import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import EventCard from '../components/events/EventCard';
import EventFilterBar from '../components/events/EventFilterBar';
import { getCategories, getEventApiErrorMessage, searchPublicEvents } from '../api/eventApi';
import type { CategoryResponse, EventSearchParams, EventSummaryResponse } from '../types/event';

function EventList() {
    const [searchParams, setSearchParams] = useSearchParams();

    const filters: EventSearchParams = useMemo(
        () => ({
            keyword: searchParams.get('keyword') || undefined,
            categoryId: searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined,
            city: searchParams.get('city') || undefined,
            from: searchParams.get('from') || undefined,
            to: searchParams.get('to') || undefined,
            page: searchParams.get('page') ? Number(searchParams.get('page')) : 0,
        }),
        [searchParams],
    );

    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [events, setEvents] = useState<EventSummaryResponse[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getCategories().then(setCategories).catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        setLoading(true);
        setError('');
        searchPublicEvents(filters)
            .then((page) => {
                setEvents(page.content);
                setTotalPages(page.totalPages);
                setCities((prev) => {
                    const merged = new Set(prev);
                    page.content.forEach((e) => e.city && merged.add(e.city));
                    return Array.from(merged).sort();
                });
            })
            .catch((err) => setError(getEventApiErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [filters]);

    const activeCategoryName = categories.find((c) => c.id === filters.categoryId)?.name;

    const applyFilters = (next: EventSearchParams) => {
        const params: Record<string, string> = {};
        if (next.keyword) params.keyword = next.keyword;
        if (next.categoryId) params.categoryId = String(next.categoryId);
        if (next.city) params.city = next.city;
        if (next.from) params.from = next.from;
        if (next.to) params.to = next.to;
        setSearchParams(params);
    };

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(page));
        setSearchParams(params);
    };

    return (
        <section className="mx-auto max-w-[1320px] px-6 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-[#0B1736]">
                    {activeCategoryName ? `Sự kiện ${activeCategoryName}` : 'Khám phá sự kiện'}
                </h1>
                <p className="mt-1 text-sm font-medium text-[#64748B]">
                    Tìm kiếm và lọc sự kiện theo danh mục, khu vực và thời gian.
                </p>
            </div>

            <EventFilterBar categories={categories} cities={cities} value={filters} onChange={applyFilters} />

            {error && <p className="mt-6 text-sm font-bold text-[#DC2626]">{error}</p>}

            {loading ? (
                <div className="mt-10 text-center text-sm font-bold text-[#94A3B8]">Đang tải sự kiện...</div>
            ) : (
                <>
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>

                    {events.length === 0 && (
                        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] py-16 text-center">
                            <SearchX size={40} className="text-[#CBD5E1]" />
                            <p className="mt-3 text-sm font-bold text-[#64748B]">
                                Không tìm thấy sự kiện phù hợp với bộ lọc hiện tại.
                            </p>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center gap-2">
                            {Array.from({ length: totalPages }).map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => goToPage(index)}
                                    className={`h-9 w-9 rounded-lg text-xs font-black transition ${(filters.page ?? 0) === index
                                            ? 'bg-[#F43F73] text-white'
                                            : 'border border-[#E2E8F0] text-[#334155] hover:border-[#F43F73]'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

export default EventList;
