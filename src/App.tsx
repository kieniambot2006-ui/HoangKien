import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LabList from './pages/LabList';
import LabDetail from './pages/LabDetail';
import LabForm from './pages/LabForm';
import DeviceList from './pages/DeviceList';
import DeviceForm from './pages/DeviceForm';
import IncidentList from './pages/IncidentList';
import IncidentForm from './pages/IncidentForm';
import IncidentDetail from './pages/IncidentDetail';
import BookingList from './pages/BookingList';
import BookingForm from './pages/BookingForm';
import MaintenanceList from './pages/MaintenanceList';
import MaintenanceForm from './pages/MaintenanceForm';
import MaintenanceDetail from './pages/MaintenanceDetail';
import Statistics from './pages/Statistics';
import UserManagement from './pages/UserManagement';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';

function AppLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#f5f8f6]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:ml-0">
        <ErrorBoundary>
          <div className="mx-auto w-full max-w-7xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/labs" element={<LabList />} />
              <Route path="/labs/new" element={<ProtectedRoute requireRole={['admin', 'staff']}><LabForm /></ProtectedRoute>} />
              <Route path="/labs/edit/:id" element={<ProtectedRoute requireRole={['admin', 'staff']}><LabForm /></ProtectedRoute>} />
              <Route path="/labs/:id" element={<LabDetail />} />
              <Route path="/devices" element={<DeviceList />} />
              <Route path="/devices/new" element={<ProtectedRoute requireRole={['admin', 'staff']}><DeviceForm /></ProtectedRoute>} />
              <Route path="/devices/edit/:id" element={<ProtectedRoute requireRole={['admin', 'staff']}><DeviceForm /></ProtectedRoute>} />
              <Route path="/incidents" element={<IncidentList />} />
              <Route path="/incidents/new" element={<IncidentForm />} />
              <Route path="/incidents/edit/:id" element={<ProtectedRoute requireRole={['admin', 'staff']}><IncidentForm /></ProtectedRoute>} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
              <Route path="/bookings" element={<BookingList />} />
              <Route path="/bookings/new" element={<BookingForm />} />
              <Route path="/maintenance" element={<ProtectedRoute requireRole={['admin', 'staff']}><MaintenanceList /></ProtectedRoute>} />
              <Route path="/maintenance/new" element={<ProtectedRoute requireRole={['admin', 'staff']}><MaintenanceForm /></ProtectedRoute>} />
              <Route path="/maintenance/edit/:id" element={<ProtectedRoute requireRole={['admin', 'staff']}><MaintenanceForm /></ProtectedRoute>} />
              <Route path="/maintenance/:id" element={<ProtectedRoute requireRole={['admin', 'staff']}><MaintenanceDetail /></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute requireRole={['admin']}><Statistics /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute requireRole={['admin']}><UserManagement /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
