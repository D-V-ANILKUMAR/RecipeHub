import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';

axios.defaults.baseURL = '';
axios.defaults.withCredentials = true;

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/auth/status')
      .then(res => { if (res.data.isAuthenticated) setUser(res.data.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a12' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, border:'3px solid rgba(99,102,241,0.3)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }}></div>
          <p style={{ color:'#6366f1', fontWeight:600 }}>Loading RecipeVideoApp…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <div style={{ minHeight:'100vh', background:'var(--bg-body)', display:'flex', flexDirection:'column' }}>
          <Toaster position="top-right" toastOptions={{
            style: { background:'#1e1e2e', color:'#e2e8f0', border:'1px solid rgba(255,255,255,0.08)' },
            success: { iconTheme: { primary:'#34d399', secondary:'#0a0a12' } },
            error: { iconTheme: { primary:'#f87171', secondary:'#0a0a12' } },
          }} />
          <Navbar />
          <main style={{ flex:1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminUsers />} />
            </Routes>
          </main>
          <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'1.5rem', textAlign:'center', color:'#4a5568', fontSize:'0.8rem' }}>
            © {new Date().getFullYear()} RecipeVideoApp — Built with React & Flask
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
