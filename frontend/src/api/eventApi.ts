import axiosInstance from './axiosInstance';
import type {
    ApiResponse,
    CategoryRequest,
    CategoryResponse,
    EventCreateRequest,
    EventResponse,
    EventSearchParams,
    EventSeatRequest,
    EventSeatResponse,
    EventStatus,
    EventSummaryResponse,
    EventUpdateRequest,
    EventZoneRequest,
    EventZoneResponse,
    Page,
    SeatBulkGenerateRequest,
} from '../types/event';

// axiosInstance.baseURL đã là 'http://localhost:8080/api' (xem src/api/axiosInstance.ts),
// nên toàn bộ path bên dưới không lặp lại tiền tố '/api'.

const buildSearchQuery = (params: EventSearchParams = {}) => {
    const query: Record<string, string | number> = {};
    if (params.keyword) query.keyword = params.keyword;
    if (params.categoryId) query.categoryId = params.categoryId;
    if (params.city) query.city = params.city;
    if (params.status) query.status = params.status;
    if (params.ticketMapType) query.ticketMapType = params.ticketMapType;
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;
    query.page = params.page ?? 0;
    query.size = params.size ?? 12;
    return query;
};

// ---------- Danh mục (Category) - public GET, admin POST/PUT/DELETE ----------

export const getCategories = async (): Promise<CategoryResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<CategoryResponse[]>>('/categories');
    return res.data.data;
};

export const createCategory = async (payload: CategoryRequest): Promise<CategoryResponse> => {
    const res = await axiosInstance.post<ApiResponse<CategoryResponse>>('/categories', payload);
    return res.data.data;
};

export const updateCategory = async (id: number, payload: CategoryRequest): Promise<CategoryResponse> => {
    const res = await axiosInstance.put<ApiResponse<CategoryResponse>>(`/categories/${id}`, payload);
    return res.data.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
};

// ---------- Public (Khách) ----------

export const searchPublicEvents = async (params: EventSearchParams = {}): Promise<Page<EventSummaryResponse>> => {
    const res = await axiosInstance.get<ApiResponse<Page<EventSummaryResponse>>>('/events', {
        params: buildSearchQuery(params),
    });
    return res.data.data;
};

export const getPublicEventById = async (id: number | string): Promise<EventResponse> => {
    const res = await axiosInstance.get<ApiResponse<EventResponse>>(`/events/${id}`);
    return res.data.data;
};

export const getPublicEventZones = async (eventId: number | string): Promise<EventZoneResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<EventZoneResponse[]>>(`/events/${eventId}/zones`);
    return res.data.data;
};

export const getPublicZoneSeats = async (zoneId: number | string): Promise<EventSeatResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<EventSeatResponse[]>>(`/zones/${zoneId}/seats`);
    return res.data.data;
};

// ---------- Admin - Sự kiện ----------

export const adminSearchEvents = async (params: EventSearchParams = {}): Promise<Page<EventSummaryResponse>> => {
    const res = await axiosInstance.get<ApiResponse<Page<EventSummaryResponse>>>('/admin/events', {
        params: buildSearchQuery({ size: 20, ...params }),
    });
    return res.data.data;
};

export const adminGetEventById = async (id: number | string): Promise<EventResponse> => {
    const res = await axiosInstance.get<ApiResponse<EventResponse>>(`/admin/events/${id}`);
    return res.data.data;
};

export const adminCreateEvent = async (payload: EventCreateRequest): Promise<EventResponse> => {
    const res = await axiosInstance.post<ApiResponse<EventResponse>>('/admin/events', payload);
    return res.data.data;
};

export const adminUpdateEvent = async (id: number | string, payload: EventUpdateRequest): Promise<EventResponse> => {
    const res = await axiosInstance.put<ApiResponse<EventResponse>>(`/admin/events/${id}`, payload);
    return res.data.data;
};

export const adminChangeEventStatus = async (id: number | string, status: EventStatus): Promise<EventResponse> => {
    const res = await axiosInstance.patch<ApiResponse<EventResponse>>(`/admin/events/${id}/status`, { status });
    return res.data.data;
};

export const adminDeleteEvent = async (id: number | string): Promise<void> => {
    await axiosInstance.delete(`/admin/events/${id}`);
};

// ---------- Admin - Khu vực (Zone) ----------

export const adminGetZones = async (eventId: number | string): Promise<EventZoneResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<EventZoneResponse[]>>(`/admin/events/${eventId}/zones`);
    return res.data.data;
};

export const adminCreateZone = async (
    eventId: number | string,
    payload: EventZoneRequest,
): Promise<EventZoneResponse> => {
    const res = await axiosInstance.post<ApiResponse<EventZoneResponse>>(`/admin/events/${eventId}/zones`, payload);
    return res.data.data;
};

export const adminUpdateZone = async (
    eventId: number | string,
    zoneId: number | string,
    payload: EventZoneRequest,
): Promise<EventZoneResponse> => {
    const res = await axiosInstance.put<ApiResponse<EventZoneResponse>>(
        `/admin/events/${eventId}/zones/${zoneId}`,
        payload,
    );
    return res.data.data;
};

export const adminDeleteZone = async (eventId: number | string, zoneId: number | string): Promise<void> => {
    await axiosInstance.delete(`/admin/events/${eventId}/zones/${zoneId}`);
};

// ---------- Admin - Ghế / Bàn (Seat) ----------

export const adminGetSeats = async (zoneId: number | string): Promise<EventSeatResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<EventSeatResponse[]>>(`/admin/zones/${zoneId}/seats`);
    return res.data.data;
};

export const adminCreateSeat = async (
    zoneId: number | string,
    payload: EventSeatRequest,
): Promise<EventSeatResponse> => {
    const res = await axiosInstance.post<ApiResponse<EventSeatResponse>>(`/admin/zones/${zoneId}/seats`, payload);
    return res.data.data;
};

export const adminBulkGenerateSeats = async (
    zoneId: number | string,
    payload: SeatBulkGenerateRequest,
): Promise<EventSeatResponse[]> => {
    const res = await axiosInstance.post<ApiResponse<EventSeatResponse[]>>(
        `/admin/zones/${zoneId}/seats/bulk-generate`,
        payload,
    );
    return res.data.data;
};

export const adminUpdateSeat = async (
    zoneId: number | string,
    seatId: number | string,
    payload: EventSeatRequest,
): Promise<EventSeatResponse> => {
    const res = await axiosInstance.put<ApiResponse<EventSeatResponse>>(
        `/admin/zones/${zoneId}/seats/${seatId}`,
        payload,
    );
    return res.data.data;
};

export const adminDeleteSeat = async (zoneId: number | string, seatId: number | string): Promise<void> => {
    await axiosInstance.delete(`/admin/zones/${zoneId}/seats/${seatId}`);
};

export const getEventApiErrorMessage = (error: unknown): string => {
    const err = error as {
        response?: { status?: number; data?: { message?: string } };
        request?: unknown;
    };
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.status === 401) return 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.';
    if (err.response?.status === 403) return 'Tài khoản hiện tại không có quyền thực hiện thao tác này.';
    if (err.response?.status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
    if (err.response?.status === 500) return 'Backend đang lỗi 500. Kiểm tra log Spring Boot.';
    if (err.request) return 'Không kết nối được backend. Kiểm tra Spring Boot đã chạy ở cổng 8080 chưa.';
    return 'Có lỗi xảy ra, vui lòng thử lại';
};
