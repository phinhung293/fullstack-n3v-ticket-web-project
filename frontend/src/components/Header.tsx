import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    Bell,
    ChevronDown,
    Heart,
    LogOut,
    Search,
    Ticket,
    UserRound,
} from 'lucide-react';
import { clearAuth, getAuthUser } from '../utils/authStorage';

type HeaderAuthUser = {
    role?: string;
    fullName?: string;
    name?: string;
    avatarUrl?: string;
};

const menuItems = [
    {
        label: 'Sự kiện',
        path: '/events',
    },
    {
        label: 'Trải nghiệm',
        path: '/experiences',
    },
    {
        label: 'Địa điểm',
        path: '/venues',
    },
    {
        label: 'Tin tức',
        path: '/news',
    },
    {
        label: 'Ưu đãi',
        path: '/promotions',
    },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex h-full shrink-0 items-center text-sm font-bold transition ${isActive ? 'text-[#F43F73]' : 'text-white hover:text-[#F43F73]'
    }`;

function Header() {
    const navigate = useNavigate();

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');

    const authUser = getAuthUser() as HeaderAuthUser | null;

    const isLoggedIn = Boolean(authUser);
    const isAdmin = authUser?.role === 'ROLE_ADMIN' || authUser?.role === 'ADMIN';

    const userName = authUser?.fullName || authUser?.name || 'Người dùng';
    const userInitial = userName.trim().charAt(0).toUpperCase() || 'U';

    const handleSearch = () => {
        const keyword = searchKeyword.trim();

        if (!keyword) {
            navigate('/events');
            return;
        }

        navigate(`/events?keyword=${encodeURIComponent(keyword)}`);
    };

    const handleViewProfile = () => {
        setIsUserMenuOpen(false);
        navigate('/profile');
    };

    const handleLogout = () => {
        setIsUserMenuOpen(false);
        clearAuth();
        navigate('/login');
        window.location.reload();
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-[#061A35] text-white">
            <div className="border-b border-white/10">
                <div className="mx-auto grid h-[74px] max-w-[1320px] grid-cols-[210px_minmax(500px,620px)_1fr] items-center gap-8 px-6">
                    <Link to="/" className="flex shrink-0 items-center">
                        <div className="overflow-hidden rounded-lg p-1">
                            <img
                                src="/images/n3v-ticket-logo.png"
                                alt="N3V Ticket"
                                className="h-12 w-auto object-contain"
                            />
                        </div>
                    </Link>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSearch();
                        }}
                        className="hidden h-11 overflow-hidden rounded-xl bg-white shadow-[0_8px_20px_rgba(15,23,42,0.12)] md:flex"
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                            <Search
                                size={20}
                                className="shrink-0 text-[#9CA3AF]"
                            />

                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                                placeholder="Tìm kiếm sự kiện, ca sĩ, địa điểm..."
                                className="h-full w-full min-w-0 bg-transparent text-sm font-semibold text-[#1F2937] outline-none placeholder:text-[#9CA3AF]"
                            />
                        </div>

                        <button
                            type="submit"
                            className="h-full w-[112px] shrink-0 bg-[#F43F73] text-sm font-black text-white transition hover:bg-[#E11D5E]"
                        >
                            Tìm kiếm
                        </button>
                    </form>

                    {!isLoggedIn && (
                        <div className="flex shrink-0 items-center justify-end gap-3">
                            <NavLink
                                to="/login"
                                className={({ isActive }) =>
                                    `flex h-11 min-w-[110px] items-center justify-center rounded-xl border px-5 text-sm font-bold transition ${isActive
                                        ? 'border-[#F43F73] bg-[#F43F73] text-white'
                                        : 'border-white/25 bg-transparent text-white hover:border-[#F43F73] hover:bg-[#F43F73]'
                                    }`
                                }
                            >
                                Đăng nhập
                            </NavLink>

                            <NavLink
                                to="/register"
                                className={({ isActive }) =>
                                    `flex h-11 min-w-[110px] items-center justify-center rounded-xl border px-5 text-sm font-bold transition ${isActive
                                        ? 'border-[#F43F73] bg-[#F43F73] text-white'
                                        : 'border-white/25 bg-transparent text-white hover:border-[#F43F73] hover:bg-[#F43F73]'
                                    }`
                                }
                            >
                                Đăng ký
                            </NavLink>
                        </div>
                    )}

                    {isLoggedIn && !isAdmin && (
                        <div className="flex shrink-0 items-center justify-end gap-5 whitespace-nowrap">
                            <NavLink
                                to="/my-tickets"
                                className={({ isActive }) =>
                                    `flex items-center gap-1.5 text-xs font-bold transition ${isActive ? 'text-[#F43F73]' : 'text-white hover:text-[#F43F73]'
                                    }`
                                }
                            >
                                <Ticket size={16} />
                                Vé của tôi
                            </NavLink>

                            <NavLink
                                to="/favorites"
                                className={({ isActive }) =>
                                    `flex items-center gap-1.5 text-xs font-bold transition ${isActive ? 'text-[#F43F73]' : 'text-white hover:text-[#F43F73]'
                                    }`
                                }
                            >
                                <Heart size={16} />
                                Yêu thích
                            </NavLink>

                            <button
                                type="button"
                                className="relative flex h-8 w-8 items-center justify-center text-white transition hover:text-[#F43F73]"
                                aria-label="Thông báo"
                            >
                                <Bell size={17} />

                                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F43F73] px-1 text-[10px] font-black leading-none text-white">
                                    3
                                </span>
                            </button>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 transition hover:text-[#F43F73]"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F43F73] text-xs font-black text-white">
                                        {authUser?.avatarUrl ? (
                                            <img
                                                src={authUser.avatarUrl}
                                                alt={userName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            userInitial
                                        )}
                                    </div>

                                    <span className="max-w-[130px] truncate text-xs font-bold">
                                        {userName}
                                    </span>

                                    <ChevronDown
                                        size={14}
                                        className={`text-white/70 transition ${isUserMenuOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-[44px] z-50 w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#0B1736] py-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                                        <button
                                            type="button"
                                            onClick={handleViewProfile}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#F43F73]"
                                        >
                                            <UserRound size={16} />
                                            Xem thông tin
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#F43F73]"
                                        >
                                            <LogOut size={16} />
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isLoggedIn && isAdmin && (
                        <div className="flex shrink-0 items-center justify-end gap-5">
                            <NavLink
                                to="/admin"
                                className={({ isActive }) =>
                                    `rounded-xl px-5 py-3 text-sm font-black text-white transition ${isActive ? 'bg-[#E11D60]' : 'bg-[#F43F73] hover:bg-[#E11D60]'
                                    }`
                                }
                            >
                                Quản trị
                            </NavLink>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-3 transition hover:text-[#F43F73]"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-black text-[#061A35]">
                                        A
                                    </div>

                                    <div className="text-left">
                                        <div className="text-sm font-black">
                                            {userName || 'Admin'}
                                        </div>

                                        <div className="text-xs font-bold text-[#F43F73]">
                                            Admin
                                        </div>
                                    </div>

                                    <ChevronDown
                                        size={14}
                                        className={`text-white/70 transition ${isUserMenuOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-[52px] z-50 w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#0B1736] py-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                                        <button
                                            type="button"
                                            onClick={handleViewProfile}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#F43F73]"
                                        >
                                            <UserRound size={16} />
                                            Xem thông tin
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#F43F73]"
                                        >
                                            <LogOut size={16} />
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <nav className="bg-[#14254A]">
                <div className="mx-auto flex h-12 max-w-[1320px] items-center justify-center gap-14 overflow-x-auto px-6">
                    <NavLink to="/" end className={navLinkClass}>
                        {({ isActive }) => (
                            <>
                                Trang chủ
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t bg-[#F43F73]" />
                                )}
                            </>
                        )}
                    </NavLink>

                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={navLinkClass}
                        >
                            {({ isActive }) => (
                                <>
                                    {item.label}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t bg-[#F43F73]" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </header>
    );
}

export default Header;