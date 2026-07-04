import { useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from 'lucide-react';

import axiosInstance from '../api/axiosInstance';

type Step = 1 | 2 | 3;

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

const getErrorMessage = (error: unknown) => {
    const err = error as ApiError;
    return err.response?.data?.message || 'Đã có lỗi xảy ra, vui lòng thử lại sau';
};

function ForgotPassword() {
    const navigate = useNavigate();
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

    const [step, setStep] = useState<Step>(1);

    const [email, setEmail] = useState('');
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const otpCode = otpDigits.join('');

    const passwordRules = useMemo(() => {
        return {
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            number: /\d/.test(newPassword),
            special: /[@$!%*#?&]/.test(newPassword),
        };
    }, [newPassword]);

    const isPasswordValid = Object.values(passwordRules).every(Boolean);

    const clearMessage = () => {
        setError('');
        setSuccess('');
    };

    const handleSendCode = async () => {
        clearMessage();

        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail) {
            setError('Vui lòng nhập email.');
            return;
        }

        setLoading(true);

        try {
            await axiosInstance.post('/auth/forgot-password/send-code', {
                email: trimmedEmail,
            });

            setEmail(trimmedEmail);
            setStep(2);
            setOtpDigits(['', '', '', '', '', '']);
            setSuccess('Mã xác minh đã được gửi.');

            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 100);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        clearMessage();

        if (otpCode.length !== 6) {
            setError('Vui lòng nhập đủ 6 số xác minh.');
            return;
        }

        setLoading(true);

        try {
            await axiosInstance.post('/auth/forgot-password/verify-code', {
                email,
                code: otpCode,
            });

            setStep(3);
            setSuccess('Xác minh thành công. Vui lòng tạo mật khẩu mới.');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        clearMessage();

        if (!newPassword) {
            setError('Vui lòng nhập mật khẩu mới.');
            return;
        }

        if (!isPasswordValid) {
            setError('Mật khẩu chưa đủ điều kiện bảo mật.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);

        try {
            await axiosInstance.post('/auth/forgot-password/reset', {
                email,
                code: otpCode,
                newPassword,
            });

            setSuccess('Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập...');

            setTimeout(() => {
                navigate('/login');
            }, 1200);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        clearMessage();
        setLoading(true);

        try {
            await axiosInstance.post('/auth/forgot-password/send-code', {
                email,
            });

            setOtpDigits(['', '', '', '', '', '']);
            setSuccess('Mã xác minh đã được gửi.');

            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 100);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);

        const nextDigits = [...otpDigits];
        nextDigits[index] = digit;
        setOtpDigits(nextDigits);

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();

        const pastedValue = event.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);

        if (!pastedValue) return;

        const nextDigits = Array.from({ length: 6 }, (_, index) => pastedValue[index] || '');
        setOtpDigits(nextDigits);

        const nextFocusIndex = Math.min(pastedValue.length, 5);
        otpRefs.current[nextFocusIndex]?.focus();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (step === 1) {
            void handleSendCode();
            return;
        }

        if (step === 2) {
            void handleVerifyCode();
            return;
        }

        void handleResetPassword();
    };

    const goBack = () => {
        clearMessage();

        if (step === 1) {
            navigate('/login');
            return;
        }

        if (step === 2) {
            setStep(1);
            return;
        }

        setStep(2);
    };

    const renderRule = (valid: boolean, text: string) => {
        return (
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <CheckCircle2
                    size={18}
                    className={valid ? 'text-[#22C55E]' : 'text-white/30'}
                />
                {text}
            </div>
        );
    };

    const inputWhiteStyle = {
        WebkitTextFillColor: '#FFFFFF',
    };

    return (
        <main className="relative h-screen overflow-hidden bg-[#020B1F] text-white">
            <div className="absolute -left-40 bottom-0 h-[320px] w-[320px] rounded-full bg-[#F43F73]/35 blur-[115px]" />
            <div className="absolute -right-28 top-0 h-[320px] w-[320px] rounded-full bg-[#F43F73]/30 blur-[115px]" />
            <div className="absolute left-1/2 top-1/3 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[#2563EB]/20 blur-[120px]" />

            <section className="relative z-10 mx-auto flex h-screen w-full max-w-[660px] flex-col justify-center px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={goBack}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                    >
                        <ArrowLeft size={26} />
                    </button>

                    <div className="rounded-xl border border-[#F43F73]/50 bg-white/5 px-4 py-1.5 text-sm font-black shadow-[0_0_20px_rgba(244,63,115,0.2)]">
                        <span className="text-[#F43F73]">{step}</span>
                        <span className="text-white"> / 3</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div>
                            <div className="mx-auto flex h-[82px] w-[82px] items-center justify-center rounded-full border-4 border-[#F43F73] bg-[#F43F73]/10 text-[#F43F73] shadow-[0_0_38px_rgba(244,63,115,0.48)]">
                                <Mail size={42} strokeWidth={1.9} />
                            </div>

                            <div className="mt-5 text-center">
                                <h1 className="text-3xl font-black">
                                    Quên mật khẩu?
                                </h1>

                                <p className="mx-auto mt-3 max-w-[470px] text-base font-medium leading-7 text-white/75">
                                    Nhập địa chỉ email của bạn và chúng tôi sẽ gửi mã xác minh để đặt lại mật khẩu.
                                </p>
                            </div>

                            <div className="mt-8">
                                <label className="mb-3 block text-sm font-black">
                                    Địa chỉ email
                                </label>

                                <div className="flex h-[58px] items-center gap-4 rounded-xl border border-[#F43F73] bg-white/5 px-5 shadow-[0_0_24px_rgba(244,63,115,0.12)] focus-within:border-[#7C3AED]">
                                    <Mail size={23} className="text-white/80" />

                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="Nhập email của bạn"
                                        autoComplete="off"
                                        className="w-full bg-transparent text-base font-semibold text-white caret-white outline-none placeholder:text-white/35 selection:bg-[#F43F73]/40 selection:text-white"
                                        style={inputWhiteStyle}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-7 h-[58px] w-full rounded-xl bg-gradient-to-r from-[#F43F73] to-[#6D35FF] text-lg font-black text-white shadow-[0_16px_42px_rgba(109,53,255,0.3)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Đang gửi...' : 'Gửi mã xác minh'}
                            </button>

                            <p className="mt-5 text-center text-base font-medium text-white/80">
                                Bạn nhớ mật khẩu?{' '}
                                <Link
                                    to="/login"
                                    className="font-black text-[#F43F73] transition hover:text-[#FF6B9A]"
                                >
                                    Đăng nhập
                                </Link>
                            </p>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div className="mx-auto flex h-[86px] w-[86px] items-center justify-center text-[#F43F73] drop-shadow-[0_0_32px_rgba(244,63,115,0.45)]">
                                <ShieldCheck size={84} strokeWidth={1.7} />
                            </div>

                            <div className="mt-5 text-center">
                                <h1 className="text-3xl font-black">
                                    Nhập mã xác minh
                                </h1>

                                <p className="mx-auto mt-3 max-w-[520px] text-base font-medium leading-7 text-white/75">
                                    Chúng tôi đã gửi mã gồm 6 chữ số đến
                                    <br />
                                    <span className="font-bold text-white">{email}</span>
                                </p>
                            </div>

                            <div className="mt-8 flex justify-center gap-3">
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(element) => {
                                            otpRefs.current[index] = element;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        value={digit}
                                        onChange={(event) => handleOtpChange(index, event.target.value)}
                                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                        onPaste={handleOtpPaste}
                                        className="h-[62px] w-[56px] rounded-xl border border-[#7C3AED] bg-white/5 text-center text-2xl font-black text-white caret-white outline-none transition selection:bg-[#F43F73]/40 selection:text-white focus:border-[#F43F73] focus:shadow-[0_0_28px_rgba(244,63,115,0.35)]"
                                        style={inputWhiteStyle}
                                    />
                                ))}
                            </div>

                            <div className="mt-7 flex items-center justify-center gap-3 text-base font-medium text-white/75">
                                Không nhận được mã?

                                <button
                                    type="button"
                                    onClick={() => void handleResendCode()}
                                    disabled={loading}
                                    className="font-black text-[#E54DFF] transition hover:text-[#F43F73] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Gửi lại
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-7 h-[58px] w-full rounded-xl bg-gradient-to-r from-[#F43F73] to-[#6D35FF] text-lg font-black text-white shadow-[0_16px_42px_rgba(109,53,255,0.3)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Đang xác minh...' : 'Xác minh mã'}
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div className="mx-auto flex h-[82px] w-[82px] items-center justify-center text-[#4F7CFF] drop-shadow-[0_0_32px_rgba(79,124,255,0.55)]">
                                <KeyRound size={80} strokeWidth={1.7} />
                            </div>

                            <div className="mt-4 text-center">
                                <h1 className="text-3xl font-black">
                                    Tạo mật khẩu mới
                                </h1>

                                <p className="mx-auto mt-3 max-w-[470px] text-base font-medium leading-7 text-white/75">
                                    Mật khẩu mới của bạn phải khác với mật khẩu đã sử dụng trước đó.
                                </p>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-black">
                                        Mật khẩu mới
                                    </label>

                                    <div className="flex h-[54px] items-center gap-4 rounded-xl border border-[#7C3AED] bg-white/5 px-5 focus-within:border-[#F43F73]">
                                        <LockKeyhole size={22} className="text-white/75" />

                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(event) => setNewPassword(event.target.value)}
                                            placeholder="Nhập mật khẩu mới"
                                            autoComplete="new-password"
                                            className="w-full bg-transparent text-base font-semibold text-white caret-white outline-none placeholder:text-white/35 selection:bg-[#F43F73]/40 selection:text-white"
                                            style={inputWhiteStyle}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword((prev) => !prev)}
                                            className="text-white/80 transition hover:text-white"
                                        >
                                            {showNewPassword ? <EyeOff size={23} /> : <Eye size={23} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-black">
                                        Xác nhận mật khẩu mới
                                    </label>

                                    <div className="flex h-[54px] items-center gap-4 rounded-xl border border-[#7C3AED] bg-white/5 px-5 focus-within:border-[#F43F73]">
                                        <LockKeyhole size={22} className="text-white/75" />

                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                            placeholder="Nhập lại mật khẩu"
                                            autoComplete="new-password"
                                            className="w-full bg-transparent text-base font-semibold text-white caret-white outline-none placeholder:text-white/35 selection:bg-[#F43F73]/40 selection:text-white"
                                            style={inputWhiteStyle}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            className="text-white/80 transition hover:text-white"
                                        >
                                            {showConfirmPassword ? <EyeOff size={23} /> : <Eye size={23} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-2 sm:grid-cols-2">
                                {renderRule(passwordRules.length, 'Ít nhất 8 ký tự')}
                                {renderRule(passwordRules.uppercase, 'Một chữ cái viết hoa')}
                                {renderRule(passwordRules.number, 'Một chữ số')}
                                {renderRule(passwordRules.special, 'Một ký tự đặc biệt')}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-6 h-[58px] w-full rounded-xl bg-gradient-to-r from-[#F43F73] to-[#6D35FF] text-lg font-black text-white shadow-[0_16px_42px_rgba(109,53,255,0.3)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                            </button>
                        </div>
                    )}

                    {(error || success) && (
                        <div
                            className={`mt-4 flex min-h-[52px] items-center justify-center rounded-xl border px-4 py-3 text-center text-sm font-bold ${
                                error
                                    ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#DC2626]'
                                    : 'border-[#86EFAC] bg-[#F0FDF4] text-[#16A34A]'
                            }`}
                        >
                            {error || success}
                        </div>
                    )}
                </form>
            </section>
        </main>
    );
}

export default ForgotPassword;