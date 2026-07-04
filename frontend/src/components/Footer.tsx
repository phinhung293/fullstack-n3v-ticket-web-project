import type { SVGProps } from 'react';
import { Link } from 'react-router-dom';

const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M13.5 21v-8.05h2.7l.4-3.15h-3.1V7.85c0-.91.25-1.53 1.56-1.53h1.67V3.5c-.29-.04-1.28-.12-2.44-.12-2.41 0-4.06 1.47-4.06 4.17v2.3H7.5v3.15h2.73V21h3.27Z" />
    </svg>
);

const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
);

const YoutubeIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
        <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
        <path d="M10.5 9.7 15 12l-4.5 2.3v-4.6Z" fill="currentColor" stroke="none" />
    </svg>
);

const TikTokIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M16.7 3h-2.9v12.3a2.6 2.6 0 1 1-1.9-2.5v-3a5.6 5.6 0 1 0 4.8 5.5V9.3a7 7 0 0 0 4.1 1.3V7.7A4.1 4.1 0 0 1 16.7 3Z" />
    </svg>
);

const aboutLinks = ['Giới thiệu', 'Tuyển dụng', 'Tin tức', 'Liên hệ'];

const supportLinks = [
    'Trung tâm hỗ trợ',
    'Hướng dẫn đặt vé',
    'Chính sách thanh toán',
    'Chính sách hoàn hủy',
    'Câu hỏi thường gặp',
];

const partnerLinks = ['Đối tác tổ chức sự kiện', 'Đối tác địa điểm', 'Đăng ký đối tác'];

const paymentMethods = [
    { name: 'VISA', type: 'visa' },
    { name: 'Mastercard', type: 'mastercard' },
    { name: 'MoMo', type: 'momo' },
    { name: 'ZaloPay', type: 'zalopay' },
    { name: 'VNPay', type: 'vnpay' },
    { name: 'Napas', type: 'napas' },
];

const socialLinks = [
    { icon: FacebookIcon, label: 'Facebook' },
    { icon: InstagramIcon, label: 'Instagram' },
    { icon: YoutubeIcon, label: 'YouTube' },
    { icon: TikTokIcon, label: 'TikTok' },
];

function Footer() {
    return (
        <footer className="w-full bg-[#0B1736] text-white">
            <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-6 py-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.35fr_0.85fr_1.15fr_1fr_1.25fr_0.9fr]">
                <div>
                    <div className="mb-3 flex items-center">
                        <img
                            src="/images/n3v-ticket-logo.png"
                            alt="N3V Ticket"
                            className="h-10 w-auto rounded-md object-contain p-1"
                        />
                    </div>

                    <p className="max-w-[240px] text-xs leading-5 text-[#CBD5E1]">
                        Nền tảng đặt vé sự kiện hàng đầu Việt Nam. Kết nối bạn với những trải nghiệm đáng nhớ.
                    </p>

                    <div className="mt-3 flex gap-2">
                        {socialLinks.map(({ icon: Icon, label }) => (
                            <a
                                key={label}
                                href="#"
                                aria-label={label}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/40 text-white transition hover:border-[#F43F73] hover:text-[#F43F73]"
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </a>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-3 text-xs font-bold text-white">Về N3V Ticket</h3>
                    <ul className="space-y-2 text-xs text-[#CBD5E1]">
                        {aboutLinks.map((item) => (
                            <li key={item}>
                                <a href="#" className="transition hover:text-[#F43F73]">
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="mb-3 text-xs font-bold text-white">Hỗ trợ khách hàng</h3>
                    <ul className="space-y-2 text-xs text-[#CBD5E1]">
                        {supportLinks.map((item) => (
                            <li key={item}>
                                <a href="#" className="transition hover:text-[#F43F73]">
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="mb-3 text-xs font-bold text-white">Đối tác</h3>
                    <ul className="space-y-2 text-xs text-[#CBD5E1]">
                        {partnerLinks.map((item) => (
                            <li key={item}>
                                <a href="#" className="transition hover:text-[#F43F73]">
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="mb-3 text-xs font-bold text-white">Phương thức thanh toán</h3>

                    <div className="grid max-w-[190px] grid-cols-4 gap-2">
                        {paymentMethods.map((item) => (
                            <div
                                key={item.name}
                                className="flex h-8 w-11 items-center justify-center rounded-md bg-white shadow-sm"
                            >
                                {item.type === 'visa' && (
                                    <span className="text-[11px] font-black italic tracking-tight text-[#1A4DB3]">
                                        VISA
                                    </span>
                                )}

                                {item.type === 'mastercard' && (
                                    <div className="relative h-4 w-7">
                                        <span className="absolute left-0 top-0 h-4 w-4 rounded-full bg-[#EB001B]" />
                                        <span className="absolute right-0 top-0 h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
                                    </div>
                                )}

                                {item.type === 'momo' && (
                                    <div className="flex h-6 w-6 flex-col items-center justify-center rounded bg-[#A50064] text-[7px] font-black leading-[7px] text-white">
                                        <span>mo</span>
                                        <span>mo</span>
                                    </div>
                                )}

                                {item.type === 'zalopay' && (
                                    <div className="text-center text-[7px] font-black leading-[8px]">
                                        <span className="text-[#0068FF]">Zalo</span>
                                        <span className="text-[#22C55E]">Pay</span>
                                    </div>
                                )}

                                {item.type === 'vnpay' && (
                                    <div className="text-center text-[7px] font-black leading-[8px]">
                                        <span className="text-[#E11D48]">VN</span>
                                        <span className="text-[#2563EB]">PAY</span>
                                    </div>
                                )}

                                {item.type === 'napas' && (
                                    <div className="text-[8px] font-black italic">
                                        <span className="text-[#1D4ED8]">napas</span>
                                        <span className="text-[#16A34A]">●</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:justify-self-end">
                    <h3 className="mb-3 text-xs font-bold text-white">Tải ứng dụng</h3>

                    <div className="space-y-2">
                        <a
                            href="#"
                            className="flex h-9 w-[128px] items-center gap-2 rounded-md border border-white/40 bg-black px-3 text-white transition hover:border-[#F43F73]"
                        >
                            <span className="text-xl leading-none"></span>
                            <span>
                                <span className="block text-[8px] font-normal leading-none text-[#CBD5E1]">
                                    Tải ngay trên
                                </span>
                                <span className="text-xs font-bold leading-none">App Store</span>
                            </span>
                        </a>

                        <a
                            href="#"
                            className="flex h-9 w-[128px] items-center gap-2 rounded-md border border-white/40 bg-black px-3 text-white transition hover:border-[#F43F73]"
                        >
                            <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-[#4F7CFF] text-[9px]">
                                ▶
                            </span>
                            <span>
                                <span className="block text-[8px] font-normal leading-none text-[#CBD5E1]">
                                    Tải trên
                                </span>
                                <span className="text-xs font-bold leading-none">Google Play</span>
                            </span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-[#CBD5E1] sm:flex-row">
                    <p>© 2026 N3V Ticket. All rights reserved.</p>

                    <p>
                        <Link to="/terms" className="transition hover:text-[#F43F73]">
                            Điều khoản sử dụng
                        </Link>

                        {' | '}

                        <Link to="/privacy" className="transition hover:text-[#F43F73]">
                            Chính sách bảo mật
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;