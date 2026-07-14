import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Ticket, Home } from 'lucide-react';


import apiClient from '../api/apiClient';

function BookingStatus() {
    const { orderCode } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const status = searchParams.get('status');

    // PayOS also sends: code, id, cancel, status (as url params)
    const isCancel = searchParams.get('cancel') === 'true' || status === 'cancel' || status === 'CANCELLED';
    const isSuccess = !isCancel && (status === 'success' || status === 'PAID');

    const [updated, setUpdated] = useState(false);

    useEffect(() => {
        if (!orderCode) {
            navigate('/');
        } else if (isSuccess && !updated) {
            apiClient.put(`/api/orders/${orderCode}/success`)
                .then(() => setUpdated(true))
                .catch(console.error);
        } else if (isCancel && !updated) {
            apiClient.put(`/api/orders/${orderCode}/cancel`)
                .then(() => setUpdated(true))
                .catch(console.error);
        }
    }, [orderCode, navigate, isSuccess, isCancel, updated]);

    if (!orderCode) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-16">
            <div className="mx-auto max-w-[600px] px-6 text-center">
                
                <div className="rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm sm:p-12">
                    {isSuccess ? (
                        <>
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                                <CheckCircle2 size={48} />
                            </div>
                            <h1 className="mt-6 text-3xl font-black text-[#0B1736]">Đặt vé thành công!</h1>
                            <p className="mt-4 text-sm font-medium leading-relaxed text-[#475569]">
                                Cảm ơn bạn đã sử dụng dịch vụ của N3V Ticket.<br />
                                Mã đơn hàng của bạn là <span className="font-bold text-[#0B1736]">#{orderCode}</span>.<br />
                                Vui lòng kiểm tra Email để nhận vé điện tử (mã QR).
                            </p>
                            
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <Link
                                    to="/my-tickets"
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#F43F73] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#E11D48]"
                                >
                                    <Ticket size={18} />
                                    Xem vé của tôi
                                </Link>
                                <Link
                                    to="/"
                                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#E2E8F0] bg-white px-6 py-3.5 text-sm font-bold text-[#0B1736] transition hover:border-[#CBD5E1]"
                                >
                                    <Home size={18} />
                                    Về trang chủ
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
                                <XCircle size={48} />
                            </div>
                            <h1 className="mt-6 text-3xl font-black text-[#0B1736]">Thanh toán thất bại</h1>
                            <p className="mt-4 text-sm font-medium leading-relaxed text-[#475569]">
                                Đơn hàng <span className="font-bold text-[#0B1736]">#{orderCode}</span> đã bị huỷ hoặc thanh toán không thành công.<br />
                                Ghế của bạn có thể đã được giải phóng.
                            </p>
                            
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <Link
                                    to="/events"
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#F43F73] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#E11D48]"
                                >
                                    Xem sự kiện khác
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}

export default BookingStatus;
