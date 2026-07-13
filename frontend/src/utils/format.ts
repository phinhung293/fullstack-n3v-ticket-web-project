export const formatCurrency = (value?: number | null): string => {
    if (value === null || value === undefined) return 'Liên hệ';
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
};

export const formatDateTime = (value?: string | null): string => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const formatDate = (value?: string | null): string => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const formatShortDate = (value?: string | null): { day: string; month: string } => {
    if (!value) return { day: '--', month: '--' };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { day: '--', month: '--' };
    return {
        day: date.toLocaleDateString('vi-VN', { day: '2-digit' }),
        month: date.toLocaleDateString('vi-VN', { month: 'short' }).toUpperCase(),
    };
};

// Chuyển "2026-07-12T10:00" (input type=datetime-local) <-> ISO cho backend LocalDateTime
export const toDateTimeLocalInputValue = (value?: string | null): string => {
    if (!value) return '';
    // LocalDateTime backend trả về dạng "2026-07-12T10:00:00" -> input cần "2026-07-12T10:00"
    return value.length >= 16 ? value.slice(0, 16) : value;
};

export const fromDateTimeLocalInputValue = (value: string): string => {
    if (!value) return '';
    // input trả "2026-07-12T10:00" -> backend LocalDateTime chấp nhận luôn dạng ISO này
    return value.length === 16 ? `${value}:00` : value;
};
