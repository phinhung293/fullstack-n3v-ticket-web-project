import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { EventSummaryResponse } from '../../types/event';
import { formatCurrency, formatShortDate } from '../../utils/format';
import { DISPLAY_STATUS_BADGE_CLASS, DISPLAY_STATUS_LABEL, getDisplayStatus } from '../../utils/eventStatus';

function EventCard({ event }: { event: EventSummaryResponse }) {
    const { day, month } = formatShortDate(event.startTime);
    const displayStatus = getDisplayStatus(event);

    return (
        <Link
            to={`/events/${event.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(244,63,115,0.16)]"
        >
            <div className="relative aspect-video w-full overflow-hidden bg-[#0B1736]">
                {event.thumbnailUrl ? (
                    <img
                        src={event.thumbnailUrl}
                        alt={event.name}
                        className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${displayStatus === 'EXPIRED' || displayStatus === 'COMPLETED' ? 'grayscale' : ''
                            }`}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0B1736] to-[#4C1D95] text-sm font-bold text-white/50">
                        N3V Ticket
                    </div>
                )}
                <div className="absolute left-3 top-3 flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white shadow-md">
                    <span className="text-base font-black leading-none text-[#F43F73]">{day}</span>
                    <span className="text-[10px] font-bold leading-none text-[#64748B]">{month}</span>
                </div>
                <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black ${DISPLAY_STATUS_BADGE_CLASS[displayStatus]}`}
                >
                    {DISPLAY_STATUS_LABEL[displayStatus]}
                </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                {event.categoryName && (
                    <span className="w-fit rounded-full bg-[#F43F73]/10 px-2.5 py-1 text-[10px] font-black text-[#F43F73]">
                        {event.categoryName}
                    </span>
                )}
                <h3 className="line-clamp-2 text-sm font-black leading-5 text-[#0B1736] transition group-hover:text-[#F43F73]">
                    {event.name}
                </h3>
                <div className="mt-auto space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">
                            {event.venueName}
                            {event.city ? `, ${event.city}` : ''}
                        </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-[#94A3B8]">Từ</span>
                        <span className="text-sm font-black text-[#F43F73]">
                            {formatCurrency(event.minPrice)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function EventCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="aspect-video w-full animate-pulse bg-[#F1F5F9]" />
            <div className="space-y-3 p-4">
                <div className="h-3 w-16 animate-pulse rounded-full bg-[#F1F5F9]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#F1F5F9]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[#F1F5F9]" />
            </div>
        </div>
    );
}

export default EventCard;
