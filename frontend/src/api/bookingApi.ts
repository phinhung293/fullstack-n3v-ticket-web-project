import apiClient from './apiClient';

interface CheckoutResponse {
    orderCode: string;
    checkoutUrl: string;
}

export const createCheckout = async (payload: any): Promise<CheckoutResponse> => {
    const response = await apiClient.post('/api/orders/checkout', payload);
    return response.data.data;
};

export const getMyOrders = async (): Promise<any[]> => {
    const response = await apiClient.get('/api/orders/my-orders');
    return response.data.data;
};
