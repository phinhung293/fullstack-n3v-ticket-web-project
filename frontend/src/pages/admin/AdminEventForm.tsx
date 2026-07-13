import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import TicketMapTypeSelector from '../../components/events/TicketMapTypeSelector';
import { adminCreateEvent, createCategory, getCategories, getEventApiErrorMessage } from '../../api/eventApi';
import type { CategoryResponse, EventCreateRequest, TicketMapType } from '../../types/event';
import { fromDateTimeLocalInputValue } from '../../utils/format';

type Props = {
    onCancel: () => void;
    onCreated: (eventId: number) => void;
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

function AdminEventForm({ onCancel, onCreated }: Props) {
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [ticketMapType, setTicketMapType] = useState<TicketMapType | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const loadCategories = () => {
        getCategories()
            .then(setCategories)
            .catch(() => setCategories([]));
    };

    useEffect(() => {
        loadCategories();
    }, []);

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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!form.name.trim()) return setError('Vui lòng nhập tên sự kiện.');
        if (!form.categoryId) return setError('Vui lòng chọn danh mục.');
        if (!form.venueName.trim()) return setError('Vui lòng nhập địa điểm tổ chức.');
        if (!form.startTime || !form.endTime) return setError('Vui lòng nhập thời gian bắt đầu và kết thúc.');
        if (!ticketMapType) return setError('Vui lòng chọn loại sơ đồ vé.');

        const payload: EventCreateRequest = {
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
            ticketMapType,
        };

        setSubmitting(true);
        try {
            const created = await adminCreateEvent(payload);
            onCreated(created.id);
        } catch (err) {
            setError(getEventApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

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
                    <h1 className="text-xl font-black text-[#0B1736]">Tạo sự kiện mới</h1>
                    <p className="mt-1 text-sm font-medium text-[#64748B]">
                        Bước 1: nhập thông tin sự kiện và chọn loại sơ đồ bán vé. Sau khi tạo, bạn sẽ cấu hình
                        khu vực / ghế / bàn ở bước tiếp theo.
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
                            onChange={(event) => update({ startTime: event.target.value })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Thời gian kết thúc *</label>
                        <input
                            type="datetime-local"
                            value={form.endTime}
                            onChange={(event) => update({ endTime: event.target.value })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Mở bán vé từ</label>
                        <input
                            type="datetime-local"
                            value={form.saleStartTime}
                            onChange={(event) => update({ saleStartTime: event.target.value })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Đóng bán vé lúc</label>
                        <input
                            type="datetime-local"
                            value={form.saleEndTime}
                            onChange={(event) => update({ saleEndTime: event.target.value })}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Ảnh thumbnail (URL)</label>
                        <input
                            type="text"
                            value={form.thumbnailUrl}
                            onChange={(event) => update({ thumbnailUrl: event.target.value })}
                            placeholder="https://..."
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Ảnh banner (URL)</label>
                        <input
                            type="text"
                            value={form.bannerUrl}
                            onChange={(event) => update({ bannerUrl: event.target.value })}
                            placeholder="https://..."
                            className={inputClass}
                        />
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
                        Lưu ý: không thể đổi loại sơ đồ vé sau khi tạo sự kiện.
                    </p>
                    <TicketMapTypeSelector value={ticketMapType} onChange={setTicketMapType} />
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
                        disabled={submitting}
                        className="h-11 rounded-lg bg-[#F43F73] px-6 text-sm font-black text-white transition hover:bg-[#E11D5E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Đang tạo...' : 'Tạo sự kiện & tiếp tục cấu hình vé'}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default AdminEventForm;
