import { useEffect, useMemo, useState } from 'react';
import { Ticket, Clock, CheckCircle2, XCircle, AlertCircle, Search, Filter, CalendarDays } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { getMyOrders } from '../../api/bookingApi';

type OrderResponse = {
    orderCode: string;
    status: string;
    totalAmount: number;
    eventName: string;
    ticketDetails: string;
    checkoutUrl: string | null;
    createdAt: string;
};

export default function OrderHistory() {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

    // Filters & Sorting
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredAndSortedOrders = useMemo(() => {
        let result = [...orders];

        if (filterStatus !== 'ALL') {
            result = result.filter(order => order.status === filterStatus);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(order => 
                order.orderCode.toLowerCase().includes(query) || 
                order.eventName.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [orders, filterStatus, sortOrder, searchQuery]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F43F73] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-black text-[#0B1736]">Lịch sử đặt vé</h2>
            <p className="mt-2 text-sm font-medium text-[#64748B]">Quản lý, tra cứu và theo dõi trạng thái các đơn hàng của bạn</p>

            {/* Toolbar: Search, Filter, Sort */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input 
                        type="text"
                        placeholder="Tìm theo mã đơn hoặc tên sự kiện..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 text-sm font-medium text-[#0B1736] outline-none transition focus:border-[#F43F73] focus:ring-4 focus:ring-[#F43F73]/10"
                    />
                </div>
                
                <div className="flex gap-3">
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-11 cursor-pointer appearance-none rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-8 text-sm font-bold text-[#0B1736] outline-none transition focus:border-[#F43F73]"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="SUCCESS">Thành công</option>
                            <option value="PENDING">Chờ thanh toán</option>
                            <option value="FAILED">Đã huỷ</option>
                        </select>
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    </div>

                    <div className="relative">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'DESC' | 'ASC')}
                            className="h-11 cursor-pointer appearance-none rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-8 text-sm font-bold text-[#0B1736] outline-none transition focus:border-[#F43F73]"
                        >
                            <option value="DESC">Mới nhất</option>
                            <option value="ASC">Cũ nhất</option>
                        </select>
                        <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {!error && filteredAndSortedOrders.length === 0 && (
                <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#94A3B8] shadow-sm">
                        <Ticket size={32} />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-[#0B1736]">Không tìm thấy đơn hàng</h3>
                    <p className="mt-2 text-sm font-medium text-[#64748B]">Chưa có đơn hàng nào khớp với điều kiện tìm kiếm.</p>
                </div>
            )}

            <div className="mt-6 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredAndSortedOrders.map((order) => {
                    const { bg, text, icon: Icon, label } = getStatusStyle(order.status);

                    return (
                        <div key={order.orderCode} className="flex flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:border-[#CBD5E1] sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-base font-black text-[#0B1736]">{order.eventName}</h3>
                                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${bg} ${text}`}>
                                        <Icon size={14} />
                                        {label}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-[#475569]">
                                    <p>Mã đơn: <span className="font-bold text-[#0B1736]">#{order.orderCode}</span></p>
                                    <span className="hidden text-[#CBD5E1] sm:inline">•</span>
                                    <p>{formatDateTime(order.createdAt)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-start gap-3 sm:items-end">
                                <p className="text-lg font-black text-[#F43F73]">
                                    {formatCurrency(order.totalAmount)}
                                </p>
                                <div className="flex gap-2">
                                    {order.status === 'PENDING' && order.checkoutUrl && (
                                        <a
                                            href={order.checkoutUrl}
                                            className="flex items-center justify-center rounded-xl bg-[#0B1736] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0B1736]/90"
                                        >
                                            Thanh toán
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="flex items-center justify-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-bold text-[#0B1736] transition hover:bg-[#F8FAFC]"
                                    >
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-opacity">
                    <div className="relative w-full max-w-[500px] rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="absolute right-4 top-4 rounded-full p-2 text-[#94A3B8] transition hover:bg-[#F1F5F9] hover:text-[#0B1736]"
                        >
                            <XCircle size={24} />
                        </button>
                        
                        <div className="text-center">
                            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${getStatusStyle(selectedOrder.status).bg} ${getStatusStyle(selectedOrder.status).text}`}>
                                {(() => {
                                    const Icon = getStatusStyle(selectedOrder.status).icon;
                                    return <Icon size={32} />;
                                })()}
                            </div>
                            <h2 className="mt-4 text-2xl font-black text-[#0B1736]">Chi tiết đơn hàng</h2>
                            <p className="mt-1 text-sm font-medium text-[#64748B]">Mã đơn: #{selectedOrder.orderCode}</p>
                        </div>
                        
                        <div className="mt-8 space-y-4 rounded-2xl bg-[#F8FAFC] p-5">
                            <div className="flex justify-between border-b border-[#E2E8F0] pb-4">
                                <span className="text-sm font-medium text-[#64748B]">Sự kiện</span>
                                <span className="text-sm font-bold text-[#0B1736] text-right max-w-[200px] truncate">{selectedOrder.eventName}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#E2E8F0] pb-4">
                                <span className="text-sm font-medium text-[#64748B]">Trạng thái</span>
                                <span className={`text-sm font-bold ${getStatusStyle(selectedOrder.status).text}`}>
                                    {getStatusStyle(selectedOrder.status).label}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-[#E2E8F0] pb-4">
                                <span className="text-sm font-medium text-[#64748B]">Ngày đặt</span>
                                <span className="text-sm font-bold text-[#0B1736]">{formatDateTime(selectedOrder.createdAt)}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-[#E2E8F0] pb-4">
                                <span className="text-sm font-medium text-[#64748B]">Chi tiết vé / ghế</span>
                                <span className="text-sm font-bold text-[#0B1736]">{selectedOrder.ticketDetails}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-base font-black text-[#0B1736]">Tổng thanh toán</span>
                                <span className="text-lg font-black text-[#F43F73]">{formatCurrency(selectedOrder.totalAmount)}</span>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="mt-8 w-full rounded-xl bg-[#0B1736] py-3.5 text-sm font-black text-white transition hover:bg-[#0B1736]/90"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
