import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/format';
import { getMyOrders } from '../api/bookingApi';

type OrderResponse = {
    orderCode: string;
    status: string;
    totalAmount: number;
    eventName: string;
    ticketDetails: string;
    checkoutUrl: string | null;
    createdAt: string;
};

function MyTickets() {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await getMyOrders();
                setOrders(data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách vé');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2, label: 'Thành công' };
            case 'PENDING':
                return { bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock, label: 'Chờ thanh toán' };
            default:
                return { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle, label: 'Đã huỷ' };
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F43F73] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12">
            <div className="mx-auto max-w-[1024px] px-6">
                
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-[#0B1736]">Vé của tôi</h1>
                    <p className="mt-1 text-sm font-medium text-[#64748B]">
                        Quản lý danh sách các vé bạn đã đặt
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!error && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white py-16 text-center shadow-sm">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                            <Ticket size={32} />
                        </div>
                        <h3 className="mt-4 text-lg font-black text-[#0B1736]">Bạn chưa có vé nào</h3>
                        <p className="mt-2 text-sm font-medium text-[#64748B]">Hãy khám phá các sự kiện hấp dẫn và đặt vé ngay nhé!</p>
                        <Link to="/events" className="mt-6 flex items-center gap-2 rounded-xl bg-[#F43F73] px-6 py-3 text-sm font-black text-white hover:bg-[#E11D48] transition">
                            Xem sự kiện
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                )}

                <div className="grid gap-6">
                    {orders.map((order) => {
                        const { bg, text, icon: Icon, label } = getStatusStyle(order.status);

                        return (
                            <div key={order.orderCode} className="flex flex-col gap-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-black text-[#0B1736]">{order.eventName}</h3>
                                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${bg} ${text}`}>
                                            <Icon size={14} />
                                            {label}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-[#475569]">
                                        Mã đơn: <span className="font-bold text-[#0B1736]">#{order.orderCode}</span>
                                    </p>
                                    <p className="text-sm font-medium text-[#475569]">
                                        {order.ticketDetails}
                                    </p>
                                    <p className="text-sm text-[#94A3B8]">
                                        Ngày đặt: {formatDateTime(order.createdAt)}
                                    </p>
                                </div>

                                <div className="flex flex-col items-start gap-4 sm:items-end">
                                    <p className="text-xl font-black text-[#F43F73]">
                                        {formatCurrency(order.totalAmount)}
                                    </p>
                                    {order.status === 'PENDING' && order.checkoutUrl && (
                                        <a
                                            href={order.checkoutUrl}
                                            className="flex items-center gap-2 rounded-xl bg-[#0B1736] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0B1736]/90"
                                        >
                                            Thanh toán ngay
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}

export default MyTickets;