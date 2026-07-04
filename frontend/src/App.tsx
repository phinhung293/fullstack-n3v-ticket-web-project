import { Routes, Route, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

type ComingSoonPageProps = {
    title: string;
    description?: string;
};

function ComingSoonPage({ title, description }: ComingSoonPageProps) {
    return (
        <section className="mx-auto min-h-[520px] max-w-[1320px] px-6 py-16">
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-[#0B1736]">
                        {title}
                    </h1>

                    <p className="mt-3 text-sm text-[#94A3B8]">
                        {description || 'Nội dung trang này sẽ được thiết kế sau'}
                    </p>
                </div>
            </div>
        </section>
    );
}

function App() {
    const location = useLocation();

    const hideLayoutPages = [
        '/login',
        '/register',
        '/forgot-password',
        '/terms',
        '/privacy',
    ];

    const isAdminPage = location.pathname.startsWith('/admin');

    const shouldHideLayout =
        hideLayoutPages.includes(location.pathname) || isAdminPage;

    return (
        <div className="min-h-screen bg-white font-sans">
            {!shouldHideLayout && <Header />}

            {shouldHideLayout ? (
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            ) : (
                <>
                    <main className="min-h-[520px] bg-white">
                        <Routes>
                            <Route path="/" element={<Home />} />

                            <Route path="/events" element={<ComingSoonPage title="Sự kiện" />} />
                            <Route path="/concert" element={<ComingSoonPage title="Concert" />} />
                            <Route path="/sports" element={<ComingSoonPage title="Thể thao" />} />
                            <Route path="/arts" element={<ComingSoonPage title="Nghệ thuật" />} />
                            <Route path="/experiences" element={<ComingSoonPage title="Trải nghiệm" />} />
                            <Route path="/venues" element={<ComingSoonPage title="Địa điểm" />} />
                            <Route path="/news" element={<ComingSoonPage title="Tin tức" />} />
                            <Route path="/promotions" element={<ComingSoonPage title="Ưu đãi" />} />

                            <Route
                                path="/my-tickets"
                                element={
                                    <ComingSoonPage
                                        title="Vé của tôi"
                                        description="Danh sách vé của bạn sẽ được thiết kế sau"
                                    />
                                }
                            />

                            <Route
                                path="/favorites"
                                element={
                                    <ComingSoonPage
                                        title="Yêu thích"
                                        description="Danh sách sự kiện yêu thích sẽ được thiết kế sau"
                                    />
                                }
                            />

                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </main>

                    <Footer />
                </>
            )}
        </div>
    );
}

export default App;