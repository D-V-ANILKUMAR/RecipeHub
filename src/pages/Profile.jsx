import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', gender: '', phone_number: '' });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    axios.get('/api/profile')
      .then(res => {
        setProfile(res.data.user);
        setForm({
          full_name: res.data.user.full_name || '',
          email: res.data.user.email || '',
          gender: res.data.user.gender || '',
          phone_number: res.data.user.phone_number || ''
        });
      })
      .catch(() => toast.error('Failed to load profile'));
  }, [user]);

  if (!user) return (
    <div className="container fade-in" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <p style={{ color: 'var(--text-muted)' }}>Please <a href="/login" style={{ color: 'var(--primary)' }}>log in</a> to view your profile.</p>
    </div>
  );

  if (!profile) return <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>Loading...</div>;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append('full_name', form.full_name);
    fd.append('email', form.email);
    fd.append('gender', form.gender);
    fd.append('phone_number', form.phone_number);
    if (photo) fd.append('profile_photo', photo);

    try {
      const { data } = await axios.post('/api/update_profile', fd);
      toast.success(data.message);
      setProfile(data.user);
      setUser(u => ({ ...u, ...data.user }));
      setPhoto(null);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = profile.profile_photo
    ? `/static/uploads/profiles/${profile.profile_photo}`
    : `https://ui-avatars.com/api/?name=${profile.username}&background=4f46e5&color=fff&size=150`;

  return (
    <div className="container fade-in" style={{ maxWidth: '700px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}><i className="fas fa-id-card"></i> Your Identity</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your culinary profile and personal preferences.</p>
      </div>

      <div className="profile-card" style={{ position: 'relative', padding: '3rem' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', filter: 'blur(50px)', opacity: 0.1 }}></div>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 1.5rem', borderRadius: '50%', padding: '5px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fff' }}>
              <img src={avatarSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{profile.username}</h2>
          <span className={`badge ${profile.role === 'admin' ? 'badge-admin' : 'badge-primary'}`} style={{ fontSize: '0.9rem' }}>
            <i className={`fas ${profile.role === 'admin' ? 'fa-user-shield' : 'fa-user'}`}></i> {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Member
          </span>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="full_name"><i className="fas fa-signature"></i> Full Name</label>
            <input
              type="text"
              id="full_name"
              className="form-control"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="E.g. Chef Alessandro"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email"><i className="fas fa-envelope-open-text"></i> Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="chef@recipehub.com"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label htmlFor="gender"><i className="fas fa-venus-mars"></i> Gender</label>
              <select
                id="gender"
                className="form-control"
                style={{ appearance: 'none' }}
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Mixed/Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="phone_number"><i className="fas fa-phone-alt"></i> Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                className="form-control"
                value={form.phone_number}
                onChange={e => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label><i className="fas fa-cloud-upload-alt"></i> Update Profile Photo</label>
            <div
              className="drop-zone"
              style={{ padding: '1.5rem' }}
              onClick={() => document.getElementById('profile_photo').click()}
            >
              <i className="fas fa-image" style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}></i>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {photo ? photo.name : 'Click to choose a new photo'}
              </p>
              <input
                type="file"
                id="profile_photo"
                accept="image/*"
                onChange={e => setPhoto(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ width: '100%', borderRadius: '18px', padding: '1.2rem' }}
            >
              <i className="fas fa-save"></i> {saving ? 'Saving...' : 'Preserve Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
