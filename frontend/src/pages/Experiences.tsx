import { QrCode, ScanFace, Gift, RotateCcw, CheckCircle2 } from 'lucide-react';

function Experiences() {
    return (
        <div className="bg-[#F8FAFC]">
            {/* Hero Banner */}
            <section className="relative overflow-hidden bg-[#061A35] py-20">
                <div className="absolute -left-24 top-0 h-[280px] w-[280px] rounded-full bg-[#F43F73]/30 blur-[120px]" />
                <div className="absolute -right-16 bottom-0 h-[260px] w-[260px] rounded-full bg-[#7C3AED]/30 blur-[120px]" />
                <div className="relative mx-auto flex max-w-[1320px] flex-col items-start px-6 text-white lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-[600px] z-10">
                        <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                            Trải nghiệm tuyệt vời cùng <span className="text-[#F43F73]">N3V Ticket</span>
                        </h1>
                        <p className="mt-5 text-base font-medium text-white/80 md:text-lg">
                            Không chỉ là vé sự kiện, chúng tôi mang đến những trải nghiệm đáng nhớ trước, trong và sau mỗi sự kiện.
                        </p>
                        <ul className="mt-8 space-y-4">
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-[#F43F73]" size={24} />
                                <span className="font-semibold text-white/90">Đặt vé nhanh chóng, thanh toán dễ dàng</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-[#F43F73]" size={24} />
                                <span className="font-semibold text-white/90">Sơ đồ ghế rõ ràng, chọn chỗ ưng ý</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-[#F43F73]" size={24} />
                                <span className="font-semibold text-white/90">Hỗ trợ 24/7 nhiệt tình, giải đáp mọi thắc mắc</span>
                            </li>
                        </ul>
                    </div>
                    {/* Placeholder for an image or graphic */}
                    <div className="hidden lg:block z-10 relative">
                        <div className="h-[400px] w-[500px] rounded-3xl overflow-hidden shadow-2xl shadow-[#F43F73]/20 border border-white/10">
                             <img 
                                src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=2070&q=80"
                                alt="Concert Experience" 
                                className="w-full h-full object-cover"
                             />
                        </div>
                    </div>
                </div>
            </section>

            {/* Trải nghiệm nổi bật */}
            <section className="mx-auto max-w-[1320px] px-6 py-16">
                <h2 className="mb-8 text-2xl font-black text-[#0B1736]">Trải nghiệm nổi bật</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1 */}
                    <div className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#F43F73]/30 hover:shadow-lg">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white">
                            <QrCode size={28} />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-[#1E293B]">Vé điện tử tiện lợi</h3>
                        <p className="text-sm font-medium text-[#64748B]">
                            Nhận vé ngay trên điện thoại. Không lo mất vé giấy.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#F43F73]/30 hover:shadow-lg">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
                            <ScanFace size={28} />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-[#1E293B]">Check-in nhanh chóng</h3>
                        <p className="text-sm font-medium text-[#64748B]">
                            Quét mã QR, check-in dễ dàng, tiết kiệm thời gian.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#F43F73]/30 hover:shadow-lg">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-purple-500 transition group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white">
                            <Gift size={28} />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-[#1E293B]">Ưu đãi đặc quyền</h3>
                        <p className="text-sm font-medium text-[#64748B]">
                            Nhận thông tin sớm nhất về sự kiện và ưu đãi.
                        </p>
                    </div>

                    {/* Card 4 */}
                    <div className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#F43F73]/30 hover:shadow-lg">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-pink-50 text-pink-500 transition group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white">
                            <RotateCcw size={28} />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-[#1E293B]">Hoàn hủy linh hoạt</h3>
                        <p className="text-sm font-medium text-[#64748B]">
                            Chính sách hoàn hủy rõ ràng, hỗ trợ tận tình.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Experiences;
