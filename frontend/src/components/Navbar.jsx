import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Zap, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import logoImg from '../assets/logo_cgdelivery.png';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef(null);
  const cartCount = useCartStore(s => s.getCount());
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 300);
  };



  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <img src={logoImg} className="navbar-logo-img" alt="CG Delivery logo" />
          </div>
          <span>CG<span className="logo-accent">Delivery</span></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header mobile-only">
            <h3>Menu</h3>
            <button className="menu-close" onClick={() => setMenuOpen(false)}><X size={24} /></button>
          </div>
          
          {user && (
            <div className="mobile-user-info mobile-only">
              <div className="mobile-user-avatar"><User size={24} /></div>
              <div className="mobile-user-text">
                <strong>{user.name.split(' ')[0]}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}

          {user?.role !== 'admin' && (
            <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>
              Início
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link to="/admin" className={`mobile-only ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Painel Admin
            </Link>
          )}

          {user && user.role !== 'admin' && (
            <Link to="/orders" className={location.pathname === '/orders' ? 'active' : ''} onClick={() => setMenuOpen(false)}>
              Meus Pedidos
            </Link>
          )}

          {user && !user.establishmentId && (
            <Link to="/profile" className={`mobile-only ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Meus Dados
            </Link>
          )}

          {!user && (
            <Link to="/login" className="mobile-only btn btn-primary mt-4" onClick={() => setMenuOpen(false)}>
              Entrar / Criar Conta
            </Link>
          )}

          {user && (
            <button className="mobile-only mobile-logout-btn" onClick={() => { logout(); setMenuOpen(false); }}>
              Sair da conta
            </button>
          )}
        </div>

        <div className="navbar-actions">
          {user?.role !== 'admin' && (
            <Link to="/cart" className="cart-btn">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {user ? (
            <div 
              className="user-menu desktop-only" 
              onMouseEnter={handleMouseEnter} 
              onMouseLeave={handleMouseLeave}
            >
              <button 
                className="btn btn-ghost btn-sm user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <User size={16} />
                <span>{user.name.split(' ')[0]}</span>
                {user.role === 'admin' && (
                  <span className="user-role-badge">
                    {user.establishmentId ? 'Lojista' : 'Admin Geral'}
                  </span>
                )}
              </button>
              <div className={`user-dropdown ${dropdownOpen ? 'open' : ''}`}>
                {user.role === 'admin' && (
                  <div className="user-dropdown-header">
                    <span className="dropdown-user-role">
                      {user.establishmentId ? `Lojista (${user.establishment?.name || 'Restaurante'})` : 'Administrador Geral'}
                    </span>
                  </div>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setDropdownOpen(false)}>
                    Painel Admin
                  </Link>
                )}
                {!user.establishmentId && (
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                    Meus Dados
                  </Link>
                )}
                {user.role !== 'admin' && (
                  <Link to="/orders" onClick={() => setDropdownOpen(false)}>
                    Meus Pedidos
                  </Link>
                )}
                <button onClick={() => { logout(); setDropdownOpen(false); }}>
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm desktop-only">
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
