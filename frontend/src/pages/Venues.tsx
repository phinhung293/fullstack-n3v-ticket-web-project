import { useEffect, useState } from 'react';
import { MapPin, Users } from 'lucide-react';
import { searchPublicEvents } from '../api/eventApi';


type Venue = {
    id: string;
    name: string;
    city: string;
    imageUrl: string;
    eventCount: number;
};

function Venues() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState<string>('Tất cả');

    useEffect(() => {
        setLoading(true);
        // Lấy 100 sự kiện để tổng hợp danh sách địa điểm
        searchPublicEvents({ page: 0, size: 100 })
            .then((page) => {
                const events = page.content;
                const venueMap = new Map<string, Venue>();

                events.forEach(event => {
                    if (event.venueName && event.city) {
                        const key = `${event.venueName}-${event.city}`;
                        if (venueMap.has(key)) {
                            const existing = venueMap.get(key)!;
                            existing.eventCount += 1;
                        } else {
                            venueMap.set(key, {
                                id: key,
                                name: event.venueName,
                                city: event.city,
                                imageUrl: event.thumbnailUrl || 'https://images.unsplash.com/photo-1540039155733-d7696d8dd9b8?q=80&w=600&auto=format&fit=crop', // Fallback image
                                eventCount: 1
                            });
                        }
                    }
                });

                setVenues(Array.from(venueMap.values()));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const cities = ['Tất cả', ...Array.from(new Set(venues.map(v => v.city)))];

    const filteredVenues = selectedCity === 'Tất cả' 
        ? venues 
        : venues.filter(v => v.city === selectedCity);

    return (
        <div className="bg-white min-h-screen">
            <section className="mx-auto max-w-[1320px] px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-[#0B1736]">Địa điểm tổ chức</h1>
                    <p className="mt-2 text-sm text-[#64748B]">
                        Khám phá các địa điểm tổ chức sự kiện hàng đầu trên toàn quốc
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-8 flex flex-wrap gap-3">
                    {cities.map((city) => (
                        <button
                            key={city}
                            onClick={() => setSelectedCity(city)}
                            className={`rounded-full border px-5 py-2 text-sm font-bold transition ${
                                selectedCity === city
                                    ? 'border-[#F43F73] bg-[#F43F73] text-white shadow-md'
                                    : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#F43F73] hover:text-[#F43F73]'
                            }`}
                        >
                            {city}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F43F73] border-t-transparent"></div>
                    </div>
                ) : filteredVenues.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-[#64748B]">Không tìm thấy địa điểm nào.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {filteredVenues.map((venue) => (
                            <div key={venue.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white transition hover:-translate-y-1 hover:border-[#F43F73]/30 hover:shadow-lg">
                                <div className="relative h-48 overflow-hidden bg-gray-100">
                                    <img
                                        src={venue.imageUrl}
                                        alt={venue.name}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 left-3 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
                                        <span className="text-xs font-bold text-white">{venue.eventCount} sự kiện</span>
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="mb-2 text-lg font-bold text-[#1E293B] line-clamp-1">{venue.name}</h3>
                                    <div className="mt-auto space-y-2">
                                        <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
                                            <MapPin size={16} className="shrink-0" />
                                            <span className="truncate">{venue.city}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
                                            <Users size={16} className="shrink-0" />
                                            <span>Sức chứa: 1,000+ chỗ</span>
                                        </div>
                                    </div>
                                    <button className="mt-5 w-full rounded-xl border border-[#F43F73] py-2 text-sm font-bold text-[#F43F73] transition group-hover:bg-[#F43F73] group-hover:text-white">
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Venues;
