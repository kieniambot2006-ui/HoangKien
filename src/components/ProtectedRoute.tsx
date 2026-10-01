import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: ('admin' | 'staff' | 'teacher' | 'student')[];
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && !requireRole.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-600 font-medium">Không có quyền truy cập</p>
        <p className="text-sm text-gray-400 mt-1">Bạn cần quyền {requireRole.join(' hoặc ')} để truy cập trang này</p>
      </div>
    );
  }
  return <>{children}</>;
}
