import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!user) return (
    <div className="container fade-in" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <p style={{ color: 'var(--text-muted)' }}>Please <a href="/login" style={{ color: 'var(--primary)' }}>log in</a> to upload recipes.</p>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video) return toast.error('Please select a video file');
    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    fd.append('video', video);
    setUploading(true);
    try {
      await axios.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round(e.loaded / e.total * 100))
      });
      toast.success('Recipe uploaded successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); setProgress(0); }
  };

  return (
    <div className="container fade-in">
      <div className="upload-container">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Share Your Recipe Video</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Recipe Title</label>
            <input
              type="text"
              id="title"
              className="form-control"
              placeholder="e.g., Authentic Italian Carbonara"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Steps & Ingredients</label>
            <textarea
              id="description"
              className="form-control"
              rows="6"
              placeholder="List ingredients and cooking steps..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Upload Video (MP4, AVI, MOV)</label>
            <div
              className="drop-zone"
              onClick={() => document.getElementById('video').click()}
            >
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
              <p>{video ? video.name : 'Click to select video file'}</p>
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={e => setVideo(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {uploading && (
            <div style={{ marginTop: '1rem' }}>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                Uploading: {progress}%
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {uploading ? 'Uploading...' : 'Upload Recipe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
