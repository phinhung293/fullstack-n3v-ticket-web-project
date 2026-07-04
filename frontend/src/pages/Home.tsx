import { getAuthUser } from '../utils/authStorage';

function Home() {
    const authUser = getAuthUser();

    let text = 'Nội dung trang chủ chưa đăng nhập sẽ thiết kế sau';

    if (authUser?.role === 'ROLE_USER') {
        text = 'Nội dung trang chủ USER đã đăng nhập sẽ thiết kế sau';
    }

    if (authUser?.role === 'ROLE_ADMIN') {
        text = 'Nội dung trang chủ ADMIN đã đăng nhập sẽ thiết kế sau';
    }

    return (
        <section className="mx-auto min-h-[560px] max-w-[1320px] px-6 py-10">
            <div className="flex min-h-[480px] items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white">
                <p className="text-[#9CA3AF]">{text}</p>
            </div>
        </section>
    );
}

export default Home;