import type { EventStatus } from '../types/event';

// Trạng thái hiển thị = trạng thái backend (EventStatus) + trạng thái suy ra theo thời gian
// thực tế (EXPIRED). Việc tính toán này áp dụng được cho CẢ dữ liệu mock (Home/EventList/
// EventDetail) LẪN dữ liệu thật từ API sau này (chỉ cần event có startTime/endTime/saleEndTime),
// nên khi backend đã publish thật, không cần sửa lại chỗ này.
export type DisplayStatus = EventStatus | 'EXPIRED';

export type EventTimeInfo = {
    startTime: string;
    endTime: string;
    saleEndTime?: string | null;
    status: EventStatus;
};

export function getDisplayStatus(event: EventTimeInfo): DisplayStatus {
    if (event.status === 'CANCELLED') return 'CANCELLED';

    const now = new Date();
    const end = new Date(event.endTime);
    const start = new Date(event.startTime);

    // Sự kiện đã diễn ra xong -> luôn là "Đã kết thúc", bất kể còn hạn bán vé hay không.
    if (!Number.isNaN(end.getTime()) && now > end) return 'COMPLETED';

    // Sự kiện chưa diễn ra / đang diễn ra nhưng đã quá hạn mua vé (hoặc hạn kết thúc bán vé)
    // -> "Đã hết hạn": không cho đặt vé nữa dù sự kiện chưa xảy ra.
    if (event.saleEndTime) {
        const saleEnd = new Date(event.saleEndTime);
        if (!Number.isNaN(saleEnd.getTime()) && now > saleEnd) return 'EXPIRED';
    }

    if (!Number.isNaN(start.getTime()) && now >= start && (Number.isNaN(end.getTime()) || now <= end)) {
        return 'ONGOING';
    }

    return event.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';
}

export function canPurchase(displayStatus: DisplayStatus): boolean {
    return displayStatus === 'PUBLISHED' || displayStatus === 'ONGOING';
}

export const DISPLAY_STATUS_LABEL: Record<DisplayStatus, string> = {
    DRAFT: 'Bản nháp',
    PUBLISHED: 'Đã công khai',
    ONGOING: 'Đang diễn ra',
    COMPLETED: 'Đã kết thúc',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Đã hết hạn',
};

export const DISPLAY_STATUS_BADGE_CLASS: Record<DisplayStatus, string> = {
    DRAFT: 'bg-[#F59E0B]/15 text-[#B45309]',
    PUBLISHED: 'bg-[#22C55E]/15 text-[#16A34A]',
    ONGOING: 'bg-[#F43F73]/15 text-[#F43F73]',
    COMPLETED: 'bg-[#94A3B8]/15 text-[#64748B]',
    CANCELLED: 'bg-[#EF4444]/15 text-[#DC2626]',
    EXPIRED: 'bg-[#334155]/15 text-[#334155]',
};
