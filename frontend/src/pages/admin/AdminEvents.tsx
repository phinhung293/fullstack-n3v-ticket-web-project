import { useEffect, useState } from 'react';
import { CalendarDays, Pencil, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import AdminEventForm from './AdminEventForm';
import AdminEventConfigure from './AdminEventConfigure';
import { adminDeleteEvent, adminSearchEvents, getEventApiErrorMessage } from '../../api/eventApi';
import type { EventStatus, EventSummaryResponse } from '../../types/event';
import { EVENT_STATUS_LABEL, TICKET_MAP_TYPE_LABEL } from '../../types/event';
import { formatCurrency, formatDateTime } from '../../utils/format';

type View = { name: 'list' } | { name: 'create' } | { name: 'edit'; eventId: number } | { name: 'configure'; eventId: number };

const statusBadge: Record<EventStatus, string> = {
    DRAFT: 'bg-[#FEF3C7] text-[#B45309]',
    PUBLISHED: 'bg-[#D1FAE5] text-[#059669]',
    ONGOING: 'bg-[#FCE7F3] text-[#DB2777]',
    COMPLETED: 'bg-[#E2E8F0] text-[#334155]',
    CANCELLED: 'bg-[#FEE2E2] text-[#DC2626]',
};

function AdminEvents() {
    const [view, setView] = useState<View>({ name: 'list' });
    const [events, setEvents] = useState<EventSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');

    const loadEvents = () => {
        setLoading(true);
        setError('');
        adminSearchEvents({
            keyword: keyword || undefined,
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            size: 50,
        })
            .then((page) => setEvents(page.content))
            .catch((err) => setError(getEventApiErrorMessage(err)))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (view.name === 'list') loadEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view.name, statusFilter]);

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        loadEvents();
    };

    const handleDelete = async (eventItem: EventSummaryResponse) => {
        if (!window.confirm(`Xóa sự kiện "${eventItem.name}"?`)) return;
        try {
            await adminDeleteEvent(eventItem.id);
            loadEvents();
        } catch (err) {
            alert(getEventApiErrorMessage(err));
        }
    };

    if (view.name === 'create') {
        return (
            <AdminEventForm
                onCancel={() => setView({ name: 'list' })}
                onCreated={(eventId) => setView({ name: 'configure', eventId })}
            />
        );
    }

    if (view.name === 'edit') {
        return (
            <AdminEventForm
                eventId={view.eventId}
                onCancel={() => setView({ name: 'list' })}
                onCreated={(eventId) => setView({ name: 'configure', eventId })}
                onUpdated={() => {
                    setView({ name: 'list' });
                }}
            />
        );
    }

    if (view.name === 'configure') {
        return (
            <AdminEventConfigure
                eventId={view.eventId}
                onBack={() => setView({ name: 'list' })}
            />
        );
    }

    return (
        <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-[#0B1736]">Quản lý sự kiện</h1>
                    <p className="mt-1 text-sm font-medium text-[#64748B]">
                        Tạo sự kiện mới, cấu hình sơ đồ vé và công khai cho khách hàng.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setView({ name: 'create' })}
                    className="flex h-10 items-center gap-2 rounded-lg bg-[#5B00FF] px-4 text-sm font-black text-white shadow-[0_10px_22px_rgba(91,0,255,0.22)] transition hover:bg-[#4B00D8]"
                >
                    <Plus size={17} strokeWidth={2.5} />
                    Tạo sự kiện
                </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative w-[300px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Tìm kiếm theo tên sự kiện..."
                        className="h-10 w-full rounded-lg border border-[#DDE3EF] bg-white pl-9 pr-3 text-sm font-medium text-[#0B1736] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as EventStatus | 'ALL')}
                    className="h-10 rounded-lg border border-[#DDE3EF] bg-white px-3 text-sm font-semibold text-[#334155] outline-none focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    {Object.entries(EVENT_STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="h-10 rounded-lg border border-[#DDE3EF] px-4 text-sm font-black text-[#334155] transition hover:bg-[#F8FAFC]"
                >
                    Lọc
                </button>
            </form>

            {error && (
                <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                <table className="w-full table-fixed text-left text-sm">
                    <thead>
                        <tr className="border-b border-[#E2E8F0] bg-[#FBFCFE] text-xs font-black text-[#0B1736]">
                            <th className="w-[28%] px-3 py-4">Sự kiện</th>
                            <th className="w-[14%] px-3 py-4">Loại vé</th>
                            <th className="w-[16%] px-3 py-4">Thời gian</th>
                            <th className="w-[14%] px-3 py-4">Địa điểm</th>
                            <th className="w-[10%] px-3 py-4">Giá từ</th>
                            <th className="w-[10%] px-3 py-4">Trạng thái</th>
                            <th className="w-[8%] px-3 py-4 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm font-bold text-[#64748B]">
                                    Đang tải danh sách sự kiện...
                                </td>
                            </tr>
                        )}
                        {!loading && events.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm font-bold text-[#64748B]">
                                    Chưa có sự kiện nào phù hợp.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            events.map((eventItem) => (
                                <tr
                                    key={eventItem.id}
                                    className="border-b border-[#E2E8F0] text-xs font-semibold text-[#0B1736] transition last:border-b-0 hover:bg-[#F8FAFC]"
                                >
                                    <td className="px-3 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#94A3B8]">
                                                <CalendarDays size={16} />
                                            </div>
                                            <span className="truncate font-black">{eventItem.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-[#334155]">
                                        {TICKET_MAP_TYPE_LABEL[eventItem.ticketMapType]}
                                    </td>
                                    <td className="truncate px-3 py-4 text-[#334155]">
                                        {formatDateTime(eventItem.startTime)}
                                    </td>
                                    <td className="truncate px-3 py-4 text-[#334155]">
                                        {eventItem.venueName}
                                        {eventItem.city ? `, ${eventItem.city}` : ''}
                                    </td>
                                    <td className="px-3 py-4 text-[#334155]">{formatCurrency(eventItem.minPrice)}</td>
                                    <td className="px-3 py-4">
                                        <span
                                            className={`inline-flex max-w-full truncate rounded-md px-2 py-1 text-[10px] font-black ${statusBadge[eventItem.status]}`}
                                        >
                                            {EVENT_STATUS_LABEL[eventItem.status]}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setView({ name: 'configure', eventId: eventItem.id })}
                                                title="Cấu hình vé"
                                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE3EF] bg-white text-[#5B00FF] transition hover:bg-[#F3E8FF]"
                                            >
                                                <Settings2 size={15} strokeWidth={2.4} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setView({ name: 'edit', eventId: eventItem.id })}
                                                title="Sửa thông tin sự kiện"
                                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE3EF] bg-white text-[#6D00FF] transition hover:bg-[#F3E8FF]"
                                            >
                                                <Pencil size={15} strokeWidth={2.4} />
                                            </button>
                                            {eventItem.status === 'DRAFT' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(eventItem)}
                                                    title="Xóa"
                                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE3EF] bg-white text-[#EF321F] transition hover:bg-[#FEE2E2]"
                                                >
                                                    <Trash2 size={15} strokeWidth={2.4} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled
                                                    title="Chỉ xoá được sự kiện đang ở trạng thái Nháp (DRAFT). Sự kiện đã Publish (kể cả đã Hủy) được giữ lại để phục vụ báo cáo/doanh thu."
                                                    className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md border border-[#DDE3EF] bg-[#F8FAFC] text-[#CBD5E1]"
                                                >
                                                    <Trash2 size={15} strokeWidth={2.4} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default AdminEvents;
