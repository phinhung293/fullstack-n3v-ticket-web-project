import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../utils/authStorage';

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
    Search,
    Settings,
    Tag,
    Ticket,
    Trash2,
    UserRound,
    Users,
    X,
} from 'lucide-react';

import axiosInstance from '../api/axiosInstance';

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

type EditUserForm = {
    fullName: string;
    phone: string;
    role: 'ADMIN' | 'CUSTOMER';
    status: 'ACTIVE' | 'LOCKED';
};

const menuItems = [
    { label: 'Tổng quan', icon: Home },
    { label: 'Sự kiện', icon: CalendarDays },
    { label: 'Đơn vé', icon: ClipboardList },
    { label: 'Người dùng', icon: Users },
    { label: 'Khuyến mãi', icon: Tag },
    { label: 'Báo cáo', icon: BarChart3 },
    { label: 'Cài đặt', icon: Settings },
];

const statCards = [
    {
        title: 'Tổng vé đã bán',
        icon: Ticket,
        iconClass: 'bg-[#F43F73]/12 text-[#F43F73]',
    },
    {
        title: 'Doanh thu hôm nay',
        icon: CircleDollarSign,
        iconClass: 'bg-[#8B5CF6]/12 text-[#8B5CF6]',
    },
    {
        title: 'Sự kiện đang hoạt động',
        icon: CalendarDays,
        iconClass: 'bg-[#2563EB]/12 text-[#2563EB]',
    },
    {
        title: 'Người dùng mới',
        icon: UserRound,
        iconClass: 'bg-[#22C55E]/12 text-[#16A34A]',
    },
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

function AdminDashboard() {
    const navigate = useNavigate();

    const [activeMenu, setActiveMenu] = useState('Tổng quan');
    const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

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

    useEffect(() => {
        if (activeMenu === 'Người dùng') {
            void fetchUsers();
        }
    }, [activeMenu]);

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

                <div className="mt-5 grid gap-4 xl:grid-cols-4">
                    {statCards.map(({ title, icon: Icon, iconClass }) => (
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
                                    <p className="truncate text-base font-black text-[#0B1736]">
                                        {title}
                                    </p>

                                    <div className="mt-3 h-7 w-32 rounded-lg bg-[#F8FAFC]" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
                    <div className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Doanh thu 7 ngày gần nhất
                            </h3>

                            <button
                                type="button"
                                className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-bold text-[#334155]"
                            >
                                7 ngày
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#64748B]">
                            <span className="h-2 w-5 rounded-full bg-[#F43F73]" />
                            Doanh thu
                        </div>

                        <div className="mt-4 h-[205px] rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC]" />
                    </div>

                    <div className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Vé bán ra 7 ngày gần nhất
                            </h3>

                            <button
                                type="button"
                                className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-bold text-[#334155]"
                            >
                                7 ngày
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#64748B]">
                            <span className="h-2 w-5 rounded-full bg-[#5B35F5]" />
                            Số vé
                        </div>

                        <div className="mt-4 h-[205px] rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC]" />
                    </div>

                    <div className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Thông báo & Hoạt động
                            </h3>

                            <button
                                type="button"
                                className="text-xs font-black text-[#F43F73]"
                            >
                                Xem tất cả
                            </button>
                        </div>

                        <div className="h-[232px] rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC]" />
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
                            >
                                Xem tất cả ›
                            </button>
                        </div>

                        <table className="w-full table-fixed text-left text-[11px]">
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
                            <tr>
                                <td colSpan={7}>
                                    <div className="mt-4 h-[190px] rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC]" />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-black text-[#0B1736]">
                                Sự kiện nổi bật / Sắp diễn ra
                            </h3>

                            <button
                                type="button"
                                className="text-xs font-black text-[#F43F73]"
                            >
                                Xem tất cả ›
                            </button>
                        </div>

                        <table className="w-full table-fixed text-left text-[11px]">
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
                            <tr>
                                <td colSpan={6}>
                                    <div className="mt-4 h-[190px] rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC]" />
                                </td>
                            </tr>
                            </tbody>
                        </table>
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
                                                    className={`inline-flex max-w-full truncate rounded-md px-2 py-1 text-[10px] font-black ${
                                                        roleLabel === 'ADMIN'
                                                            ? 'bg-[#F3E8FF] text-[#7C3AED]'
                                                            : 'bg-[#FCE7F3] text-[#B000FF]'
                                                    }`}
                                                >
                                                    {roleLabel}
                                                </span>
                                        </td>

                                        <td className="px-3 py-4">
                                                <span
                                                    className={`inline-flex max-w-full truncate rounded-md px-2 py-1 text-[10px] font-black ${
                                                        user.status === 'ACTIVE'
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
                                                    className={`flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE3EF] transition ${
                                                        isAdminAccount
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

        if (activeMenu === 'Người dùng') {
            return renderUsers();
        }

        return renderPlaceholder();
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0B1736]">
            <header className="fixed left-0 right-0 top-0 z-50 flex h-[76px] items-center justify-between border-b border-white/10 bg-[#061A35] px-8 text-white shadow-[0_6px_18px_rgba(15,23,42,0.14)]">
                <div className="flex items-center">
                    <img
                        src="/images/n3v-ticket-logo.png"
                        alt="N3V Ticket"
                        className="h-[52px] w-auto rounded-lg bg-white object-contain p-1"
                    />
                </div>

                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                        aria-label="Thông báo"
                    >
                        <Bell size={22} strokeWidth={2.2} />

                        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F43F73] px-1.5 text-xs font-black text-white">
                            8
                        </span>
                    </button>

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
                                className={`text-white/70 transition ${
                                    isAdminDropdownOpen ? 'rotate-180' : ''
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

            <aside className="fixed left-0 top-[76px] z-40 flex h-[calc(100vh-76px)] w-[240px] flex-col border-2 border-[#111827] bg-white text-[#0B1736] shadow-[8px_0_28px_rgba(15,23,42,0.06)]">
                <nav className="mt-6 space-y-3 px-5">
                    {menuItems.map(({ label, icon: Icon }) => {
                        const isActive = activeMenu === label;

                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => setActiveMenu(label)}
                                className={`flex h-[52px] w-full items-center gap-4 rounded-xl px-5 text-sm font-black transition ${
                                    isActive
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

            <main className="ml-[240px] min-h-screen bg-[#F8FAFC] p-6 pt-[100px]">
                {renderContent()}
            </main>
        </div>
    );
}

export default AdminDashboard;