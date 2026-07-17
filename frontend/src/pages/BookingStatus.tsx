import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    Home,
    RefreshCw,
    Ticket,
    XCircle,
} from 'lucide-react';

import apiClient from '../api/apiClient';

type ApiResponse<T> = {
    code: number;
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
};

type OrderStatusData = {
    orderCode: string;
    orderStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    paymentStatus: string | null;
    ticketsReady: boolean;
};

const MAX_AUTO_CHECKS = 10;
const CHECK_INTERVAL_MS = 1500;

function BookingStatus() {
    const { orderCode } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const returnedAsCancelled =
        searchParams.get('cancel') === 'true' ||
        searchParams.get('status') === 'CANCELLED';

    const [orderStatus, setOrderStatus] =
        useState<OrderStatusData | null>(null);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState('');

    const loadStatus = useCallback(async () => {
        if (!orderCode) {
            return null;
        }

        const response = await apiClient.get<ApiResponse<OrderStatusData>>(
            `/api/orders/${orderCode}/status`,
        );

        setOrderStatus(response.data.data);
        return response.data.data;
    }, [orderCode]);

    useEffect(() => {
        if (!orderCode) {
            navigate('/', { replace: true });
            return;
        }

        let cancelled = false;
        let timeoutId: number | undefined;
        let checkCount = 0;

        const checkUntilFinished = async () => {
            try {
                const currentStatus = await loadStatus();

                if (cancelled || !currentStatus) {
                    return;
                }

                const isFinal =
                    currentStatus.orderStatus === 'SUCCESS' ||
                    currentStatus.orderStatus === 'FAILED' ||
                    currentStatus.orderStatus === 'CANCELLED';

                checkCount += 1;

                if (!isFinal && !returnedAsCancelled && checkCount < MAX_AUTO_CHECKS) {
                    timeoutId = window.setTimeout(
                        () => void checkUntilFinished(),
                        CHECK_INTERVAL_MS,
                    );
                    return;
                }

                setChecking(false);
            } catch (requestError: unknown) {
                if (cancelled) {
                    return;
                }

                const err = requestError as {
                    response?: { data?: { message?: string } };
                };

                setError(
                    err.response?.data?.message ||
                    'Không thể kiểm tra trạng thái đơn hàng.',
                );
                setChecking(false);
            }
        };

        void checkUntilFinished();

        return () => {
            cancelled = true;
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [loadStatus, navigate, orderCode, returnedAsCancelled]);

    const checkAgain = async () => {
        setChecking(true);
        setError('');

        try {
            await loadStatus();
        } catch (requestError: unknown) {
            const err = requestError as {
                response?: { data?: { message?: string } };
            };

            setError(
                err.response?.data?.message ||
                'Không thể kiểm tra trạng thái đơn hàng.',
            );
        } finally {
            setChecking(false);
        }
    };

    if (!orderCode) {
        return null;
    }

    const isSuccess = orderStatus?.orderStatus === 'SUCCESS';
    const isFailed =
        returnedAsCancelled ||
        orderStatus?.orderStatus === 'FAILED' ||
        orderStatus?.orderStatus === 'CANCELLED';

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-16">
            <div className="mx-auto max-w-[600px] px-6 text-center">
                <div className="rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm sm:p-12">
                    {isSuccess ? (
                        <>
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                                <CheckCircle2 size={48} />
                            </div>

                            <h1 className="mt-6 text-3xl font-black text-[#0B1736]">
                                Đặt vé thành công!
                            </h1>

                            <p className="mt-4 text-sm font-medium leading-relaxed text-[#475569]">
                                Đơn hàng <span className="font-bold text-[#0B1736]">#{orderCode}</span>{' '}
                                đã được PayOS xác nhận. Vé điện tử của bạn đã sẵn sàng.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <Link
                                    to="/my-tickets"
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#F43F73] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#E11D48]"
                                >
                                    <Ticket size={18} />
                                    Xem vé của tôi
                                </Link>

                                <Link
                                    to="/"
                                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#E2E8F0] bg-white px-6 py-3.5 text-sm font-bold text-[#0B1736] transition hover:border-[#CBD5E1]"
                                >
                                    <Home size={18} />
                                    Về trang chủ
                                </Link>
                            </div>
                        </>
                    ) : isFailed ? (
                        <>
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
                                <XCircle size={48} />
                            </div>

                            <h1 className="mt-6 text-3xl font-black text-[#0B1736]">
                                Thanh toán chưa hoàn tất
                            </h1>

                            <p className="mt-4 text-sm font-medium leading-relaxed text-[#475569]">
                                Đơn hàng <span className="font-bold text-[#0B1736]">#{orderCode}</span>{' '}
                                đã bị hủy hoặc chưa được PayOS xác nhận thanh toán.
                            </p>

                            <Link
                                to="/events"
                                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F43F73] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#E11D48]"
                            >
                                Xem sự kiện khác
                                <ArrowRight size={18} />
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                {checking ? (
                                    <RefreshCw size={44} className="animate-spin" />
                                ) : (
                                    <Clock3 size={44} />
                                )}
                            </div>

                            <h1 className="mt-6 text-3xl font-black text-[#0B1736]">
                                Đang xác nhận thanh toán
                            </h1>

                            <p className="mt-4 text-sm font-medium leading-relaxed text-[#475569]">
                                Hệ thống đang chờ webhook PayOS cho đơn{' '}
                                <span className="font-bold text-[#0B1736]">#{orderCode}</span>.
                                Không đóng trang hoặc thanh toán lại đơn này.
                            </p>

                            {error && (
                                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                                    {error}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => void checkAgain()}
                                disabled={checking}
                                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1736] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#162A49] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={18}
                                    className={checking ? 'animate-spin' : ''}
                                />
                                Kiểm tra lại
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookingStatus;
