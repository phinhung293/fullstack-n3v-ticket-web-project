import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, Ticket, CreditCard, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/format';
import type { EventResponse, EventSeatResponse, EventZoneResponse } from '../types/event';


function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as {
        event?: EventResponse;
        selectedSeats?: EventSeatResponse[];
        selectedZones?: { zone: EventZoneResponse; quantity: number }[];
        total?: number;
        orderCode?: string;
        checkoutUrl?: string;
    };

    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [loading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!state?.event || (!state?.selectedSeats?.length && !state?.selectedZones?.length)) {
            navigate('/');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    alert('Hết thời gian giữ ghế, vui lòng đặt lại.');
                    navigate(`/events/${state.event!.id}`);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate, state]);

    if (!state?.event || (!state?.selectedSeats?.length && !state?.selectedZones?.length)) return null;

    const { event, selectedSeats, selectedZones, total } = state;
    const seatList = selectedSeats ? selectedSeats.map((seat) => seat.seatCode).join(', ') : '';
    const zoneList = selectedZones ? selectedZones.map((z) => `${z.zone.zoneName} (x${z.quantity})`).join(', ') : '';
    const totalTickets = (selectedSeats?.length || 0) + (selectedZones?.reduce((acc, curr) => acc + curr.quantity, 0) || 0);

    const handlePayment = async () => {
        if (state.checkoutUrl) {
            window.location.href = state.checkoutUrl;
        } else {
            setError('Không tìm thấy link thanh toán, vui lòng đặt lại vé.');
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12">
            <div className="mx-auto max-w-[1024px] px-6">
                
                {/* Header & Timer */}
                <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div>
                        <h1 className="text-2xl font-black text-[#0B1736]">Thanh toán an toàn</h1>
                        <p className="mt-1 text-sm font-medium text-[#64748B]">
                            Hoàn tất thông tin thanh toán để nhận vé của bạn
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-[#F43F73]/10 px-4 py-2 text-[#F43F73]">
                        <Clock size={20} />
                        <span className="font-bold">
                            Thời gian giữ ghế: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column: Event Details & Payment Methods */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Event Summary */}
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#0B1736]">
                                <Ticket size={20} className="text-[#F43F73]" />
                                Thông tin sự kiện
                            </h2>
                            <div className="flex flex-col gap-5 sm:flex-row">
                                <img
                                    src={event.thumbnailUrl || event.bannerUrl || 'https://via.placeholder.com/150'}
                                    alt={event.name}
                                    className="h-28 w-40 rounded-xl object-cover"
                                />
                                <div>
                                    <h3 className="text-lg font-black text-[#0B1736]">{event.name}</h3>
                                    <p className="mt-2 text-sm font-medium text-[#475569]">
                                        <span className="font-bold text-[#0B1736]">Thời gian:</span> {formatDateTime(event.startTime)}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-[#475569]">
                                        <span className="font-bold text-[#0B1736]">Địa điểm:</span> {event.venueName}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-[#475569]">
                                        <span className="font-bold text-[#0B1736]">{seatList ? 'Vị trí ghế:' : 'Khu vực:'}</span> {seatList || zoneList}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#0B1736]">
                                <CreditCard size={20} className="text-[#6D28D9]" />
                                Phương thức thanh toán
                            </h2>
                            <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-[#F43F73] bg-[#F43F73]/5 p-4 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                                        <img src="https://payos.vn/wp-content/uploads/sites/13/2023/07/payos-logo.svg" alt="PayOS" className="h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0B1736]">Thanh toán qua PayOS</p>
                                        <p className="text-xs text-[#64748B]">Hỗ trợ quét mã QR VietQR miễn phí</p>
                                    </div>
                                </div>
                                <input type="radio" name="payment" checked readOnly className="h-5 w-5 accent-[#F43F73]" />
                            </label>
                        </div>

                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="h-fit rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:sticky lg:top-24">
                        <h2 className="text-lg font-black text-[#0B1736]">Tổng quan đơn hàng</h2>
                        
                        <div className="mt-6 flex justify-between text-sm font-medium text-[#475569]">
                            <span>Số lượng vé</span>
                            <span className="font-bold text-[#0B1736]">{totalTickets} vé</span>
                        </div>
                        <div className="mt-3 flex justify-between text-sm font-medium text-[#475569]">
                            <span>Tạm tính</span>
                            <span className="font-bold text-[#0B1736]">{formatCurrency(total || 0)}</span>
                        </div>
                        
                        <hr className="my-5 border-[#E2E8F0]" />
                        
                        <div className="flex justify-between text-lg">
                            <span className="font-black text-[#0B1736]">Tổng tiền</span>
                            <span className="font-black text-[#F43F73]">{formatCurrency(total || 0)}</span>
                        </div>

                        {error && (
                            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1736] text-sm font-black text-white transition hover:bg-[#0B1736]/90 disabled:opacity-70"
                        >
                            {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
                            <ShieldCheck size={18} />
                        </button>
                        <p className="mt-4 text-center text-xs font-medium text-[#94A3B8]">
                            Bằng việc nhấn "Thanh toán", bạn đồng ý với các Điều khoản & Chính sách của N3V Ticket.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Checkout;
