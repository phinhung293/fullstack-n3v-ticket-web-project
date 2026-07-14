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
    Menu,
    X,
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');

    const authUser = getAuthUser() as HeaderAuthUser | null;

    const isLoggedIn = Boolean(authUser);
    const isAdmin = authUser?.role === 'ROLE_ADMIN' || authUser?.role === 'ADMIN';

    const userName = authUser?.fullName || authUser?.name || 'Người dùng';
    const userInitial = userName.trim().charAt(0).toUpperCase() || 'U';

    const handleSearch = () => {
        const keyword = searchKeyword.trim();
        setIsMobileMenuOpen(false);

        if (!keyword) {
            navigate('/events');
            return;
        }

        navigate(`/events?keyword=${encodeURIComponent(keyword)}`);
    };

    const handleViewProfile = () => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/profile');
    };

    const handleLogout = () => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        clearAuth();
        navigate('/login');
        window.location.reload();
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-[#061A35] text-white">
            <div className="border-b border-white/10">
                {/* Mobile & Desktop Header Container */}
                <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-[210px_minmax(400px,620px)_1fr] lg:gap-8">
                    
                    {/* Logo & Mobile Menu Toggle */}
                    <div className="flex items-center gap-3">
                        <button 
                            className="lg:hidden p-1 text-white hover:text-[#F43F73] transition"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <Link to="/" className="flex shrink-0 items-center">
                            <div className="overflow-hidden rounded-lg p-1">
                                <img
                                    src="/images/n3v-ticket-logo.png"
                                    alt="N3V Ticket"
                                    className="h-10 sm:h-12 w-auto object-contain"
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Search Bar */}
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSearch();
                        }}
                        className="hidden lg:flex h-11 overflow-hidden rounded-xl bg-white shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
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

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex shrink-0 items-center justify-end gap-3">
                        {!isLoggedIn && (
                            <>
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
                            </>
                        )}

                        {isLoggedIn && !isAdmin && (
                            <div className="flex shrink-0 items-center justify-end gap-5 whitespace-nowrap">
                                <NavLink
                                    to="/my-tickets"
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 text-xs font-bold transition ${isActive ? 'text-[#F43F73]' : 'text-white hover:text-[#F43F73]'}`
                                    }
                                >
                                    <Ticket size={16} /> Vé của tôi
                                </NavLink>
                                <NavLink
                                    to="/favorites"
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 text-xs font-bold transition ${isActive ? 'text-[#F43F73]' : 'text-white hover:text-[#F43F73]'}`
                                    }
                                >
                                    <Heart size={16} /> Yêu thích
                                </NavLink>
                                <button
                                    type="button"
                                    className="relative flex h-8 w-8 items-center justify-center text-white transition hover:text-[#F43F73]"
                                >
                                    <Bell size={17} />
                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F43F73] px-1 text-[10px] font-black leading-none text-white">3</span>
                                </button>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-2 transition hover:text-[#F43F73]"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F43F73] text-xs font-black text-white">
                                            {authUser?.avatarUrl ? (
                                                <img src={authUser.avatarUrl} alt={userName} className="h-full w-full object-cover" />
                                            ) : userInitial}
                                        </div>
                                        <span className="max-w-[130px] truncate text-xs font-bold">{userName}</span>
                                        <ChevronDown size={14} className={`text-white/70 transition ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-[44px] z-50 w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#0B1736] py-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                                            <button onClick={handleViewProfile} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#F43F73]">
                                                <UserRound size={16} /> Xem thông tin
                                            </button>
                                            <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#F43F73]">
                                                <LogOut size={16} /> Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {isLoggedIn && isAdmin && (
                            <div className="flex shrink-0 items-center justify-end gap-5">
                                <NavLink to="/admin" className={({ isActive }) => `rounded-xl px-5 py-3 text-sm font-black text-white transition ${isActive ? 'bg-[#E11D60]' : 'bg-[#F43F73] hover:bg-[#E11D60]'}`}>Quản trị</NavLink>
                                <div className="relative">
                                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 transition hover:text-[#F43F73]">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-black text-[#061A35]">A</div>
                                        <div className="text-left">
                                            <div className="text-sm font-black">{userName || 'Admin'}</div>
                                            <div className="text-xs font-bold text-[#F43F73]">Admin</div>
                                        </div>
                                        <ChevronDown size={14} className={`text-white/70 transition ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-[52px] z-50 w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#0B1736] py-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                                            <button onClick={handleViewProfile} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#F43F73]">
                                                <UserRound size={16} /> Xem thông tin
                                            </button>
                                            <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#F43F73]">
                                                <LogOut size={16} /> Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:block bg-[#14254A]">
                <div className="mx-auto flex h-12 max-w-[1320px] items-center justify-center gap-14 px-6">
                    <NavLink to="/" end className={navLinkClass}>
                        {({ isActive }) => (
                            <>Trang chủ {isActive && <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t bg-[#F43F73]" />}</>
                        )}
                    </NavLink>
                    {menuItems.map((item) => (
                        <NavLink key={item.path} to={item.path} className={navLinkClass}>
                            {({ isActive }) => (
                                <>{item.label} {isActive && <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t bg-[#F43F73]" />}</>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Mobile Drawer Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    {/* Drawer */}
                    <div className="absolute inset-y-0 left-0 w-[280px] sm:w-[320px] bg-[#061A35] shadow-2xl overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <img src="/images/n3v-ticket-logo.png" alt="Logo" className="h-8 object-contain" />
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Mobile Search */}
                        <div className="p-4 border-b border-white/10">
                            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex h-10 overflow-hidden rounded-lg bg-white/10 focus-within:bg-white/20 transition">
                                <input
                                    type="text"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    placeholder="Tìm kiếm..."
                                    className="w-full bg-transparent px-3 text-sm text-white placeholder-white/50 outline-none"
                                />
                                <button type="submit" className="flex items-center justify-center px-3 text-white">
                                    <Search size={18} />
                                </button>
                            </form>
                        </div>

                        {/* Mobile Navigation Links */}
                        <nav className="flex-1 py-2">
                            <NavLink to="/" end onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block px-5 py-3.5 text-base font-bold border-l-4 transition ${isActive ? 'border-[#F43F73] text-[#F43F73] bg-white/5' : 'border-transparent text-white hover:bg-white/5'}`}>Trang chủ</NavLink>
                            {menuItems.map(item => (
                                <NavLink key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block px-5 py-3.5 text-base font-bold border-l-4 transition ${isActive ? 'border-[#F43F73] text-[#F43F73] bg-white/5' : 'border-transparent text-white hover:bg-white/5'}`}>
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        {/* Mobile User Actions */}
                        <div className="border-t border-white/10 p-5 mt-auto">
                            {!isLoggedIn ? (
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="w-full rounded-xl bg-[#F43F73] py-3.5 text-sm font-bold text-white text-center hover:bg-[#E11D5E]">Đăng nhập</button>
                                    <button onClick={() => { setIsMobileMenuOpen(false); navigate('/register'); }} className="w-full rounded-xl border border-white/20 py-3.5 text-sm font-bold text-white text-center hover:bg-white/10">Đăng ký</button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F43F73] text-sm font-black text-white">
                                            {authUser?.avatarUrl ? <img src={authUser.avatarUrl} alt={userName} className="h-full w-full object-cover" /> : userInitial}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{userName}</p>
                                            <p className="text-xs text-white/60">{isAdmin ? 'Quản trị viên' : 'Thành viên'}</p>
                                        </div>
                                    </div>
                                    
                                    {isAdmin ? (
                                        <button onClick={() => { setIsMobileMenuOpen(false); navigate('/admin'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-white hover:bg-white/10">
                                            Quản trị hệ thống
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => { setIsMobileMenuOpen(false); navigate('/my-tickets'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-white hover:bg-white/10">
                                                <Ticket size={18} /> Vé của tôi
                                            </button>
                                            <button onClick={() => { setIsMobileMenuOpen(false); navigate('/favorites'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-white hover:bg-white/10">
                                                <Heart size={18} /> Yêu thích
                                            </button>
                                        </>
                                    )}
                                    <button onClick={handleViewProfile} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-white hover:bg-white/10">
                                        <UserRound size={18} /> Thông tin cá nhân
                                    </button>
                                    <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-[#F43F73] hover:bg-white/10">
                                        <LogOut size={18} /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;