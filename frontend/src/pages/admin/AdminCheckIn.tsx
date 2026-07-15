import { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    Camera,
    CheckCircle2,
    Keyboard,
    LoaderCircle,
    QrCode,
    RotateCcw,
    ScanLine,
    Ticket,
    UserRound,
    XCircle,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

import axiosInstance from '../../api/axiosInstance';

type CheckInResponse = {
    success: boolean;
    message: string;

    ticketCode: string | null;
    ticketStatus: string | null;

    customerName: string | null;
    eventName: string | null;
    zoneName: string | null;
    seatCode: string | null;

    checkedInAt: string | null;
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

    const time = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const day = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return `${time} - ${day}`;
};

const getErrorMessage = (error: unknown) => {
    const err = error as {
        response?: {
            data?: {
                message?: string;
            };
        };
        message?: string;
    };

    return (
        err.response?.data?.message ||
        err.message ||
        'Không thể thực hiện check-in'
    );
};

function AdminCheckIn() {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanLockedRef = useRef(false);

    const [manualQrContent, setManualQrContent] = useState('');

    const [cameraRunning, setCameraRunning] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState('');

    const [checkingIn, setCheckingIn] = useState(false);
    const [result, setResult] = useState<CheckInResponse | null>(null);
    const [requestError, setRequestError] = useState('');

    const stopCamera = async () => {
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
            // Reader có thể đã được xóa.
        }

        scannerRef.current = null;
        setCameraRunning(false);
    };

    useEffect(() => {
        return () => {
            const scanner = scannerRef.current;

            if (!scanner) {
                return;
            }

            void scanner.stop().finally(() => {
                scanner.clear();
            });

            scannerRef.current = null;
        };
    }, []);

    const submitCheckIn = async (qrContent: string) => {
        const normalizedQrContent = qrContent.trim();

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
            const response =
                await axiosInstance.post<CheckInResponse>(
                    '/admin/check-in',
                    {
                        qrContent: normalizedQrContent,
                    },
                );

            setResult(response.data);
            setManualQrContent(normalizedQrContent);

            await stopCamera();
        } catch (error) {
            setRequestError(getErrorMessage(error));
        } finally {
            setCheckingIn(false);

            window.setTimeout(() => {
                scanLockedRef.current = false;
            }, 1200);
        }
    };

    const startCamera = async () => {
        setCameraLoading(true);
        setCameraError('');
        setRequestError('');
        setResult(null);

        await stopCamera();

        try {
            const scanner = new Html5Qrcode(READER_ID);
            scannerRef.current = scanner;

            await scanner.start(
                {
                    facingMode: 'environment',
                },
                {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250,
                    },
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

    const handleManualSubmit = () => {
        void submitCheckIn(manualQrContent);
    };

    const resetCheckIn = () => {
        setResult(null);
        setRequestError('');
        setCameraError('');
        setManualQrContent('');
        scanLockedRef.current = false;
    };

    const resultIsSuccessful = result?.success === true;

    return (
        <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-[#0B1736]">
                    Check-in vé điện tử
                </h1>

                <p className="mt-2 text-sm font-medium text-[#64748B]">
                    Quét mã QR trên vé của khách hoặc nhập nội dung QR thủ công.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-black text-[#0B1736]">
                                <Camera size={21} className="text-[#F43F73]" />
                                Camera quét QR
                            </h2>

                            <p className="mt-1 text-xs font-semibold text-[#64748B]">
                                Đưa mã QR vào giữa khung hình.
                            </p>
                        </div>

                        {!cameraRunning ? (
                            <button
                                type="button"
                                onClick={() => void startCamera()}
                                disabled={cameraLoading || checkingIn}
                                className="flex h-10 items-center gap-2 rounded-lg bg-[#F43F73] px-4 text-sm font-black text-white transition hover:bg-[#E11D5E] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {cameraLoading ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Camera size={17} />
                                )}

                                {cameraLoading
                                    ? 'Đang mở...'
                                    : 'Mở camera'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => void stopCamera()}
                                className="flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-600 transition hover:bg-red-100"
                            >
                                <XCircle size={17} />
                                Dừng camera
                            </button>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-dashed border-[#CBD5E1] bg-[#0B1736]">
                        <div
                            id={READER_ID}
                            className="min-h-[420px] w-full"
                        />

                        {!cameraRunning && !cameraLoading && (
                            <div className="-mt-[420px] flex min-h-[420px] flex-col items-center justify-center px-5 text-center text-white">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                                    <ScanLine size={40} />
                                </div>

                                <p className="mt-5 text-lg font-black">
                                    Camera chưa được bật
                                </p>

                                <p className="mt-2 max-w-[400px] text-sm font-medium text-white/65">
                                    Bấm “Mở camera” và cho phép trình duyệt sử
                                    dụng camera.
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

                    <div>
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
                            onChange={(event) =>
                                setManualQrContent(event.target.value)
                            }
                            placeholder="Ví dụ: N3V:TICKET:..."
                            rows={4}
                            className="w-full resize-none rounded-xl border border-[#DDE3EF] px-4 py-3 text-sm font-semibold text-[#0B1736] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                        />

                        <button
                            type="button"
                            onClick={handleManualSubmit}
                            disabled={
                                checkingIn || !manualQrContent.trim()
                            }
                            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1736] text-sm font-black text-white transition hover:bg-[#162A49] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {checkingIn ? (
                                <LoaderCircle
                                    size={19}
                                    className="animate-spin"
                                />
                            ) : (
                                <QrCode size={19} />
                            )}

                            {checkingIn
                                ? 'Đang kiểm tra vé...'
                                : 'Thực hiện check-in'}
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                    <h2 className="text-lg font-black text-[#0B1736]">
                        Kết quả check-in
                    </h2>

                    {!result && !requestError && (
                        <div className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                                <Ticket size={38} />
                            </div>

                            <p className="mt-5 text-base font-black text-[#0B1736]">
                                Chưa có kết quả
                            </p>

                            <p className="mt-2 text-sm font-medium text-[#64748B]">
                                Thông tin vé sẽ xuất hiện sau khi quét QR.
                            </p>
                        </div>
                    )}

                    {requestError && (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                            <div className="flex items-start gap-3">
                                <XCircle
                                    size={28}
                                    className="shrink-0 text-red-500"
                                />

                                <div>
                                    <p className="text-base font-black text-red-700">
                                        Check-in thất bại
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-red-600">
                                        {requestError}
                                    </p>
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
                        <div
                            className={`mt-5 overflow-hidden rounded-2xl border ${
                                resultIsSuccessful
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-amber-200 bg-amber-50'
                            }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start gap-3">
                                    {resultIsSuccessful ? (
                                        <CheckCircle2
                                            size={31}
                                            className="shrink-0 text-emerald-600"
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={31}
                                            className="shrink-0 text-amber-600"
                                        />
                                    )}

                                    <div>
                                        <p
                                            className={`text-lg font-black ${
                                                resultIsSuccessful
                                                    ? 'text-emerald-700'
                                                    : 'text-amber-700'
                                            }`}
                                        >
                                            {result.message}
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-[#64748B]">
                                            Trạng thái: {result.ticketStatus}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-black/5 bg-white p-5">
                                <dl className="space-y-4 text-sm">
                                    <div>
                                        <dt className="text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
                                            Mã vé
                                        </dt>

                                        <dd className="mt-1 break-all font-black text-[#0B1736]">
                                            {result.ticketCode || 'Chưa có'}
                                        </dd>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <UserRound
                                            size={18}
                                            className="mt-0.5 shrink-0 text-[#F43F73]"
                                        />

                                        <div>
                                            <dt className="text-xs font-bold text-[#94A3B8]">
                                                Khách hàng
                                            </dt>

                                            <dd className="mt-1 font-black text-[#0B1736]">
                                                {result.customerName ||
                                                    'Chưa có thông tin'}
                                            </dd>
                                        </div>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-bold text-[#94A3B8]">
                                            Sự kiện
                                        </dt>

                                        <dd className="mt-1 font-black text-[#0B1736]">
                                            {result.eventName ||
                                                'Chưa có thông tin'}
                                        </dd>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <dt className="text-xs font-bold text-[#94A3B8]">
                                                Khu vực
                                            </dt>

                                            <dd className="mt-1 font-black text-[#0B1736]">
                                                {result.zoneName || '—'}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-xs font-bold text-[#94A3B8]">
                                                Ghế
                                            </dt>

                                            <dd className="mt-1 font-black text-[#0B1736]">
                                                {result.seatCode ||
                                                    'Không chọn ghế'}
                                            </dd>
                                        </div>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-bold text-[#94A3B8]">
                                            Thời gian check-in
                                        </dt>

                                        <dd className="mt-1 font-black text-[#0B1736]">
                                            {formatDateTime(
                                                result.checkedInAt,
                                            )}
                                        </dd>
                                    </div>
                                </dl>

                                <button
                                    type="button"
                                    onClick={resetCheckIn}
                                    className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1736] text-sm font-black text-white transition hover:bg-[#162A49]"
                                >
                                    <RotateCcw size={18} />
                                    Quét vé tiếp theo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default AdminCheckIn;