import { useState } from 'react';
import {
    AlertCircle,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    ClipboardList,
    FileText,
    FileSpreadsheet,
    LoaderCircle,
    Search,
    Ticket,
} from 'lucide-react';

import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import axiosInstance from '../../api/axiosInstance';

type ApiResponse<T> = {
    code: number;
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
};

type DailyRevenueItem = {
    date: string;
    revenue: number;
};

type DailyTicketItem = {
    date: string;
    ticketCount: number;
};

type RevenueReport = {
    fromDate: string;
    toDate: string;

    totalRevenue: number;
    successfulOrders: number;

    totalTickets: number;
    checkedInTickets: number;
    checkInRate: number;

    dailyRevenue: DailyRevenueItem[];
    dailyTickets: DailyTicketItem[];
};

const getToday = () => {
    return new Date().toISOString().slice(0, 10);
};

const getFirstDayOfCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatChartCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toLocaleString('vi-VN', {
            maximumFractionDigits: 1,
        })} tỷ`;
    }

    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toLocaleString('vi-VN', {
            maximumFractionDigits: 1,
        })} tr`;
    }

    if (value >= 1_000) {
        return `${(value / 1_000).toLocaleString('vi-VN', {
            maximumFractionDigits: 0,
        })}k`;
    }

    return value.toLocaleString('vi-VN');
};

const formatChartDate = (value: string) => {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}`;
};

const formatFullDate = (value: string) => {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}/${year}`;
};

const getErrorMessage = (error: unknown) => {
    const err = error as {
        response?: {
            status?: number;
            data?: {
                message?: string;
            };
        };
        request?: unknown;
    };

    if (err.response?.data?.message) {
        return err.response.data.message;
    }

    if (err.response?.status === 401) {
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }

    if (err.response?.status === 403) {
        return 'Tài khoản hiện tại không có quyền xem báo cáo.';
    }

    if (err.request) {
        return 'Không kết nối được backend. Hãy kiểm tra Spring Boot.';
    }

    return 'Không thể tải báo cáo. Vui lòng thử lại.';
};

function AdminReports() {
    const [fromDate, setFromDate] = useState(
        getFirstDayOfCurrentMonth(),
    );
    const [toDate, setToDate] = useState(getToday());

    const [report, setReport] = useState<RevenueReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);

    const validateDateRange = () => {
        if (!fromDate || !toDate) {
            setError(
                'Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.',
            );
            return false;
        }

        if (fromDate > toDate) {
            setError(
                'Ngày bắt đầu không được lớn hơn ngày kết thúc.',
            );
            return false;
        }

        const from = new Date(`${fromDate}T00:00:00`);
        const to = new Date(`${toDate}T00:00:00`);

        const differenceInDays =
            Math.floor(
                (to.getTime() - from.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1;

        if (differenceInDays > 366) {
            setError(
                'Khoảng thời gian báo cáo không được vượt quá 366 ngày.',
            );
            return false;
        }

        return true;
    };

    const fetchReport = async () => {
        setError('');

        if (!validateDateRange()) {
            return;
        }

        setLoading(true);

        try {
            const response =
                await axiosInstance.get<ApiResponse<RevenueReport>>(
                    '/admin/reports/revenue',
                    {
                        params: {
                            from: fromDate,
                            to: toDate,
                        },
                    },
                );

            setReport(response.data.data);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setLoading(false);
        }
    };

    const exportExcel = async () => {
        setError('');

        if (!validateDateRange()) {
            return;
        }

        setExportingExcel(true);

        try {
            const response = await axiosInstance.get<Blob>(
                '/admin/reports/revenue/export/excel',
                {
                    params: {
                        from: fromDate,
                        to: toDate,
                    },
                    responseType: 'blob',
                },
            );

            const fileBlob = new Blob(
                [response.data],
                {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            );

            const fileUrl = URL.createObjectURL(fileBlob);

            const downloadLink = document.createElement('a');

            downloadLink.href = fileUrl;
            downloadLink.download =
                `bao-cao-doanh-thu_${fromDate}_${toDate}.xlsx`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            URL.revokeObjectURL(fileUrl);
        } catch (requestError) {
            const err = requestError as {
                response?: {
                    data?: Blob;
                    status?: number;
                };
                request?: unknown;
            };

            if (
                err.response?.data instanceof Blob &&
                err.response.data.type.includes('application/json')
            ) {
                try {
                    const errorText =
                        await err.response.data.text();

                    const errorData = JSON.parse(errorText) as {
                        message?: string;
                    };

                    setError(
                        errorData.message ||
                        'Không thể xuất báo cáo Excel.',
                    );
                } catch {
                    setError('Không thể xuất báo cáo Excel.');
                }
            } else {
                setError(getErrorMessage(requestError));
            }
        } finally {
            setExportingExcel(false);
        }
    };

    const exportPdf = async () => {
        setError('');

        if (!validateDateRange()) {
            return;
        }

        setExportingPdf(true);

        try {
            const response = await axiosInstance.get<Blob>(
                '/admin/reports/revenue/export/pdf',
                {
                    params: {
                        from: fromDate,
                        to: toDate,
                    },
                    responseType: 'blob',
                },
            );

            const fileBlob = new Blob(
                [response.data],
                {
                    type: 'application/pdf',
                },
            );

            const fileUrl = URL.createObjectURL(fileBlob);
            const downloadLink = document.createElement('a');

            downloadLink.href = fileUrl;
            downloadLink.download =
                `bao-cao-doanh-thu_${fromDate}_${toDate}.pdf`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            URL.revokeObjectURL(fileUrl);
        } catch (requestError) {
            const err = requestError as {
                response?: {
                    data?: Blob;
                    status?: number;
                };
                request?: unknown;
            };

            if (
                err.response?.data instanceof Blob &&
                err.response.data.type.includes('application/json')
            ) {
                try {
                    const errorText =
                        await err.response.data.text();

                    const errorData = JSON.parse(errorText) as {
                        message?: string;
                    };

                    setError(
                        errorData.message ||
                        'Không thể xuất báo cáo PDF.',
                    );
                } catch {
                    setError('Không thể xuất báo cáo PDF.');
                }
            } else {
                setError(getErrorMessage(requestError));
            }
        } finally {
            setExportingPdf(false);
        }
    };

    const reportCards = [
        {
            title: 'Tổng doanh thu',
            value: report
                ? formatCurrency(report.totalRevenue)
                : '0 ₫',
            icon: CircleDollarSign,
            iconClass: 'bg-violet-100 text-violet-600',
        },
        {
            title: 'Đơn thành công',
            value: report
                ? report.successfulOrders.toLocaleString('vi-VN')
                : '0',
            icon: ClipboardList,
            iconClass: 'bg-blue-100 text-blue-600',
        },
        {
            title: 'Vé đã phát hành',
            value: report
                ? report.totalTickets.toLocaleString('vi-VN')
                : '0',
            icon: Ticket,
            iconClass: 'bg-pink-100 text-[#F43F73]',
        },
        {
            title: 'Tỷ lệ check-in',
            value: report
                ? `${report.checkedInTickets.toLocaleString(
                    'vi-VN',
                )}/${report.totalTickets.toLocaleString(
                    'vi-VN',
                )} (${report.checkInRate.toLocaleString(
                    'vi-VN',
                )}%)`
                : '0/0 (0%)',
            icon: CheckCircle2,
            iconClass: 'bg-emerald-100 text-emerald-600',
        },
    ];

    return (
        <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#0B1736]">
                        Báo cáo doanh thu
                    </h1>

                    <p className="mt-2 text-sm font-medium text-[#64748B]">
                        Xem doanh thu, số đơn, số vé và tỷ lệ check-in theo
                        khoảng thời gian.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => void exportExcel()}
                        disabled={
                            exportingExcel ||
                            exportingPdf ||
                            loading
                        }
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {exportingExcel ? (
                            <LoaderCircle
                                size={19}
                                className="animate-spin"
                            />
                        ) : (
                            <FileSpreadsheet size={19} />
                        )}

                        {exportingExcel
                            ? 'Đang xuất Excel...'
                            : 'Xuất Excel'}
                    </button>

                    <button
                        type="button"
                        onClick={() => void exportPdf()}
                        disabled={
                            exportingPdf ||
                            exportingExcel ||
                            loading
                        }
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {exportingPdf ? (
                            <LoaderCircle
                                size={19}
                                className="animate-spin"
                            />
                        ) : (
                            <FileText size={19} />
                        )}

                        {exportingPdf
                            ? 'Đang xuất PDF...'
                            : 'Xuất PDF'}
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] lg:items-end">
                    <div>
                        <label
                            htmlFor="report-from-date"
                            className="mb-2 flex items-center gap-2 text-sm font-black text-[#0B1736]"
                        >
                            <CalendarDays
                                size={18}
                                className="text-[#F43F73]"
                            />
                            Từ ngày
                        </label>

                        <input
                            id="report-from-date"
                            type="date"
                            value={fromDate}
                            max={toDate || undefined}
                            onChange={(event) =>
                                setFromDate(event.target.value)
                            }
                            className="h-11 w-full rounded-xl border border-[#DDE3EF] bg-white px-4 text-sm font-semibold text-[#0B1736] outline-none transition focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="report-to-date"
                            className="mb-2 flex items-center gap-2 text-sm font-black text-[#0B1736]"
                        >
                            <CalendarDays
                                size={18}
                                className="text-[#F43F73]"
                            />
                            Đến ngày
                        </label>

                        <input
                            id="report-to-date"
                            type="date"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={(event) =>
                                setToDate(event.target.value)
                            }
                            className="h-11 w-full rounded-xl border border-[#DDE3EF] bg-white px-4 text-sm font-semibold text-[#0B1736] outline-none transition focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => void fetchReport()}
                        disabled={loading}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F43F73] px-6 text-sm font-black text-white shadow-[0_10px_22px_rgba(244,63,115,0.24)] transition hover:bg-[#E11D5E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <LoaderCircle
                                size={19}
                                className="animate-spin"
                            />
                        ) : (
                            <Search size={18} />
                        )}

                        {loading
                            ? 'Đang tải báo cáo...'
                            : 'Xem báo cáo'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        <AlertCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {!report && !loading && (
                <div className="mt-6 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#94A3B8] shadow-sm">
                        <BarChart3 size={38} />
                    </div>

                    <h2 className="mt-5 text-lg font-black text-[#0B1736]">
                        Chưa có dữ liệu báo cáo
                    </h2>

                    <p className="mt-2 max-w-[460px] text-sm font-medium text-[#64748B]">
                        Chọn khoảng thời gian và bấm “Xem báo cáo” để tải
                        số liệu.
                    </p>
                </div>
            )}

            {loading && !report && (
                <div className="mt-6 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <LoaderCircle
                        size={42}
                        className="animate-spin text-[#F43F73]"
                    />

                    <p className="mt-4 text-sm font-bold text-[#64748B]">
                        Đang tổng hợp dữ liệu báo cáo...
                    </p>
                </div>
            )}

            {report && (
                <div className="relative mt-6">
                    {loading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/65 backdrop-blur-[1px]">
                            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#475569] shadow-lg">
                                <LoaderCircle
                                    size={20}
                                    className="animate-spin text-[#F43F73]"
                                />
                                Đang cập nhật báo cáo...
                            </div>
                        </div>
                    )}

                    <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                        Khoảng báo cáo:{' '}
                        <span className="font-black">
                            {formatFullDate(report.fromDate)}
                        </span>{' '}
                        đến{' '}
                        <span className="font-black">
                            {formatFullDate(report.toDate)}
                        </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {reportCards.map(
                            ({
                                 title,
                                 value,
                                 icon: Icon,
                                 iconClass,
                             }) => (
                                <div
                                    key={title}
                                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClass}`}
                                        >
                                            <Icon
                                                size={24}
                                                strokeWidth={2.2}
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[#64748B]">
                                                {title}
                                            </p>

                                            <p className="mt-2 truncate text-xl font-black text-[#0B1736]">
                                                {value}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>

                    <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
                        <div className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                            <div>
                                <h2 className="text-lg font-black text-[#0B1736]">
                                    Doanh thu theo ngày
                                </h2>

                                <p className="mt-1 text-xs font-semibold text-[#64748B]">
                                    Tổng doanh thu từ các đơn thanh toán
                                    thành công.
                                </p>
                            </div>

                            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#64748B]">
                                <span className="h-2.5 w-6 rounded-full bg-[#F43F73]" />
                                Doanh thu
                            </div>

                            <div className="mt-4 h-[320px] min-w-0">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <LineChart
                                        data={report.dailyRevenue}
                                        margin={{
                                            top: 12,
                                            right: 14,
                                            bottom: 6,
                                            left: 8,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#E2E8F0"
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatChartDate}
                                            tickLine={false}
                                            axisLine={{
                                                stroke: '#CBD5E1',
                                            }}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748B',
                                            }}
                                            minTickGap={24}
                                        />

                                        <YAxis
                                            width={62}
                                            tickFormatter={
                                                formatChartCurrency
                                            }
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748B',
                                            }}
                                        />

                                        <Tooltip
                                            formatter={(value) => [
                                                formatCurrency(
                                                    Number(value),
                                                ),
                                                'Doanh thu',
                                            ]}
                                            labelFormatter={(label) =>
                                                `Ngày: ${formatFullDate(
                                                    String(label),
                                                )}`
                                            }
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow:
                                                    '0 8px 24px rgba(15, 23, 42, 0.08)',
                                            }}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#F43F73"
                                            strokeWidth={3}
                                            dot={{
                                                r: 3,
                                                fill: '#FFFFFF',
                                                stroke: '#F43F73',
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                            <div>
                                <h2 className="text-lg font-black text-[#0B1736]">
                                    Vé phát hành theo ngày
                                </h2>

                                <p className="mt-1 text-xs font-semibold text-[#64748B]">
                                    Số vé điện tử được phát hành trong từng
                                    ngày.
                                </p>
                            </div>

                            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#64748B]">
                                <span className="h-2.5 w-6 rounded-full bg-[#5B35F5]" />
                                Số vé
                            </div>

                            <div className="mt-4 h-[320px] min-w-0">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={report.dailyTickets}
                                        margin={{
                                            top: 12,
                                            right: 14,
                                            bottom: 6,
                                            left: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#E2E8F0"
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatChartDate}
                                            tickLine={false}
                                            axisLine={{
                                                stroke: '#CBD5E1',
                                            }}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748B',
                                            }}
                                            minTickGap={24}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            width={38}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748B',
                                            }}
                                        />

                                        <Tooltip
                                            formatter={(value) => [
                                                `${Number(
                                                    value,
                                                ).toLocaleString(
                                                    'vi-VN',
                                                )} vé`,
                                                'Số vé',
                                            ]}
                                            labelFormatter={(label) =>
                                                `Ngày: ${formatFullDate(
                                                    String(label),
                                                )}`
                                            }
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow:
                                                    '0 8px 24px rgba(15, 23, 42, 0.08)',
                                            }}
                                        />

                                        <Bar
                                            dataKey="ticketCount"
                                            fill="#5B35F5"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={36}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
                            <div>
                                <h2 className="text-lg font-black text-[#0B1736]">
                                    Chi tiết theo ngày
                                </h2>

                                <p className="mt-1 text-xs font-semibold text-[#64748B]">
                                    Dữ liệu chi tiết đang được sử dụng để tạo báo cáo
                                    Excel và PDF.
                                </p>
                            </div>

                            <span className="rounded-full bg-[#F1F5F9] px-3 py-1.5 text-xs font-black text-[#475569]">
                                {report.dailyRevenue.length.toLocaleString('vi-VN')} ngày
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] border-collapse">
                                <thead className="bg-[#0B1736] text-white">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide">
                                        Ngày
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide">
                                        Doanh thu
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-wide">
                                        Số vé phát hành
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-wide">
                                        Tỷ trọng doanh thu
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide">
                                        Ghi chú
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {report.dailyRevenue.map((revenueItem, index) => {
                                    const ticketItem = report.dailyTickets.find(
                                        (item) => item.date === revenueItem.date,
                                    );

                                    const ticketCount =
                                        ticketItem?.ticketCount ?? 0;

                                    const revenueRatio =
                                        report.totalRevenue > 0
                                            ? (revenueItem.revenue /
                                                report.totalRevenue) *
                                            100
                                            : 0;

                                    let note = 'Không phát sinh';

                                    if (
                                        revenueItem.revenue > 0 &&
                                        ticketCount > 0
                                    ) {
                                        note = 'Có giao dịch';
                                    } else if (ticketCount > 0) {
                                        note =
                                            'Có vé, chưa ghi nhận doanh thu';
                                    } else if (revenueItem.revenue > 0) {
                                        note =
                                            'Có doanh thu, chưa ghi nhận vé';
                                    }

                                    return (
                                        <tr
                                            key={revenueItem.date}
                                            className={`border-b border-[#E2E8F0] last:border-b-0 ${
                                                index % 2 === 0
                                                    ? 'bg-white'
                                                    : 'bg-[#F8FAFC]'
                                            }`}
                                        >
                                            <td className="whitespace-nowrap px-5 py-3.5 text-sm font-black text-[#0B1736]">
                                                {formatFullDate(revenueItem.date)}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-black text-[#0B1736]">
                                                {formatCurrency(
                                                    revenueItem.revenue,
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-center text-sm font-bold text-[#475569]">
                                                {ticketCount.toLocaleString(
                                                    'vi-VN',
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-center">
                                <span className="inline-flex min-w-[72px] justify-center rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                                    {revenueRatio.toLocaleString(
                                        'vi-VN',
                                        {
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                    %
                                </span>
                                            </td>

                                            <td className="px-5 py-3.5 text-sm font-semibold text-[#64748B]">
                                                {note}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default AdminReports;