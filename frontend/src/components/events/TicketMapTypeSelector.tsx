import { Armchair, Coffee, LayoutGrid } from 'lucide-react';
import type { TicketMapType } from '../../types/event';

const options: {
    value: TicketMapType;
    title: string;
    description: string;
    icon: typeof Armchair;
}[] = [
    {
        value: 'SEAT_MAP',
        title: 'Sơ đồ ghế',
        description: 'Khách chọn đúng 1 ghế cụ thể (VD: rạp hát, hội trường).',
        icon: Armchair,
    },
    {
        value: 'ZONE',
        title: 'Sơ đồ khu vực',
        description: 'Bán vé theo khu, không cần chọn ghế cụ thể (VD: concert đứng).',
        icon: LayoutGrid,
    },
    {
        value: 'TEA_LOUNGE',
        title: 'Sơ đồ phòng trà',
        description: 'Khách chọn theo bàn, mỗi bàn ngồi được nhiều người.',
        icon: Coffee,
    },
];

type Props = {
    value: TicketMapType | null;
    onChange: (value: TicketMapType) => void;
    disabled?: boolean;
};

function TicketMapTypeSelector({ value, onChange, disabled }: Props) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {options.map((option) => {
                const Icon = option.icon;
                const active = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(option.value)}
                        className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            active
                                ? 'border-[#F43F73] bg-[#F43F73]/5 shadow-[0_8px_20px_rgba(244,63,115,0.15)]'
                                : 'border-[#E2E8F0] bg-white hover:border-[#F43F73]/40'
                        }`}
                    >
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                active ? 'bg-[#F43F73] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}
                        >
                            <Icon size={20} />
                        </div>
                        <p className={`text-sm font-black ${active ? 'text-[#F43F73]' : 'text-[#0B1736]'}`}>
                            {option.title}
                        </p>
                        <p className="text-xs font-medium leading-5 text-[#64748B]">{option.description}</p>
                    </button>
                );
            })}
        </div>
    );
}

export default TicketMapTypeSelector;
