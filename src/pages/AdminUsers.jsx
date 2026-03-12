import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    axios.get('/api/admin/users')
      .then(res => setUsers(res.data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleRole = async (id) => {
    if (!window.confirm('Change this users role?')) return;
    try {
      await axios.post(`/api/admin/toggle_role/${id}`);
      toast.success('Role updated');
      load();
    } catch { toast.error('Failed to update role'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      await axios.delete(`/api/admin/delete_user/${id}`);
      toast.success('User deleted');
      load();
    } catch { toast.error('Failed to delete user'); }
  };

  if (!currentUser || currentUser.role !== 'admin') return (
    <div className="container fade-in" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <p style={{ color: '#dc2626', fontWeight: 600 }}>Admin access required</p>
    </div>
  );

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}><i className="fas fa-users-cog"></i> User Management</h1>
        <Link to="/dashboard" className="btn btn-primary"><i className="fas fa-arrow-left"></i> Back to Dashboard</Link>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', textAlign: 'left' }}>
                <th>User Info</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.username}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{user.full_name || 'No name set'}</div>
                  </td>
                  <td style={{ fontSize: '0.9rem' }}>
                    <div>{user.email || 'N/A'}</div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-admin' : ''}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    {user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : 'N/A'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => toggleRole(user.id)}
                        className="btn"
                        style={{ background: '#f1c40f', color: '#000', fontSize: '0.8rem' }}
                      >
                        <i className="fas fa-exchange-alt"></i> Toggle Role
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="btn btn-danger"
                          style={{ fontSize: '0.8rem' }}
                        >
                          <i className="fas fa-user-minus"></i> Delete
                        </button>
                      )}
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

export default AdminUsers;
