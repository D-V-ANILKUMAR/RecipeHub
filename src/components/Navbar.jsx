import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch { toast.error('Logout failed'); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/?q=${encodeURIComponent(search)}` : '/');
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="logo">
        🍽️ Recipe<span>Hub</span>
      </Link>

      {/* Search */}
      <div className="search-container">
        <form onSubmit={handleSearch}>
          <button type="submit" className="search-btn">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </button>
          <input
            type="text"
            placeholder="Find a recipe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
        </form>
      </div>

      {/* Nav links */}
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        {user ? (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/upload">Upload</Link></li>
            <li><Link to="/profile">👤</Link></li>
            {user.role === 'admin' && <li><Link to="/admin">Admin</Link></li>}
            <li>
              <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '4px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register" className="btn btn-primary">Get Started</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
