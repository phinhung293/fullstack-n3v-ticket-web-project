import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, MousePointerClick, Ticket } from 'lucide-react';
import SeatMap from '../components/events/SeatMap';
import ZoneQuantitySelector from '../components/events/ZoneQuantitySelector';
import { getEventApiErrorMessage, getPublicEventById, getPublicZoneSeats, toAbsoluteImageUrl } from '../api/eventApi';
import type { EventResponse, EventSeatResponse, EventZoneResponse } from '../types/event';
import {
    canPurchase,
    DISPLAY_STATUS_BADGE_CLASS,
    DISPLAY_STATUS_LABEL,
    getDisplayStatus,
} from '../utils/eventStatus';
import { formatCurrency, formatDateTime } from '../utils/format';

function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState<EventResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    // zoneId -> danh sách ghế/bàn của zone đó (SEAT_MAP / TEA_LOUNGE)
    const [seatsByZone, setSeatsByZone] = useState<Record<number, EventSeatResponse[]>>({});
    const [seatsLoading, setSeatsLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError('');
        getPublicEventById(id)
            .then(setEvent)
            .catch((err) => setError(getEventApiErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [id]);

    // Với SEAT_MAP / TEA_LOUNGE: khi mở sơ đồ, tải ghế của từng zone đang active.
    useEffect(() => {
        if (!showPicker || !event) return;
        if (event.ticketMapType === 'ZONE') return;

        const zonesToLoad = event.zones.filter((z) => z.active && !seatsByZone[z.id]);
        if (zonesToLoad.length === 0) return;

        setSeatsLoading(true);
        Promise.all(zonesToLoad.map((zone) => getPublicZoneSeats(zone.id).then((seats) => [zone.id, seats] as const)))
            .then((results) => {
                setSeatsByZone((prev) => {
                    const next = { ...prev };
                    for (const [zoneId, seats] of results) next[zoneId] = seats;
                    return next;
                });
            })
            .catch((err) => setError(getEventApiErrorMessage(err)))
            .finally(() => setSeatsLoading(false));
    }, [showPicker, event, seatsByZone]);

    if (loading) {
        return (
            <div className="mx-auto max-w-[720px] px-6 py-16 text-center">
                <p className="text-sm font-bold text-[#94A3B8]">Đang tải thông tin sự kiện...</p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="mx-auto max-w-[720px] px-6 py-16 text-center">
                <p className="text-sm font-bold text-[#DC2626]">{error || 'Không tìm thấy sự kiện.'}</p>
                <Link to="/events" className="mt-4 inline-block text-sm font-black text-[#F43F73]">
                    ← Quay lại danh sách sự kiện
                </Link>
            </div>
        );
    }

    const displayStatus = getDisplayStatus(event);
    const canBuy = canPurchase(displayStatus) && !event.isExpired;
    const activeZones = event.zones.filter((z) => z.active);
    const minPrice = activeZones.reduce<number | null>((min, z) => {
        if (min === null || z.price < min) return z.price;
        return min;
    }, null);

    // Tất cả ghế/bàn (SEAT_MAP hoặc TEA_LOUNGE) của các zone đã tải, gộp lại cho SeatMap.
    const allSeats = activeZones.flatMap((z) => seatsByZone[z.id] || []);

    const handleBuySeats = (selectedSeats: EventSeatResponse[], total: number) => {
        // TODO: điểm tích hợp với Cart / Checkout thật (module Đặt vé & thanh toán) - hiện
        // tại chỉ demo bằng alert, KHÔNG đụng vào logic Cart/Thanh toán hiện có của dự án.
        const seatList = selectedSeats.map((seat) => seat.seatCode).join(', ');
        alert(`Đã chọn ${selectedSeats.length} ghế (${seatList})\nTổng tiền: ${formatCurrency(total)}`);
    };

    const handleBuyZones = (
        selections: { zone: EventZoneResponse; quantity: number }[],
        total: number,
    ) => {
        // TODO: điểm tích hợp với Cart / Checkout thật (module Đặt vé & thanh toán).
        const summary = selections.map((s) => `${s.zone.zoneName} x${s.quantity}`).join(', ');
        alert(`Đã chọn: ${summary}\nTổng tiền: ${formatCurrency(total)}`);
    };

    const pickerLabel = event.ticketMapType === 'ZONE' ? 'Chọn vé' : 'Chọn vị trí';

    return (
        <div className="bg-white">
            <div className="relative aspect-[16/6] w-full overflow-hidden bg-[#0B1736] sm:aspect-[16/5]">
                <img
                    src={toAbsoluteImageUrl(event.bannerUrl || event.thumbnailUrl)}
                    alt={event.name}
                    className={`h-full w-full object-cover opacity-80 ${displayStatus === 'EXPIRED' || displayStatus === 'COMPLETED' ? 'grayscale' : ''
                        }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061A35] via-transparent to-transparent" />
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
                >
                    <ArrowLeft size={18} />
                </button>
            </div>

            <section className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_360px]">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F43F73]/10 px-3 py-1 text-xs font-black text-[#F43F73]">
                            {event.category?.name}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${DISPLAY_STATUS_BADGE_CLASS[displayStatus]}`}>
                            {DISPLAY_STATUS_LABEL[displayStatus]}
                        </span>
                    </div>

                    <h1 className="mt-3 text-2xl font-black leading-tight text-[#0B1736] sm:text-3xl">{event.name}</h1>

                    <div className="mt-5 grid gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <CalendarDays size={20} className="mt-0.5 shrink-0 text-[#F43F73]" />
                            <div>
                                <p className="text-xs font-bold text-[#94A3B8]">Thời gian</p>
                                <p className="text-sm font-black text-[#0B1736]">{formatDateTime(event.startTime)}</p>
                                <p className="text-xs font-medium text-[#64748B]">đến {formatDateTime(event.endTime)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin size={20} className="mt-0.5 shrink-0 text-[#F43F73]" />
                            <div>
                                <p className="text-xs font-bold text-[#94A3B8]">Địa điểm</p>
                                <p className="text-sm font-black text-[#0B1736]">{event.venueName}</p>
                                <p className="text-xs font-medium text-[#64748B]">
                                    {event.address}
                                    {event.city ? `, ${event.city}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-lg font-black text-[#0B1736]">Giới thiệu sự kiện</h2>
                        <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-[#475569]">
                            {event.description}
                        </p>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-black text-[#0B1736]">Bảng giá vé</h2>
                        <div className="mt-4 space-y-3">
                            {activeZones.map((zone) => (
                                <div
                                    key={zone.id}
                                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3"
                                >
                                    <p className="text-sm font-black text-[#0B1736]">{zone.zoneName}</p>
                                    <span className="text-sm font-black text-[#F43F73]">{formatCurrency(zone.price)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {showPicker && (
                        <div className="mt-8">
                            {event.ticketMapType === 'ZONE' ? (
                                <ZoneQuantitySelector zones={activeZones} onBuyNow={handleBuyZones} />
                            ) : seatsLoading ? (
                                <p className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm font-bold text-[#94A3B8]">
                                    Đang tải sơ đồ chỗ ngồi...
                                </p>
                            ) : (
                                <SeatMap
                                    seats={allSeats}
                                    zones={activeZones.map((z) => ({ id: z.id, name: z.zoneName, price: z.price }))}
                                    onBuyNow={handleBuySeats}
                                />
                            )}
                        </div>
                    )}
                </div>

                <aside className="h-fit rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] lg:sticky lg:top-24">
                    <p className="text-xs font-bold text-[#94A3B8]">Giá vé chỉ từ</p>
                    <p className="mt-1 text-2xl font-black text-[#F43F73]">{formatCurrency(minPrice)}</p>
                    <button
                        type="button"
                        disabled={!canBuy}
                        onClick={() => setShowPicker((prev) => !prev)}
                        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F43F73] to-[#6D28D9] text-sm font-black text-white shadow-[0_12px_28px_rgba(244,63,115,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <MousePointerClick size={18} />
                        {canBuy ? (showPicker ? `Ẩn ${pickerLabel.toLowerCase()}` : pickerLabel) : DISPLAY_STATUS_LABEL[displayStatus]}
                    </button>
                    {!canBuy && (
                        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-[#B45309]">
                            <Ticket size={13} />
                            {displayStatus === 'EXPIRED' ? 'Sự kiện đã hết hạn mua vé.' : 'Sự kiện đã kết thúc, không thể mua vé.'}
                        </p>
                    )}
                </aside>
            </section>
        </div>
    );
}

export default EventDetail;
