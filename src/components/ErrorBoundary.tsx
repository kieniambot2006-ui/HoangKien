import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-sm text-gray-500 mb-4">{this.state.error?.message || 'Lỗi không xác định'}</p>
            <button onClick={() => window.location.reload()} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition">
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
