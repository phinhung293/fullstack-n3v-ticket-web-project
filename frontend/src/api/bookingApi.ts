import apiClient from './apiClient';

interface CheckoutResponse {
    orderCode: string;
    checkoutUrl: string;
}

export const createCheckout = async (seatIds: number[]): Promise<CheckoutResponse> => {
    const response = await apiClient.post('/orders/checkout', seatIds);
    return response.data.data;
};
