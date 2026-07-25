import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertCircle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    QrCode,
    Ticket,
    X,
} from 'lucide-react';

import {
    getMyTickets,
    getTicketQr,
    type TicketResponse,
} from '../api/ticketApi';

import { formatDateTime } from '../utils/format';

const getTicketStatus = (status: string) => {
    switch (status) {
        case 'ISSUED':
            return {
                label: 'Có hiệu lực',
                className: 'bg-emerald-50 text-emerald-600',
                icon: CheckCircle2,
            };

        case 'CHECKED_IN':
            return {
                label: 'Đã check-in',
                className: 'bg-blue-50 text-blue-600',
                icon: CheckCircle2,
            };

        case 'CANCELLED':
            return {
                label: 'Đã hủy',
                className: 'bg-red-50 text-red-600',
                icon: AlertCircle,
            };

        case 'EXPIRED':
            return {
                label: 'Hết hạn',
                className: 'bg-slate-100 text-slate-600',
                icon: Clock3,
            };

        default:
            return {
                label: status,
                className: 'bg-slate-100 text-slate-600',
                icon: Ticket,
            };
    }
};

function MyTickets() {
    const [tickets, setTickets] = useState<TicketResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedTicket, setSelectedTicket] =
        useState<TicketResponse | null>(null);

    const [qrImageUrl, setQrImageUrl] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState('');

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await getMyTickets();
                setTickets(data);
            } catch (error: unknown) {
                const err = error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                };

                setError(
                    err.response?.data?.message ||
                    'Có lỗi xảy ra khi tải danh sách vé',
                );
            } finally {
                setLoading(false);
            }
        };

        void fetchTickets();
    }, []);

    useEffect(() => {
        return () => {
            if (qrImageUrl) {
                URL.revokeObjectURL(qrImageUrl);
            }
        };
    }, [qrImageUrl]);

    const openTicketQr = async (ticket: TicketResponse) => {
        setSelectedTicket(ticket);
        setQrLoading(true);
        setQrError('');

        if (qrImageUrl) {
            URL.revokeObjectURL(qrImageUrl);
            setQrImageUrl('');
        }

        try {
            const qrBlob = await getTicketQr(ticket.id);
            const objectUrl = URL.createObjectURL(qrBlob);

            setQrImageUrl(objectUrl);
        } catch (error: unknown) {
            const err = error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };

            setQrError(
                err.response?.data?.message ||
                'Không thể tải mã QR của vé',
            );
        } finally {
            setQrLoading(false);
        }
    };

    const closeTicketModal = () => {
        if (qrImageUrl) {
            URL.revokeObjectURL(qrImageUrl);
        }

        setQrImageUrl('');
        setQrError('');
        setSelectedTicket(null);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#F43F73] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12">
            <div className="mx-auto max-w-[1100px] px-5 sm:px-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-[#0B1736]">
                        Vé của tôi
                    </h1>

                    <p className="mt-2 text-sm font-medium text-[#64748B]">
                        Xem thông tin vé điện tử và mã QR check-in của bạn.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        <AlertCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />

                        <span>{error}</span>
                    </div>
                )}

                {!error && tickets.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E2E8F0] bg-white py-20 text-center shadow-sm">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                            <Ticket size={38} />
                        </div>

                        <h2 className="mt-5 text-xl font-black text-[#0B1736]">
                            Bạn chưa có vé điện tử
                        </h2>

                        <p className="mt-2 max-w-[430px] text-sm font-medium text-[#64748B]">
                            Vé điện tử sẽ xuất hiện tại đây sau khi đơn hàng
                            được thanh toán thành công.
                        </p>

                        <Link
                            to="/events"
                            className="mt-7 flex items-center gap-2 rounded-xl bg-[#F43F73] px-6 py-3 text-sm font-black text-white transition hover:bg-[#E11D48]"
                        >
                            Xem sự kiện
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {tickets.map((ticket) => {
                        const statusInfo = getTicketStatus(ticket.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <article
                                key={ticket.id}
                                className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                            >
                                <div className="relative h-[190px] bg-[#E2E8F0]">
                                    {ticket.eventThumbnail ? (
                                        <img
                                            src={ticket.eventThumbnail}
                                            alt={
                                                ticket.eventName ||
                                                'Ảnh sự kiện'
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[#94A3B8]">
                                            <Ticket size={54} />
                                        </div>
                                    )}

                                    <div
                                        className={`absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black shadow-sm ${statusInfo.className}`}
                                    >
                                        <StatusIcon size={15} />
                                        {statusInfo.label}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h2 className="line-clamp-2 text-xl font-black text-[#0B1736]">
                                        {ticket.eventName ||
                                            'Sự kiện chưa xác định'}
                                    </h2>

                                    <div className="mt-5 space-y-3">
                                        <div className="flex items-start gap-3 text-sm">
                                            <CalendarDays
                                                size={18}
                                                className="mt-0.5 shrink-0 text-[#F43F73]"
                                            />

                                            <span className="font-semibold text-[#475569]">
                                                {ticket.eventStartTime
                                                    ? formatDateTime(
                                                        ticket.eventStartTime,
                                                    )
                                                    : 'Chưa cập nhật thời gian'}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3 text-sm">
                                            <MapPin
                                                size={18}
                                                className="mt-0.5 shrink-0 text-[#F43F73]"
                                            />

                                            <div className="font-semibold text-[#475569]">
                                                <p>
                                                    {ticket.venueName ||
                                                        'Chưa cập nhật địa điểm'}
                                                </p>

                                                {ticket.address && (
                                                    <p className="mt-1 text-xs font-medium text-[#94A3B8]">
                                                        {ticket.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 text-sm">
                                            <Ticket
                                                size={18}
                                                className="mt-0.5 shrink-0 text-[#F43F73]"
                                            />

                                            <div className="font-semibold text-[#475569]">
                                                <p>
                                                    Khu vực:{' '}
                                                    <span className="font-black text-[#0B1736]">
                                                        {ticket.zoneName ||
                                                            'Không xác định'}
                                                    </span>
                                                </p>

                                                <p className="mt-1">
                                                    Ghế:{' '}
                                                    <span className="font-black text-[#0B1736]">
                                                        {ticket.seatCode ||
                                                            'Vé không chọn ghế'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-xl bg-[#F8FAFC] px-4 py-3">
                                        <p className="text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
                                            Mã vé
                                        </p>

                                        <p className="mt-1 break-all text-sm font-black text-[#0B1736]">
                                            {ticket.ticketCode}
                                        </p>
                                    </div>

                                    {ticket.status === 'CHECKED_IN' &&
                                        ticket.checkedInAt && (
                                            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                                                Đã check-in lúc{' '}
                                                {formatDateTime(
                                                    ticket.checkedInAt,
                                                )}
                                            </div>
                                        )}

                                    {ticket.status === 'EXPIRED' && (
                                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Vé đã quá hạn và không còn sử dụng
                                            được.
                                        </div>
                                    )}

                                    {ticket.status === 'CANCELLED' && (
                                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                            Vé đã bị hủy và không còn sử dụng
                                            được.
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void openTicketQr(ticket)
                                        }
                                        disabled={!ticket.qrAvailable}
                                        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1736] text-sm font-black text-white transition hover:bg-[#162A49] disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        <QrCode size={20} />
                                        {ticket.qrAvailable
                                            ? 'Xem mã QR'
                                            : 'Mã QR không còn hiệu lực'}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            {selectedTicket && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4 py-8 backdrop-blur-sm"
                    onClick={closeTicketModal}
                >
                    <div
                        className="relative max-h-full w-full max-w-[540px] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closeTicketModal}
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#475569] transition hover:bg-[#E2E8F0]"
                            aria-label="Đóng"
                        >
                            <X size={21} />
                        </button>

                        <div className="pr-10">
                            <h2 className="text-2xl font-black text-[#0B1736]">
                                Mã QR vé điện tử
                            </h2>

                            <p className="mt-2 text-sm font-medium text-[#64748B]">
                                Đưa mã này cho nhân viên check-in tại sự kiện.
                            </p>
                        </div>

                        <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                            <div className="flex min-h-[360px] items-center justify-center rounded-xl bg-white p-4">
                                {qrLoading && (
                                    <div className="text-center">
                                        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#F43F73] border-t-transparent" />

                                        <p className="mt-4 text-sm font-semibold text-[#64748B]">
                                            Đang tải mã QR...
                                        </p>
                                    </div>
                                )}

                                {!qrLoading && qrError && (
                                    <div className="flex max-w-[320px] flex-col items-center text-center">
                                        <AlertCircle
                                            size={42}
                                            className="text-red-500"
                                        />

                                        <p className="mt-4 text-sm font-semibold text-red-600">
                                            {qrError}
                                        </p>
                                    </div>
                                )}

                                {!qrLoading &&
                                    !qrError &&
                                    qrImageUrl && (
                                        <img
                                            src={qrImageUrl}
                                            alt={`Mã QR vé ${selectedTicket.ticketCode}`}
                                            className="h-auto w-full max-w-[360px] object-contain"
                                        />
                                    )}
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl bg-[#0B1736] p-5 text-white">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                                Mã vé
                            </p>

                            <p className="mt-1 break-all text-lg font-black">
                                {selectedTicket.ticketCode}
                            </p>

                            <p className="mt-4 text-sm font-bold">
                                {selectedTicket.eventName}
                            </p>

                            <p className="mt-1 text-sm font-medium text-white/70">
                                {selectedTicket.zoneName ||
                                    'Không xác định khu vực'}
                                {selectedTicket.seatCode
                                    ? ` • Ghế ${selectedTicket.seatCode}`
                                    : ''}
                            </p>
                        </div>

                        <p className="mt-5 text-center text-xs font-semibold leading-5 text-[#64748B]">
                            Không chia sẻ mã QR công khai. Mỗi vé chỉ được
                            check-in hợp lệ một lần.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyTickets;
