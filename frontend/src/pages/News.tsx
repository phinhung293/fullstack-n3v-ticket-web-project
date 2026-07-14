import React from 'react';

const mockFeaturedNews = {
    id: '1',
    title: 'Sky Music Festival 2026 công bố dàn nghệ sĩ đình đám',
    tag: 'Sự kiện',
    date: '12/07/2026',
    excerpt: 'Sự kiện âm nhạc lớn nhất năm với sự góp mặt của nhiều nghệ sĩ hàng đầu Việt Nam và quốc tế...',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop'
};

const mockLatestNews = [
    {
        id: '2',
        title: 'Đêm Ballet Quốc Gia trở lại với phiên bản đặc biệt',
        tag: 'Sự kiện',
        date: '10/07/2026',
        imageUrl: 'https://images.unsplash.com/photo-1507676184212-d0330a15183c?q=80&w=1769&auto=format&fit=crop'
    },
    {
        id: '3',
        title: 'Ưu đãi 20% khi thanh toán qua ví điện tử MoMo',
        tag: 'Ưu đãi',
        date: '08/07/2026',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1974&auto=format&fit=crop'
    },
    {
        id: '4',
        title: 'Thông báo thay đổi địa điểm sự kiện Giải Marathon Hà Nội',
        tag: 'Thông báo',
        date: '05/07/2026',
        imageUrl: 'https://images.unsplash.com/photo-1552674605-15c2145eba11?q=80&w=2070&auto=format&fit=crop'
    }
];

function News() {
    return (
        <div className="bg-[#F8FAFC] min-h-screen">
            <section className="mx-auto max-w-[1320px] px-6 py-12">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    
                    {/* Tin nổi bật */}
                    <div className="lg:col-span-2">
                        <h2 className="mb-6 text-2xl font-black text-[#0B1736]">Tin nổi bật</h2>
                        <div className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md border border-[#E2E8F0]">
                            <div className="relative h-[300px] w-full overflow-hidden sm:h-[400px]">
                                <img
                                    src={mockFeaturedNews.imageUrl}
                                    alt={mockFeaturedNews.title}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="mb-3 text-2xl font-bold text-[#1E293B] group-hover:text-[#F43F73] transition">
                                    {mockFeaturedNews.title}
                                </h3>
                                <div className="mb-4 flex items-center gap-3">
                                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
                                        {mockFeaturedNews.tag}
                                    </span>
                                    <span className="text-sm font-medium text-[#94A3B8]">{mockFeaturedNews.date}</span>
                                </div>
                                <p className="text-base text-[#64748B]">{mockFeaturedNews.excerpt}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tin mới nhất */}
                    <div>
                        <h2 className="mb-6 text-2xl font-black text-[#0B1736]">Tin mới nhất</h2>
                        <div className="flex flex-col gap-5">
                            {mockLatestNews.map((news) => (
                                <div key={news.id} className="group flex cursor-pointer gap-4 rounded-xl bg-white p-3 shadow-sm transition hover:shadow-md border border-[#E2E8F0]">
                                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg">
                                        <img
                                            src={news.imageUrl}
                                            alt={news.title}
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-between py-1">
                                        <div>
                                            <span className="mb-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                                {news.tag}
                                            </span>
                                            <h4 className="text-sm font-bold text-[#1E293B] line-clamp-2 group-hover:text-[#F43F73] transition">
                                                {news.title}
                                            </h4>
                                        </div>
                                        <span className="text-xs font-medium text-[#94A3B8]">{news.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 flex justify-center">
                    <button className="rounded-full border border-[#F43F73] bg-transparent px-8 py-3 text-sm font-bold text-[#F43F73] transition hover:bg-[#F43F73] hover:text-white">
                        Xem tất cả tin tức
                    </button>
                </div>
            </section>
        </div>
    );
}

export default News;
