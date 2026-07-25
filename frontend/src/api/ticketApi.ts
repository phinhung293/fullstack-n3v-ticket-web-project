import apiClient from './apiClient';

export type TicketResponse = {
    id: number;
    ticketCode: string;
    status: string;

    eventName: string | null;
    eventThumbnail: string | null;
    venueName: string | null;
    address: string | null;
    eventStartTime: string | null;
    eventEndTime: string | null;
    qrAvailable: boolean;

    zoneName: string | null;
    seatCode: string | null;

    checkedInAt: string | null;
    createdAt: string;
};

export const getMyTickets = async (): Promise<TicketResponse[]> => {
    const response = await apiClient.get<TicketResponse[]>(
        '/api/tickets/my-tickets',
    );

    return response.data;
};

export const getTicketQr = async (
    ticketId: number,
): Promise<Blob> => {
    const response = await apiClient.get(
        `/api/tickets/${ticketId}/qr`,
        {
            responseType: 'blob',
        },
    );

    return response.data;
};
