import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getAuthUser } from '../utils/authStorage';

const sections = [
    {
        title: '1. Thông tin chúng tôi thu thập',
        content:
            'Khi bạn đăng ký tài khoản, hệ thống có thể thu thập họ tên, email, mật khẩu đã được mã hóa và các thông tin cần thiết để hỗ trợ quá trình đặt vé.',
    },
    {
        title: '2. Mục đích sử dụng thông tin',
        content:
            'Thông tin được sử dụng để tạo tài khoản, đăng nhập, xác thực người dùng, hỗ trợ đặt vé, gửi thông báo liên quan đến tài khoản và cải thiện trải nghiệm sử dụng website.',
    },
    {
        title: '3. Bảo mật tài khoản',
        content:
            'Mật khẩu người dùng được lưu dưới dạng đã mã hóa. Bạn nên sử dụng mật khẩu mạnh, không chia sẻ mật khẩu và đăng xuất khỏi tài khoản khi dùng thiết bị công cộng.',
    },
    {
        title: '4. Chia sẻ thông tin',
        content:
            'N3V Ticket không bán thông tin cá nhân của người dùng. Thông tin chỉ được sử dụng trong phạm vi vận hành hệ thống hoặc khi cần thiết theo yêu cầu hợp lệ.',
    },
    {
        title: '5. Quyền của người dùng',
        content:
            'Bạn có thể xem và cập nhật thông tin cá nhân trong trang quản lý tài khoản. Nếu cần hỗ trợ chỉnh sửa hoặc xử lý dữ liệu, bạn có thể liên hệ đội ngũ hỗ trợ.',
    },
    {
        title: '6. Cập nhật chính sách',
        content:
            'Chính sách bảo mật có thể được cập nhật khi hệ thống thay đổi chức năng hoặc quy trình xử lý dữ liệu. Phiên bản mới sẽ được hiển thị trên website.',
    },
];

function Privacy() {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('accessToken') || getAuthUser());

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
                        to={isLoggedIn ? '/' : '/register'}
                        className="rounded-full bg-[#F43F73] px-5 py-2 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,63,115,0.28)] transition hover:bg-[#E11D60]"
                    >
                        {isLoggedIn ? 'Về trang chủ' : 'Về trang đăng ký'}
                    </Link>
                </div>

                <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                    <div className="relative overflow-hidden bg-[#120B35] px-8 py-10 md:px-12">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_45%,rgba(244,63,115,0.35),transparent_32%),radial-gradient(circle_at_82%_55%,rgba(124,58,237,0.32),transparent_34%)]" />

                        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-[#FDA4AF]">
                                    <ShieldCheck size={18} />
                                    N3V Ticket
                                </div>

                                <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                                    Chính sách <span className="text-[#F43F73]">bảo mật</span>
                                </h1>

                                <p className="mt-4 max-w-[760px] text-sm font-medium leading-6 text-white/75 md:text-base">
                                    Chính sách này giải thích cách N3V Ticket thu thập, sử dụng và bảo vệ thông tin tài khoản của bạn.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                                <LockKeyhole size={36} className="text-[#F43F73]" />

                                <p className="mt-3 text-sm font-bold text-white/70">
                                    Bảo vệ dữ liệu người dùng
                                </p>
                            </div>
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
                                Cam kết bảo mật
                            </h3>

                            <div className="mt-5 space-y-4">
                                {[
                                    'Không bán thông tin cá nhân người dùng.',
                                    'Mật khẩu được lưu dưới dạng mã hóa.',
                                    'Chỉ dùng dữ liệu cho vận hành hệ thống.',
                                    'Cho phép người dùng cập nhật hồ sơ.',
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
                                to="/terms"
                                className="mt-6 flex h-11 items-center justify-center rounded-xl bg-[#F43F73] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,63,115,0.24)] transition hover:bg-[#E11D60]"
                            >
                                Xem điều khoản sử dụng
                            </Link>
                        </aside>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Privacy;