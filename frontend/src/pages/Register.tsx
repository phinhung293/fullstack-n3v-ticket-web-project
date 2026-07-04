import { Link, useNavigate } from 'react-router-dom';
import {
    Check,
    ChevronDown,
    Eye,
    EyeOff,
    Globe2,
    LockKeyhole,
    Mail,
    Phone,
    User,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

type RegisterApiResponse = {
    success?: boolean;
    code?: number;
    message?: string;
    data?: unknown;
};

function Register() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [generalError, setGeneralError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const inputClassName =
        'w-full min-w-0 bg-transparent text-xs font-medium text-white caret-white outline-none placeholder:text-white/40 selection:bg-[#F43F73]/40 selection:text-white [color-scheme:dark] [&:-webkit-autofill]:shadow-[0_0_0_1000px_rgba(11,16,40,0.85)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white';

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setGeneralError('');

        const trimmedFullName = fullName.trim();
        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^0\d{9}$/;
        const passwordRegex =
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

        if (!trimmedFullName) {
            setGeneralError('Vui lòng nhập họ và tên.');
            return;
        }

        if (trimmedFullName.length < 2) {
            setGeneralError('Họ và tên phải có ít nhất 2 ký tự.');
            return;
        }

        if (!trimmedEmail) {
            setGeneralError('Vui lòng nhập email.');
            return;
        }

        if (!emailRegex.test(trimmedEmail)) {
            setGeneralError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
            return;
        }

        if (!trimmedPhone) {
            setGeneralError('Vui lòng nhập số điện thoại.');
            return;
        }

        if (!phoneRegex.test(trimmedPhone)) {
            setGeneralError('Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số và bắt đầu bằng số 0.');
            return;
        }

        if (!password) {
            setGeneralError('Vui lòng nhập mật khẩu.');
            return;
        }

        if (!passwordRegex.test(password)) {
            setGeneralError(
                'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái, số và ký tự đặc biệt.',
            );
            return;
        }

        if (!confirmPassword) {
            setGeneralError('Vui lòng nhập xác nhận mật khẩu.');
            return;
        }

        if (password !== confirmPassword) {
            setGeneralError('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.');
            return;
        }

        if (!agree) {
            setGeneralError('Bạn cần đồng ý với điều khoản sử dụng và chính sách bảo mật.');
            return;
        }

        try {
            setIsLoading(true);

            const res = await axiosInstance.post<RegisterApiResponse>('/auth/register', {
                fullName: trimmedFullName,
                email: trimmedEmail,
                phone: trimmedPhone,
                password,
            });

            if (res.data.success === false) {
                setGeneralError(res.data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
                return;
            }

            setIsSuccess(true);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const message =
                    (error.response?.data as { message?: string })?.message ||
                    'Đăng ký thất bại. Vui lòng thử lại!';

                setGeneralError(message);
                return;
            }

            setGeneralError('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!');
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
                    src="/images/register-bg.png"
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain object-center"
                />

                <section className="absolute right-[8%] top-1/2 w-[39%] -translate-y-1/2">
                    <div className="w-full rounded-[22px] border border-[#F43F73]/65 bg-[#071126]/80 p-4 shadow-[0_0_38px_rgba(124,58,237,0.22)] backdrop-blur-md">
                        {isSuccess ? (
                            <div className="flex min-h-[470px] flex-col items-center justify-center text-center">
                                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#10B981] text-[#10B981]">
                                    <Check size={42} strokeWidth={3} />
                                </div>

                                <h1 className="text-[28px] font-black text-white">
                                    Đăng ký <span className="text-[#10B981]">thành công!</span>
                                </h1>

                                <p className="mt-4 max-w-[340px] text-sm font-medium leading-6 text-white/60">
                                    Tài khoản của bạn đã được tạo thành công. Hãy đăng nhập để bắt đầu đặt vé sự kiện.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="mt-8 flex h-[46px] w-full max-w-[300px] items-center justify-center rounded-xl bg-gradient-to-r from-[#F43F73] via-[#C026D3] to-[#6D28D9] text-sm font-black text-white shadow-[0_0_20px_rgba(244,63,115,0.24)] transition hover:brightness-110"
                                >
                                    Đi đến đăng nhập
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-1 flex items-start justify-between gap-5">
                                    <h1 className="text-[24px] font-black leading-none tracking-tight text-white">
                                        Tạo <span className="text-[#F43F73]">tài khoản</span>
                                    </h1>

                                    <button
                                        type="button"
                                        className="flex h-8 shrink-0 items-center gap-2 rounded-xl border border-white/25 bg-transparent px-3 text-xs font-bold text-white transition hover:border-[#F43F73] hover:text-[#F43F73]"
                                    >
                                        <Globe2 size={16} />
                                        VI
                                        <ChevronDown size={14} />
                                    </button>
                                </div>

                                <p className="mb-2 text-xs font-medium text-white/55">
                                    Điền thông tin để tạo tài khoản mới
                                </p>

                                {generalError && (
                                    <div className="mb-2 rounded-xl border border-[#F43F73]/70 bg-[#F43F73]/15 px-3 py-2 text-xs font-semibold text-[#FDA4AF]">
                                        {generalError}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-white">
                                            Họ và tên
                                        </label>

                                        <div className="flex h-[38px] items-center rounded-lg border border-white/25 bg-[#0B1028]/60 px-3 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                            <User size={16} className="mr-2.5 shrink-0 text-white/80" />

                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(event) => {
                                                    setFullName(event.target.value);
                                                    if (generalError) setGeneralError('');
                                                }}
                                                placeholder="Nhập họ và tên"
                                                required
                                                className={inputClassName}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-white">
                                            Email
                                        </label>

                                        <div className="flex h-[38px] items-center rounded-lg border border-white/25 bg-[#0B1028]/60 px-3 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                            <Mail size={16} className="mr-2.5 shrink-0 text-white/80" />

                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(event) => {
                                                    setEmail(event.target.value);
                                                    if (generalError) setGeneralError('');
                                                }}
                                                placeholder="Nhập email của bạn"
                                                required
                                                className={inputClassName}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-white">
                                            Số điện thoại
                                        </label>

                                        <div className="flex h-[38px] items-center rounded-lg border border-white/25 bg-[#0B1028]/60 px-3 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                            <Phone size={16} className="mr-2.5 shrink-0 text-white/80" />

                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                value={phone}
                                                onChange={(event) => {
                                                    const onlyNumbers = event.target.value.replace(/\D/g, '').slice(0, 10);
                                                    setPhone(onlyNumbers);
                                                    if (generalError) setGeneralError('');
                                                }}
                                                placeholder="Nhập số điện thoại"
                                                required
                                                className={inputClassName}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-white">
                                            Mật khẩu
                                        </label>

                                        <div className="flex h-[38px] items-center rounded-lg border border-white/25 bg-[#0B1028]/60 px-3 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                            <LockKeyhole size={16} className="mr-2.5 shrink-0 text-white/80" />

                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(event) => {
                                                    setPassword(event.target.value);
                                                    if (generalError) setGeneralError('');
                                                }}
                                                placeholder="Tạo mật khẩu"
                                                required
                                                className={inputClassName}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="ml-2.5 text-white/80 transition hover:text-[#F43F73]"
                                                aria-label="Ẩn hoặc hiện mật khẩu"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>

                                        <p className="mt-0.5 text-[10px] font-medium text-white/45">
                                            Ít nhất 8 ký tự, gồm chữ cái, số và ký tự đặc biệt.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-white">
                                            Xác nhận mật khẩu
                                        </label>

                                        <div className="flex h-[38px] items-center rounded-lg border border-white/25 bg-[#0B1028]/60 px-3 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                            <LockKeyhole size={16} className="mr-2.5 shrink-0 text-white/80" />

                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(event) => {
                                                    setConfirmPassword(event.target.value);
                                                    if (generalError) setGeneralError('');
                                                }}
                                                placeholder="Nhập lại mật khẩu"
                                                required
                                                className={inputClassName}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="ml-2.5 text-white/80 transition hover:text-[#F43F73]"
                                                aria-label="Ẩn hoặc hiện xác nhận mật khẩu"
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2.5 text-xs font-medium text-white">
                                        <input
                                            type="checkbox"
                                            checked={agree}
                                            onChange={(event) => {
                                                setAgree(event.target.checked);
                                                if (generalError) setGeneralError('');
                                            }}
                                            className="peer sr-only"
                                        />

                                        <span
                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition ${
                                                agree
                                                    ? 'border-[#F43F73] bg-[#F43F73]'
                                                    : 'border-white/40 bg-transparent'
                                            }`}
                                        >
                                            {agree && <Check size={12} strokeWidth={3} className="text-white" />}
                                        </span>

                                        <span className="whitespace-nowrap">
                                            Tôi đồng ý với{' '}
                                            <Link to="/terms" className="font-bold text-[#F43F73] hover:text-[#FB7185]">
                                                Điều khoản sử dụng
                                            </Link>{' '}
                                            và{' '}
                                            <Link to="/privacy" className="font-bold text-[#F43F73] hover:text-[#FB7185]">
                                                Chính sách bảo mật
                                            </Link>
                                        </span>
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex h-[42px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#F43F73] via-[#C026D3] to-[#6D28D9] text-sm font-black text-white shadow-[0_0_20px_rgba(244,63,115,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                                    </button>
                                </form>

                                <div className="my-2.5 flex items-center gap-4">
                                    <div className="h-px flex-1 bg-white/25" />

                                    <span className="text-xs font-medium text-white/55">
                                        Hoặc đăng ký với
                                    </span>

                                    <div className="h-px flex-1 bg-white/25" />
                                </div>

                                <button
                                    type="button"
                                    className="flex h-[42px] w-full items-center justify-center gap-3 rounded-xl border border-white/25 bg-transparent text-sm font-bold text-white transition hover:border-[#F43F73] hover:text-[#F43F73]"
                                >
                                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
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

                                    Đăng ký với Google
                                </button>

                                <p className="mt-2.5 text-center text-xs font-semibold text-white">
                                    Đã có tài khoản?{' '}
                                    <Link
                                        to="/login"
                                        className="ml-2 font-black text-[#F43F73] transition hover:text-[#FB7185]"
                                    >
                                        Đăng nhập
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Register;