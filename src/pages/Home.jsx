import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// ── YouTube Modal ──────────────────────────────────────────────────────────────
const YouTubeModal = ({ videoId, onClose }) => {
  if (!videoId) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div style={{ position:'relative', width:'90%', maxWidth:860 }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-content">
          <div className="modal-iframe-wrap">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              allow="autoplay; fullscreen"
              title="YouTube video"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Local Recipe Card ──────────────────────────────────────────────────────────
const RecipeCard = ({ recipe }) => (
  <div className="card fade-in">
    <div className="video-container">
      <video controls preload="metadata">
        <source src={`/static/uploads/videos/${recipe.video_filename}`} type="video/mp4" />
      </video>
    </div>
    <div className="card-body">
      <h3 className="card-title">{recipe.title}</h3>
      <p className="card-text">{recipe.description}</p>
      <div className="card-footer">
        <span className="badge badge-primary">@{recipe.username}</span>
        <span style={{ fontSize:'0.8rem', color:'#94a3b8' }}>
          {recipe.created_at ? new Date(recipe.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''}
        </span>
      </div>
    </div>
  </div>
);

// ── YouTube Card ───────────────────────────────────────────────────────────────
const YouTubeCard = ({ video, onPlay }) => {
  const thumbnail = video.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
  return (
    <div className="card fade-in" onClick={() => onPlay(video.id)} style={{ cursor:'pointer' }}>
      <div className="thumbnail-container">
        <img src={thumbnail} alt={video.title} loading="lazy" />
        <div className="thumbnail-overlay">
          <span className="play-icon">▶</span>
        </div>
        {video.duration && (
          <span style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.8)', color:'white', fontSize:'0.72rem', fontWeight:700, padding:'0.1rem 0.4rem', borderRadius:4 }}>
            {video.duration}
          </span>
        )}
      </div>
      <div className="card-body">
        <h3 className="card-title" style={{ height:'3em', overflow:'hidden', lineHeight:1.4 }}>{video.title}</h3>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
          <span className="badge badge-youtube">YouTube</span>
          <span style={{ fontSize:'0.8rem', fontWeight:600 }}>{video.duration}</span>
        </div>
        <p style={{ fontSize:'0.85rem', color:'#64748b', margin:0 }}>{video.channel?.name}</p>
      </div>
    </div>
  );
};

// ── Home ───────────────────────────────────────────────────────────────────────
const Home = () => {
  const [localRecipes, setLocalRecipes] = useState([]);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  useEffect(() => {
    setLoading(true);
    if (query) {
      axios.get(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => {
          setLocalRecipes(res.data.local_recipes || []);
          setYoutubeVideos(res.data.youtube_recipes || []);
        })
        .catch(() => toast.error('Search failed'))
        .finally(() => setLoading(false));
    } else {
      axios.get('/api/recipes')
        .then(res => {
          setLocalRecipes(res.data.recipes || []);
          setYoutubeVideos(res.data.youtube_recipes || []);
        })
        .catch(() => toast.error('Failed to load recipes'))
        .finally(() => setLoading(false));
    }
  }, [query]);

  // Close modal on Escape key
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setActiveVideoId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="container fade-in">
      {/* Hero / Search header */}
      {query ? (
        <div style={{ marginBottom:'2rem' }}>
          <h2 style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--text-main)' }}>Results for "{query}"</h2>
          <p style={{ color:'var(--text-muted)' }}>Showing local and community results</p>
        </div>
      ) : (
        <div className="hero">
          <h1>The heart of the kitchen</h1>
          <p>Discover, share, and master new flavors with our community-driven recipe platform.</p>
        </div>
      )}

      {/* ── Local Recipes ── */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'2rem' }}>
          {Array(6).fill(0).map((_,i) => (
            <div key={i} style={{ background:'#fff', border:'1px solid var(--border-color)', borderRadius:'var(--radius)', overflow:'hidden' }}>
              <div style={{ paddingTop:'56.25%', background:'#f1f5f9', animation:'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ padding:'1.25rem' }}>
                {[70,50,90].map((w,j)=>(<div key={j} style={{ height:12, background:'#f1f5f9', borderRadius:6, marginBottom:'0.6rem', width:`${w}%`, animation:'pulse 1.4s ease-in-out infinite' }} />))}
              </div>
            </div>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
        </div>
      ) : (
        <div className="recipe-grid">
          {localRecipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
          {localRecipes.length === 0 && !query && (
            <p style={{ color:'var(--text-muted)', gridColumn:'1/-1', textAlign:'center', padding:'4rem' }}>No recipes yet. Be the first to upload!</p>
          )}
          {localRecipes.length === 0 && query && (
            <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>No local recipes matched your search.</p>
          )}
        </div>
      )}

      {/* ── YouTube Section ── */}
      {youtubeVideos.length > 0 && (
        <>
          <div className="section-header">
            <span className="yt-icon">{query ? '▶' : '🔥'}</span>
            {query ? 'Trending on YouTube' : 'Suggested Cooking Recipes'}
            <div className="section-divider" />
          </div>
          <div className="recipe-grid">
            {youtubeVideos.map((v,i) => <YouTubeCard key={v.id||i} video={v} onPlay={setActiveVideoId} />)}
          </div>
        </>
      )}

      {/* YouTube Player Modal */}
      <YouTubeModal videoId={activeVideoId} onClose={() => setActiveVideoId(null)} />
    </div>
  );
};

export default Home;
