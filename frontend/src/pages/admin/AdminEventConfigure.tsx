import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    CheckCircle2,
    Grid3x3,
    Loader2,
    Pencil,
    Plus,
    Rocket,
    Trash2,
    Undo2,
    X,
} from 'lucide-react';
import {
    adminBulkGenerateSeats,
    adminChangeEventStatus,
    adminCreateZone,
    adminDeleteSeat,
    adminDeleteZone,
    adminGetEventById,
    adminUpdateZone,
    getEventApiErrorMessage,
} from '../../api/eventApi';
import type { EventResponse, EventZoneRequest, EventZoneResponse } from '../../types/event';
import { EVENT_STATUS_LABEL, TICKET_MAP_TYPE_LABEL } from '../../types/event';
import { formatCurrency } from '../../utils/format';

type Props = {
    eventId: number;
    onBack: () => void;
};

const seatStatusColor: Record<string, string> = {
    AVAILABLE: 'bg-[#E2E8F0] text-[#334155]',
    LOCKED: 'bg-[#FDE68A] text-[#92400E]',
    SOLD: 'bg-[#F43F73] text-white',
    DISABLED: 'bg-[#CBD5E1] text-[#64748B] line-through',
};

const emptyZoneForm: EventZoneRequest = {
    zoneName: '',
    description: '',
    totalCapacity: undefined,
    price: 0,
    displayOrder: 0,
};

function AdminEventConfigure({ eventId, onBack }: Props) {
    const [event, setEvent] = useState<EventResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [showZoneForm, setShowZoneForm] = useState(false);
    const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
    const [zoneForm, setZoneForm] = useState<EventZoneRequest>(emptyZoneForm);
    const [savingZone, setSavingZone] = useState(false);

    const [publishing, setPublishing] = useState(false);
    const [reverting, setReverting] = useState(false);

    const isZoneOnly = event?.ticketMapType === 'ZONE';

    const loadEvent = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminGetEventById(eventId);
            setEvent(data);
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    const openCreateZone = () => {
        setEditingZoneId(null);
        setZoneForm({ ...emptyZoneForm, displayOrder: event?.zones.length ?? 0 });
        setShowZoneForm(true);
    };

    const openEditZone = (zone: EventZoneResponse) => {
        setEditingZoneId(zone.id);
        setZoneForm({
            zoneName: zone.zoneName,
            description: zone.description || '',
            totalCapacity: zone.totalCapacity ?? undefined,
            price: zone.price,
            displayOrder: zone.displayOrder ?? 0,
        });
        setShowZoneForm(true);
    };

    const handleSaveZone = async () => {
        if (!zoneForm.zoneName.trim()) {
            setError('Vui lòng nhập tên khu vực.');
            return;
        }
        if (!zoneForm.price || zoneForm.price <= 0) {
            setError('Vui lòng nhập giá vé hợp lệ (> 0).');
            return;
        }
        setSavingZone(true);
        setError('');
        try {
            const payload: EventZoneRequest = {
                ...zoneForm,
                totalCapacity: zoneForm.totalCapacity || undefined,
            };
            if (editingZoneId) {
                await adminUpdateZone(eventId, editingZoneId, payload);
            } else {
                await adminCreateZone(eventId, payload);
            }
            setShowZoneForm(false);
            await loadEvent();
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        } finally {
            setSavingZone(false);
        }
    };

    const handleDeleteZone = async (zoneId: number) => {
        if (!window.confirm('Xóa khu vực này? Toàn bộ ghế/bàn bên trong cũng sẽ bị xóa.')) return;
        try {
            await adminDeleteZone(eventId, zoneId);
            await loadEvent();
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        }
    };

    const handlePublish = async () => {
        if (!event) return;
        setPublishing(true);
        setError('');
        setNotice('');
        try {
            await adminChangeEventStatus(eventId, 'PUBLISHED');
            setNotice('Đã công khai sự kiện. Khách hàng có thể xem và đặt vé.');
            await loadEvent();
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        } finally {
            setPublishing(false);
        }
    };

    const handleCancelEvent = async () => {
        if (!event) return;
        if (!window.confirm('Hủy sự kiện này?')) return;
        try {
            await adminChangeEventStatus(eventId, 'CANCELLED');
            await loadEvent();
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        }
    };

    // Gỡ công khai: PUBLISHED -> DRAFT. Dùng khi thông tin/khu vực bị nhập sai và cần
    // sửa lại từ đầu, hoặc muốn xóa hẳn sự kiện (chỉ xóa được khi đang ở DRAFT).
    const handleRevertToDraft = async () => {
        if (!event) return;
        if (!window.confirm('Gỡ công khai và chuyển sự kiện về trạng thái Nháp? Khách sẽ không còn xem/đặt vé được nữa cho tới khi bạn Công khai lại.')) return;
        setReverting(true);
        setError('');
        setNotice('');
        try {
            await adminChangeEventStatus(eventId, 'DRAFT');
            setNotice('Đã chuyển sự kiện về Nháp. Bạn có thể sửa thông tin hoặc xóa sự kiện này.');
            await loadEvent();
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        } finally {
            setReverting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center rounded-2xl bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <Loader2 size={26} className="animate-spin text-[#F43F73]" />
            </div>
        );
    }

    if (!event) {
        return (
            <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-bold text-[#DC2626]">{error || 'Không tìm thấy sự kiện.'}</p>
                <button onClick={onBack} className="mt-4 text-sm font-black text-[#F43F73]">
                    ← Quay lại danh sách
                </button>
            </section>
        );
    }

    return (
        <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] text-[#334155] transition hover:bg-[#F8FAFC]"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-black text-[#0B1736]">{event.name}</h1>
                            <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-black text-[#4338CA]">
                                {TICKET_MAP_TYPE_LABEL[event.ticketMapType]}
                            </span>
                            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[10px] font-black text-[#334155]">
                                {EVENT_STATUS_LABEL[event.status]}
                            </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-[#64748B]">
                            Bước 2: cấu hình khu vực{isZoneOnly ? '' : ', ghế/bàn'} cho sự kiện, sau đó công khai
                            để khách có thể xem và đặt vé.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {event.status === 'DRAFT' && (
                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={publishing || event.zones.length === 0}
                            title={event.zones.length === 0 ? 'Cần ít nhất 1 khu vực trước khi công khai' : ''}
                            className="flex h-10 items-center gap-2 rounded-lg bg-[#22C55E] px-4 text-sm font-black text-white transition hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Rocket size={16} />
                            {publishing ? 'Đang công khai...' : 'Công khai sự kiện'}
                        </button>
                    )}
                    {event.status === 'PUBLISHED' && (
                        <button
                            type="button"
                            onClick={handleRevertToDraft}
                            disabled={reverting}
                            title="Gỡ công khai, chuyển về Nháp để sửa thông tin hoặc xóa sự kiện"
                            className="flex h-10 items-center gap-2 rounded-lg border border-[#DDE3EF] px-4 text-sm font-black text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Undo2 size={16} />
                            {reverting ? 'Đang chuyển...' : 'Gỡ công khai (về Nháp)'}
                        </button>
                    )}
                    {(event.status === 'PUBLISHED' || event.status === 'DRAFT') && (
                        <button
                            type="button"
                            onClick={handleCancelEvent}
                            className="flex h-10 items-center gap-2 rounded-lg border border-[#FCA5A5] px-4 text-sm font-black text-[#DC2626] transition hover:bg-[#FEF2F2]"
                        >
                            Hủy sự kiện
                        </button>
                    )}
                </div>
            </div>

            {notice && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#86EFAC] bg-[#F0FDF4] px-4 py-3 text-sm font-bold text-[#16A34A]">
                    <CheckCircle2 size={16} />
                    {notice}
                </div>
            )}
            {error && (
                <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">
                    {error}
                </div>
            )}

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-[#0B1736]">
                    Khu vực ({event.zones.length})
                </h2>
                <button
                    type="button"
                    onClick={openCreateZone}
                    className="flex items-center gap-2 rounded-lg bg-[#5B00FF] px-4 py-2 text-xs font-black text-white transition hover:bg-[#4B00D8]"
                >
                    <Plus size={15} />
                    Thêm khu vực
                </button>
            </div>

            {showZoneForm && (
                <div className="mb-5 rounded-xl border border-[#F43F73]/30 bg-[#FFF7F9] p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#0B1736]">
                            {editingZoneId ? 'Sửa khu vực' : 'Khu vực mới'}
                        </h3>
                        <button onClick={() => setShowZoneForm(false)} className="text-[#64748B] hover:text-[#0B1736]">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-black text-[#0B1736]">Tên khu vực *</label>
                            <input
                                type="text"
                                value={zoneForm.zoneName}
                                onChange={(event) => setZoneForm((prev) => ({ ...prev, zoneName: event.target.value }))}
                                placeholder="VD: VIP, Tầng 1, Khu A..."
                                className="h-10 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold outline-none focus:border-[#F43F73]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black text-[#0B1736]">Giá vé (đ) *</label>
                            <input
                                type="number"
                                min={0}
                                value={zoneForm.price || ''}
                                onChange={(event) =>
                                    setZoneForm((prev) => ({ ...prev, price: Number(event.target.value) }))
                                }
                                placeholder="200000"
                                className="h-10 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold outline-none focus:border-[#F43F73]"
                            />
                        </div>
                        {isZoneOnly && (
                            <div>
                                <label className="mb-1 block text-xs font-black text-[#0B1736]">
                                    Sức chứa (số vé)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={zoneForm.totalCapacity || ''}
                                    onChange={(event) =>
                                        setZoneForm((prev) => ({
                                            ...prev,
                                            totalCapacity: event.target.value ? Number(event.target.value) : undefined,
                                        }))
                                    }
                                    placeholder="500"
                                    className="h-10 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold outline-none focus:border-[#F43F73]"
                                />
                            </div>
                        )}
                        <div>
                            <label className="mb-1 block text-xs font-black text-[#0B1736]">Thứ tự hiển thị</label>
                            <input
                                type="number"
                                value={zoneForm.displayOrder ?? 0}
                                onChange={(event) =>
                                    setZoneForm((prev) => ({ ...prev, displayOrder: Number(event.target.value) }))
                                }
                                className="h-10 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold outline-none focus:border-[#F43F73]"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-black text-[#0B1736]">Mô tả</label>
                            <input
                                type="text"
                                value={zoneForm.description}
                                onChange={(event) =>
                                    setZoneForm((prev) => ({ ...prev, description: event.target.value }))
                                }
                                className="h-10 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold outline-none focus:border-[#F43F73]"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            onClick={() => setShowZoneForm(false)}
                            className="h-9 rounded-lg border border-[#DDE3EF] px-4 text-xs font-black text-[#334155]"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSaveZone}
                            disabled={savingZone}
                            className="h-9 rounded-lg bg-[#F43F73] px-4 text-xs font-black text-white disabled:opacity-60"
                        >
                            {savingZone ? 'Đang lưu...' : 'Lưu khu vực'}
                        </button>
                    </div>
                </div>
            )}

            {event.zones.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] py-12 text-center text-sm font-bold text-[#94A3B8]">
                    Chưa có khu vực nào. Thêm khu vực đầu tiên để có thể công khai sự kiện.
                </div>
            ) : (
                <div className="space-y-4">
                    {[...event.zones]
                        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                        .map((zone) => (
                            <ZonePanel
                                key={zone.id}
                                zone={zone}
                                isZoneOnly={isZoneOnly}
                                onEdit={() => openEditZone(zone)}
                                onDelete={() => handleDeleteZone(zone.id)}
                                onSeatsChanged={loadEvent}
                            />
                        ))}
                </div>
            )}
        </section>
    );
}

// ---- Panel cấu hình 1 khu vực (kèm sinh ghế/bàn nếu SEAT_MAP / TEA_LOUNGE) ----

function ZonePanel({
    zone,
    isZoneOnly,
    onEdit,
    onDelete,
    onSeatsChanged,
}: {
    zone: EventZoneResponse;
    isZoneOnly: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSeatsChanged: () => void;
}) {
    const [showGenerator, setShowGenerator] = useState(false);
    const [rowsText, setRowsText] = useState('A,B,C');
    const [columnsPerRow, setColumnsPerRow] = useState('10');
    const [seatTier, setSeatTier] = useState<'VIP' | 'STANDARD'>('VIP');
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState('');

    const seats = zone.seats || [];

    const handleGenerate = async () => {
        const rows = rowsText
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean);
        const columns = Number(columnsPerRow);
        if (rows.length === 0 || !columns || columns <= 0) {
            setGenError('Nhập danh sách hàng (VD: A,B,C) và số cột > 0.');
            return;
        }
        setGenerating(true);
        setGenError('');
        try {
            await adminBulkGenerateSeats(zone.id, {
                rows,
                columnsPerRow: columns,
                seatTier,
            });
            setShowGenerator(false);
            onSeatsChanged();
        } catch (err) {
            setGenError(getEventApiErrorMessage(err));
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteSeat = async (seatId: number) => {
        try {
            await adminDeleteSeat(zone.id, seatId);
            onSeatsChanged();
        } catch {
            // im lặng - lỗi hiếm xảy ra khi xóa 1 ghế lẻ
        }
    };

    return (
        <div className="rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-black text-[#0B1736]">{zone.zoneName}</p>
                    {zone.description && <p className="text-xs font-medium text-[#64748B]">{zone.description}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-bold text-[#64748B]">
                        <span className="text-[#F43F73]">{formatCurrency(zone.price)}</span>
                        {isZoneOnly ? (
                            <span>
                                Còn {zone.remaining ?? '—'}/{zone.totalCapacity ?? '—'} vé
                            </span>
                        ) : (
                            <span>{seats.length} ghế/bàn đã tạo</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isZoneOnly && (
                        <button
                            type="button"
                            onClick={() => setShowGenerator((prev) => !prev)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#DDE3EF] px-3 py-1.5 text-xs font-black text-[#334155] transition hover:border-[#F43F73] hover:text-[#F43F73]"
                        >
                            <Grid3x3 size={14} />
                            Sinh sơ đồ
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE3EF] text-[#6D00FF] transition hover:bg-[#F3E8FF]"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE3EF] text-[#EF321F] transition hover:bg-[#FEE2E2]"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {showGenerator && (
                <div className="mt-4 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-3">
                    <p className="mb-2 text-xs font-bold text-[#334155]">
                        Nhập danh sách hàng (phân cách bởi dấu phẩy) và số cột mỗi hàng để tự động sinh ghế.
                        Ví dụ: hàng "A,B,C" + 10 cột/hàng → tạo A1..A10, B1..B10, C1..C10.
                    </p>
                    {genError && <p className="mb-2 text-xs font-bold text-[#DC2626]">{genError}</p>}
                    <div className="flex flex-wrap items-end gap-2">
                        <div>
                            <label className="mb-1 block text-[11px] font-black text-[#334155]">Danh sách hàng</label>
                            <input
                                type="text"
                                value={rowsText}
                                onChange={(event) => setRowsText(event.target.value)}
                                className="h-9 w-[160px] rounded-lg border border-[#DDE3EF] px-2.5 text-xs font-semibold outline-none focus:border-[#F43F73]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-black text-[#334155]">Số cột/hàng</label>
                            <input
                                type="number"
                                min={1}
                                value={columnsPerRow}
                                onChange={(event) => setColumnsPerRow(event.target.value)}
                                className="h-9 w-[100px] rounded-lg border border-[#DDE3EF] px-2.5 text-xs font-semibold outline-none focus:border-[#F43F73]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-black text-[#334155]">
                                Loại ghế
                            </label>

                            <select
                                value={seatTier}
                                onChange={(e) =>
                                    setSeatTier(e.target.value as 'VIP' | 'STANDARD')
                                }
                                className="h-9 rounded-lg border border-[#DDE3EF] px-2 text-xs font-semibold"
                            >
                                <option value="VIP">VIP</option>
                                <option value="STANDARD">STANDARD</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="h-9 rounded-lg bg-[#5B00FF] px-4 text-xs font-black text-white disabled:opacity-60"
                        >
                            {generating ? 'Đang sinh...' : 'Sinh sơ đồ'}
                        </button>
                    </div>
                </div>
            )}

            {!isZoneOnly && seats.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {seats.map((seat) => (
                        <button
                            key={seat.id}
                            type="button"
                            title={`${seat.seatCode} - ${seat.status}${seat.capacity ? ` - ${seat.capacity} người` : ''}`}
                            onClick={() => handleDeleteSeat(seat.id)}
                            className={`flex h-8 min-w-[34px] items-center justify-center rounded-md px-1.5 text-[10px] font-black transition hover:opacity-70 ${seatStatusColor[seat.status] || 'bg-[#E2E8F0] text-[#334155]'
                                }`}
                        >
                            {seat.seatCode}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminEventConfigure;
