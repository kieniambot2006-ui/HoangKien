import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <p className="text-gray-500 mb-6">Không tìm thấy trang</p>
        <Link to="/" className="bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-blue-600 transition">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
