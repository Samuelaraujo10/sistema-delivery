import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartStore(s => s.getCount());
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <Zap size={20} fill="currentColor" />
          </div>
          <span>Delivery<span className="logo-accent">App</span></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>
            Início
          </Link>
          {user && (
            <Link to="/orders" className={location.pathname === '/orders' ? 'active' : ''} onClick={() => setMenuOpen(false)}>
              Pedidos
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          <Link to="/cart" className="cart-btn">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="user-menu">
              <button className="btn btn-ghost btn-sm user-btn">
                <User size={16} />
                <span>{user.name.split(' ')[0]}</span>
              </button>
              <div className="user-dropdown">
                {user.role === 'admin' && <Link to="/admin">Painel Admin</Link>}
                <Link to="/orders">Meus Pedidos</Link>
                <button onClick={logout}>Sair</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Entrar
            </Link>
          )}

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
