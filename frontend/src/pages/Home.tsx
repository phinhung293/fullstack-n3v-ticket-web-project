import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import EventCard from '../components/events/EventCard';
import { getCategories, searchPublicEvents } from '../api/eventApi';
import type { CategoryResponse, EventSummaryResponse } from '../types/event';
import { canPurchase, getDisplayStatus } from '../utils/eventStatus';

function Home() {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [featured, setFeatured] = useState<EventSummaryResponse[]>([]);
    const [upcoming, setUpcoming] = useState<EventSummaryResponse[]>([]);

    useEffect(() => {
        getCategories().then(setCategories).catch(() => setCategories([]));

        // API public /events mặc định chỉ trả PUBLISHED + ONGOING, đã sắp theo thời gian gần nhất
        // (JpaSpecificationExecutor phía backend), 8 sự kiện là đủ tách 4 nổi bật + 4 sắp diễn ra.
        searchPublicEvents({ page: 0, size: 8 })
            .then((page) => {
                const all = page.content;
                setFeatured(all.slice(0, 4));
                setUpcoming(all.filter((e) => canPurchase(getDisplayStatus(e))).slice(0, 4));
            })
            .catch(() => {
                setFeatured([]);
                setUpcoming([]);
            });
    }, []);

    const handleSearch = () => {
        const trimmed = keyword.trim();
        navigate(trimmed ? `/events?keyword=${encodeURIComponent(trimmed)}` : '/events');
    };

    return (
        <div className="bg-white">
            {/* Hero */}
            <section className="relative overflow-hidden bg-[#061A35]">
                <div className="absolute -left-24 top-0 h-[280px] w-[280px] rounded-full bg-[#F43F73]/25 blur-[110px]" />
                <div className="absolute -right-16 bottom-0 h-[260px] w-[260px] rounded-full bg-[#7C3AED]/25 blur-[110px]" />
                <div className="relative mx-auto flex max-w-[1320px] flex-col items-center px-6 py-16 text-center text-white">
                    <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-[#FDA4AF]">
                        Nền tảng đặt vé sự kiện hàng đầu Việt Nam
                    </span>
                    <h1 className="mt-5 max-w-[720px] text-3xl font-black leading-tight sm:text-4xl">
                        Khám phá &amp; đặt vé cho những{' '}
                        <span className="text-[#F43F73]">trải nghiệm đáng nhớ</span>
                    </h1>
                    <p className="mt-3 max-w-[560px] text-sm font-medium text-white/70">
                        Concert, thể thao, nghệ thuật --- hàng chục sự kiện đang chờ bạn.
                    </p>
                    <div className="mt-7 flex h-12 w-full max-w-[560px] overflow-hidden rounded-xl bg-white shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
                        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                            <Search size={18} className="shrink-0 text-[#9CA3AF]" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                                placeholder="Tìm sự kiện, ca sĩ, địa điểm..."
                                className="h-full w-full min-w-0 bg-transparent text-sm font-semibold text-[#1F2937] outline-none placeholder:text-[#9CA3AF]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="shrink-0 bg-[#F43F73] px-6 text-sm font-black text-white transition hover:bg-[#E11D5E]"
                        >
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </section>

            {/* Danh mục */}
            <section className="mx-auto max-w-[1320px] px-6 py-10">
                <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            to={`/events?categoryId=${category.id}`}
                            className="rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#334155] shadow-sm transition hover:border-[#F43F73] hover:bg-[#F43F73] hover:text-white"
                        >
                            {category.name}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Sự kiện nổi bật */}
            {featured.length > 0 && (
                <section className="mx-auto max-w-[1320px] px-6 pb-10">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-xl font-black text-[#0B1736]">Sự kiện nổi bật</h2>
                        <Link to="/events" className="flex items-center gap-1 text-xs font-black text-[#F43F73] hover:text-[#E11D5E]">
                            Xem tất cả
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {featured.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}

            {/* Sắp diễn ra */}
            {upcoming.length > 0 && (
                <section className="mx-auto max-w-[1320px] px-6 pb-16">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-xl font-black text-[#0B1736]">Sắp diễn ra</h2>
                        <Link to="/events" className="flex items-center gap-1 text-xs font-black text-[#F43F73] hover:text-[#E11D5E]">
                            Xem tất cả
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {upcoming.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default Home;
