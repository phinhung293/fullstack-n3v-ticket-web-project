import { Link, useLocation } from 'react-router-dom';
import {
    Check,
    ChevronDown,
    Eye,
    EyeOff,
    Globe2,
    LockKeyhole,
    Mail,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

type LoginResponseData = {
    accessToken: string;
    tokenType: string;
    userId: number;
    role: string;
    fullName?: string;
    email?: string;
    [key: string]: unknown;
};

type ApiResponse<T> = {
    data: T;
    message?: string;
};

function Login() {
    // const navigate = useNavigate();
    const location = useLocation();

    const loginMessage = (location.state as { message?: string } | null)?.message || null;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const inputClassName =
        'w-full bg-transparent text-sm font-medium text-white caret-white outline-none placeholder:text-white/40 selection:bg-[#F43F73]/40 selection:text-white [color-scheme:dark] [&:-webkit-autofill]:shadow-[0_0_0_1000px_rgba(11,16,40,0.85)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white';

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoginError('');

        const loginData = {
            email: email.trim(),
            password: password,
        };

        if (!loginData.email) {
            setLoginError('Vui lòng nhập địa chỉ email.');
            return;
        }

        if (!loginData.password) {
            setLoginError('Vui lòng nhập mật khẩu.');
            return;
        }

        try {
            setIsLoading(true);

            const res = await axiosInstance.post<ApiResponse<LoginResponseData>>(
                '/auth/login',
                loginData,
            );

            const userData = res.data.data;

            localStorage.setItem('accessToken', userData.accessToken);
            localStorage.setItem('authUser', JSON.stringify(userData));

            const redirectTo = sessionStorage.getItem('redirectAfterLogin');
            sessionStorage.removeItem('redirectAfterLogin');

            if (redirectTo) {
                window.location.href = redirectTo;
                return;
            }

            if (userData.role === 'ADMIN' || userData.role === 'ROLE_ADMIN') {
                window.location.href = '/admin';
                return;
            }

            window.location.href = '/';
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const message =
                    (error.response?.data as { message?: string })?.message ||
                    'Email hoặc mật khẩu không chính xác. Vui lòng thử lại!';

                setLoginError(message);
                return;
            }

            setLoginError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#08051E] font-sans text-white">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#08051E_0%,#130827_25%,#08051E_50%,#130827_75%,#08051E_100%)]" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_50%,rgba(244,63,115,0.18),transparent_32%),radial-gradient(circle_at_82%_55%,rgba(124,58,237,0.18),transparent_34%)]" />

            <div className="relative mx-auto h-screen max-h-screen aspect-[3/2] overflow-hidden">
                <img
                    src="/images/login-bg.png"
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain object-center"
                />

                <section className="absolute right-[6.8%] top-1/2 w-[37%] -translate-y-1/2">
                    <div className="w-full rounded-[24px] border border-[#F43F73]/65 bg-[#071126]/76 p-7 shadow-[0_0_45px_rgba(124,58,237,0.24)] backdrop-blur-md">
                        <div className="mb-6 flex items-start justify-between gap-5">
                            <h1 className="text-[36px] font-black leading-none tracking-tight text-white">
                                Đăng <span className="text-[#F43F73]">nhập</span>
                            </h1>

                            <button
                                type="button"
                                className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/25 bg-transparent px-4 text-sm font-bold text-white transition hover:border-[#F43F73] hover:text-[#F43F73]"
                            >
                                <Globe2 size={18} />
                                VI
                                <ChevronDown size={16} />
                            </button>
                        </div>

                        {loginMessage && (
                            <div className="mb-4 rounded-xl border border-[#FCD34D]/70 bg-[#FEF3C7]/15 px-4 py-3 text-sm font-semibold text-[#FDE68A]">
                                {loginMessage}
                            </div>
                        )}

                        {loginError && (
                            <div className="mb-4 rounded-xl border border-[#F43F73]/70 bg-[#F43F73]/15 px-4 py-3 text-sm font-semibold text-[#FDA4AF]">
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-white">
                                    Địa chỉ email
                                </label>

                                <div className="flex h-[56px] items-center rounded-xl border border-white/25 bg-[#0B1028]/60 px-5 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                    <Mail size={21} className="mr-4 shrink-0 text-white/80" />

                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="Nhập email của bạn"
                                        required
                                        className={inputClassName}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between gap-4">
                                    <label className="block text-sm font-bold text-white">
                                        Mật khẩu
                                    </label>

                                    <Link
                                        to="/forgot-password"
                                        className="text-sm font-bold text-[#38BDF8] transition hover:text-[#F43F73]"
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>

                                <div className="flex h-[56px] items-center rounded-xl border border-white/25 bg-[#0B1028]/60 px-5 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                    <LockKeyhole size={21} className="mr-4 shrink-0 text-white/80" />

                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Nhập mật khẩu của bạn"
                                        required
                                        className={inputClassName}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="ml-3 text-white/80 transition hover:text-[#F43F73]"
                                        aria-label="Ẩn hoặc hiện mật khẩu"
                                    >
                                        {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                                    </button>
                                </div>
                            </div>

                            <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-bold text-white">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(event) => setRemember(event.target.checked)}
                                    className="peer sr-only"
                                />

                                <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition ${
                                        remember
                                            ? 'border-[#F43F73] bg-[#F43F73]'
                                            : 'border-white/40 bg-transparent'
                                    }`}
                                >
                                    {remember && (
                                        <Check size={14} strokeWidth={3} className="text-white" />
                                    )}
                                </span>

                                Ghi nhớ đăng nhập
                            </label>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex h-[56px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#F43F73] via-[#C026D3] to-[#6D28D9] text-sm font-black text-white shadow-[0_0_24px_rgba(244,63,115,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </form>

                        <div className="my-6 flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/25" />

                            <span className="text-sm font-medium text-white/55">
                                Hoặc tiếp tục với
                            </span>

                            <div className="h-px flex-1 bg-white/25" />
                        </div>

                        <button
                            type="button"
                            className="flex h-[56px] w-full items-center justify-center gap-4 rounded-xl border border-white/25 bg-transparent text-sm font-bold text-white transition hover:border-[#F43F73] hover:text-[#F43F73]"
                        >
                            <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                                <path
                                    fill="#FFC107"
                                    d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                                />
                                <path
                                    fill="#FF3D00"
                                    d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                                />
                                <path
                                    fill="#4CAF50"
                                    d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                                />
                                <path
                                    fill="#1976D2"
                                    d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                                />
                            </svg>

                            Đăng nhập với Google
                        </button>

                        <p className="mt-6 text-center text-sm font-semibold text-white">
                            Chưa có tài khoản?{' '}
                            <Link
                                to="/register"
                                className="ml-5 font-black text-[#F43F73] transition hover:text-[#FB7185]"
                            >
                                Tạo tài khoản
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Login;