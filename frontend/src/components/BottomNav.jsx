import { Link, useLocation } from 'react-router-dom';
import { Home, ListOrdered, User, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import './BottomNav.css';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuthStore();
  const cartCount = useCartStore(s => s.getCount());

  // Hide BottomNav on admin panel
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // If user is admin (owner), they don't use the customer bottom nav
  if (user?.role === 'admin') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Home size={22} />
        <span>Início</span>
      </Link>
      
      <Link 
        to="/orders" 
        className={`bottom-nav-item ${location.pathname === '/orders' ? 'active' : ''}`}
      >
        <ListOrdered size={22} />
        <span>Pedidos</span>
      </Link>

      <Link 
        to="/cart" 
        className={`bottom-nav-item ${location.pathname === '/cart' ? 'active' : ''}`}
      >
        <div className="bottom-nav-icon-wrapper">
          <ShoppingCart size={22} />
          {cartCount > 0 && <span className="bottom-nav-badge">{cartCount}</span>}
        </div>
        <span>Carrinho</span>
      </Link>

      <Link 
        to={user ? "/profile" : "/login"} 
        className={`bottom-nav-item ${(location.pathname === '/profile' || location.pathname === '/login') ? 'active' : ''}`}
      >
        <User size={22} />
        <span>{user ? 'Perfil' : 'Entrar'}</span>
      </Link>
    </nav>
  );
}
