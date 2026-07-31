import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/Unauthorized';
import { useWebSocket } from './hooks/useWebSocket';

const ParkingLots = lazy(() =>
  import('./pages/ParkingLots').then(m => ({ default: m.ParkingLots }))
);
const Vehicles = lazy(() => import('./pages/Vehicles').then(m => ({ default: m.Vehicles })));
const Sessions = lazy(() => import('./pages/Sessions').then(m => ({ default: m.Sessions })));
const Payments = lazy(() => import('./pages/Payments').then(m => ({ default: m.Payments })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Reservations = lazy(() =>
  import('./pages/Reservations').then(m => ({ default: m.Reservations }))
);
const AnprSimulator = lazy(() =>
  import('./pages/AnprSimulator').then(m => ({ default: m.AnprSimulator }))
);
const QrScannerPage = lazy(() =>
  import('./pages/QrScannerPage').then(m => ({ default: m.QrScannerPage }))
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  useWebSocket();

  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parking-lots"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ParkingLots />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER']}>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Sessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/anpr-simulator"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AnprSimulator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qr-scanner"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER']}>
                  <QrScannerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'CUSTOMER']}>
                  <Reservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Payments />
                </ProtectedRoute>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
