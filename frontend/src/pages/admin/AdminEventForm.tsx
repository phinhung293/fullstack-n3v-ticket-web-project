import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import TicketMapTypeSelector from '../../components/events/TicketMapTypeSelector';
import {
    adminCreateEvent,
    adminGetEventById,
    adminUpdateEvent,
    adminUploadImage,
    createCategory,
    getCategories,
    getEventApiErrorMessage,
    toAbsoluteImageUrl,
} from '../../api/eventApi';
import type { CategoryResponse, EventCreateRequest, EventUpdateRequest, TicketMapType } from '../../types/event';
import { fromDateTimeLocalInputValue, toDateTimeLocalInputValue } from '../../utils/format';

type Props = {
    // Khi co eventId: form chay o che do SUA thong tin su kien co san (goi adminUpdateEvent).
    // Khi khong co eventId: form chay o che do TAO MOI (goi adminCreateEvent), giu nguyen hanh vi cu.
    eventId?: number;
    onCancel: () => void;
    onCreated: (eventId: number) => void;
    onUpdated?: (eventId: number) => void;
};

type FormState = {
    name: string;
    description: string;
    thumbnailUrl: string;
    bannerUrl: string;
    categoryId: string;
    venueName: string;
    address: string;
    city: string;
    startTime: string;
    endTime: string;
    saleStartTime: string;
    saleEndTime: string;
};

const emptyForm: FormState = {
    name: '',
    description: '',
    thumbnailUrl: '',
    bannerUrl: '',
    categoryId: '',
    venueName: '',
    address: '',
    city: '',
    startTime: '',
    endTime: '',
    saleStartTime: '',
    saleEndTime: '',
};

const inputClass =
    'h-11 w-full rounded-lg border border-[#DDE3EF] bg-white px-3 text-sm font-semibold text-[#0B1736] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10';
const labelClass = 'mb-1.5 block text-sm font-black text-[#0B1736]';

// Gio hien tai theo gio dia phuong (KHONG dung toISOString vi no tra ve UTC), dinh dang
// "YYYY-MM-DDTHH:mm" giong het gia tri cua input type="datetime-local", dung lam moc "min"
// de khoa khong cho chon ngay da qua tren UI.
const getNowLocalInputValue = (): string => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

function AdminEventForm({ eventId, onCancel, onCreated, onUpdated }: Props) {
    const isEditMode = eventId !== undefined;
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [ticketMapType, setTicketMapType] = useState<TicketMapType | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditMode);
    const [error, setError] = useState('');
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    // Chi cho phep startTime/endTime la qua khu khi su kien GOC (luc mo form) da thuc su
    // bat dau roi (VD dang ONGOING). Neu su kien goc van chua bat dau (con o tuong lai),
    // van ap dung rule "khong duoc chon ngay qua khu" giong het luc tao moi.
    const [allowPastStart, setAllowPastStart] = useState(false);

    const loadCategories = () => {
        getCategories()
            .then(setCategories)
            .catch(() => setCategories([]));
    };

    useEffect(() => {
        loadCategories();
    }, []);

    // Che do SUA: tai thong tin su kien co san va do vao form.
    useEffect(() => {
        if (!isEditMode || eventId === undefined) return;
        setLoading(true);
        adminGetEventById(eventId)
            .then((event) => {
                setForm({
                    name: event.name,
                    description: event.description ?? '',
                    thumbnailUrl: event.thumbnailUrl ?? '',
                    bannerUrl: event.bannerUrl ?? '',
                    categoryId: String(event.category.id),
                    venueName: event.venueName ?? '',
                    address: event.address ?? '',
                    city: event.city ?? '',
                    startTime: toDateTimeLocalInputValue(event.startTime),
                    endTime: toDateTimeLocalInputValue(event.endTime),
                    saleStartTime: toDateTimeLocalInputValue(event.saleStartTime),
                    saleEndTime: toDateTimeLocalInputValue(event.saleEndTime),
                });
                setTicketMapType(event.ticketMapType);
                setAllowPastStart(new Date(event.startTime) < new Date());
            })
            .catch((err) => setError(getEventApiErrorMessage(err)))
            .finally(() => setLoading(false));
    }, [isEditMode, eventId]);

    const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

    const handleAddCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) return;
        try {
            const created = await createCategory({ name });
            setNewCategoryName('');
            setIsAddingCategory(false);
            loadCategories();
            update({ categoryId: String(created.id) });
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        }
    };

    const handleImageUpload = async (field: 'thumbnailUrl' | 'bannerUrl', file: File | undefined) => {
        if (!file) return;
        const setUploading = field === 'thumbnailUrl' ? setUploadingThumbnail : setUploadingBanner;
        setUploading(true);
        setError('');
        try {
            const url = await adminUploadImage(file);
            update({ [field]: url });
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!form.name.trim()) return setError('Vui lòng nhập tên sự kiện.');
        if (!form.categoryId) return setError('Vui lòng chọn danh mục.');
        if (!form.venueName.trim()) return setError('Vui lòng nhập địa điểm tổ chức.');
        if (!form.startTime || !form.endTime) return setError('Vui lòng nhập thời gian bắt đầu và kết thúc.');
        if (!isEditMode && !ticketMapType) return setError('Vui lòng chọn loại sơ đồ vé.');

        // Validate lai bang JS (phong khi trinh duyet khong chan het min/max cua input,
        // VD Firefox/Safari cho go tay gia tri ngoai khoang min/max).
        // Chi ap dung rule "khong duoc la ngay qua khu" khi TAO MOI - khi SUA, su kien co the
        // dang ONGOING (da bat dau that su) nen startTime cu la qua khu la hop le, khong chan.
        const now = new Date();
        const startTimeDate = new Date(form.startTime);
        const endTimeDate = new Date(form.endTime);
        if (!allowPastStart && startTimeDate < now) return setError('Thời gian bắt đầu không được là ngày trong quá khứ.');
        if (!allowPastStart && endTimeDate < now) return setError('Thời gian kết thúc không được là ngày trong quá khứ.');
        if (endTimeDate <= startTimeDate) return setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
        if (form.saleEndTime && new Date(form.saleEndTime) > endTimeDate) {
            return setError('Thời gian đóng bán vé không được muộn hơn thời gian kết thúc sự kiện.');
        }

        const basePayload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            thumbnailUrl: form.thumbnailUrl.trim() || undefined,
            bannerUrl: form.bannerUrl.trim() || undefined,
            categoryId: Number(form.categoryId),
            venueName: form.venueName.trim(),
            address: form.address.trim() || undefined,
            city: form.city.trim() || undefined,
            startTime: fromDateTimeLocalInputValue(form.startTime),
            endTime: fromDateTimeLocalInputValue(form.endTime),
            saleStartTime: form.saleStartTime ? fromDateTimeLocalInputValue(form.saleStartTime) : undefined,
            saleEndTime: form.saleEndTime ? fromDateTimeLocalInputValue(form.saleEndTime) : undefined,
        };

        setSubmitting(true);
        try {
            if (isEditMode && eventId !== undefined) {
                // EventUpdateRequest khong co ticketMapType - backend co tinh khong cho doi
                // loai so do ve sau khi tao (xem EventService.update()).
                const updatePayload: EventUpdateRequest = basePayload;
                await adminUpdateEvent(eventId, updatePayload);
                (onUpdated ?? onCreated)(eventId);
            } else {
                if (!ticketMapType) return setError('Vui lòng chọn loại sơ đồ vé.');
                const createPayload: EventCreateRequest = { ...basePayload, ticketMapType };
                const created = await adminCreateEvent(createPayload);
                onCreated(created.id);
            }
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <section className="flex h-[400px] items-center justify-center rounded-2xl bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <Loader2 size={26} className="animate-spin text-[#F43F73]" />
            </section>
        );
    }

    return (
        <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] text-[#334155] transition hover:bg-[#F8FAFC]"
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-[#0B1736]">
                        {isEditMode ? 'Sửa thông tin sự kiện' : 'Tạo sự kiện mới'}
                    </h1>
                    <p className="mt-1 text-sm font-medium text-[#64748B]">
                        {isEditMode
                            ? 'Chỉnh sửa thông tin cơ bản của sự kiện. Loại sơ đồ bán vé không thể đổi sau khi tạo.'
                            : 'Bước 1: nhập thông tin sự kiện và chọn loại sơ đồ bán vé. Sau khi tạo, bạn sẽ cấu hình khu vực / ghế / bàn ở bước tiếp theo.'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className={labelClass}>Tên sự kiện *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(event) => update({ name: event.target.value })}
                            placeholder="VD: Đêm nhạc Trịnh Công Sơn"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Danh mục *</label>
                        {!isAddingCategory ? (
                            <div className="flex gap-2">
                                <select
                                    value={form.categoryId}
                                    onChange={(event) => update({ categoryId: event.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    title="Thêm danh mục mới"
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#DDE3EF] text-[#334155] transition hover:border-[#F43F73] hover:text-[#F43F73]"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(event) => setNewCategoryName(event.target.value)}
                                    placeholder="Tên danh mục mới"
                                    className={inputClass}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="h-11 shrink-0 rounded-lg bg-[#F43F73] px-4 text-sm font-black text-white"
                                >
                                    Thêm
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(false)}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#DDE3EF] text-[#334155]"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Thành phố</label>
                        <input
                            type="text"
                            value={form.city}
                            onChange={(event) => update({ city: event.target.value })}
                            placeholder="VD: TP. Hồ Chí Minh"
                            className={inputClass}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelClass}>Địa điểm tổ chức *</label>
                        <input
                            type="text"
                            value={form.venueName}
                            onChange={(event) => update({ venueName: event.target.value })}
                            placeholder="VD: Nhà hát Hòa Bình"
                            className={inputClass}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelClass}>Địa chỉ chi tiết</label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={(event) => update({ address: event.target.value })}
                            placeholder="Số nhà, đường, phường/xã..."
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Thời gian bắt đầu *</label>
                        <input
                            type="datetime-local"
                            value={form.startTime}
                            min={allowPastStart ? undefined : getNowLocalInputValue()}
                            onChange={(event) => update({ startTime: event.target.value })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Thời gian kết thúc *</label>
                        <input
                            type="datetime-local"
                            value={form.endTime}
                            min={allowPastStart ? form.startTime || undefined : form.startTime || getNowLocalInputValue()}
                            onChange={(event) => update({ endTime: event.target.value })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Mở bán vé từ</label>
                        <input
                            type="datetime-local"
                            value={form.saleStartTime}
                            max={form.endTime || undefined}
                            onChange={(event) => update({ saleStartTime: event.target.value })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Đóng bán vé lúc</label>
                        <input
                            type="datetime-local"
                            value={form.saleEndTime}
                            max={form.endTime || undefined}
                            onChange={(event) => update({ saleEndTime: event.target.value })}
                            className={inputClass}
                        />
                        <p className="mt-1 text-xs font-medium text-[#94A3B8]">
                            Không được muộn hơn thời gian kết thúc sự kiện.
                        </p>
                    </div>

                    <div>
                        <label className={labelClass}>Ảnh thumbnail</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(event) => handleImageUpload('thumbnailUrl', event.target.files?.[0])}
                            className="block w-full text-sm font-semibold text-[#334155] file:mr-3 file:rounded-lg file:border-0 file:bg-[#F43F73] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#e0356a]"
                        />
                        {uploadingThumbnail && (
                            <p className="mt-1.5 text-xs font-bold text-[#94A3B8]">Đang tải ảnh lên...</p>
                        )}
                        {form.thumbnailUrl && !uploadingThumbnail && (
                            <img
                                src={toAbsoluteImageUrl(form.thumbnailUrl)}
                                alt="Xem trước thumbnail"
                                className="mt-2 h-24 w-24 rounded-lg border border-[#DDE3EF] object-cover"
                            />
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Ảnh banner</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(event) => handleImageUpload('bannerUrl', event.target.files?.[0])}
                            className="block w-full text-sm font-semibold text-[#334155] file:mr-3 file:rounded-lg file:border-0 file:bg-[#F43F73] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#e0356a]"
                        />
                        {uploadingBanner && (
                            <p className="mt-1.5 text-xs font-bold text-[#94A3B8]">Đang tải ảnh lên...</p>
                        )}
                        {form.bannerUrl && !uploadingBanner && (
                            <img
                                src={toAbsoluteImageUrl(form.bannerUrl)}
                                alt="Xem trước banner"
                                className="mt-2 h-24 w-full rounded-lg border border-[#DDE3EF] object-cover"
                            />
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelClass}>Mô tả sự kiện</label>
                        <textarea
                            value={form.description}
                            onChange={(event) => update({ description: event.target.value })}
                            rows={4}
                            placeholder="Nội dung giới thiệu sự kiện..."
                            className="w-full rounded-lg border border-[#DDE3EF] bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1736] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F43F73] focus:ring-2 focus:ring-[#F43F73]/10"
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Loại sơ đồ bán vé *</label>
                    <p className="mb-3 text-xs font-medium text-[#94A3B8]">
                        {isEditMode
                            ? 'Loại sơ đồ vé đã cố định từ lúc tạo, không thể đổi để tránh sai lệch với khu vực/ghế đã cấu hình.'
                            : 'Lưu ý: không thể đổi loại sơ đồ vé sau khi tạo sự kiện.'}
                    </p>
                    <TicketMapTypeSelector value={ticketMapType} onChange={setTicketMapType} disabled={isEditMode} />
                </div>

                <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-11 rounded-lg border border-[#DDE3EF] px-5 text-sm font-black text-[#334155] transition hover:bg-[#F8FAFC]"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || uploadingThumbnail || uploadingBanner}
                        className="h-11 rounded-lg bg-[#F43F73] px-6 text-sm font-black text-white transition hover:bg-[#E11D5E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting
                            ? 'Đang lưu...'
                            : isEditMode
                              ? 'Lưu thay đổi'
                              : 'Tạo sự kiện & tiếp tục cấu hình vé'}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default AdminEventForm;
