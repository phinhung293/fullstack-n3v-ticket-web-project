import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    Camera,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Keyboard,
    LoaderCircle,
    MapPin,
    QrCode,
    RefreshCw,
    RotateCcw,
    ScanLine,
    Ticket,
    UserRound,
    XCircle,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

import axiosInstance from '../../api/axiosInstance';

type CheckInWindowStatus = 'NOT_OPEN' | 'OPEN' | 'CLOSED';

type CheckInEvent = {
    id: number;
    name: string;
    thumbnailUrl: string | null;
    venueName: string | null;
    address: string | null;
    startTime: string;
    endTime: string;
    checkInOpenAt: string;
    checkInCloseAt: string;
    eventStatus: string;
    checkInStatus: CheckInWindowStatus;
    totalTickets: number;
    checkedInTickets: number;
    remainingTickets: number;
};

type CheckInResponse = {
    success: boolean;
    message: string;
    ticketCode: string | null;
    ticketStatus: string | null;
    eventId: number | null;
    customerName: string | null;
    eventName: string | null;
    zoneName: string | null;
    seatCode: string | null;
    checkedInAt: string | null;
    checkedInByName: string | null;
};

const READER_ID = 'admin-ticket-qr-reader';

const formatDateTime = (value: string | null) => {
    if (!value) {
        return 'Chưa có';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatEventDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatCountdown = (target: string, now: number) => {
    const targetTime = new Date(target).getTime();

    if (Number.isNaN(targetTime)) {
        return '';
    }

    const difference = Math.max(0, targetTime - now);
    const totalMinutes = Math.ceil(difference / 60_000);
    const days = Math.floor(totalMinutes / 1_440);
    const hours = Math.floor((totalMinutes % 1_440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
        return `${days} ngày ${hours} giờ`;
    }

    if (hours > 0) {
        return `${hours} giờ ${minutes} phút`;
    }

    return `${minutes} phút`;
};

const getErrorMessage = (error: unknown) => {
    const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
    };

    return (
        err.response?.data?.message ||
        err.message ||
        'Không thể thực hiện check-in'
    );
};

const getStatusLabel = (status: CheckInWindowStatus) => {
    if (status === 'OPEN') {
        return 'Đang mở check-in';
    }

    if (status === 'CLOSED') {
        return 'Đã đóng check-in';
    }

    return 'Chưa mở check-in';
};

function AdminCheckIn() {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanLockedRef = useRef(false);

    const [events, setEvents] = useState<CheckInEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsError, setEventsError] = useState('');
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());

    const [manualQrContent, setManualQrContent] = useState('');
    const [cameraRunning, setCameraRunning] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);
    const [result, setResult] = useState<CheckInResponse | null>(null);
    const [requestError, setRequestError] = useState('');

    const selectedEvent = useMemo(
        () => events.find((event) => event.id === selectedEventId) ?? null,
        [events, selectedEventId],
    );

    const loadEvents = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setEventsLoading(true);
        }

        setEventsError('');

        try {
            const response = await axiosInstance.get<CheckInEvent[]>(
                '/admin/check-in/events',
            );

            setEvents(response.data);
        } catch (error) {
            setEventsError(getErrorMessage(error));
        } finally {
            if (showLoading) {
                setEventsLoading(false);
            }
        }
    }, []);

    const stopCamera = useCallback(async () => {
        const scanner = scannerRef.current;

        if (!scanner) {
            setCameraRunning(false);
            return;
        }

        try {
            await scanner.stop();
        } catch {
            // Camera có thể đã dừng trước đó.
        }

        try {
            await scanner.clear();
        } catch {
            // Reader có thể đã bị xóa khi chuyển màn hình.
        }

        scannerRef.current = null;
        setCameraRunning(false);
    }, []);

    useEffect(() => {
        void loadEvents();

        const refreshInterval = window.setInterval(() => {
            setNow(Date.now());
            void loadEvents(false);
        }, 30_000);

        const clockInterval = window.setInterval(() => {
            setNow(Date.now());
        }, 1_000);

        return () => {
            window.clearInterval(refreshInterval);
            window.clearInterval(clockInterval);
        };
    }, [loadEvents]);

    useEffect(() => {
        return () => {
            const scanner = scannerRef.current;

            if (!scanner) {
                return;
            }

            void scanner.stop().finally(() => scanner.clear());
            scannerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (selectedEvent?.checkInStatus !== 'OPEN') {
            void stopCamera();
        }
    }, [selectedEvent?.checkInStatus, stopCamera]);

    const resetCheckIn = () => {
        setResult(null);
        setRequestError('');
        setCameraError('');
        setManualQrContent('');
        scanLockedRef.current = false;
    };

    const selectEvent = async (event: CheckInEvent) => {
        await stopCamera();
        resetCheckIn();
        setSelectedEventId(event.id);
    };

    const goBackToEvents = async () => {
        await stopCamera();
        resetCheckIn();
        setSelectedEventId(null);
        void loadEvents(false);
    };

    const submitCheckIn = async (qrContent: string) => {
        const normalizedQrContent = qrContent.trim();

        if (!selectedEvent) {
            setRequestError('Phải chọn sự kiện trước khi check-in');
            return;
        }

        if (selectedEvent.checkInStatus !== 'OPEN') {
            setRequestError('Sự kiện hiện chưa mở check-in');
            return;
        }

        if (!normalizedQrContent) {
            setRequestError('Vui lòng quét hoặc nhập nội dung mã QR');
            return;
        }

        if (checkingIn || scanLockedRef.current) {
            return;
        }

        scanLockedRef.current = true;
        setCheckingIn(true);
        setRequestError('');
        setResult(null);

        try {
            const response = await axiosInstance.post<CheckInResponse>(
                '/admin/check-in',
                {
                    eventId: selectedEvent.id,
                    qrContent: normalizedQrContent,
                },
            );

            setResult(response.data);
            setManualQrContent(normalizedQrContent);
            await stopCamera();
            void loadEvents(false);
        } catch (error) {
            setRequestError(getErrorMessage(error));
            await stopCamera();
        } finally {
            setCheckingIn(false);

            window.setTimeout(() => {
                scanLockedRef.current = false;
            }, 1_200);
        }
    };

    const startCamera = async () => {
        if (!selectedEvent || selectedEvent.checkInStatus !== 'OPEN') {
            setCameraError('Sự kiện hiện chưa mở check-in');
            return;
        }

        setCameraLoading(true);
        setCameraError('');
        setRequestError('');
        setResult(null);

        await stopCamera();

        try {
            const scanner = new Html5Qrcode(READER_ID);
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    if (!scanLockedRef.current) {
                        void submitCheckIn(decodedText);
                    }
                },
                () => {
                    // Bỏ qua lỗi từng khung hình khi chưa nhìn thấy QR.
                },
            );

            setCameraRunning(true);
        } catch (error) {
            scannerRef.current = null;
            setCameraRunning(false);
            setCameraError(
                error instanceof Error
                    ? error.message
                    : 'Không thể mở camera',
            );
        } finally {
            setCameraLoading(false);
        }
    };

    if (!selectedEvent) {
        return (
            <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-[#0B1736]">
                            Chọn sự kiện check-in
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-[#64748B]">
                            Hiển thị các sự kiện đang diễn ra, diễn ra hôm nay hoặc ngày mai.
                            Máy quét chỉ mở từ 60 phút trước giờ bắt đầu đến khi sự kiện kết thúc.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadEvents()}
                        disabled={eventsLoading}
                        className="flex h-10 items-center gap-2 rounded-lg border border-[#DDE3EF] bg-white px-4 text-sm font-black text-[#0B1736] transition hover:bg-[#F8FAFC] disabled:opacity-60"
                    >
                        <RefreshCw
                            size={17}
                            className={eventsLoading ? 'animate-spin' : ''}
                        />
                        Làm mới
                    </button>
                </div>

                {eventsLoading && (
                    <div className="mt-8 flex min-h-[320px] items-center justify-center">
                        <LoaderCircle size={34} className="animate-spin text-[#F43F73]" />
                    </div>
                )}

                {!eventsLoading && eventsError && (
                    <div className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{eventsError}</span>
                    </div>
                )}

                {!eventsLoading && !eventsError && events.length === 0 && (
                    <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 text-center">
                        <CalendarDays size={46} className="text-[#94A3B8]" />
                        <p className="mt-4 text-lg font-black text-[#0B1736]">
                            Chưa có sự kiện cần check-in
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#64748B]">
                            Chỉ sự kiện PUBLISHED hoặc ONGOING của hôm nay và ngày mai mới xuất hiện.
                        </p>
                    </div>
                )}

                {!eventsLoading && !eventsError && events.length > 0 && (
                    <div className="mt-7 grid gap-5 lg:grid-cols-2">
                        {events.map((event) => {
                            const progress = event.totalTickets > 0
                                ? Math.min(100, (event.checkedInTickets / event.totalTickets) * 100)
                                : 0;
                            const isOpen = event.checkInStatus === 'OPEN';

                            return (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => void selectEvent(event)}
                                    className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white text-left transition hover:-translate-y-0.5 hover:border-[#F43F73]/40 hover:shadow-lg"
                                >
                                    <div className="flex min-h-[190px]">
                                        <div className="w-36 shrink-0 bg-[#F1F5F9] sm:w-44">
                                            {event.thumbnailUrl ? (
                                                <img
                                                    src={event.thumbnailUrl}
                                                    alt={event.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-[#94A3B8]">
                                                    <CalendarDays size={44} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1 p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-black ${
                                                        isOpen
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {getStatusLabel(event.checkInStatus)}
                                                </span>
                                                <ChevronRight size={20} className="shrink-0 text-[#94A3B8]" />
                                            </div>

                                            <h2 className="mt-3 line-clamp-2 text-lg font-black text-[#0B1736]">
                                                {event.name}
                                            </h2>

                                            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[#475569]">
                                                <Clock3 size={16} className="text-[#F43F73]" />
                                                {formatTime(event.startTime)} · {formatEventDate(event.startTime)}
                                            </p>

                                            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#64748B]">
                                                <MapPin size={16} className="shrink-0 text-[#F43F73]" />
                                                <span className="line-clamp-1">
                                                    {event.venueName || event.address || 'Chưa cập nhật địa điểm'}
                                                </span>
                                            </p>

                                            <div className="mt-4">
                                                <div className="flex justify-between text-xs font-black text-[#64748B]">
                                                    <span>Đã vào {event.checkedInTickets}</span>
                                                    <span>Tổng {event.totalTickets} vé</span>
                                                </div>
                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                                                    <div
                                                        className="h-full rounded-full bg-[#F43F73]"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>
        );
    }

    const isCheckInOpen = selectedEvent.checkInStatus === 'OPEN';
    const resultIsSuccessful = result?.success === true;

    return (
        <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <button
                type="button"
                onClick={() => void goBackToEvents()}
                className="flex items-center gap-2 text-sm font-black text-[#64748B] transition hover:text-[#0B1736]"
            >
                <ArrowLeft size={18} />
                Chọn sự kiện khác
            </button>

            <div className="mt-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-black text-[#0B1736]">
                            {selectedEvent.name}
                        </h1>
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                                isCheckInOpen
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            {getStatusLabel(selectedEvent.checkInStatus)}
                        </span>
                    </div>

                    <p className="mt-2 text-sm font-bold text-[#475569]">
                        {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)} ·{' '}
                        {formatEventDate(selectedEvent.startTime)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#64748B]">
                        {selectedEvent.venueName || selectedEvent.address || 'Chưa cập nhật địa điểm'}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xl font-black text-[#0B1736]">{selectedEvent.totalTickets}</p>
                        <p className="text-xs font-bold text-[#94A3B8]">Tổng vé</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xl font-black text-emerald-600">{selectedEvent.checkedInTickets}</p>
                        <p className="text-xs font-bold text-[#94A3B8]">Đã vào</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xl font-black text-amber-600">{selectedEvent.remainingTickets}</p>
                        <p className="text-xs font-bold text-[#94A3B8]">Còn lại</p>
                    </div>
                </div>
            </div>

            {!isCheckInOpen && (
                <div className="mt-6 flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-6 text-center">
                    <Clock3 size={52} className="text-amber-600" />
                    <h2 className="mt-5 text-2xl font-black text-[#0B1736]">
                        Chưa đến giờ check-in
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#64748B]">
                        Check-in mở lúc <strong>{formatDateTime(selectedEvent.checkInOpenAt)}</strong>,
                        tức 60 phút trước khi sự kiện bắt đầu. Backend sẽ từ chối mọi lượt quét sớm.
                    </p>
                    <p className="mt-5 rounded-xl bg-white px-5 py-3 text-lg font-black text-amber-700">
                        Còn {formatCountdown(selectedEvent.checkInOpenAt, now)}
                    </p>
                </div>
            )}

            {isCheckInOpen && (
                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-black text-[#0B1736]">
                                    <Camera size={21} className="text-[#F43F73]" />
                                    Camera quét QR
                                </h2>
                                <p className="mt-1 text-xs font-semibold text-[#64748B]">
                                    Chỉ quét vé của sự kiện đang được chọn.
                                </p>
                            </div>

                            {!cameraRunning ? (
                                <button
                                    type="button"
                                    onClick={() => void startCamera()}
                                    disabled={cameraLoading || checkingIn}
                                    className="flex h-10 items-center gap-2 rounded-lg bg-[#F43F73] px-4 text-sm font-black text-white transition hover:bg-[#E11D5E] disabled:opacity-60"
                                >
                                    {cameraLoading ? (
                                        <LoaderCircle size={17} className="animate-spin" />
                                    ) : (
                                        <Camera size={17} />
                                    )}
                                    {cameraLoading ? 'Đang mở...' : 'Mở camera'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => void stopCamera()}
                                    className="flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-600"
                                >
                                    <XCircle size={17} />
                                    Dừng camera
                                </button>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-dashed border-[#CBD5E1] bg-[#0B1736]">
                            <div id={READER_ID} className="min-h-[420px] w-full" />
                            {!cameraRunning && !cameraLoading && (
                                <div className="-mt-[420px] flex min-h-[420px] flex-col items-center justify-center px-5 text-center text-white">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                                        <ScanLine size={40} />
                                    </div>
                                    <p className="mt-5 text-lg font-black">Camera chưa được bật</p>
                                    <p className="mt-2 text-sm font-medium text-white/65">
                                        Bấm “Mở camera” và cho phép trình duyệt sử dụng camera.
                                    </p>
                                </div>
                            )}
                        </div>

                        {cameraError && (
                            <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                                <AlertCircle size={19} className="shrink-0" />
                                <span>{cameraError}</span>
                            </div>
                        )}

                        <div className="my-6 flex items-center gap-4">
                            <div className="h-px flex-1 bg-[#E2E8F0]" />
                            <span className="text-xs font-black uppercase tracking-wide text-[#94A3B8]">
                                Hoặc nhập thủ công
                            </span>
                            <div className="h-px flex-1 bg-[#E2E8F0]" />
                        </div>

                        <label
                            htmlFor="manual-qr-content"
                            className="mb-2 flex items-center gap-2 text-sm font-black text-[#0B1736]"
                        >
                            <Keyboard size={18} className="text-[#F43F73]" />
                            Nội dung mã QR
                        </label>
                        <textarea
                            id="manual-qr-content"
                            value={manualQrContent}
                            onChange={(event) => setManualQrContent(event.target.value)}
                            placeholder="Ví dụ: N3V:TICKET:..."
                            rows={4}
                            className="w-full resize-none rounded-xl border border-[#DDE3EF] px-4 py-3 text-sm font-semibold text-[#0B1736] outline-none focus:border-[#F43F73]"
                        />
                        <button
                            type="button"
                            onClick={() => void submitCheckIn(manualQrContent)}
                            disabled={checkingIn || !manualQrContent.trim()}
                            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1736] text-sm font-black text-white disabled:opacity-60"
                        >
                            {checkingIn ? (
                                <LoaderCircle size={19} className="animate-spin" />
                            ) : (
                                <QrCode size={19} />
                            )}
                            {checkingIn ? 'Đang kiểm tra vé...' : 'Thực hiện check-in'}
                        </button>
                    </div>

                    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                        <h2 className="text-lg font-black text-[#0B1736]">Kết quả check-in</h2>

                        {!result && !requestError && (
                            <div className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 text-center">
                                <Ticket size={42} className="text-[#94A3B8]" />
                                <p className="mt-5 font-black text-[#0B1736]">Chưa có kết quả</p>
                                <p className="mt-2 text-sm font-medium text-[#64748B]">
                                    Thông tin vé sẽ xuất hiện sau khi quét QR.
                                </p>
                            </div>
                        )}

                        {requestError && (
                            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                                <div className="flex gap-3">
                                    <XCircle size={28} className="shrink-0 text-red-500" />
                                    <div>
                                        <p className="font-black text-red-700">Check-in thất bại</p>
                                        <p className="mt-1 text-sm font-semibold text-red-600">{requestError}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetCheckIn}
                                    className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white text-sm font-black text-red-600"
                                >
                                    <RotateCcw size={17} />
                                    Quét lại
                                </button>
                            </div>
                        )}

                        {result && (
                            <div className={`mt-5 overflow-hidden rounded-2xl border ${
                                resultIsSuccessful
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-amber-200 bg-amber-50'
                            }`}>
                                <div className="flex items-start gap-3 p-5">
                                    {resultIsSuccessful ? (
                                        <CheckCircle2 size={31} className="shrink-0 text-emerald-600" />
                                    ) : (
                                        <AlertCircle size={31} className="shrink-0 text-amber-600" />
                                    )}
                                    <div>
                                        <p className="text-lg font-black text-[#0B1736]">{result.message}</p>
                                        <p className="mt-1 text-sm font-semibold text-[#64748B]">
                                            Trạng thái: {result.ticketStatus}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-black/5 bg-white p-5">
                                    <dl className="space-y-4 text-sm">
                                        <div>
                                            <dt className="text-xs font-bold uppercase text-[#94A3B8]">Mã vé</dt>
                                            <dd className="mt-1 break-all font-black text-[#0B1736]">
                                                {result.ticketCode || 'Chưa có'}
                                            </dd>
                                        </div>
                                        <div className="flex gap-3">
                                            <UserRound size={18} className="text-[#F43F73]" />
                                            <div>
                                                <dt className="text-xs font-bold text-[#94A3B8]">Khách hàng</dt>
                                                <dd className="mt-1 font-black text-[#0B1736]">
                                                    {result.customerName || 'Chưa có thông tin'}
                                                </dd>
                                            </div>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-bold text-[#94A3B8]">Sự kiện</dt>
                                            <dd className="mt-1 font-black text-[#0B1736]">
                                                {result.eventName || 'Chưa có thông tin'}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <dt className="text-xs font-bold text-[#94A3B8]">Khu vực</dt>
                                                <dd className="mt-1 font-black text-[#0B1736]">{result.zoneName || '—'}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold text-[#94A3B8]">Ghế</dt>
                                                <dd className="mt-1 font-black text-[#0B1736]">
                                                    {result.seatCode || 'Không chọn ghế'}
                                                </dd>
                                            </div>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-bold text-[#94A3B8]">Thời gian check-in</dt>
                                            <dd className="mt-1 font-black text-[#0B1736]">
                                                {formatDateTime(result.checkedInAt)}
                                            </dd>
                                        </div>
                                        {result.checkedInByName && (
                                            <div>
                                                <dt className="text-xs font-bold text-[#94A3B8]">Nhân viên check-in</dt>
                                                <dd className="mt-1 font-black text-[#0B1736]">
                                                    {result.checkedInByName}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>

                                    <button
                                        type="button"
                                        onClick={resetCheckIn}
                                        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1736] text-sm font-black text-white"
                                    >
                                        <RotateCcw size={18} />
                                        Quét vé tiếp theo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export default AdminCheckIn;
