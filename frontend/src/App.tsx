import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MarketplacePage } from './pages/MarketplacePage';
import { NeedDetailPage } from './pages/NeedDetailPage';
import { AuthPage } from './pages/AuthPage';
import { VolunteerDashboardPage } from './pages/VolunteerDashboardPage';
import { MilitaryDashboardPage } from './pages/MilitaryDashboardPage';

const LeaderboardPlaceholder: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
    <h1 className="text-2xl font-bold text-slate-900 mb-2">Лідерборд волонтерів</h1>
    <p className="text-sm text-slate-500">
      Слот для компонента Людини 3 (<code>GET /api/leaderboard</code>)
    </p>
  </div>
);

const ProfilePlaceholder: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
    <h1 className="text-2xl font-bold text-slate-900 mb-2">Профіль та бейджі</h1>
    <p className="text-sm text-slate-500">
      Слот для компонента Людини 3 (статистика, історія зборів та шеврони бригад)
    </p>
  </div>
);

export const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const appTree = (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MarketplacePage />} />
            <Route path="/needs/:id" element={<NeedDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/leaderboard" element={<LeaderboardPlaceholder />} />

            <Route
              path="/volunteer"
              element={
                <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                  <VolunteerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/military"
              element={
                <ProtectedRoute allowedRoles={['military', 'admin']}>
                  <MilitaryDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePlaceholder />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );

  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
  ) : (
    appTree
  );
};

export default App;
