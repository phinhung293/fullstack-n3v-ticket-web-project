import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';

const sections = [
    {
        title: '1. Chấp nhận điều khoản',
        content:
            'Khi đăng ký và sử dụng N3V Ticket, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các điều khoản sử dụng này. Nếu không đồng ý, bạn vui lòng ngừng sử dụng dịch vụ.',
    },
    {
        title: '2. Tài khoản người dùng',
        content:
            'Bạn cần cung cấp thông tin chính xác khi đăng ký tài khoản. Bạn chịu trách nhiệm bảo mật email, mật khẩu và mọi hoạt động phát sinh từ tài khoản của mình.',
    },
    {
        title: '3. Đặt vé và thanh toán',
        content:
            'Thông tin sự kiện, giá vé và trạng thái vé sẽ được hiển thị trên hệ thống. Người dùng cần kiểm tra kỹ thông tin trước khi xác nhận đặt vé hoặc thanh toán.',
    },
    {
        title: '4. Hành vi không được phép',
        content:
            'Bạn không được sử dụng hệ thống để gian lận vé, tạo tài khoản giả, can thiệp trái phép vào hệ thống, phát tán mã độc hoặc thực hiện hành vi ảnh hưởng đến người dùng khác.',
    },
    {
        title: '5. Thay đổi dịch vụ',
        content:
            'N3V Ticket có thể cập nhật giao diện, chức năng hoặc nội dung điều khoản để phù hợp với quá trình phát triển hệ thống.',
    },
    {
        title: '6. Liên hệ hỗ trợ',
        content:
            'Nếu cần hỗ trợ về tài khoản, vé hoặc điều khoản sử dụng, bạn có thể liên hệ đội ngũ hỗ trợ của N3V Ticket qua các kênh được hiển thị trên website.',
    },
];

function Terms() {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen bg-[#08051E] px-6 py-8 text-white">
            <section className="mx-auto max-w-[1120px]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-bold text-white transition hover:border-[#F43F73] hover:text-[#F43F73]"
                    >
                        <ArrowLeft size={18} />
                        Quay lại
                    </button>

                    <Link
                        to="/register"
                        className="rounded-full bg-[#F43F73] px-5 py-2 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,63,115,0.28)] transition hover:bg-[#E11D60]"
                    >
                        Về trang đăng ký
                    </Link>
                </div>

                <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                    <div className="relative overflow-hidden bg-[#120B35] px-8 py-10 md:px-12">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_45%,rgba(244,63,115,0.35),transparent_32%),radial-gradient(circle_at_82%_55%,rgba(124,58,237,0.32),transparent_34%)]" />

                        <div className="relative">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-[#FDA4AF]">
                                <FileText size={18} />
                                N3V Ticket
                            </div>

                            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                                Điều khoản <span className="text-[#F43F73]">sử dụng</span>
                            </h1>

                            <p className="mt-4 max-w-[760px] text-sm font-medium leading-6 text-white/75 md:text-base">
                                Đây là các điều khoản cơ bản khi bạn tạo tài khoản và sử dụng nền tảng đặt vé N3V Ticket.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-8 bg-[#F8FAFC] p-8 md:p-12 lg:grid-cols-[1fr_300px]">
                        <div className="space-y-5">
                            {sections.map((section) => (
                                <article
                                    key={section.title}
                                    className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition hover:border-[#F43F73]/45 hover:shadow-[0_12px_32px_rgba(244,63,115,0.08)]"
                                >
                                    <h2 className="text-xl font-black text-[#0B1736]">
                                        {section.title}
                                    </h2>

                                    <p className="mt-3 text-sm font-medium leading-7 text-[#475569]">
                                        {section.content}
                                    </p>
                                </article>
                            ))}
                        </div>

                        <aside className="h-fit rounded-2xl border border-[#F43F73]/25 bg-[#F43F73]/5 p-6">
                            <h3 className="text-lg font-black text-[#0B1736]">
                                Tóm tắt nhanh
                            </h3>

                            <div className="mt-5 space-y-4">
                                {[
                                    'Cung cấp thông tin đăng ký chính xác.',
                                    'Tự bảo mật tài khoản và mật khẩu.',
                                    'Kiểm tra kỹ thông tin trước khi đặt vé.',
                                    'Không gian lận hoặc can thiệp hệ thống.',
                                ].map((item) => (
                                    <div key={item} className="flex gap-3">
                                        <CheckCircle2
                                            size={20}
                                            className="mt-0.5 shrink-0 text-[#F43F73]"
                                        />

                                        <p className="text-sm font-semibold leading-6 text-[#334155]">
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <Link
                                to="/privacy"
                                className="mt-6 flex h-11 items-center justify-center rounded-xl bg-[#F43F73] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,63,115,0.24)] transition hover:bg-[#E11D60]"
                            >
                                Xem chính sách bảo mật
                            </Link>
                        </aside>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Terms;