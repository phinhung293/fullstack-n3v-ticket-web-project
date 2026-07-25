import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../utils/authStorage';
import NotificationBell from '../components/NotificationBell';
import { getLatestNotifications } from '../api/notificationApi';
import type { NotificationItem } from '../types/notification';

import {
    BarChart3,
    Bell,
    CalendarDays,
    ChevronDown,
    CircleDollarSign,
    ClipboardList,
    Headphones,
    Home,
    LogOut,
    Pencil,
    Plus,
    ScanLine,
    Search,
    Ticket,
    Trash2,
    UserRound,
    Users,
    X,
    Menu,
} from 'lucide-react';

import axiosInstance from '../api/axiosInstance';
import AdminEvents from './admin/AdminEvents';
import AdminOrders from './admin/AdminOrders';
import AdminCheckIn from './admin/AdminCheckIn';

import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AdminReports from "./admin/AdminReports.tsx";

type UserItem = {
    id: number;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    status: string;
    avatarUrl?: string | null;
    createdAt?: string | null;
};

type ApiResponse<T> = {
    code: number;
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
};

type DashboardSummary = {
    totalRevenue: number;
    successfulOrders: number;
    totalTickets: number;
    checkedInTickets: number;
    checkInRate: number;
};

type RevenueChartItem = {
    date: string;
    revenue: number;
};

type TicketChartItem = {
    date: string;
    ticketCount: number;
};

type RevenuePeriod = 7 | 30 | 90;

type EditUserForm = {
    fullName: string;
    phone: string;
    role: 'ADMIN' | 'CUSTOMER';
    status: 'ACTIVE' | 'LOCKED';
};

type RecentOrderItem = {
    orderCode: string;
    eventName: string;
    customerName: string | null;
    totalTickets: number;
    totalAmount: number;
    status: string;
    createdAt: string;
};

type UpcomingEventItem = {
    id: number;
    name: string;
    startTime: string;
    venueName: string | null;
    city: string | null;
    soldTickets: number;
    totalCapacity: number;
    salesRate: number;
    status: string;
};

const menuItems = [
    { label: 'Tổng quan', icon: Home },
    { label: 'Check-in', icon: ScanLine },
    { label: 'Sự kiện', icon: CalendarDays },
    { label: 'Đơn vé', icon: ClipboardList },
    { label: 'Người dùng', icon: Users },
    { label: 'Báo cáo', icon: BarChart3 },
];

const getErrorMessage = (error: unknown) => {
    const err = error as {
        response?: {
            status?: number;
            data?: {
                message?: string;
            };
        };
        request?: unknown;
    };

    if (err.response?.data?.message) {
        return err.response.data.message;
    }

    if (err.response?.status === 401) {
        return 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }

    if (err.response?.status === 403) {
        return 'Tài khoản hiện tại không có quyền ADMIN. Hãy đăng nhập bằng tài khoản admin.';
    }

    if (err.response?.status === 404) {
        return 'Không tìm thấy API /api/admin/users. Kiểm tra lại AdminController.';
    }

    if (err.response?.status === 500) {
        return 'Backend đang lỗi 500. Kiểm tra tab Console trong IntelliJ.';
    }

    if (err.request) {
        return 'Không kết nối được backend. Hãy kiểm tra Spring Boot đã chạy ở cổng 8080 chưa.';
    }

    return 'Có lỗi xảy ra, vui lòng thử lại';
};

const getRoleLabel = (role: string) => {
    if (role === 'ROLE_ADMIN' || role === 'ADMIN') {
        return 'ADMIN';
    }

    return 'CUSTOMER';
};

const getDateLabel = (value?: string | null) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('vi-VN');
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatChartDate = (value: string) => {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}`;
};

const formatFullChartDate = (value: string) => {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}/${year}`;
};

const formatChartCurrency = (value: number) => {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toLocaleString('vi-VN', {
            maximumFractionDigits: 1,
        })} tr`;
    }

    if (value >= 1_000) {
        return `${(value / 1_000).toLocaleString('vi-VN', {
            maximumFractionDigits: 0,
        })}k`;
    }

    return value.toLocaleString('vi-VN');
};

function AdminDashboard() {
    const navigate = useNavigate();

    const [activeMenu, setActiveMenu] = useState('Tổng quan');
    const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [dashboardSummary, setDashboardSummary] =
        useState<DashboardSummary | null>(null);

    const [revenueChart, setRevenueChart] = useState<RevenueChartItem[]>([]);
    const [revenueDays, setRevenueDays] = useState<RevenuePeriod>(7);
    const [loadingRevenue, setLoadingRevenue] = useState(false);
    const [revenueError, setRevenueError] = useState('');

    const [ticketChart, setTicketChart] = useState<TicketChartItem[]>([]);
    const [ticketDays, setTicketDays] = useState<RevenuePeriod>(7);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [ticketError, setTicketError] = useState('');

    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState('');

    const [recentOrders, setRecentOrders] =
        useState<RecentOrderItem[]>([]);

    const [recentActivities, setRecentActivities] =
        useState<NotificationItem[]>([]);

    const [upcomingEvents, setUpcomingEvents] =
        useState<UpcomingEventItem[]>([]);

    const [loadingOverviewLists, setLoadingOverviewLists] =
        useState(false);

    const [overviewListsError, setOverviewListsError] =
        useState('');

    const fetchOverviewLists = async () => {
        setLoadingOverviewLists(true);
        setOverviewListsError('');

        try {
            const [
                ordersResponse,
                notifications,
                eventsResponse,
            ] = await Promise.all([
                axiosInstance.get<ApiResponse<RecentOrderItem[]>>(
                    '/admin/dashboard/recent-orders',
                ),
                getLatestNotifications(),
                axiosInstance.get<ApiResponse<UpcomingEventItem[]>>(
                    '/admin/dashboard/upcoming-events',
                ),
            ]);

            setRecentOrders(ordersResponse.data.data || []);
            setRecentActivities(notifications.slice(0, 5));
            setUpcomingEvents(eventsResponse.data.data || []);
        } catch (error) {
            console.error(
                'Không thể tải danh sách tổng quan',
                error,
            );

            setOverviewListsError(
                getErrorMessage(error),
            );
        } finally {
            setLoadingOverviewLists(false);
        }
    };

    const formatDateTime = (value: string) => {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getOrderStatusLabel = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return 'Thành công';
            case 'PENDING':
                return 'Chờ thanh toán';
            case 'FAILED':
                return 'Thanh toán không hoàn tất';
            case 'CANCELLED':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const dashboardCards = [
        {
            title: 'Tổng doanh thu',
            value: dashboardSummary
                ? formatCurrency(dashboardSummary.totalRevenue)
                : '0 ₫',
            icon: CircleDollarSign,
            iconClass: 'bg-[#8B5CF6]/12 text-[#8B5CF6]',
        },
        {
            title: 'Đơn thành công',
            value: dashboardSummary
                ? dashboardSummary.successfulOrders.toLocaleString('vi-VN')
                : '0',
            icon: ClipboardList,
            iconClass: 'bg-[#2563EB]/12 text-[#2563EB]',
        },
        {
            title: 'Tổng vé đã phát hành',
            value: dashboardSummary
                ? dashboardSummary.totalTickets.toLocaleString('vi-VN')
                : '0',
            icon: Ticket,
            iconClass: 'bg-[#F43F73]/12 text-[#F43F73]',
        },
        {
            title: 'Vé đã check-in',
            value: dashboardSummary
                ? `${dashboardSummary.checkedInTickets.toLocaleString(
                    'vi-VN',
                )} (${dashboardSummary.checkInRate}%)`
                : '0 (0%)',
            icon: UserRound,
            iconClass: 'bg-[#22C55E]/12 text-[#16A34A]',
        },
    ];

    const [users, setUsers] = useState<UserItem[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userError, setUserError] = useState('');

    const [keyword, setKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [editForm, setEditForm] = useState<EditUserForm>({
        fullName: '',
        phone: '',
        role: 'CUSTOMER',
        status: 'ACTIVE',
    });
    const [savingEdit, setSavingEdit] = useState(false);

    const handleLogout = () => {
        clearAuth();
        sessionStorage.clear();
        navigate('/login');
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setUserError('');

        try {
            const res = await axiosInstance.get<ApiResponse<UserItem[]>>('/admin/users');
            setUsers(res.data.data || []);
        } catch (error) {
            setUserError(getErrorMessage(error));
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchDashboardSummary = async () => {
        setLoadingDashboard(true);
        setDashboardError('');

        try {
            const response =
                await axiosInstance.get<ApiResponse<DashboardSummary>>(
                    '/admin/dashboard/summary',
                );

            setDashboardSummary(response.data.data);
        } catch (error) {
            setDashboardError(getErrorMessage(error));
        } finally {
            setLoadingDashboard(false);
        }
    };

    useEffect(() => {
        if (activeMenu === 'Người dùng') {
            void fetchUsers();
        }
    }, [activeMenu]);

    useEffect(() => {
        if (activeMenu === 'Tổng quan') {
            void fetchDashboardSummary();
        }
    }, [activeMenu]);

    useEffect(() => {
        if (activeMenu === 'Tổng quan') {
            void fetchRevenueChart(revenueDays);
        }
    }, [activeMenu, revenueDays]);

    useEffect(() => {
        if (activeMenu === 'Tổng quan') {
            void fetchTicketChart(ticketDays);
        }
    }, [activeMenu, ticketDays]);

    useEffect(() => {
        if (activeMenu === 'Tổng quan') {
            void fetchOverviewLists();
        }
    }, [activeMenu]);

    const fetchRevenueChart = async (days: RevenuePeriod) => {
        setLoadingRevenue(true);
        setRevenueError('');

        try {
            const response =
                await axiosInstance.get<ApiResponse<RevenueChartItem[]>>(
                    '/admin/dashboard/revenue',
                    {
                        params: {
                            days,
                        },
                    },
                );

            setRevenueChart(response.data.data || []);
        } catch (error) {
            console.error('Không thể tải dữ liệu doanh thu:', error);
            setRevenueError(getErrorMessage(error));
        } finally {
            setLoadingRevenue(false);
        }
    };

    const fetchTicketChart = async (days: RevenuePeriod) => {
        setLoadingTickets(true);
        setTicketError('');

        try {
            const response =
                await axiosInstance.get<ApiResponse<TicketChartItem[]>>(
                    '/admin/dashboard/tickets',
                    {
                        params: {
                            days,
                        },
                    },
                );

            setTicketChart(response.data.data || []);
        } catch (error) {
            console.error('Không thể tải dữ liệu số vé:', error);
            setTicketError(getErrorMessage(error));
        } finally {
            setLoadingTickets(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const text = keyword.trim().toLowerCase();

        return users.filter((user) => {
            const roleLabel = getRoleLabel(user.role);

            const matchKeyword =
                !text ||
                user.fullName.toLowerCase().includes(text) ||
                user.email.toLowerCase().includes(text) ||
                (user.phone || '').toLowerCase().includes(text);

            const matchRole = roleFilter === 'ALL' || roleLabel === roleFilter;
            const matchStatus = statusFilter === 'ALL' || user.status === statusFilter;

            return matchKeyword && matchRole && matchStatus;
        });
    }, [keyword, roleFilter, statusFilter, users]);

    const openEditModal = (user: UserItem) => {
        setEditingUser(user);
        setEditForm({
            fullName: user.fullName,
            phone: user.phone || '',
            role: getRoleLabel(user.role),
            status: user.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;

        setSavingEdit(true);

        try {
            const res = await axiosInstance.put<ApiResponse<UserItem>>(
                `/admin/users/${editingUser.id}`,
                editForm,
            );

            setUsers((prev) =>
                prev.map((item) => (item.id === editingUser.id ? res.data.data : item)),
            );

            setEditingUser(null);
        } catch (error) {
            alert(getErrorMessage(error));
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDeleteUser = async (user: UserItem) => {
        const roleLabel = getRoleLabel(user.role);

        if (roleLabel === 'ADMIN') {
            alert('Không được xóa tài khoản ADMIN');
            return;
        }

        const isConfirmed = window.confirm(`Bạn có chắc muốn xóa tài khoản ${user.fullName}?`);

        if (!isConfirmed) return;

        try {
            await axiosInstance.delete<ApiResponse<void>>(`/admin/users/${user.id}`);
            setUsers((prev) => prev.filter((item) => item.id !== user.id));
        } catch (error) {
            alert(getErrorMessage(error));
        }
    };

    const renderOverview = () => {
        return (
            <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <div>
                    <h1 className="text-2xl font-black text-[#0B1736]">
                        Trang quản trị N3V Ticket
                    </h1>

                    <p className="mt-2 text-sm font-medium text-[#64748B]">
                        Chào mừng trở lại, Admin! Đây là khu vực quản trị hệ thống.
                    </p>
                </div>

                {dashboardError && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                        {dashboardError}
                    </div>
                )}

                {overviewListsError && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        Không thể tải đơn vé, hoạt động hoặc sự kiện: {overviewListsError}
                    </div>
                )}

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {dashboardCards.map(
                        ({ title, value, icon: Icon, iconClass }) => (
                            <div
                                key={title}
                                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClass}`}
                                    >
                                        <Icon size={25} strokeWidth={2.2} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[#64748B]">
                                            {title}
                                        </p>

                                        {loadingDashboard ? (
                                            <div className="mt-2 h-7 w-32 animate-pulse rounded-lg bg-[#F1F5F9]" />
                                        ) : (
                                            <p className="mt-2 truncate text-xl font-black text-[#0B1736]">
                                                {value}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ),
                    )}
                </div>

                <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
                    <div className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Doanh thu {revenueDays} ngày gần nhất
                            </h3>

                            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#334155]">
                                <CalendarDays size={14} />

                                <select
                                    value={revenueDays}
                                    onChange={(event) =>
                                        setRevenueDays(
                                            Number(event.target.value) as RevenuePeriod,
                                        )
                                    }
                                    disabled={loadingRevenue}
                                    className="cursor-pointer bg-transparent font-bold text-[#334155] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Chọn khoảng thời gian thống kê doanh thu"
                                >
                                    <option value={7}>7 ngày</option>
                                    <option value={30}>30 ngày</option>
                                    <option value={90}>90 ngày</option>
                                </select>
                            </div>
                        </div>

                        {revenueError && (
                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                                {revenueError}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#64748B]">
                            <span className="h-2 w-5 rounded-full bg-[#F43F73]" />
                            Doanh thu
                        </div>

                        <div className="relative mt-4 h-[205px] min-w-0">
                            {revenueChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={revenueChart}
                                        margin={{
                                            top: 8,
                                            right: 12,
                                            bottom: 4,
                                            left: 8,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#E2E8F0"
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatChartDate}
                                            tickLine={false}
                                            axisLine={{
                                                stroke: '#CBD5E1',
                                            }}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748B',
                                            }}
                                            minTickGap={24}
                                        />

                                        <YAxis
                                            width={58}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748B',
                                            }}
                                            tickFormatter={formatChartCurrency}
                                        />

                                        <Tooltip
                                            formatter={(value) => [
                                                `${Number(value).toLocaleString('vi-VN')} ₫`,
                                                'Doanh thu',
                                            ]}
                                            labelFormatter={(label) =>
                                                `Ngày: ${formatFullChartDate(String(label))}`
                                            }
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                                            }}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#F43F73"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: '#FFFFFF',
                                                stroke: '#F43F73',
                                                strokeWidth: 3,
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : loadingRevenue ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-[#64748B]">
                                    Đang tải dữ liệu doanh thu...
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-[#64748B]">
                                    Chưa có dữ liệu doanh thu
                                </div>
                            )}

                            {loadingRevenue && revenueChart.length > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[1px]">
                                    <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#475569] shadow">
                                        Đang cập nhật...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Vé bán ra {ticketDays} ngày gần nhất
                            </h3>

                            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#334155]">
                                <CalendarDays size={14} />

                                <select
                                    value={ticketDays}
                                    onChange={(event) =>
                                        setTicketDays(
                                            Number(event.target.value) as RevenuePeriod,
                                        )
                                    }
                                    disabled={loadingTickets}
                                    className="cursor-pointer bg-transparent font-bold text-[#334155] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Chọn khoảng thời gian thống kê số vé"
                                >
                                    <option value={7}>7 ngày</option>
                                    <option value={30}>30 ngày</option>
                                    <option value={90}>90 ngày</option>
                                </select>
                            </div>
                        </div>

                        {ticketError && (
                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                                {ticketError}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#64748B]">
                            <span className="h-2 w-5 rounded-full bg-[#5B35F5]" />
                            Số vé
                        </div>

                        <div className="relative mt-4 h-[205px] min-w-0">
                            {ticketChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={ticketChart}
                                        margin={{
                                            top: 8,
                                            right: 12,
                                            bottom: 4,
                                            left: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#E2E8F0"
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatChartDate}
                                            tickLine={false}
                                            axisLine={{
                                                stroke: '#CBD5E1',
                                            }}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748B',
                                            }}
                                            minTickGap={24}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            width={32}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748B',
                                            }}
                                        />

                                        <Tooltip
                                            formatter={(value) => [
                                                `${Number(value).toLocaleString('vi-VN')} vé`,
                                                'Số vé',
                                            ]}
                                            labelFormatter={(label) =>
                                                `Ngày: ${formatFullChartDate(String(label))}`
                                            }
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow:
                                                    '0 8px 24px rgba(15, 23, 42, 0.08)',
                                            }}
                                        />

                                        <Bar
                                            dataKey="ticketCount"
                                            fill="#5B35F5"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={34}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : loadingTickets ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-[#64748B]">
                                    Đang tải dữ liệu số vé...
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-[#64748B]">
                                    Chưa có dữ liệu số vé
                                </div>
                            )}

                            {loadingTickets && ticketChart.length > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[1px]">
                                    <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#475569] shadow">
                                        Đang cập nhật...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Thông báo & Hoạt động
                            </h3>
                        </div>

                        <div className="h-[232px] overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white">
                            {loadingOverviewLists ? (
                                <div className="space-y-3 p-4">
                                    {[1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="h-14 animate-pulse rounded-lg bg-[#F1F5F9]"
                                        />
                                    ))}
                                </div>
                            ) : recentActivities.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-semibold text-[#94A3B8]">
                                    Chưa có hoạt động
                                </div>
                            ) : (
                                recentActivities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex gap-3 border-b border-[#F1F5F9] p-3 last:border-0"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F5] text-[#F43F73]">
                                            <Bell size={17} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-black text-[#0B1736]">
                                                {activity.title}
                                            </p>

                                            <p className="mt-1 line-clamp-2 text-[11px] font-medium text-[#64748B]">
                                                {activity.message}
                                            </p>

                                            <p className="mt-1 text-[10px] font-semibold text-[#94A3B8]">
                                                {formatDateTime(activity.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Đơn vé gần đây
                            </h3>

                            <button
                                type="button"
                                className="text-xs font-black text-[#F43F73]"
                                onClick={() => setActiveMenu('Đơn vé')}
                            >
                                Xem tất cả ›
                            </button>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar pb-2">
                            <table className="w-full min-w-[700px] table-fixed text-left text-[11px]">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] text-[#334155]">
                                        <th className="w-[80px] pb-2 font-black">Mã đơn</th>
                                        <th className="w-[170px] pb-2 font-black">Sự kiện</th>
                                        <th className="w-[115px] pb-2 font-black">Khách hàng</th>
                                        <th className="w-[42px] pb-2 font-black">Vé</th>
                                        <th className="w-[90px] pb-2 font-black">Tổng tiền</th>
                                        <th className="w-[110px] pb-2 font-black">Trạng thái</th>
                                        <th className="w-[110px] pb-2 font-black">Thời gian</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loadingOverviewLists ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center">
                                                Đang tải...
                                            </td>
                                        </tr>
                                    ) : recentOrders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-8 text-center font-semibold text-[#94A3B8]"
                                            >
                                                Chưa có đơn vé
                                            </td>
                                        </tr>
                                    ) : (
                                        recentOrders.map((order) => (
                                            <tr
                                                key={order.orderCode}
                                                className="border-b border-[#F1F5F9]"
                                            >
                                                <td className="py-3 font-bold">
                                                    #{order.orderCode}
                                                </td>

                                                <td className="truncate py-3">
                                                    {order.eventName}
                                                </td>

                                                <td className="truncate py-3">
                                                    {order.customerName || 'Khách hàng'}
                                                </td>

                                                <td className="py-3">
                                                    {order.totalTickets}
                                                </td>

                                                <td className="py-3 font-bold text-[#F43F73]">
                                                    {formatCurrency(order.totalAmount)}
                                                </td>

                                                <td className="py-3">
                                                    {getOrderStatusLabel(order.status)}
                                                </td>

                                                <td className="py-3">
                                                    {formatDateTime(order.createdAt)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                        </table>
                        </div>
                    </div>

                    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Sự kiện nổi bật / Sắp diễn ra
                            </h3>

                            <button
                                type="button"
                                className="text-xs font-black text-[#F43F73]"
                                onClick={() => setActiveMenu('Sự kiện')}
                            >
                                Xem tất cả ›
                            </button>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar pb-2">
                            <table className="w-full min-w-[650px] table-fixed text-left text-[11px]">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] text-[#334155]">
                                        <th className="w-[190px] pb-2 font-black">Sự kiện</th>
                                        <th className="w-[90px] pb-2 font-black">Thời gian</th>
                                        <th className="w-[130px] pb-2 font-black">Địa điểm</th>
                                        <th className="w-[90px] pb-2 font-black">Vé đã bán</th>
                                        <th className="w-[70px] pb-2 font-black">Tỉ lệ</th>
                                        <th className="w-[88px] pb-2 font-black">Trạng thái</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loadingOverviewLists ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center">
                                                Đang tải...
                                            </td>
                                        </tr>
                                    ) : upcomingEvents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-8 text-center font-semibold text-[#94A3B8]"
                                            >
                                                Chưa có sự kiện sắp diễn ra
                                            </td>
                                        </tr>
                                    ) : (
                                        upcomingEvents.map((event) => (
                                            <tr
                                                key={event.id}
                                                className="border-b border-[#F1F5F9]"
                                            >
                                                <td className="truncate py-3 font-bold">
                                                    {event.name}
                                                </td>

                                                <td className="py-3">
                                                    {formatDateTime(event.startTime)}
                                                </td>

                                                <td className="truncate py-3">
                                                    {event.venueName || event.city || 'Chưa cập nhật'}
                                                </td>

                                                <td className="py-3">
                                                    {event.soldTickets}/{event.totalCapacity}
                                                </td>

                                                <td className="py-3">
                                                    {event.salesRate}%
                                                </td>

                                                <td className="py-3">
                                                    {event.status === 'ONGOING'
                                                        ? 'Đang diễn ra'
                                                        : 'Sắp diễn ra'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    const renderUsers = () => {
        return (
            <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-[#0B1736]">
                            Danh sách người dùng
                        </h1>

                        <p className="mt-1 text-sm font-medium text-[#64748B]">
                            Dữ liệu được lấy trực tiếp từ database.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="flex h-10 items-center gap-2 rounded-lg bg-[#5B00FF] px-4 text-sm font-black text-white shadow-[0_10px_22px_rgba(91,0,255,0.22)] transition hover:bg-[#4B00D8]"
                    >
                        <Plus size={17} strokeWidth={2.5} />
                        Thêm người dùng
                    </button>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="relative w-[300px]">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                        />

                        <input
                            type="text"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            placeholder="Tìm kiếm tên, email, SĐT..."
                            className="h-10 w-full rounded-lg border border-[#DDE3EF] bg-white pl-9 pr-3 text-sm font-medium text-[#0B1736] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value)}
                        className="h-10 rounded-lg border border-[#DDE3EF] bg-white px-3 text-sm font-semibold text-[#334155] outline-none focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                    >
                        <option value="ALL">Tất cả quyền</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="h-10 rounded-lg border border-[#DDE3EF] bg-white px-3 text-sm font-semibold text-[#334155] outline-none focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="LOCKED">LOCKED</option>
                    </select>
                </div>

                {userError && (
                    <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">
                        {userError}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                    <table className="w-full table-fixed text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#E2E8F0] bg-[#FBFCFE] text-xs font-black text-[#0B1736]">
                                <th className="w-[5%] px-3 py-4">ID</th>
                                <th className="w-[20%] px-3 py-4">Họ và tên</th>
                                <th className="w-[25%] px-3 py-4">Email</th>
                                <th className="w-[13%] px-3 py-4">Số điện thoại</th>
                                <th className="w-[10%] px-3 py-4">Quyền</th>
                                <th className="w-[10%] px-3 py-4">Trạng thái</th>
                                <th className="w-[10%] px-3 py-4">Ngày tạo</th>
                                <th className="w-[7%] px-3 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loadingUsers && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-8 text-center text-sm font-bold text-[#64748B]"
                                    >
                                        Đang tải danh sách người dùng...
                                    </td>
                                </tr>
                            )}

                            {!loadingUsers && filteredUsers.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-8 text-center text-sm font-bold text-[#64748B]"
                                    >
                                        Không có người dùng phù hợp
                                    </td>
                                </tr>
                            )}

                            {!loadingUsers &&
                                filteredUsers.map((user) => {
                                    const roleLabel = getRoleLabel(user.role);
                                    const isAdminAccount = roleLabel === 'ADMIN';

                                    return (
                                        <tr
                                            key={user.id}
                                            className="border-b border-[#E2E8F0] text-xs font-semibold text-[#0B1736] transition last:border-b-0 hover:bg-[#F8FAFC]"
                                        >
                                            <td className="px-3 py-4">
                                                {user.id}
                                            </td>

                                            <td className="px-3 py-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                                                        <UserRound size={17} />
                                                    </div>

                                                    <span className="truncate font-black">
                                                        {user.fullName}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="truncate px-3 py-4 text-[#334155]">
                                                {user.email}
                                            </td>

                                            <td className="truncate px-3 py-4 text-[#334155]">
                                                {user.phone || 'Chưa có'}
                                            </td>

                                            <td className="px-3 py-4">
                                                <span
                                                    className={`inline-flex max-w-full truncate rounded-md px-2 py-1 text-[10px] font-black ${roleLabel === 'ADMIN'
                                                        ? 'bg-[#F3E8FF] text-[#7C3AED]'
                                                        : 'bg-[#FCE7F3] text-[#B000FF]'
                                                        }`}
                                                >
                                                    {roleLabel}
                                                </span>
                                            </td>

                                            <td className="px-3 py-4">
                                                <span
                                                    className={`inline-flex max-w-full truncate rounded-md px-2 py-1 text-[10px] font-black ${user.status === 'ACTIVE'
                                                        ? 'bg-[#D1FAE5] text-[#059669]'
                                                        : 'bg-[#FEE2E2] text-[#DC2626]'
                                                        }`}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>

                                            <td className="truncate px-3 py-4 text-[#334155]">
                                                {getDateLabel(user.createdAt)}
                                            </td>

                                            <td className="px-3 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(user)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE3EF] bg-white text-[#6D00FF] transition hover:bg-[#F3E8FF]"
                                                        title="Sửa"
                                                    >
                                                        <Pencil size={15} strokeWidth={2.4} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDeleteUser(user)}
                                                        disabled={isAdminAccount}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE3EF] transition ${isAdminAccount
                                                            ? 'cursor-not-allowed bg-[#F1F5F9] text-[#94A3B8] opacity-60'
                                                            : 'bg-white text-[#EF321F] hover:bg-[#FEE2E2]'
                                                            }`}
                                                        title={
                                                            isAdminAccount
                                                                ? 'Không được xóa tài khoản ADMIN'
                                                                : 'Xóa'
                                                        }
                                                    >
                                                        <Trash2 size={15} strokeWidth={2.4} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {editingUser && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-[#0B1736]">
                                        Chỉnh sửa người dùng
                                    </h2>

                                    <p className="mt-1 text-sm font-medium text-[#64748B]">
                                        {editingUser.email}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9] text-[#334155] transition hover:bg-[#E2E8F0]"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-black text-[#0B1736]">
                                        Họ và tên
                                    </label>

                                    <input
                                        type="text"
                                        value={editForm.fullName}
                                        onChange={(event) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                fullName: event.target.value,
                                            }))
                                        }
                                        className="h-11 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold text-[#0B1736] outline-none focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-black text-[#0B1736]">
                                        Số điện thoại
                                    </label>

                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(event) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                phone: event.target.value,
                                            }))
                                        }
                                        className="h-11 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold text-[#0B1736] outline-none focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-black text-[#0B1736]">
                                            Quyền
                                        </label>

                                        <select
                                            value={editForm.role}
                                            onChange={(event) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    role: event.target.value as EditUserForm['role'],
                                                }))
                                            }
                                            className="h-11 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold text-[#0B1736] outline-none focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                                        >
                                            <option value="ADMIN">ADMIN</option>
                                            <option value="CUSTOMER">CUSTOMER</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-black text-[#0B1736]">
                                            Trạng thái
                                        </label>

                                        <select
                                            value={editForm.status}
                                            onChange={(event) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    status: event.target.value as EditUserForm['status'],
                                                }))
                                            }
                                            className="h-11 w-full rounded-lg border border-[#DDE3EF] px-3 text-sm font-semibold text-[#0B1736] outline-none focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="LOCKED">LOCKED</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="h-10 rounded-lg border border-[#DDE3EF] px-4 text-sm font-black text-[#334155] transition hover:bg-[#F8FAFC]"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void handleSaveEdit()}
                                    disabled={savingEdit}
                                    className="h-10 rounded-lg bg-[#F43F73] px-4 text-sm font-black text-white transition hover:bg-[#E11D5E] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        );
    };

    const renderPlaceholder = () => {
        return (
            <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <h1 className="text-2xl font-black text-[#0B1736]">
                    {activeMenu}
                </h1>

                <p className="mt-2 text-sm font-medium text-[#64748B]">
                    Khu vực này sẽ được thêm nội dung sau.
                </p>

                <div className="mt-6 h-[480px] rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC]" />
            </section>
        );
    };

    const renderContent = () => {
        if (activeMenu === 'Tổng quan') {
            return renderOverview();
        }
        if (activeMenu === 'Check-in') {
            return <AdminCheckIn />;
        }
        if (activeMenu === 'Người dùng') {
            return renderUsers();
        }
        if (activeMenu === 'Sự kiện') {
            return <AdminEvents />;
        }
        if (activeMenu === 'Đơn vé') {
            return <AdminOrders />;
        }
        if (activeMenu === 'Báo cáo') {
            return <AdminReports />;
        }
        return renderPlaceholder();
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-[76px] font-sans text-[#0B1736] overflow-x-hidden">
            <header className="fixed left-0 right-0 top-0 z-50 flex h-[76px] items-center justify-between border-b border-white/10 bg-[#061A35] px-4 sm:px-8 text-white shadow-[0_6px_18px_rgba(15,23,42,0.14)]">
                <div className="flex items-center gap-3">
                    <button 
                        className="lg:hidden p-1 text-white hover:text-[#F43F73] transition"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <img
                        src="/images/n3v-ticket-logo.png"
                        alt="N3V Ticket"
                        className="h-[52px] w-auto rounded-lg bg-white object-contain p-1"
                    />
                </div>

                <div className="flex items-center gap-6">
                    <NotificationBell variant="admin" />

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsAdminDropdownOpen((prev) => !prev)}
                            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/10"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#F43F73] bg-[#FFE7F0] text-base font-black text-[#F43F73]">
                                A
                            </div>

                            <div className="text-left">
                                <p className="text-base font-black leading-5 text-white">
                                    Admin
                                </p>

                                <p className="mt-0.5 text-sm font-semibold text-white/70">
                                    Quản trị viên
                                </p>
                            </div>

                            <ChevronDown
                                size={18}
                                className={`text-white/70 transition ${isAdminDropdownOpen ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {isAdminDropdownOpen && (
                            <div className="absolute right-0 top-[58px] w-[210px] rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#0B1736] shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
                                <div className="border-b border-[#E2E8F0] px-3 py-3">
                                    <p className="text-sm font-black text-[#0B1736]">
                                        Admin
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-[#64748B]">
                                        Quản trị viên
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="mt-2 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-black text-[#EF321F] transition hover:bg-[#FEF2F2]"
                                >
                                    <LogOut size={18} strokeWidth={2.4} />
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden top-[76px]"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`fixed left-0 top-[76px] z-40 flex h-[calc(100vh-76px)] w-[240px] flex-col border-2 border-[#111827] bg-white text-[#0B1736] shadow-[8px_0_28px_rgba(15,23,42,0.06)] transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <nav className="mt-6 space-y-3 px-5 overflow-y-auto custom-scrollbar">
                    {menuItems.map(({ label, icon: Icon }) => {
                        const isActive = activeMenu === label;

                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => { setActiveMenu(label); setIsMobileMenuOpen(false); }}
                                className={`flex h-[52px] w-full items-center gap-4 rounded-xl px-5 text-sm font-black transition ${isActive
                                    ? 'bg-[#F43F73] text-white shadow-[0_14px_28px_rgba(244,63,115,0.28)]'
                                    : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#F43F73]'
                                    }`}
                            >
                                <Icon size={21} strokeWidth={2.2} />
                                {label}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto p-5">
                    <div className="flex items-center gap-3 rounded-xl border border-[#FBCFE8] bg-[#FFF1F5] p-4 shadow-[0_10px_24px_rgba(244,63,115,0.08)]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F43F73] text-white">
                            <Headphones size={22} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-black text-[#0B1736]">
                                Hỗ trợ nhanh
                            </p>

                            <p className="text-xs font-medium leading-4 text-[#64748B]">
                                Trung tâm trợ giúp
                            </p>
                        </div>

                        <span className="ml-auto text-lg font-bold text-[#F43F73]">
                            ›
                        </span>
                    </div>
                </div>
            </aside>

            <main className="min-h-[calc(100vh-76px)] bg-[#F8FAFC] p-4 sm:p-6 lg:ml-[240px]">
                {renderContent()}
            </main>
        </div>
    );
}

export default AdminDashboard;