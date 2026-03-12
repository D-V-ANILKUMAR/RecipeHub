import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const Dashboard = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    setLoading(true);
    axios.get('/api/dashboard')
      .then(res => setRecipes(res.data.recipes || []))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently remove this recipe?')) return;
    try {
      await axios.delete(`/api/delete/${id}`);
      toast.success('Recipe deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  if (!user) return (
    <div className="container fade-in" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <p style={{ color: 'var(--text-muted)' }}>Please <a href="/login" style={{ color: 'var(--primary)' }}>log in</a> to access your dashboard.</p>
    </div>
  );

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {user.role === 'admin' ? (
              <><i className="fas fa-user-shield" style={{ color: '#f1c40f' }}></i> Admin Control</>
            ) : (
              <><i className="fas fa-utensils" style={{ color: 'var(--primary)' }}></i> My Kitchen</>
            )}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your culinary contributions and platform status.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {user.role === 'admin' && (
            <Link to="/admin" className="btn btn-icon">
              <i className="fas fa-users-cog"></i> Users Management
            </Link>
          )}
          <Link to="/upload" className="btn btn-primary">
            <i className="fas fa-plus-circle"></i> New Recipe
          </Link>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
            <i className="fas fa-folder-open" style={{ fontSize: '4rem', color: 'var(--text-muted)', marginBottom: '2rem', opacity: 0.3 }}></i>
            <h3>No Contributions Found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Start building your culinary portfolio today.</p>
            <Link to="/upload" className="btn btn-primary"><i className="fas fa-plus"></i> Upload First Recipe</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th>PREVIEW</th>
                <th>RECIPE DETAILS</th>
                <th>CREATOR</th>
                <th>POSTED ON</th>
                <th style={{ textAlign: 'right' }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map(recipe => (
                <tr key={recipe.id}>
                  <td style={{ width: '140px' }}>
                    <div style={{ width: '110px', height: '70px', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <video style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                        <source src={`/static/uploads/videos/${recipe.video_filename}`} type="video/mp4" />
                      </video>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }}>
                        <i className="fas fa-play" style={{ color: 'white', fontSize: '0.8rem', opacity: 0.7 }}></i>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.3rem' }}>{recipe.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{recipe.description}</div>
                  </td>
                  <td>
                    <span className="badge badge-primary">
                      <i className="fas fa-user-circle"></i> {user.role === 'admin' ? recipe.username : 'You'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {recipe.created_at ? new Date(recipe.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ancient Date'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                      {/* Note: Edit feature link is kept but would need a page/component to work */}
                      <span className="btn btn-icon" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
                        <i className="fas fa-edit"></i> Edit
                      </span>
                      <button onClick={() => handleDelete(recipe.id)} className="btn btn-danger">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
