import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    Camera,
    CheckCircle2,
    Eye,
    EyeOff,
    Headphones,
    History,
    ShieldCheck,
    Upload,
    UserRound,
    X,
} from 'lucide-react';
import { getAuthUser } from '../utils/authStorage';
import axiosInstance from '../api/axiosInstance';
import OrderHistory from '../components/profile/OrderHistory';

type ProfileUser = {
    id?: number;
    fullName?: string;
    name?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    gender?: string;
    birthday?: string;
    dateOfBirth?: string;
    createdAt?: string;
    avatarUrl?: string;
};

type ApiResponse<T> = {
    data: T;
    message?: string;
};

type ActiveTab = 'profile' | 'history' | 'security';

type EditProfileForm = {
    fullName: string;
    email: string;
    phone: string;
    birthday: string;
    gender: string;
};

function formatDate(dateValue?: string) {
    if (!dateValue) return 'Chưa cập nhật';

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split('-');
        return `${day}/${month}/${year}`;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString('vi-VN');
}

function toDateInputValue(dateValue?: string) {
    if (!dateValue) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

const getApiErrorMessage = (error: unknown) => {
    const err = error as {
        response?: {
            data?: {
                message?: string;
            };
        };
    };

    return err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
};

function Profile() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

    const [profileUser, setProfileUser] = useState<ProfileUser | null>(
        () => getAuthUser() as ProfileUser | null,
    );

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    const [editForm, setEditForm] = useState<EditProfileForm>({
        fullName: '',
        email: '',
        phone: '',
        birthday: '',
        gender: '',
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isAvatarBoxOpen, setIsAvatarBoxOpen] = useState(false);
    const [avatarError, setAvatarError] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const syncEditForm = (user: ProfileUser | null) => {
        setEditForm({
            fullName: user?.fullName || user?.name || '',
            email: user?.email || '',
            phone: user?.phone || user?.phoneNumber || '',
            birthday: toDateInputValue(user?.birthday || user?.dateOfBirth),
            gender: user?.gender || '',
        });
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axiosInstance.get<ApiResponse<ProfileUser>>('/users/profile');

                const serverUser = res.data.data;
                setProfileUser(serverUser);
                syncEditForm(serverUser);

                const currentAuthUser = getAuthUser() as ProfileUser | null;

                localStorage.setItem(
                    'authUser',
                    JSON.stringify({
                        ...(currentAuthUser || {}),
                        ...serverUser,
                    }),
                );
            } catch (error) {
                console.log('GET PROFILE ERROR:', error);

                const localUser = getAuthUser() as ProfileUser | null;
                syncEditForm(localUser);
            }
        };

        fetchProfile();
    }, []);

    const fullName = profileUser?.fullName || profileUser?.name || 'Người dùng';
    const email = profileUser?.email || 'Chưa cập nhật';
    const phone = profileUser?.phone || profileUser?.phoneNumber || 'Chưa cập nhật';
    const birthday = formatDate(profileUser?.birthday || profileUser?.dateOfBirth);
    const gender = profileUser?.gender || 'Chưa cập nhật';
    const joinedDate = formatDate(profileUser?.createdAt);

    const menuButtonClass = (tab: ActiveTab) =>
        `flex w-full items-center gap-4 px-5 py-4 lg:py-5 text-left text-sm font-black transition ${
            activeTab === tab
                ? 'border-b-4 lg:border-b-0 lg:border-l-4 border-[#F43F73] bg-[#F43F73]/10 text-[#F43F73]'
                : 'border-b-4 lg:border-b-0 lg:border-l-4 border-transparent text-[#0B1736] hover:bg-[#F8FAFC] hover:text-[#F43F73]'
        }`;

    const contentCardClass =
        'min-w-0 min-h-[500px] h-fit rounded-2xl border border-[#F43F73]/50 bg-white p-5 sm:p-8 shadow-[0_8px_30px_rgba(15,23,42,0.06)]';

    const profileInputClass =
        'h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm font-semibold text-[#0B1736] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F43F73] focus:ring-4 focus:ring-[#F43F73]/10';

    const passwordInputClass =
        'w-full bg-transparent text-sm font-semibold text-[#0B1736] caret-[#F43F73] outline-none placeholder:text-[#94A3B8]';

    const handleOpenFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const isValidType = file.type === 'image/jpeg' || file.type === 'image/png';
        const isValidSize = file.size <= 2 * 1024 * 1024;

        if (!isValidType) {
            setAvatarError('Chỉ hỗ trợ ảnh JPG hoặc PNG.');
            return;
        }

        if (!isValidSize) {
            setAvatarError('Ảnh không được vượt quá 2MB.');
            return;
        }

        setAvatarError('');

        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);

        const updatedUser: ProfileUser = {
            ...(profileUser || {}),
            avatarUrl: previewUrl,
        };

        setProfileUser(updatedUser);

        const currentAuthUser = getAuthUser() as ProfileUser | null;

        localStorage.setItem(
            'authUser',
            JSON.stringify({
                ...(currentAuthUser || {}),
                ...updatedUser,
            }),
        );

        setIsAvatarBoxOpen(false);
    };

    const handleEditProfile = () => {
        syncEditForm(profileUser);
        setProfileError('');
        setProfileSuccess('');
        setIsEditingProfile(true);
    };

    const handleCancelEditProfile = () => {
        syncEditForm(profileUser);
        setProfileError('');
        setProfileSuccess('');
        setIsEditingProfile(false);
    };

    const handleSaveProfile = async () => {
        setProfileError('');
        setProfileSuccess('');

        const trimmedFullName = editForm.fullName.trim();
        const trimmedEmail = editForm.email.trim();
        const trimmedPhone = editForm.phone.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^0\d{9}$/;

        if (!trimmedFullName) {
            setProfileError('Vui lòng nhập họ và tên.');
            return;
        }

        if (!emailRegex.test(trimmedEmail)) {
            setProfileError('Email không hợp lệ.');
            return;
        }

        if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
            setProfileError('Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0.');
            return;
        }

        const payload = {
            fullName: trimmedFullName,
            name: trimmedFullName,
            email: trimmedEmail,
            phone: trimmedPhone,
            phoneNumber: trimmedPhone,
            birthday: editForm.birthday || undefined,
            dateOfBirth: editForm.birthday || undefined,
            gender: editForm.gender || undefined,
        };

        try {
            const res = await axiosInstance.put<ApiResponse<ProfileUser>>('/users/profile', payload);

            const responseUser = res.data.data || {};

            const updatedUser: ProfileUser = {
                ...(profileUser || {}),
                ...responseUser,

                fullName: trimmedFullName,
                name: trimmedFullName,
                email: trimmedEmail,
                phone: trimmedPhone,
                phoneNumber: trimmedPhone,
                birthday: editForm.birthday || responseUser.birthday,
                dateOfBirth: editForm.birthday || responseUser.dateOfBirth,
                gender: editForm.gender || responseUser.gender,
            };

            setProfileUser(updatedUser);
            syncEditForm(updatedUser);

            const currentAuthUser = getAuthUser() as ProfileUser | null;

            localStorage.setItem(
                'authUser',
                JSON.stringify({
                    ...(currentAuthUser || {}),
                    ...updatedUser,
                }),
            );

            setIsEditingProfile(false);
            setProfileSuccess('Cập nhật thông tin thành công.');
        } catch (error) {
            console.log('UPDATE PROFILE ERROR:', error);
            setProfileError('Cập nhật thất bại. Vui lòng kiểm tra API cập nhật hồ sơ.');
        }
    };

    const clearPasswordForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordError('');
        setPasswordSuccess('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

        if (!currentPassword) {
            setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }

        if (!newPassword) {
            setPasswordError('Vui lòng nhập mật khẩu mới.');
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            setPasswordError(
                'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
            );
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError('Mật khẩu nhập lại không khớp.');
            return;
        }

        try {
            const res = await axiosInstance.put<ApiResponse<null>>('/users/change-password', {
                oldPassword: currentPassword,
                newPassword,
                confirmPassword: confirmNewPassword,
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmNewPassword(false);

            setPasswordSuccess(res.data.message || 'Đổi mật khẩu thành công.');
        } catch (error) {
            console.log('CHANGE PASSWORD ERROR:', error);
            setPasswordError(getApiErrorMessage(error));
        }
    };

    return (
        <main className="bg-white">
            <section className="mx-auto min-h-[600px] max-w-[1320px] px-6 py-10">
                <div className="grid items-start gap-8 lg:grid-cols-[270px_1fr]">
                    <aside className="space-y-5 min-w-0">
                        <div className="flex overflow-x-auto lg:flex-col lg:overflow-visible rounded-xl border border-[#E2E8F0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] hide-scrollbar">
                            <button
                                type="button"
                                onClick={() => setActiveTab('profile')}
                                className={`${menuButtonClass('profile')} whitespace-nowrap lg:whitespace-normal`}
                            >
                                <UserRound size={24} className="shrink-0" />
                                Thông tin cá nhân
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('history')}
                                className={`${menuButtonClass('history')} whitespace-nowrap lg:whitespace-normal`}
                            >
                                <History size={24} className="shrink-0" />
                                Lịch sử đặt vé
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('security')}
                                className={`${menuButtonClass('security')} whitespace-nowrap lg:whitespace-normal`}
                            >
                                <ShieldCheck size={24} className="shrink-0" />
                                Bảo mật tài khoản
                            </button>
                        </div>

                        <div className="hidden lg:block rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                            <div className="flex items-start gap-4">
                                <Headphones
                                    size={32}
                                    strokeWidth={2}
                                    className="shrink-0 text-[#F43F73]"
                                />

                                <div>
                                    <h3 className="text-xl font-black text-[#0B1736]">
                                        Cần hỗ trợ?
                                    </h3>

                                    <p className="mt-2 text-sm leading-5 text-[#64748B]">
                                        Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
                                    </p>

                                    <button
                                        type="button"
                                        className="mt-4 rounded-lg border border-[#F43F73] px-5 py-2 text-sm font-bold text-[#0B1736] transition hover:bg-[#F43F73] hover:text-white"
                                    >
                                        Liên hệ hỗ trợ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className={contentCardClass}>
                        {activeTab === 'profile' && (
                            <>
                                <h1 className="text-2xl sm:text-3xl font-black text-[#0B1736]">
                                    Thông tin cá nhân
                                </h1>

                                {profileError && (
                                    <div className="mt-4 rounded-xl border border-[#F43F73]/60 bg-[#F43F73]/10 px-4 py-2.5 text-sm font-bold text-[#F43F73]">
                                        {profileError}
                                    </div>
                                )}

                                {profileSuccess && (
                                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#10B981]/60 bg-[#10B981]/10 px-4 py-2.5 text-sm font-bold text-[#047857]">
                                        <CheckCircle2 size={18} />
                                        {profileSuccess}
                                    </div>
                                )}

                                <div className="mt-6 sm:mt-8 grid gap-6 lg:gap-10 lg:grid-cols-[220px_1fr]">
                                    <div className="relative flex flex-col items-center">
                                        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#F43F73]/25 bg-[#F8FAFC] text-[#0B1736]">
                                            {avatarPreview || profileUser?.avatarUrl ? (
                                                <img
                                                    src={avatarPreview || profileUser?.avatarUrl}
                                                    alt={fullName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <UserRound size={72} strokeWidth={1.6} />
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAvatarBoxOpen(true);
                                                setAvatarError('');
                                            }}
                                            className="mt-5 flex items-center gap-2 rounded-lg border border-[#F43F73] px-4 py-2 text-sm font-bold text-[#0B1736] transition hover:bg-[#F43F73] hover:text-white"
                                        >
                                            <Camera size={18} />
                                            Thay đổi ảnh
                                        </button>

                                        <p className="mt-3 text-xs font-medium text-[#64748B]">
                                            JPG, PNG tối đa 2MB
                                        </p>

                                        {isAvatarBoxOpen && (
                                            <div className="absolute left-1/2 top-[175px] z-30 w-[230px] -translate-x-1/2 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.18)]">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="text-sm font-black text-[#0B1736]">
                                                        Thay đổi ảnh đại diện
                                                    </h3>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsAvatarBoxOpen(false);
                                                            setAvatarError('');
                                                        }}
                                                        className="text-[#0B1736] transition hover:text-[#F43F73]"
                                                        aria-label="Đóng"
                                                    >
                                                        <X size={18} strokeWidth={3} />
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleOpenFilePicker}
                                                    className="flex w-full items-center gap-3 rounded-lg bg-[#DDD6FE] px-4 py-3 text-left transition hover:bg-[#C4B5FD]"
                                                >
                                                    <Upload size={20} className="shrink-0 text-[#6D28D9]" />

                                                    <span>
                                                        <span className="block text-sm font-black text-[#4C1D95]">
                                                            Tải ảnh lên
                                                        </span>

                                                        <span className="block text-xs font-medium text-[#64748B]">
                                                            Chọn ảnh từ thiết bị
                                                        </span>
                                                    </span>
                                                </button>

                                                {avatarError && (
                                                    <p className="mt-2 text-xs font-bold text-[#F43F73]">
                                                        {avatarError}
                                                    </p>
                                                )}

                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/png,image/jpeg"
                                                    className="hidden"
                                                    onChange={handleAvatarFileChange}
                                                />
                                            </div>
                                        )}

                                        <div className="mt-6 lg:mt-10 flex w-full flex-col items-center gap-3">
                                            {!isEditingProfile ? (
                                                <button
                                                    type="button"
                                                    onClick={handleEditProfile}
                                                    className="w-[150px] rounded-full border border-[#F43F73] px-5 py-2 text-sm font-bold text-[#0B1736] transition hover:bg-[#F43F73] hover:text-white"
                                                >
                                                    Chỉnh sửa
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveProfile}
                                                        className="w-[150px] rounded-full bg-[#F43F73] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#E11D60]"
                                                    >
                                                        Lưu thay đổi
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={handleCancelEditProfile}
                                                        className="w-[150px] rounded-full border border-[#F43F73] px-5 py-2 text-sm font-bold text-[#F43F73] transition hover:bg-[#F43F73] hover:text-white"
                                                    >
                                                        Hủy bỏ
                                                    </button>
                                                </>
                                            )}

                                            {!isEditingProfile && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('security')}
                                                    className="w-[150px] rounded-full border border-[#F43F73] px-5 py-2 text-sm font-bold text-[#0B1736] transition hover:bg-[#F43F73] hover:text-white"
                                                >
                                                    Đổi mật khẩu
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <div className="divide-y divide-[#E2E8F0]">
                                            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start sm:items-center gap-2 sm:gap-8 py-3">
                                                <div className="text-base font-black text-[#0B1736]">
                                                    Họ và tên
                                                </div>

                                                {isEditingProfile ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.fullName}
                                                        onChange={(event) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                fullName: event.target.value,
                                                            })
                                                        }
                                                        className={profileInputClass}
                                                    />
                                                ) : (
                                                    <div className="text-base font-medium text-[#0B1736]">
                                                        {fullName}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start sm:items-center gap-2 sm:gap-8 py-3">
                                                <div className="text-base font-black text-[#0B1736]">
                                                    Email
                                                </div>

                                                {isEditingProfile ? (
                                                    <input
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(event) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                email: event.target.value,
                                                            })
                                                        }
                                                        className={profileInputClass}
                                                    />
                                                ) : (
                                                    <div className="text-base font-medium text-[#0B1736]">
                                                        {email}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start sm:items-center gap-2 sm:gap-8 py-3">
                                                <div className="text-base font-black text-[#0B1736]">
                                                    Số điện thoại
                                                </div>

                                                {isEditingProfile ? (
                                                    <input
                                                        type="tel"
                                                        inputMode="numeric"
                                                        maxLength={10}
                                                        value={editForm.phone}
                                                        onChange={(event) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                phone: event.target.value.replace(/\D/g, '').slice(0, 10),
                                                            })
                                                        }
                                                        className={profileInputClass}
                                                    />
                                                ) : (
                                                    <div className="text-base font-medium text-[#0B1736]">
                                                        {phone}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start sm:items-center gap-2 sm:gap-8 py-3">
                                                <div className="text-base font-black text-[#0B1736]">
                                                    Ngày sinh
                                                </div>

                                                {isEditingProfile ? (
                                                    <input
                                                        type="date"
                                                        value={editForm.birthday}
                                                        onChange={(event) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                birthday: event.target.value,
                                                            })
                                                        }
                                                        className={profileInputClass}
                                                    />
                                                ) : (
                                                    <div className="text-base font-medium text-[#0B1736]">
                                                        {birthday}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start sm:items-center gap-2 sm:gap-8 py-3">
                                                <div className="text-base font-black text-[#0B1736]">
                                                    Giới tính
                                                </div>

                                                {isEditingProfile ? (
                                                    <select
                                                        value={editForm.gender}
                                                        onChange={(event) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                gender: event.target.value,
                                                            })
                                                        }
                                                        className={profileInputClass}
                                                    >
                                                        <option value="">Chưa cập nhật</option>
                                                        <option value="Nam">Nam</option>
                                                        <option value="Nữ">Nữ</option>
                                                        <option value="Khác">Khác</option>
                                                    </select>
                                                ) : (
                                                    <div className="text-base font-medium text-[#0B1736]">
                                                        {gender}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start sm:items-center gap-2 sm:gap-8 py-3">
                                                <div className="text-base font-black text-[#0B1736]">
                                                    Ngày tham gia
                                                </div>

                                                {isEditingProfile ? (
                                                    <div
                                                        className={`${profileInputClass} flex items-center bg-[#E5E7EB] text-[#334155]`}
                                                    >
                                                        {joinedDate}
                                                    </div>
                                                ) : (
                                                    <div className="text-base font-medium text-[#0B1736]">
                                                        {joinedDate}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'history' && (
                            <div className="h-full">
                                <OrderHistory />
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="h-full">
                                <h1 className="text-3xl font-black text-[#0B1736]">
                                    Đổi mật khẩu
                                </h1>

                                <div className="mt-5 flex items-center gap-5">
                                    <ShieldCheck
                                        size={48}
                                        strokeWidth={1.8}
                                        className="shrink-0 text-[#F43F73]"
                                    />

                                    <p className="text-base font-medium text-[#64748B]">
                                        Vui lòng thay đổi mật khẩu mới để bảo mật tài khoản của bạn
                                    </p>
                                </div>

                                {passwordError && (
                                    <div className="mt-4 rounded-xl border border-[#F43F73]/60 bg-[#F43F73]/10 px-4 py-2.5 text-sm font-bold text-[#F43F73]">
                                        {passwordError}
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#10B981]/60 bg-[#10B981]/10 px-4 py-2.5 text-sm font-bold text-[#047857]">
                                        <CheckCircle2 size={18} />
                                        {passwordSuccess}
                                    </div>
                                )}

                                <div className="mt-6 space-y-4">
                                    <div className="grid items-center gap-6 lg:grid-cols-[250px_1fr]">
                                        <label className="text-base font-black text-[#0B1736]">
                                            Mật khẩu hiện tại <span className="text-[#F43F73]">*</span>
                                        </label>

                                        <div className="flex h-11 items-center rounded-xl border border-[#CBD5E1] bg-white px-4 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(event) => {
                                                    setCurrentPassword(event.target.value);
                                                    setPasswordError('');
                                                    setPasswordSuccess('');
                                                }}
                                                placeholder="Nhập mật khẩu hiện tại"
                                                className={passwordInputClass}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="ml-3 text-[#0B1736] transition hover:text-[#F43F73]"
                                                aria-label="Ẩn hoặc hiện mật khẩu hiện tại"
                                            >
                                                {showCurrentPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid items-start gap-6 lg:grid-cols-[250px_1fr]">
                                        <label className="pt-2.5 text-base font-black text-[#0B1736]">
                                            Mật khẩu mới <span className="text-[#F43F73]">*</span>
                                        </label>

                                        <div>
                                            <div className="flex h-11 items-center rounded-xl border border-[#CBD5E1] bg-white px-4 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={(event) => {
                                                        setNewPassword(event.target.value);
                                                        setPasswordError('');
                                                        setPasswordSuccess('');
                                                    }}
                                                    placeholder="Nhập mật khẩu mới"
                                                    className={passwordInputClass}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="ml-3 text-[#0B1736] transition hover:text-[#F43F73]"
                                                    aria-label="Ẩn hoặc hiện mật khẩu mới"
                                                >
                                                    {showNewPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                                                </button>
                                            </div>

                                            <p className="mt-2 text-sm font-medium text-[#64748B]">
                                                Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid items-center gap-6 lg:grid-cols-[250px_1fr]">
                                        <label className="text-base font-black text-[#0B1736]">
                                            Nhập lại mật khẩu mới <span className="text-[#F43F73]">*</span>
                                        </label>

                                        <div className="flex h-11 items-center rounded-xl border border-[#CBD5E1] bg-white px-4 transition focus-within:border-[#F43F73] focus-within:ring-4 focus-within:ring-[#F43F73]/10">
                                            <input
                                                type={showConfirmNewPassword ? 'text' : 'password'}
                                                value={confirmNewPassword}
                                                onChange={(event) => {
                                                    setConfirmNewPassword(event.target.value);
                                                    setPasswordError('');
                                                    setPasswordSuccess('');
                                                }}
                                                placeholder="Nhập lại mật khẩu mới"
                                                className={passwordInputClass}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                className="ml-3 text-[#0B1736] transition hover:text-[#F43F73]"
                                                aria-label="Ẩn hoặc hiện nhập lại mật khẩu mới"
                                            >
                                                {showConfirmNewPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 pt-1 lg:grid-cols-[250px_1fr]">
                                        <div />

                                        <div className="flex flex-wrap items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={handleChangePassword}
                                                className="h-11 min-w-[230px] rounded-xl bg-[#F43F73] px-7 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,63,115,0.28)] transition hover:bg-[#E11D60]"
                                            >
                                                Cập nhật mật khẩu mới
                                            </button>

                                            <button
                                                type="button"
                                                onClick={clearPasswordForm}
                                                className="h-11 min-w-[180px] rounded-xl border border-[#F43F73] px-7 text-sm font-black text-[#F43F73] transition hover:bg-[#F43F73] hover:text-white"
                                            >
                                                Hủy bỏ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Profile;