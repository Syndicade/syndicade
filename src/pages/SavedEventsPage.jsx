import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { mascotSuccessToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { Bookmark, Calendar, MapPin, ExternalLink } from 'lucide-react';

function SavedEventsPage() {
  var navigate = useNavigate();
  var { isDark } = useTheme();

  var [saves, setSaves]     = useState([]);
  var [loading, setLoading] = useState(true);
  var [removing, setRemoving] = useState(null);

  var bg       = isDark ? '#0E1523' : '#F8FAFC';
  var cardBg   = isDark ? '#1A2035' : '#FFFFFF';
  var border   = isDark ? '#2A3550' : '#E2E8F0';
  var textPri  = isDark ? '#FFFFFF'  : '#0F172A';
  var textSec  = isDark ? '#CBD5E1'  : '#475569';
  var textMute = isDark ? '#64748B'  : '#94A3B8';

  useEffect(function() {
    loadSaves();
  }, []);

  async function loadSaves() {
    setLoading(true);
    var { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    var { data, error } = await supabase
      .from('event_saves')
      .select('id, events(id, title, start_time, location, organizations(id, name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { toast.error('Could not load saved events.'); }
    else { setSaves(data || []); }
    setLoading(false);
  }

  async function handleRemove(saveId, eventTitle) {
    setRemoving(saveId);
    var { error } = await supabase.from('event_saves').delete().eq('id', saveId);
    if (error) {
      toast.error('Could not remove event.');
    } else {
      setSaves(function(prev) { return prev.filter(function(s) { return s.id !== saveId; }); });
      mascotSuccessToast('Removed from saved events.');
    }
    setRemoving(null);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function SkeletonCard() {
    return (
      <div style={{ background: cardBg, border: '1px solid ' + border }} className="rounded-xl overflow-hidden animate-pulse">
        <div style={{ background: isDark ? '#1E2845' : '#E2E8F0', height: '160px' }} />
        <div className="p-4 space-y-3">
          <div style={{ background: isDark ? '#1E2845' : '#E2E8F0', height: '16px', borderRadius: '4px', width: '70%' }} />
          <div style={{ background: isDark ? '#1E2845' : '#E2E8F0', height: '12px', borderRadius: '4px', width: '50%' }} />
          <div style={{ background: isDark ? '#1E2845' : '#E2E8F0', height: '12px', borderRadius: '4px', width: '40%' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Bookmark size={22} style={{ color: '#F5B731' }} aria-hidden="true" />
            <h1 className="text-2xl font-extrabold" style={{ color: textPri }}>Saved Events</h1>
          </div>
          <p className="text-sm" style={{ color: textSec }}>Events you've bookmarked for later.</p>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4].map(function(i) { return <SkeletonCard key={i} />; })}
          </div>
        )}

        {/* Empty state */}
        {!loading && saves.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <img
              src="/mascots-empty.png"
              alt=""
              aria-hidden="true"
              style={{ maxWidth: '220px', marginBottom: '24px' }}
            />
            <h2 className="text-xl font-bold mb-2" style={{ color: textPri }}>No saved events yet</h2>
            <p className="text-sm mb-6 max-w-xs" style={{ color: textSec }}>
              Bookmark events while browsing and they'll show up here for easy access.
            </p>
            <button
              onClick={function() { navigate('/discover'); }}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Browse Events
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && saves.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {saves.map(function(save) {
              var evt = save.events;
              if (!evt) return null;
              var org = evt.organizations;
              var orgInitials = org?.name ? org.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0,2).toUpperCase() : '?';

              return (
                <article
                  key={save.id}
                  style={{ background: cardBg, border: '1px solid ' + border }}
                  className="rounded-xl overflow-hidden flex flex-col"
                  aria-label={evt.title + ' saved event'}
                >
                  {/* Cover image */}
                  <div
                    style={{ height: '160px', background: isDark ? '#1E2845' : '#E2E8F0', position: 'relative', cursor: 'pointer' }}
                    onClick={function() { navigate('/events/' + evt.id); }}
                    role="link"
                    tabIndex={0}
                    aria-label={'View ' + evt.title}
                    onKeyDown={function(e) { if (e.key === 'Enter') navigate('/events/' + evt.id); }}
                  >
                    {evt.cover_image_url
                      ? <img src={evt.cover_image_url} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Calendar size={32} style={{ color: textMute }} aria-hidden="true" />
                        </div>
                    }

                    {/* Remove button */}
                    <button
                      onClick={function(e) { e.stopPropagation(); handleRemove(save.id, evt.title); }}
                      disabled={removing === save.id}
                      aria-label={'Remove ' + evt.title + ' from saved events'}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Bookmark
                        size={16}
                        fill={removing === save.id ? 'none' : '#F5B731'}
                        style={{ color: removing === save.id ? textMute : '#F5B731' }}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h2
                      className="font-bold text-sm mb-2 leading-snug cursor-pointer hover:underline"
                      style={{ color: textPri }}
                      onClick={function() { navigate('/events/' + evt.id); }}
                    >
                      {evt.title}
                    </h2>

                    {/* Org row */}
                    <div className="flex items-center gap-2 mb-3">
                      {org?.logo_url
                        ? <img src={org.logo_url} alt="" aria-hidden="true" className="w-5 h-5 rounded-full object-cover" />
                        : <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#3B82F6', color: '#fff', fontSize: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{orgInitials}</div>
                      }
                      <span className="text-xs truncate" style={{ color: textSec }}>{org?.name || 'Unknown org'}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar size={12} style={{ color: textMute }} aria-hidden="true" />
                      <span className="text-xs" style={{ color: textMute }}>{formatDate(evt.start_time)}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} style={{ color: textMute }} aria-hidden="true" />
                      <span className="text-xs truncate" style={{ color: textMute }}>
                        {evt.location || 'Location TBD'}
                      </span>
                    </div>

                    {/* View button */}
                    <div className="mt-auto pt-4">
                      <button
                        onClick={function() { navigate('/events/' + evt.id); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        <ExternalLink size={13} aria-hidden="true" />
                        View Event
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}

export default SavedEventsPage;