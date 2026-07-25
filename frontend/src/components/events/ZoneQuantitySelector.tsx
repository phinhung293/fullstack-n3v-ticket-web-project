import { useMemo, useState } from 'react';
import { Minus, Plus, Ticket } from 'lucide-react';
import type { EventZoneResponse } from '../../types/event';
import { formatCurrency } from '../../utils/format';

type Props = {
  zones: EventZoneResponse[];
  onBuyNow: (selections: { zone: EventZoneResponse; quantity: number }[], total: number) => void;
};

function ZoneQuantitySelector({ zones, onBuyNow }: Props) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const activeZones = useMemo(() => zones.filter((z) => z.active), [zones]);

  const setQty = (zone: EventZoneResponse, qty: number) => {
    const remaining = zone.remaining ?? zone.totalCapacity ?? 0;
    const clamped = Math.max(0, Math.min(qty, remaining));
    setQuantities((prev) => ({ ...prev, [zone.id]: clamped }));
  };

  const selections = activeZones
    .map((zone) => ({ zone, quantity: quantities[zone.id] || 0 }))
    .filter((s) => s.quantity > 0);

  const total = selections.reduce((sum, s) => sum + s.zone.price * s.quantity, 0);

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
      <h3 className="mb-4 text-base font-black text-[#0B1736]">Chọn vé</h3>

      {activeZones.length === 0 ? (
        <p className="py-8 text-center text-sm font-bold text-[#94A3B8]">
          Sự kiện chưa được cấu hình hạng vé.
        </p>
      ) : (
        <div className="space-y-3">
          {activeZones.map((zone) => {
            const remaining = zone.remaining ?? zone.totalCapacity ?? 0;
            const soldOut = remaining <= 0;
            const qty = quantities[zone.id] || 0;
            return (
              <div
                key={zone.id}
                className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-black text-[#0B1736]">{zone.zoneName}</p>
                  <p className="text-xs font-bold text-[#64748B]">
                    {formatCurrency(zone.price)} · {soldOut ? 'Hết vé' : `Còn ${remaining} vé`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={soldOut || qty <= 0}
                    onClick={() => setQty(zone, qty - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#0B1736] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-black text-[#0B1736]">{qty}</span>
                  <button
                    type="button"
                    disabled={soldOut || qty >= remaining}
                    onClick={() => setQty(zone, qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#0B1736] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#64748B]">Tổng tiền</span>
          <span className="text-lg font-black text-[#F43F73]">{formatCurrency(total)}</span>
        </div>
        <button
          type="button"
          disabled={selections.length === 0}
          onClick={() => onBuyNow(selections, total)}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F43F73] to-[#6D28D9] text-sm font-black text-white shadow-[0_10px_24px_rgba(244,63,115,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Ticket size={16} />
          Mua vé ngay
        </button>
      </div>
    </div>
  );
}

export default ZoneQuantitySelector;
