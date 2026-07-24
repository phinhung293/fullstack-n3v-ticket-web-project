// Types khớp 1:1 với DTO / enum bên backend (com.n3v.ticket.dto.event, .dto.category, .enums)

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type TicketMapType = 'SEAT_MAP' | 'ZONE' | 'TEA_LOUNGE';
export type SeatType = 'SEAT' | 'TABLE';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'SOLD' | 'DISABLED';
export type SeatTier = 'VIP' | 'STANDARD';

export type ApiResponse<T> = {
    code: number;
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
};

// Spring Data Page<T>
export type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // trang hiện tại (0-based)
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
};

export type CategoryResponse = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    iconUrl?: string | null;
};

export type CategoryRequest = {
    name: string;
    description?: string;
    iconUrl?: string;
};

export type EventSeatResponse = {
    id: number;
    zoneId: number;
    seatType: SeatType;
    seatTier: SeatTier;
    seatRow?: string | null;
    seatColumn?: number | null;
    seatCode: string;
    capacity?: number | null;
    price?: number | null;
    status: SeatStatus;

};

export type EventSeatRequest = {
    seatType: SeatType;
    seatRow?: string;
    seatColumn?: number;
    seatCode: string;
    capacity?: number;
    price?: number;
};

export type SeatBulkGenerateRequest = {
    rows: string[];
    columnsPerRow: number;
    seatTier: SeatTier;
};

export type EventZoneResponse = {
    id: number;
    eventId: number;
    zoneName: string;
    description?: string | null;
    totalCapacity?: number | null;
    soldCount?: number | null;
    remaining?: number | null;
    price: number;
    displayOrder?: number | null;
    active: boolean;
    seats?: EventSeatResponse[];
};

export type EventZoneRequest = {
    zoneName: string;
    description?: string;
    totalCapacity?: number;
    price: number;
    displayOrder?: number;
};

export type EventSummaryResponse = {
    id: number;
    name: string;
    thumbnailUrl?: string | null;
    categoryName?: string | null;
    venueName?: string | null;
    city?: string | null;
    startTime: string;
    endTime: string;
    saleEndTime?: string | null;
    ticketMapType: TicketMapType;
    status: EventStatus;
    isExpired: boolean;
    minPrice?: number | null;
};

export type EventResponse = {
    id: number;
    name: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    bannerUrl?: string | null;
    category: CategoryResponse;
    venueName?: string | null;
    address?: string | null;
    city?: string | null;
    startTime: string;
    endTime: string;
    saleStartTime?: string | null;
    saleEndTime?: string | null;
    ticketMapType: TicketMapType;
    status: EventStatus;
    isExpired: boolean;
    createdBy?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    zones: EventZoneResponse[];
};

export type EventCreateRequest = {
    name: string;
    description?: string;
    thumbnailUrl?: string;
    bannerUrl?: string;
    categoryId: number;
    venueName: string;
    address?: string;
    city?: string;
    startTime: string;
    endTime: string;
    saleStartTime?: string;
    saleEndTime?: string;
    ticketMapType: TicketMapType;
};

export type EventUpdateRequest = Omit<EventCreateRequest, 'ticketMapType'>;

export type EventStatusUpdateRequest = {
    status: EventStatus;
};

export type EventSearchParams = {
    keyword?: string;
    categoryId?: number;
    city?: string;
    status?: EventStatus;
    ticketMapType?: TicketMapType;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
};

export const TICKET_MAP_TYPE_LABEL: Record<TicketMapType, string> = {
    SEAT_MAP: 'Sơ đồ ghế',
    ZONE: 'Sơ đồ khu vực',
    TEA_LOUNGE: 'Sơ đồ phòng trà',
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
    DRAFT: 'Bản nháp',
    PUBLISHED: 'Đã công khai',
    ONGOING: 'Đang diễn ra',
    COMPLETED: 'Đã kết thúc',
    CANCELLED: 'Đã hủy',
};
