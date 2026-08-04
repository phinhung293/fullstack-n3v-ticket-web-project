import { useMemo, useState } from 'react';
import { Ticket } from 'lucide-react';
import type { EventSeatResponse } from '../../types/event';
import { formatCurrency } from '../../utils/format';

type ZoneInfo = {
    id: number;
    name: string;
    // Giá của zone - dùng làm giá mặc định cho ghế khi seat.price = null (ghế sinh bằng
    // "Sinh sơ đồ" không lưu giá riêng, giá lấy theo zone - xem GhiChú BE bulkGenerate).
    price?: number | null;
};

type Props = {
    seats: EventSeatResponse[];
    // Optional: dùng để hiển thị tên zone phía trên mỗi khối sơ đồ khi có nhiều zone.
    // Nếu không truyền, component vẫn hoạt động đúng (không hiển thị tiêu đề zone).
    zones?: ZoneInfo[];
    onBuyNow: (selectedSeats: EventSeatResponse[], total: number) => void;
};

// Ghế/bàn AVAILABLE mới được chọn. LOCKED/SOLD/DISABLED đều coi như không thể chọn
// (LOCKED = đang được người khác giữ tạm lúc checkout, không riêng gì SOLD).
const isSelectable = (seat: EventSeatResponse) => seat.status === 'AVAILABLE';

// Backend đã trả seatTier (VIP/STANDARD) trong EventSeatResponse, dùng để tô màu
// ghế còn trống theo hạng: VIP màu hổ phách, STANDARD (mặc định) màu xanh lá.

function SeatMap({ seats, zones, onBuyNow }: Props) {
    // BUG ĐÃ SỬA: state chọn ghế trước đây dùng `seat.seatCode` (VD "B5") làm khóa.
    // seatCode chỉ duy nhất TRONG 1 ZONE, không duy nhất toàn hệ thống - event có nhiều
    // zone cấu hình hàng/cột giống nhau (VD zone nào cũng có ghế "B5") sẽ bị đụng khóa,
    // khiến chọn 1 ghế ở zone này lại tô luôn ghế trùng tên ở zone khác. Dùng `seat.id`
    // (khóa chính, duy nhất toàn cục) để tránh đụng độ.
    const [selected, setSelected] = useState<Record<number, EventSeatResponse>>({});

    const zoneNameById = useMemo(() => {
        const map = new Map<number, string>();
        (zones ?? []).forEach((z) => map.set(z.id, z.name));
        return map;
    }, [zones]);

    const zonePriceById = useMemo(() => {
        const map = new Map<number, number>();
        (zones ?? []).forEach((z) => {
            if (z.price != null) map.set(z.id, z.price);
        });
        return map;
    }, [zones]);

    // BUG ĐÃ SỬA: ghế sinh bằng "Sinh sơ đồ" luôn có seat.price = null ở backend (giá
    // lấy theo zone, không lưu riêng từng ghế). Trước đây UI hiển thị thẳng seat.price
    // nên luôn ra "0 ₫" dù zone đã có giá. Hàm này lấy giá riêng của ghế nếu có, không
    // thì fallback về giá của zone chứa ghế đó.
    const seatPrice = (seat: EventSeatResponse) => seat.price ?? zonePriceById.get(seat.zoneId) ?? 0;

    // BUG ĐÃ SỬA: trước đây nhóm ghế chỉ theo `seatRow` (VD "A"). Khi trang chi tiết
    // sự kiện gộp ghế của NHIỀU zone lại (allSeats = activeZones.flatMap(...)) và các
    // zone đặt tên hàng trùng nhau (zone nào cũng có hàng A, B, C...), ghế của các zone
    // khác nhau bị trộn chung vào một "hàng A". Vì ô ghế chỉ hiển thị số cột
    // (seat.seatColumn) nên sau khi sort theo cột, 3 ghế "cột 1" của 3 zone khác nhau
    // đứng cạnh nhau -> hiển thị "1 1 1 2 2 2 3 3 3" thay vì "1 2 3".
    //
    // Sửa: nhóm theo cặp (zoneId, seatRow) để ghế của các zone không bao giờ bị trộn
    // vào cùng một hàng, và nhóm zone thành từng khối riêng để hiển thị tên zone.
    const zoneBlocks = useMemo(() => {
        const zoneGroups = new Map<number, Map<string, EventSeatResponse[]>>();

        for (const seat of seats) {
            if (!zoneGroups.has(seat.zoneId)) zoneGroups.set(seat.zoneId, new Map());
            const rowGroups = zoneGroups.get(seat.zoneId)!;
            const rowKey = seat.seatRow || seat.seatCode;
            if (!rowGroups.has(rowKey)) rowGroups.set(rowKey, []);
            rowGroups.get(rowKey)!.push(seat);
        }

        return Array.from(zoneGroups.entries())
            .sort(([zoneIdA], [zoneIdB]) => zoneIdA - zoneIdB)
            .map(([zoneId, rowGroups]) => ({
                zoneId,
                zoneName: zoneNameById.get(zoneId) ?? null,
                rows: Array.from(rowGroups.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([row, rowSeats]) => [
                        row,
                        [...rowSeats].sort((a, b) => (a.seatColumn ?? 0) - (b.seatColumn ?? 0)),
                    ] as const),
            }));
    }, [seats, zoneNameById]);

    const toggleSeat = (seat: EventSeatResponse) => {
        if (!isSelectable(seat)) return;
        setSelected((prev) => {
            const next = { ...prev };
            if (next[seat.id]) {
                delete next[seat.id];
            } else {
                next[seat.id] = seat;
            }
            return next;
        });
    };

    const selectedSeats = Object.values(selected).sort(
        (a, b) => a.zoneId - b.zoneId || a.seatCode.localeCompare(b.seatCode),
    );
    const total = selectedSeats.reduce((sum, seat) => sum + seatPrice(seat), 0);

    const seatClass = (seat: EventSeatResponse) => {
        if (seat.status === 'SOLD') {
            return 'bg-[#94A3B8] text-white cursor-not-allowed opacity-70';
        }
        if (seat.status === 'LOCKED' || seat.status === 'DISABLED') {
            return 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed opacity-70';
        }
        if (selected[seat.id]) {
            return 'bg-[#0B1736] text-white ring-2 ring-offset-1 ring-[#0B1736] scale-105';
        }
        if (seat.seatTier === 'VIP') {
            return 'bg-[#D97706]/15 text-[#B45309] hover:bg-[#D97706] hover:text-white';
        }
        return 'bg-[#16A34A]/15 text-[#15803D] hover:bg-[#16A34A] hover:text-white';
    };

    return (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-black text-[#0B1736]">Sơ đồ chỗ ngồi</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#334155]">
                    <span className="flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 rounded-full bg-[#16A34A]" />
                        Còn trống (Thường)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 rounded-full bg-[#D97706]" />
                        Còn trống (VIP)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 rounded-full bg-[#94A3B8]" />
                        Đã bán
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 rounded-full bg-[#0B1736]" />
                        Đang chọn
                    </span>
                </div>
            </div>

            <div className="mb-6 flex justify-center">
                <div className="w-full max-w-[520px] rounded-lg bg-[#0B1736] py-2.5 text-center text-xs font-black tracking-[0.3em] text-white">
                    SÂN KHẤU
                </div>
            </div>

            {zoneBlocks.length === 0 ? (
                <p className="py-8 text-center text-sm font-bold text-[#94A3B8]">
                    Sự kiện chưa được cấu hình sơ đồ ghế.
                </p>
            ) : (
                <div className="flex flex-col gap-6">
                    {zoneBlocks.map((block) => (
                        <div key={block.zoneId}>
                            {block.zoneName && (
                                <p className="mb-2 text-center text-xs font-black uppercase tracking-wide text-[#6D28D9]">
                                    {block.zoneName}
                                </p>
                            )}
                            <div className="flex flex-col items-center gap-2 overflow-x-auto pb-2">
                                {block.rows.map(([row, rowSeats]) => (
                                    <div key={`${block.zoneId}-${row}`} className="flex items-center gap-2">
                                        <span className="w-5 shrink-0 text-center text-xs font-black text-[#94A3B8]">
                                            {row}
                                        </span>
                                        <div className="flex gap-1.5">
                                            {rowSeats.map((seat) => (
                                                <button
                                                    key={seat.id}
                                                    type="button"
                                                    disabled={!isSelectable(seat)}
                                                    onClick={() => toggleSeat(seat)}
                                                    title={`${seat.seatCode} · ${formatCurrency(seatPrice(seat))}`}
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-black transition ${seatClass(seat)}`}
                                                >
                                                    {seat.seatColumn ?? seat.seatCode}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                {selectedSeats.length === 0 ? (
                    <p className="text-center text-sm font-bold text-[#94A3B8]">
                        Chưa chọn ghế nào. Bấm vào ô ghế còn trống (màu đỏ/xanh) để chọn.
                    </p>
                ) : (
                    <>
                        <p className="mb-2 text-xs font-black text-[#0B1736]">
                            Ghế đã chọn ({selectedSeats.length})
                        </p>
                        <div className="mb-3 flex flex-wrap gap-2">
                            {selectedSeats.map((seat) => (
                                <span
                                    key={seat.id}
                                    className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#0B1736] shadow-sm"
                                >
                                    {seat.seatCode} · {formatCurrency(seatPrice(seat))}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-3">
                            <span className="text-sm font-bold text-[#64748B]">Tổng tiền</span>
                            <span className="text-lg font-black text-[#F43F73]">{formatCurrency(total)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onBuyNow(selectedSeats, total)}
                            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F43F73] to-[#6D28D9] text-sm font-black text-white shadow-[0_10px_24px_rgba(244,63,115,0.25)] transition hover:brightness-110"
                        >
                            <Ticket size={16} />
                            Mua vé ngay
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default SeatMap;
