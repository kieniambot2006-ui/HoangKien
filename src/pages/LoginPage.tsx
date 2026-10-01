import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../hooks/useQueries';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);
    if (isRegistering && !name.trim()) { setError('Vui lòng nhập họ và tên'); return; }
    if (!identifier || !password) { setError('Vui lòng nhập đầy đủ'); return; }
    if (isRegistering && password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    setLoading(true);
    try {
      if (isRegistering) {
        const isEmail = identifier.includes('@');
        await api.users.create({
          name: name.trim(),
          email: isEmail ? identifier : '',
          username: isEmail ? undefined : identifier,
          password,
          role: 'student',
          active: true,
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.users });
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
        setError('Tạo tài khoản thành công. Hãy đăng nhập để tiếp tục.');
        setIsSuccess(true);
      } else {
        await login(identifier, password);
        navigate('/');
      }
    }
    catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (isRegistering) {
        setError(message.includes('Failed to fetch') ? 'Không kết nối được máy chủ dữ liệu. Hãy chạy npm run server.' : 'Không thể tạo tài khoản. Email có thể đã được sử dụng.');
      } else {
        setError(message.includes('Failed to fetch') ? 'Không kết nối được máy chủ. Hãy chạy npm run server.' : 'Username, email hoặc mật khẩu không đúng');
      }
    }
    finally { setLoading(false); }
  };

  return (
    <div className="login-shell min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="login-frame w-full max-w-5xl overflow-hidden rounded-[2rem]">
        <div className="hidden md:flex md:w-[46%] login-brand-panel p-10 lg:p-12 flex-col justify-between text-white">
          <div>
            <div className="login-logo-lockup login-logo-lockup-hero">
              <span className="login-logo-badge">
                <img src="/logobachkhoa.png" alt="Cao đẳng Bách khoa" className="h-16 w-auto object-contain" />
              </span>
              <div className="login-school-copy">
                <p>Trường Cao đẳng Bách khoa</p>
                <span>Hệ thống quản lý phòng máy</span>
              </div>
            </div>
            <div className="mt-16">
              <p className="login-kicker">Phòng máy • Thiết bị • Sự cố</p>
              <h1 className="mt-4 text-4xl lg:text-5xl font-bold leading-tight">Quản lý phòng máy thực hành.</h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">Theo dõi thiết bị, tiếp nhận báo cáo sự cố và ghi nhận quá trình sửa chữa trong một hệ thống gọn gàng.</p>
            </div>
          </div>
          <p className="text-xs text-white/45">© 2026 Trường Cao đẳng Bách khoa</p>
        </div>

        <div className="login-form-panel p-7 sm:p-10 lg:p-14 md:w-[54%]">
          <div className="mb-8 md:hidden">
            <div className="login-logo-lockup login-logo-lockup-mobile">
              <span className="login-logo-badge login-logo-badge-mobile">
                <img src="/logobachkhoa.png" alt="Cao đẳng Bách khoa" className="h-16 w-auto object-contain" />
              </span>
              <div className="login-school-copy login-school-copy-mobile">
                <p>Trường Cao đẳng Bách khoa</p>
                <span>Quản lý phòng máy</span>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <p className="login-form-kicker">{isRegistering ? 'Tạo tài khoản demo' : 'Hệ thống quản lý phòng máy'}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{isRegistering ? 'Tạo tài khoản' : 'Đăng nhập hệ thống'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{isRegistering ? 'Đăng ký nhanh để trải nghiệm chức năng báo sự cố.' : 'Đăng nhập để theo dõi phòng máy và sự cố thiết bị.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div>
                <label htmlFor="name" className="login-label">Họ và tên</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field login-input" placeholder="Nguyễn Văn An" autoFocus />
              </div>
            )}
            <div>
              <label htmlFor="identifier" className="login-label">Username hoặc email</label>
              <input id="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                className="input-field login-input" placeholder={isRegistering ? 'username hoặc you@bachkhoa.edu.vn' : 'Username hoặc email của bạn'} autoFocus={!isRegistering} />
            </div>
            <div>
              <label htmlFor="password" className="login-label">Mật khẩu</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field login-input" placeholder="Nhập mật khẩu của bạn" />
            </div>
            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="login-label">Xác nhận mật khẩu</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field login-input" placeholder="Nhập lại mật khẩu" />
              </div>
            )}
                  {error && <p className={`${isSuccess ? 'text-green-700 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'} text-sm border px-3 py-2.5 rounded-xl`}>{error}</p>}
            <button type="submit" disabled={loading} className="login-submit w-full">
              {loading ? (isRegistering ? 'Đang tạo tài khoản...' : 'Đang xác thực...') : (isRegistering ? 'Tạo tài khoản' : 'Đăng nhập')}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="login-switch">
              {isRegistering ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
