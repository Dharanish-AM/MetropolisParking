import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ParkingLots } from './pages/ParkingLots';
import { Unauthorized } from './pages/Unauthorized';
import { Vehicles } from './pages/Vehicles';
import { Sessions } from './pages/Sessions';
import { Payments } from './pages/Payments';
import { Profile } from './pages/Profile';
import { Reservations } from './pages/Reservations';
import { AnprSimulator } from './pages/AnprSimulator';
import { QrScannerPage } from './pages/QrScannerPage';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  useWebSocket();

  return (
    <AuthProvider>
      <BrowserRouter>
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
              <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
                <ParkingLots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR', 'CUSTOMER']}>
                <Vehicles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
                <Sessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anpr-simulator"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
                <AnprSimulator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qr-scanner"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR', 'CUSTOMER']}>
                <QrScannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR', 'CUSTOMER']}>
                <Reservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
