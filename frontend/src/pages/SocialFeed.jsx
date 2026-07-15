import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { API_URL, getAuthHeaders } from '../config';
import RatingBadge from '../components/RatingBadge';

export default function SocialFeed() {
  const { data: feed = [], isLoading, error } = useQuery({
    queryKey: ['socialFeed'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/social/feed`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to load social feed');
      return res.json();
    }
  });

  return (
    <div className="flex-1 max-w-3xl mx-auto px-6 py-12 text-left font-mono">
      <div className="flex items-center gap-3 mb-8 border-b-2 border-white/20 pb-4">
        <Users className="w-8 h-8 text-brutal-cyan" />
        <h1 className="text-2xl md:text-[32px] font-black text-white uppercase leading-tight">
          Friend Activity Feed
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-brand-card brutal-border" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 border-2 border-brutal-pink bg-brutal-pink/10 text-brutal-pink text-sm uppercase font-bold">
          [SYSTEM EXCEPTION]: {error.message}
        </div>
      ) : feed.length === 0 ? (
        <div className="brutal-border p-12 text-center text-brand-text-muted space-y-4 uppercase">
          <Users className="w-12 h-12 text-brand-text-muted mx-auto" />
          <h3 className="font-black text-lg text-white">Feed is Quiet</h3>
          <p className="text-sm max-w-md mx-auto font-bold">
            You don't see any activity because you aren't following anyone yet or your friends haven't logged any movies. Follow some users to see their reviews!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {feed.map((act, idx) => (
            <div key={idx} className="brutal-border p-6 flex gap-4 hover:border-brutal-pink/35 hover:shadow-[0_8px_25px_rgba(255,0,127,0.1)] hover:scale-[1.01] transition-all duration-300">
              <img
                src={act.avatar_url}
                alt={act.username}
                className="w-12 h-12 dithered-avatar shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3 border-b border-white/5 pb-2">
                  <Link to={`/profile/${act.username}`} className="font-extrabold text-white hover:text-brutal-cyan transition-colors text-sm uppercase">
                    @{act.username}
                  </Link>
                  
                  <span className="text-[10px] text-brand-text-muted uppercase font-bold">
                    {act.type === 'review' ? 'reviewed' : 'watched'}
                  </span>
                  
                  <Link to={`/media/movie/${act.tmdb_movie_id}`} className="font-bold text-brutal-cyan hover:underline text-sm uppercase">
                    Film #{act.tmdb_movie_id}
                  </Link>

                  {/* Custom Rating Badge */}
                  {act.rating && (
                    <div className="ml-auto">
                      <RatingBadge rating={act.rating} />
                    </div>
                  )}
                </div>

                {act.review_text && (
                  <p className="text-sm md:text-base text-brand-text leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 uppercase">
                    {act.review_text}
                  </p>
                )}

                <span className="block text-[10px] text-brand-text-muted mt-3 font-bold uppercase">
                  Logged: {new Date(act.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
