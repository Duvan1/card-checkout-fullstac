import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../shared/hooks';

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const tx = useAppSelector((s) => s.transaction.transaction);
  const paymentStatus = useAppSelector((s) => s.transaction.paymentStatus);

  useEffect(() => {
    if (tx && paymentStatus === 'idle' && !location.pathname.startsWith('/result')) {
      navigate('/result');
    }
  }, [tx, paymentStatus]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-white border-b border-outline-variant sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-primary tracking-tight hover:text-primary-hover transition-colors"
          >
            Card Checkout
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Productos
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-surface-container-low border-t border-outline-variant py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center text-sm text-on-surface-variant">
          Card Checkout &mdash; Demo de pasarela de pagos
        </div>
      </footer>
    </div>
  );
}
