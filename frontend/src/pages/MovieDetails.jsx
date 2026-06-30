import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bookmark, Calendar, Plus, Check, X, AlertCircle, Eye, HelpCircle,
  Trash2, Meh, Film, ThumbsUp, Trophy, Skull, Frown, Flame
} from 'lucide-react';
import { API_URL, getPosterUrl, getBackdropUrl, getAuthHeaders, RATINGS } from '../config';
import { useAuth } from '../context/AuthContext';
import RatingBadge from '../components/RatingBadge';

const RATING_ICONS = {
  Trash2,
  Meh,
  Film,
  ThumbsUp,
  Trophy,
  HelpCircle
};

const STICKER_ICONS = {
  Skull,
  Frown,
  Trash2,
  Flame
};

export default function MovieDetails() {
  const { id, mediaType } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form states for Logging
  const [rating, setRating] = useState(3);
  const [watchedDate, setWatchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewText, setReviewText] = useState('');
  const [logError, setLogError] = useState('');

  // Interactive Drag & Drop Corkboard States
  const [stickyNotes, setStickyNotes] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const corkboardRef = useRef(null);

  // Fetch Movie Details
  const { data: movie, isLoading: detailsLoading, error: detailsError } = useQuery({
    queryKey: ['movieDetails', id, mediaType || 'auto'],
    queryFn: async () => {
      const url = mediaType ? `${API_URL}/media/${mediaType}/${id}` : `${API_URL}/movies/${id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Film or show not found');
      return res.json();
    }
  });

  // Detect actual media type from backend response
  const detectedMediaType = movie?.media_type || mediaType || 'movie';

  // Determine if film is upcoming (released in the future)
  const movieDate = movie?.release_date || movie?.first_air_date;
  const isUpcoming = movieDate ? new Date(movieDate) > new Date() : false;

  // Set default rating to 0 (no rating) if upcoming
  useEffect(() => {
    if (isUpcoming) {
      setRating(0);
    } else {
      setRating(3);
    }
  }, [isUpcoming]);

  // Fetch excited state and count for upcoming films
  const { data: excitedData } = useQuery({
    queryKey: ['excitedState', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${id}/excited`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return res.json();
      return { count: 0, excited: false };
    },
    enabled: !!movie && isUpcoming
  });

  // Toggle Excited state
  const excitedMutation = useMutation({
    queryKey: ['toggleExcited', id],
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/diary/toggle-watched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ tmdb_movie_id: parseInt(id) })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['excitedState', id] });
    }
  });

  // Fetch Movie Credits
  const { data: credits } = useQuery({
    queryKey: ['movieCredits', id, detectedMediaType],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/media/${detectedMediaType}/${id}/credits`);
      if (res.ok) return res.json();
      return { cast: [], crew: [] };
    },
    enabled: !!movie
  });

  // Fetch Movie Recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['movieRecommendations', id, detectedMediaType],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/media/${detectedMediaType}/${id}/recommendations`);
      if (res.ok) return res.json();
      return { results: [] };
    },
    enabled: !!movie
  });

  // Fetch Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['movieReviews', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/reviews/movie/${id}`);
      if (res.ok) return res.json();
      return [];
    }
  });

  // Check if log modal should open immediately (from Global Log button redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('log') === 'true' && user && movie) {
      setIsLogModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [movie, user]);

  // Sync reviews to interactive sticky notes state
  useEffect(() => {
    if (reviews) {
      const colors = ['#ff007f', '#ffee00', '#00ff66', '#00f2fe', '#ffffff'];
      const isMobile = window.innerWidth < 768;
      const colsCount = isMobile ? 1 : 3;
      const colWidth = isMobile ? 40 : 280;
      const rowHeight = isMobile ? 220 : 280;

      const notes = reviews.map((rev, idx) => {
        const col = idx % colsCount;
        const row = Math.floor(idx / colsCount);
        return {
          id: rev.id,
          username: rev.username,
          avatar_url: rev.avatar_url,
          rating: rev.rating,
          review_text: rev.review_text,
          created_at: rev.created_at,
          color: colors[idx % colors.length],
          rotation: (Math.random() * 8 - 4).toFixed(1),
          // Set grid placement coordinates (responsive offsets)
          x: col * colWidth + (Math.random() * 20) + (isMobile ? 15 : 30),
          y: row * rowHeight + (Math.random() * 25) + 30,
          stickers: []
        };
      });
      setStickyNotes(notes);
    }
  }, [reviews]);

  // Fetch user Watchlist
  const { data: watchlistState } = useQuery({
    queryKey: ['watchlistState', id],
    queryFn: async () => {
      if (!user) return { onWatchlist: false };
      const res = await fetch(`${API_URL}/watchlist/check/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return res.json();
      return { onWatchlist: false };
    },
    enabled: !!user
  });

  // Fetch user Watched state
  const { data: watchedState } = useQuery({
    queryKey: ['watchedState', id],
    queryFn: async () => {
      if (!user) return { watched: false };
      const res = await fetch(`${API_URL}/diary/check/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return res.json();
      return { watched: false };
    },
    enabled: !!user && !isUpcoming
  });

  // Fetch rating distribution
  const { data: distributionData } = useQuery({
    queryKey: ['movieDistribution', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/reviews/movie/${id}/distribution`);
      if (res.ok) return res.json();
      return { total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    },
    enabled: !isUpcoming
  });

  // Toggle watchlist
  const watchlistMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/watchlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ tmdb_movie_id: parseInt(id) })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlistState', id] });
    }
  });

  // Toggle watched state
  const watchedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/diary/toggle-watched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ tmdb_movie_id: parseInt(id) })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchedState', id] });
      queryClient.invalidateQueries({ queryKey: ['movieReviews', id] });
      queryClient.invalidateQueries({ queryKey: ['movieDistribution', id] });
    }
  });

  // Log movie
  const logMutation = useMutation({
    mutationFn: async (logData) => {
      const res = await fetch(`${API_URL}/diary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(logData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log movie');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieReviews', id] });
      queryClient.invalidateQueries({ queryKey: ['movieDistribution', id] });
      setIsLogModalOpen(false);
      setReviewText('');
      setLogError('');
    },
    onError: (err) => {
      setLogError(err.message);
    }
  });

  const handleLogSubmit = (e) => {
    e.preventDefault();
    logMutation.mutate({
      tmdb_movie_id: parseInt(id),
      rating,
      watched_date: watchedDate,
      review_text: reviewText
    });
  };

  // Drag & Drop Mouse Handlers
  const handleMouseDown = (noteId, e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('a')) return;

    setDraggingId(noteId);
    const note = stickyNotes.find(n => n.id === noteId);
    if (note) {
      dragOffsetRef.current = {
        x: e.clientX - note.x,
        y: e.clientY - note.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!draggingId) return;

    setStickyNotes(prevNotes =>
      prevNotes.map(n => {
        if (n.id === draggingId) {
          let newX = e.clientX - dragOffsetRef.current.x;
          let newY = e.clientY - dragOffsetRef.current.y;

          if (corkboardRef.current) {
            const rect = corkboardRef.current.getBoundingClientRect();
            const maxX = rect.width - 245;
            newX = Math.max(10, Math.min(newX, maxX));

            const maxY = corkboardRef.current.clientHeight - 200;
            newY = Math.max(10, Math.min(newY, maxY));
          }

          return {
            ...n,
            x: newX,
            y: newY
          };
        }
        return n;
      })
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Touch Handlers for Mobile Drag & Drop
  const handleTouchStart = (noteId, e) => {
    if (e.touches.length !== 1) return;
    if (e.target.closest('button') || e.target.closest('a')) return;

    const touch = e.touches[0];
    setDraggingId(noteId);
    const note = stickyNotes.find(n => n.id === noteId);
    if (note) {
      dragOffsetRef.current = {
        x: touch.clientX - note.x,
        y: touch.clientY - note.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!draggingId) return;
    if (e.touches.length !== 1) return;

    // Prevent default scroll behavior while dragging sticky note
    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    setStickyNotes(prevNotes =>
      prevNotes.map(n => {
        if (n.id === draggingId) {
          let newX = touch.clientX - dragOffsetRef.current.x;
          let newY = touch.clientY - dragOffsetRef.current.y;

          if (corkboardRef.current) {
            const rect = corkboardRef.current.getBoundingClientRect();
            const maxX = rect.width - 245;
            newX = Math.max(10, Math.min(newX, maxX));

            const maxY = corkboardRef.current.clientHeight - 200;
            newY = Math.max(10, Math.min(newY, maxY));
          }

          return {
            ...n,
            x: newX,
            y: newY
          };
        }
        return n;
      })
    );
  };

  const handleTouchEnd = () => {
    setDraggingId(null);
  };

  const renderActionButtons = () => {
    if (!user) {
      return (
        <div className="text-center bg-black border-2 border-white p-4 font-mono">
          <p className="text-[10px] text-brand-text mb-3 uppercase">Sign in to rate films, bookmark watchlists, and log reviews.</p>
          <Link
            to="/login"
            className="block bg-white text-black font-black text-xs py-2 border-2 border-white hover:bg-brutal-cyan hover:text-black transition-colors uppercase"
          >
            Sign In to PlotHole
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-3 font-mono">
        {/* Watched Button OR Excited Button */}
        {isUpcoming ? (
          <button
            onClick={() => excitedMutation.mutate()}
            className={`w-full py-2.5 border-3 flex items-center justify-center gap-2 font-black text-xs uppercase transition-all duration-150 shadow-[4px_4px_0px_#000] ${
              excitedData?.excited
                ? 'bg-brutal-pink border-white text-black translate-x-1 translate-y-1 shadow-none'
                : 'bg-black border-white text-white hover:bg-brutal-pink hover:text-black'
            }`}
          >
            <Flame className={`w-4 h-4 ${excitedData?.excited ? 'fill-black' : ''}`} />
            <span>{excitedData?.excited ? 'Excited!' : 'Get Excited'}</span>
          </button>
        ) : (
          <button
            onClick={() => watchedMutation.mutate()}
            className={`w-full py-2.5 border-3 flex items-center justify-center gap-2 font-black text-xs uppercase transition-all duration-150 shadow-[4px_4px_0px_#000] ${
              watchedState?.watched
                ? 'bg-brutal-cyan border-white text-black translate-x-1 translate-y-1 shadow-none'
                : 'bg-black border-white text-white hover:bg-brutal-cyan hover:text-black'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{watchedState?.watched ? 'Watched' : 'Mark as Watched'}</span>
          </button>
        )}

        {/* Watchlist Button */}
        <button
          onClick={() => watchlistMutation.mutate()}
          className={`w-full py-2.5 border-3 flex items-center justify-center gap-2 font-black text-xs uppercase transition-all duration-150 shadow-[4px_4px_0px_#000] ${
            watchlistState?.onWatchlist
              ? 'bg-brutal-pink border-white text-black translate-x-1 translate-y-1 shadow-none'
              : 'bg-black border-white text-white hover:bg-brutal-pink hover:text-black'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{watchlistState?.onWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>

        {/* Log Movie Button */}
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="w-full bg-brutal-yellow hover:bg-white text-black border-3 border-white py-2.5 flex items-center justify-center gap-2 font-black text-xs uppercase transition-all duration-150 shadow-[4px_4px_0px_#000]"
        >
          <span>{isUpcoming ? 'Hype Comment' : 'Yell About This'}</span>
        </button>
      </div>
    );
  };

  // Add Sticker to a note
  const slapSticker = (noteId, iconKey) => {
    setStickyNotes(prevNotes =>
      prevNotes.map(n => {
        if (n.id === noteId) {
          return {
            ...n,
            stickers: [
              ...n.stickers,
              {
                icon: iconKey,
                top: Math.random() * 65 + 15,
                left: Math.random() * 65 + 15,
                rotation: Math.random() * 60 - 30
              }
            ]
          };
        }
        return n;
      })
    );
  };

  if (detailsLoading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center animate-pulse text-white font-mono uppercase">
        <h2 className="text-xl">LOADING FILM FROM MAIN DATA GRID...</h2>
      </div>
    );
  }

  if (detailsError || !movie) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-6 py-12 text-left">
        <div className="p-6 bg-red-600/10 border-4 border-red-500 text-red-500 rounded-none flex items-start gap-4">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-extrabold text-xl uppercase">CRITICAL SYSTEM ERROR</h3>
            <p className="text-sm mt-1">{detailsError?.message || 'COULD NOT RETRIEVE FILM DATA.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const creatorNames = movie.created_by?.map(c => c.name).join(', ');
  const director = creatorNames || credits?.crew?.find(person => person.job === 'Director')?.name || 'Unknown';
  const displayCast = credits?.cast?.slice(0, 5) || [];
  const recMovies = recommendations?.results?.slice(0, 4) || [];

  const displayTitle = movie.title || movie.name;
  const displayReleaseDate = movie.release_date || movie.first_air_date;
  const displayRuntime = movie.runtime || (movie.episode_run_time ? movie.episode_run_time[0] : null) || 'N/A';

  // Responsive board height based on sticky note count
  const isMobileBoard = typeof window !== 'undefined' && window.innerWidth < 768;
  const boardCols = isMobileBoard ? 1 : 3;
  const boardRowHeight = isMobileBoard ? 220 : 280;
  const boardHeight = Math.max(600, (Math.ceil(reviews.length / boardCols) * boardRowHeight) + 120);

  return (
    <div 
      className="flex-1 relative pb-32 text-left"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Blurry Backdrop Header */}
      <div className="relative h-[250px] w-full overflow-hidden border-b-4 border-white">
        <img
          src={getBackdropUrl(movie.backdrop_path)}
          alt={displayTitle}
          className="w-full h-full object-cover grayscale brightness-50"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-24 relative z-10">
        
        {/* EXAGGERATED WARPED SERIF TITLE */}
        <div className="relative mb-12">
          <h1 
            className="font-serif text-3xl md:text-7xl font-black text-white uppercase tracking-tighter scale-y-110 skew-x-3 rotate-1 transform leading-none block break-words border-b-8 border-white pb-6 z-20 relative bg-black/40 p-4"
            style={{ textShadow: '4px 4px 0px #ff007f, 8px 8px 0px #00f2fe' }}
          >
            {displayTitle}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Left Column: Poster & Mobile Quick Actions */}
          <div className="md:col-span-1 max-w-sm mx-auto md:max-w-none w-full space-y-6">
            <div className="border-4 border-white bg-black aspect-[2/3] overflow-hidden rounded-none shadow-[8px_8px_0px_#000]">
              <img
                src={getPosterUrl(movie.poster_path)}
                alt={displayTitle}
                className="w-full h-full object-cover bitmap-hover"
              />
            </div>
            {/* Quick action buttons for mobile only */}
            <div className="block md:hidden bg-brand-card brutal-border p-4">
              {renderActionButtons()}
            </div>
          </div>

          {/* Center Column: Movie Details */}
          <div className="md:col-span-2 space-y-8 brutal-border p-6 rounded-none font-mono">
            <div className="space-y-2 border-b-2 border-white pb-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-white uppercase">
                <span className="bg-white text-black px-2 py-0.5 font-black">
                  RELEASE: {displayReleaseDate ? displayReleaseDate.split('-')[0] : 'N/A'}
                </span>
                <span>•</span>
                <span>RUNTIME: {displayRuntime} MINS</span>
              </div>
              <p className="text-sm font-black text-brutal-cyan uppercase tracking-widest mt-2">
                {movie.created_by?.length > 0 ? 'CREATED BY' : 'DIRECTED BY'}: {director}
              </p>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs font-black tracking-widest uppercase bg-white text-black px-2 py-1 w-fit border border-black">
                FILM DOSSIER
              </h3>
              <p className="text-brand-text leading-relaxed text-sm">
                {movie.overview}
              </p>
            </div>

            {/* Cast List */}
            {displayCast.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black tracking-widest uppercase bg-white text-black px-2 py-1 w-fit border border-black">
                  OPERATING CAST
                </h3>
                <div className="flex flex-wrap gap-2">
                  {displayCast.map((actor, idx) => (
                    <span
                      key={idx}
                      className="border-2 border-white bg-black text-white px-3 py-1 text-xs font-bold uppercase"
                    >
                      {actor.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recMovies.length > 0 && (
              <div className="space-y-3 pt-4 border-t-2 border-white">
                <h3 className="text-xs font-black tracking-widest uppercase bg-white text-black px-2 py-1 w-fit border border-black">
                  RE-ROUTE SYSTEM (SIMILAR)
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {recMovies.map((rec) => (
                    <Link
                      key={rec.id}
                      to={`/media/${rec.media_type || 'movie'}/${rec.id}`}
                      className="border-2 border-white hover:border-brutal-pink transition-colors aspect-[2/3]"
                      title={rec.title || rec.name}
                    >
                      <img
                        src={getPosterUrl(rec.poster_path)}
                        alt={rec.title || rec.name}
                        className="w-full h-full object-cover bitmap-hover"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: User Interactions */}
          <div className="md:col-span-1 space-y-6">
            <div className="brutal-border p-6 space-y-6 rounded-none">
              
              {/* Verdict Section: Rating Distribution OR Upcoming Excited Counter */}
              {isUpcoming ? (
                <div className="pb-5 border-b-2 border-white text-left font-mono">
                  <span className="text-white text-xs font-black tracking-wider uppercase mb-3 block bg-white text-black px-2 py-0.5 w-fit">
                    Hype Index
                  </span>
                  <div className="border-3 border-white p-4 bg-brutal-pink text-black text-center font-black uppercase text-xs shadow-[3px_3px_0px_#000]">
                    <span className="block text-[9px] tracking-wider mb-1 text-black/70">RELEASE PENDING</span>
                    <div className="text-xl flex items-center justify-center gap-1.5 mt-1">
                      <Flame className="w-5 h-5 text-black animate-bounce fill-black" />
                      <span>{excitedData?.count || 0} Excited</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pb-5 border-b-2 border-white text-left font-mono">
                  <span className="text-white text-xs font-black tracking-wider uppercase mb-3 block bg-white text-black px-2 py-0.5 w-fit">
                    Community Verdict
                  </span>
                  
                  {distributionData && distributionData.total > 0 ? (
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-white mb-2 uppercase">
                        {distributionData.total} logs registered
                      </div>
                      {[5, 4, 3, 2, 1].map((ratingVal) => {
                        const opt = RATINGS[ratingVal];
                        const pct = distributionData.percentages[ratingVal] || 0;
                        
                        const barColors = {
                          1: 'bg-red-500',
                          2: 'bg-slate-500',
                          3: 'bg-amber-500',
                          4: 'bg-emerald-500',
                          5: 'bg-pink-500'
                        };

                        const RatingIcon = RATING_ICONS[opt.icon] || HelpCircle;

                        return (
                          <div key={ratingVal} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-black text-white">
                              <span className="flex items-center gap-1.5">
                                <RatingIcon className="w-3.5 h-3.5 text-white" />
                                <span className="uppercase tracking-widest text-brand-text-muted">{opt.label}</span>
                              </span>
                              <span>{pct}%</span>
                            </div>
                            {/* Progress bar line */}
                            <div className="h-3 w-full bg-black border-2 border-white overflow-hidden">
                              <div 
                                className={`h-full ${barColors[ratingVal]} transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-black border-2 border-white">
                      <p className="text-[10px] text-brand-text-muted font-bold leading-normal uppercase">
                        No ratings logged yet.<br />Be the first to rate!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons (visible on desktop, hidden on mobile since they are moved to under the poster) */}
              <div className="hidden md:block">
                {renderActionButtons()}
              </div>
            </div>
          </div>
        </div>

        {/* BRUTALIST COMMENT WALL / DIGITAL CORKBOARD */}
        <div className="mt-20 border-t-4 border-white pt-12">
          <div className="mb-8 font-mono">
            <h2 className="text-3xl font-black uppercase tracking-wider text-white inline-block bg-brutal-pink text-black px-4 py-2 border-3 border-white shadow-[6px_6px_0px_#000]">
              The Yelling Corkboard
            </h2>
            <p className="text-xs text-brand-text-muted mt-3 uppercase tracking-wider">
              📌 SLAP STICKERS AND DRAG POST-IT NOTES AROUND TO RE-ARRANGE INDEPENDENT REVIEWS.
            </p>
          </div>

          {stickyNotes.length === 0 ? (
            <div className="bg-brand-card border-3 border-white p-12 text-center text-brand-text-muted font-mono uppercase">
              No sticky notes on the wall yet. Be the first to yell!
            </div>
          ) : (
            <div 
              ref={corkboardRef}
              className="relative w-full bg-brand-card border-4 border-white overflow-hidden select-none bg-[radial-gradient(#1e263f_2px,transparent_2px)] [background-size:24px_24px]"
              style={{ height: `${boardHeight}px` }}
            >
              {stickyNotes.map((note) => {
                const opt = RATINGS[note.rating] || { icon: 'HelpCircle', label: 'Unrated' };
                const RatingIcon = RATING_ICONS[opt.icon] || HelpCircle;
                
                return (
                  <div
                    key={note.id}
                    onMouseDown={(e) => handleMouseDown(note.id, e)}
                    onTouchStart={(e) => handleTouchStart(note.id, e)}
                    className="absolute w-[240px] border-3 border-black p-4 select-none flex flex-col font-sans transition-shadow"
                    style={{
                      left: `${note.x}px`,
                      top: `${note.y}px`,
                      backgroundColor: note.color,
                      transform: `rotate(${note.rotation}deg)`,
                      boxShadow: draggingId === note.id ? '12px 12px 0px rgba(0,0,0,0.8)' : '6px 6px 0px rgba(0,0,0,0.9)',
                      zIndex: draggingId === note.id ? 999 : 10,
                      cursor: draggingId === note.id ? 'grabbing' : 'grab'
                    }}
                  >
                    {/* Texture overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%),linear-gradient(-45deg,rgba(0,0,0,0.15)_25%,transparent_25%)]" />

                    {/* Draggable Header */}
                    <div className="flex items-center gap-2 border-b border-black/20 pb-2 mb-2">
                      <img
                        src={note.avatar_url}
                        alt={note.username}
                        className="w-6 h-6 rounded-none border border-black"
                      />
                      <div className="min-w-0 text-left">
                        <Link 
                          to={`/profile/${note.username}`}
                          className="font-black text-xs text-black hover:underline truncate block"
                        >
                          @{note.username}
                        </Link>
                      </div>
                      
                      {/* Only display rating icon if it is not a pre-release rating (rating > 0) */}
                      {note.rating > 0 && (
                        <span className="ml-auto text-black" title={opt.label}>
                          <RatingIcon className="w-4 h-4 text-black" />
                        </span>
                      )}
                    </div>

                    {/* Review Body */}
                    <div className="text-left flex-1 min-h-[90px] max-h-[140px] overflow-y-auto pr-1">
                      <p className="text-xs text-black font-semibold leading-relaxed font-mono">
                        {note.review_text || 'Just logged this movie.'}
                      </p>
                    </div>

                    {/* Log Date */}
                    <div className="text-[9px] font-bold text-black/50 text-left mt-2 uppercase">
                      Logged: {new Date(note.created_at).toLocaleDateString()}
                    </div>

                    {/* Sticker Slaps */}
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-black/10">
                      <span className="text-[8px] font-black text-black uppercase">Slap:</span>
                      <div className="flex gap-1.5">
                        {Object.keys(STICKER_ICONS).map((iconKey) => {
                          const StickerButtonIcon = STICKER_ICONS[iconKey];
                          return (
                            <button
                              key={iconKey}
                              onClick={() => slapSticker(note.id, iconKey)}
                              className="hover:scale-125 transition-transform p-0.5 bg-white/70 hover:bg-white border border-black text-black"
                              title={`Slap ${iconKey} icon`}
                            >
                              <StickerButtonIcon className="w-3.5 h-3.5 text-black" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Absolutely Positioned Vector Stickers */}
                    {note.stickers.map((stk, sIdx) => {
                      const StickerIconComponent = STICKER_ICONS[stk.icon] || HelpCircle;
                      return (
                        <div
                          key={sIdx}
                          className="absolute pointer-events-none select-none z-[100]"
                          style={{
                            top: `${stk.top}%`,
                            left: `${stk.left}%`,
                            transform: `rotate(${stk.rotation}deg)`
                          }}
                        >
                          <div className="p-1 bg-white border-2 border-black rounded-lg shadow-md">
                            <StickerIconComponent className="w-5 h-5 text-black fill-black" />
                          </div>
                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Windows 95 Notepad Rating/Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="win95-notepad w-full max-w-lg animate-in zoom-in-95 duration-100">
            <div className="win95-titlebar font-sans">
              <span>{isUpcoming ? 'Hype_Comment.txt' : 'Write_Review.txt'} - Notepad</span>
              <div className="flex gap-1">
                <button className="win95-btn">_</button>
                <button className="win95-btn">[]</button>
                <button onClick={() => setIsLogModalOpen(false)} className="win95-btn">X</button>
              </div>
            </div>

            <div className="flex gap-3 px-2 py-1 text-black font-sans text-xs border-b border-gray-400 select-none">
              <span className="hover:bg-blue-800 hover:text-white px-1.5 cursor-default">File</span>
              <span className="hover:bg-blue-800 hover:text-white px-1.5 cursor-default">Edit</span>
              <span className="hover:bg-blue-800 hover:text-white px-1.5 cursor-default">Search</span>
              <span className="hover:bg-blue-800 hover:text-white px-1.5 cursor-default">Help</span>
            </div>

            <div className="p-4 space-y-4">
              {logError && (
                <div className="p-2 border-2 border-red-600 bg-red-600/10 text-red-500 font-mono text-[11px] uppercase">
                  [SYSTEM ERROR]: {logError}
                </div>
              )}

              <form onSubmit={handleLogSubmit} className="space-y-4 text-left font-mono">
                
                {/* Only display rating options if the movie is NOT upcoming */}
                {!isUpcoming ? (
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 mb-2">
                      VERDICT VALUE
                    </label>
                    <div className="flex flex-col gap-1.5 bg-white p-2 border border-gray-400 text-black">
                      {Object.keys(RATINGS).map((key) => {
                        const option = RATINGS[key];
                        const isSelected = rating === parseInt(key);
                        const OptIconComponent = RATING_ICONS[option.icon] || HelpCircle;
                        
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setRating(parseInt(key))}
                            className={`w-full py-1.5 px-3 border text-left font-bold text-xs uppercase flex justify-between items-center transition-colors ${
                              isSelected 
                                ? 'bg-brutal-cyan text-black border-black' 
                                : 'bg-white border-gray-300 hover:bg-gray-100 text-black'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <OptIconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-black'}`} />
                              <span>{option.label}</span>
                            </span>
                            {isSelected && <span className="text-[10px] font-black">[SELECTED]</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-brutal-pink/15 border-2 border-brutal-pink text-black text-xs font-bold uppercase">
                    [INFO]: Ratings disabled for upcoming releases. Add a hype comment below!
                  </div>
                )}

                {/* Date Selector */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-700 mb-2">
                    LOG DATE
                  </label>
                  <input
                    type="date"
                    required
                    value={watchedDate}
                    onChange={(e) => setWatchedDate(e.target.value)}
                    className="win95-textarea w-full px-3 py-1.5 text-black text-sm"
                  />
                </div>

                {/* Notepad Text Editor Area */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-700 mb-2">
                    YELL NOTES (TEXT AREA)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="win95-textarea w-full px-3 py-2 text-black text-sm resize-none focus:ring-0"
                    placeholder="Blink block cursor ready. Start typing..."
                  />
                </div>

                {/* Notepad bottom buttons */}
                <div className="flex justify-end gap-3 pt-2 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="win95-btn px-4 py-1.5 h-auto text-xs font-bold text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={logMutation.isPending}
                    className="win95-btn px-5 py-1.5 h-auto text-xs font-bold text-black"
                  >
                    {logMutation.isPending ? 'Saving...' : 'Save.txt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
