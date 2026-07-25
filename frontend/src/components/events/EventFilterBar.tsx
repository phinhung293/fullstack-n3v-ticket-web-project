import { useEffect, useState } from 'react';
import { CalendarRange, MapPin, Search, Tag, X } from 'lucide-react';
import type { CategoryResponse, EventSearchParams } from '../../types/event';

type EventFilterBarProps = {
    categories: CategoryResponse[];
    cities: string[];
    value: EventSearchParams;
    onChange: (next: EventSearchParams) => void;
};

function EventFilterBar({ categories, cities, value, onChange }: EventFilterBarProps) {
    const [keyword, setKeyword] = useState(value.keyword || '');

    useEffect(() => {
        setKeyword(value.keyword || '');
    }, [value.keyword]);

    const update = (patch: Partial<EventSearchParams>) => {
        onChange({ ...value, ...patch, page: 0 });
    };

    const hasActiveFilters = Boolean(value.categoryId || value.city || value.from || value.to);

    const clearFilters = () => {
        onChange({ keyword: value.keyword, page: 0 });
    };

    return (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-5">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    update({ keyword: keyword.trim() || undefined });
                }}
                className="flex h-12 items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4"
            >
                <Search size={18} className="shrink-0 text-[#94A3B8]" />
                <input
                    type="text"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm kiếm sự kiện, ca sĩ, địa điểm..."
                    className="h-full w-full min-w-0 bg-transparent text-sm font-semibold text-[#0B1736] outline-none placeholder:text-[#94A3B8]"
                />
                <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-[#F43F73] px-4 py-2 text-xs font-black text-white transition hover:bg-[#E11D5E]"
                >
                    Tìm kiếm
                </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex min-w-[170px] flex-1 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2">
                    <Tag size={15} className="shrink-0 text-[#94A3B8]" />
                    <select
                        value={value.categoryId ?? ''}
                        onChange={(event) =>
                            update({ categoryId: event.target.value ? Number(event.target.value) : undefined })
                        }
                        className="w-full bg-transparent text-xs font-bold text-[#334155] outline-none"
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex min-w-[160px] flex-1 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2">
                    <MapPin size={15} className="shrink-0 text-[#94A3B8]" />
                    <select
                        value={value.city ?? ''}
                        onChange={(event) => update({ city: event.target.value || undefined })}
                        className="w-full bg-transparent text-xs font-bold text-[#334155] outline-none"
                    >
                        <option value="">Tất cả khu vực</option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2">
                    <CalendarRange size={15} className="shrink-0 text-[#94A3B8]" />
                    <input
                        type="date"
                        value={value.from ? value.from.slice(0, 10) : ''}
                        onChange={(event) =>
                            update({ from: event.target.value ? `${event.target.value}T00:00:00` : undefined })
                        }
                        className="w-full bg-transparent text-xs font-bold text-[#334155] outline-none"
                    />
                    <span className="text-[#CBD5E1]">--</span>
                    <input
                        type="date"
                        value={value.to ? value.to.slice(0, 10) : ''}
                        onChange={(event) =>
                            update({ to: event.target.value ? `${event.target.value}T23:59:59` : undefined })
                        }
                        className="w-full bg-transparent text-xs font-bold text-[#334155] outline-none"
                    />
                </div>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 rounded-lg border border-[#F43F73]/40 px-3 py-2 text-xs font-black text-[#F43F73] transition hover:bg-[#F43F73] hover:text-white"
                    >
                        <X size={14} />
                        Xóa lọc
                    </button>
                )}
            </div>
        </div>
    );
}

export default EventFilterBar;
