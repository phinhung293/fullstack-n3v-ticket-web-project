import { useState } from 'react';

const mockPromotions = [
    {
        id: '1',
        title: 'Giảm 20% cho vé sự kiện',
        description: 'Áp dụng cho tất cả sự kiện từ nay đến hết 31/07/2026',
        category: 'Giảm giá vé',
        expiryDate: '31/07/2026',
        color: 'from-pink-500 to-rose-500'
    },
    {
        id: '2',
        title: 'Giảm 15% cho sinh viên',
        description: 'Ưu đãi đặc biệt dành riêng cho sinh viên khi mua vé online',
        category: 'Giảm giá vé',
        expiryDate: '31/08/2026',
        color: 'from-purple-500 to-indigo-500'
    },
    {
        id: '3',
        title: 'Giảm 10% qua VNPay',
        description: 'Thanh toán qua VNPay nhận ngay ưu đãi 10%',
        category: 'Thanh toán',
        expiryDate: '30/07/2026',
        logoUrl: 'https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png' // Mock logo
    },
    {
        id: '4',
        title: 'Mua 1 tặng 1 với VieON',
        description: 'Mua vé bất kỳ tặng ngay 1 tháng VIP VieON',
        category: 'Đối tác',
        expiryDate: '15/08/2026',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/VieON_logo.svg/2560px-VieON_logo.svg.png' // Mock logo
    }
];

function Promotions() {
    const [activeTab, setActiveTab] = useState('Tất cả ưu đãi');
    const tabs = ['Tất cả ưu đãi', 'Giảm giá vé', 'Thanh toán', 'Đối tác'];

    const filteredPromotions = activeTab === 'Tất cả ưu đãi' 
        ? mockPromotions 
        : mockPromotions.filter(p => p.category === activeTab);

    return (
        <div className="bg-white min-h-screen">
            <section className="mx-auto max-w-[1320px] px-6 py-12">
                
                {/* Hero Banner Khuyến Mãi */}
                <div className="relative mb-12 flex h-[240px] items-center overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-10 shadow-lg">
                    {/* Decorative Elements */}
                    <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute -bottom-10 right-20 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute right-0 bottom-0 h-full w-1/3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                    
                    <div className="relative z-10 max-w-[600px]">
                        <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm border border-white/30">
                            % Siêu Sale
                        </span>
                        <h1 className="mb-3 text-4xl font-black text-white">Ưu đãi hấp dẫn mỗi ngày</h1>
                        <p className="text-lg font-medium text-white/90">
                            Săn vé với giá tốt nhất và nhiều quà tặng hấp dẫn
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-8 flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                                activeTab === tab
                                    ? 'bg-[#F43F73] text-white shadow-md'
                                    : 'bg-transparent text-[#64748B] hover:bg-gray-100'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Promotions Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {filteredPromotions.map((promo) => (
                        <div key={promo.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#F43F73]/30">
                            {/* Card Header (Graphic or Logo) */}
                            <div className={`relative flex h-32 items-center justify-center ${promo.color ? `bg-gradient-to-br ${promo.color}` : 'bg-gray-50 border-b border-[#E2E8F0]'}`}>
                                {promo.color ? (
                                    <span className="text-4xl font-black text-white">
                                        {promo.title.split(' ')[1]} {promo.title.split(' ')[0]} {/* Extract percentage roughly */}
                                    </span>
                                ) : (
                                    <img src={promo.logoUrl} alt={promo.title} className="h-12 max-w-[120px] object-contain drop-shadow-sm" />
                                )}
                            </div>
                            
                            {/* Card Body */}
                            <div className="flex flex-1 flex-col p-5">
                                <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-wider text-[#F43F73]">
                                    {promo.category}
                                </span>
                                <h3 className="mb-2 text-lg font-bold text-[#1E293B] group-hover:text-[#F43F73] transition-colors">{promo.title}</h3>
                                <p className="mb-4 flex-1 text-sm text-[#64748B]">{promo.description}</p>
                                <div className="mt-auto border-t border-dashed border-[#E2E8F0] pt-4">
                                    <p className="text-xs font-semibold text-[#94A3B8]">HSD: {promo.expiryDate}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPromotions.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-[#64748B]">Không có ưu đãi nào trong danh mục này.</p>
                    </div>
                )}
                
                <div className="mt-12 flex justify-center">
                    <button className="rounded-full border border-[#F43F73] bg-transparent px-8 py-3 text-sm font-bold text-[#F43F73] transition hover:bg-[#F43F73] hover:text-white">
                        Xem tất cả ưu đãi
                    </button>
                </div>

            </section>
        </div>
    );
}

export default Promotions;
