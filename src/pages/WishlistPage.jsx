import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Status config ───────────────────────────────────────────────
const STATUS = {
  planned:     { label: 'Planned',     color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  completed:   { label: 'Completed',   color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  reviewing:   { label: 'Under Review',color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  declined:    { label: 'Declined',    color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const CATEGORIES = ['All', 'Events', 'Members', 'Communications', 'Dashboard', 'Payments', 'Mobile', 'Other'];

// ─── Seed data (replace with Supabase fetch once table exists) ────
const SEED_IDEAS = [
  { id: 1, title: 'Recurring event templates', description: 'Save event settings as a template so weekly meetings are a one-click creation.', category: 'Events', status: 'in_progress', votes: 142, voted: false },
  { id: 2, title: 'Member birthday notifications', description: 'Automatically send birthday emails to members and notify admins.', category: 'Members', status: 'planned', votes: 98, voted: false },
  { id: 3, title: 'Bulk email campaigns', description: 'Send rich-text newsletters to all members or filtered segments.', category: 'Communications', status: 'planned', votes: 87, voted: false },
  { id: 4, title: 'Mobile app (iOS & Android)', description: 'Native apps with push notifications for events and announcements.', category: 'Mobile', status: 'reviewing', votes: 231, voted: false },
  { id: 5, title: 'Stripe payment integration', description: 'Collect dues, event fees, and donations through the platform.', category: 'Payments', status: 'in_progress', votes: 189, voted: false },
  { id: 6, title: 'Calendar export (Google / iCal)', description: 'One-click add-to-calendar for all events.', category: 'Events', status: 'completed', votes: 76, voted: false },
  { id: 7, title: 'Dark mode toggle', description: 'Let members choose between light and dark interface themes.', category: 'Dashboard', status: 'reviewing', votes: 64, voted: false },
  { id: 8, title: 'Member-to-member messaging', description: 'Private direct messages between organization members.', category: 'Members', status: 'planned', votes: 55, voted: false },
];

// ─── Sub-components ───────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse" aria-hidden="true">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-14 h-16 bg-white/10 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-4/5" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 bg-white/10 rounded-full" />
            <div className="h-5 w-24 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors = {
    success: 'bg-green-600 border-green-500',
    error:   'bg-red-700 border-red-500',
    info:    'bg-blue-700 border-blue-500',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-white text-sm font-medium transition-all ' + (colors[toast.type] || colors.info)}
    >
      {toast.type === 'success' && (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {toast.type === 'error' && (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span>{toast.message}</span>
      <button onClick={onDismiss} aria-label="Dismiss notification" className="ml-2 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white rounded">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function IdeaCard({ idea, onVote }) {
  const statusCfg = STATUS[idea.status] || STATUS.reviewing;

  return (
    <article
      className={'group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-500/40 rounded-xl p-5 transition-all duration-200 ' + (idea.status === 'completed' ? 'opacity-70' : '')}
      aria-label={'Feature request: ' + idea.title + ', ' + idea.votes + ' votes'}
    >
      <div className="flex gap-4">
        {/* Vote button */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onVote(idea.id)}
            disabled={idea.status === 'completed' || idea.status === 'declined'}
            aria-label={(idea.voted ? 'Remove vote from' : 'Vote for') + ' ' + idea.title}
            aria-pressed={idea.voted}
            className={
              'flex flex-col items-center justify-center w-14 h-16 rounded-lg border transition-all duration-150 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ' +
              (idea.voted
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 border-white/15 text-slate-400 hover:border-indigo-500/60 hover:text-indigo-300 hover:bg-indigo-500/10') +
              (idea.status === 'completed' || idea.status === 'declined' ? ' cursor-not-allowed opacity-50' : ' cursor-pointer')
            }
          >
            <svg className="w-4 h-4 mb-1" fill={idea.voted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            <span>{idea.votes}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base leading-snug mb-1">{idea.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">{idea.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' + statusCfg.color}>
              {statusCfg.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-white/10">
              {idea.category}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function SubmitModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Other' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    else if (form.title.trim().length < 10) e.title = 'Please be more descriptive (10+ chars).';
    if (!form.description.trim()) e.description = 'Description is required.';
    else if (form.description.trim().length < 20) e.description = 'Please add more detail (20+ chars).';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  }

  function handleChange(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
    >
      <div className="bg-slate-900 border border-white/15 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 id="submit-modal-title" className="text-white text-xl font-bold">Submit a Feature Idea</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="mb-4">
            <label htmlFor="idea-title" className="block text-sm font-medium text-slate-300 mb-1.5">
              Title <span aria-hidden="true" className="text-red-400">*</span>
            </label>
            <input
              id="idea-title"
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="A short, clear name for your idea"
              maxLength={120}
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
              className={'w-full bg-white/5 border rounded-lg px-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ' + (errors.title ? 'border-red-500' : 'border-white/15 hover:border-white/25')}
            />
            {errors.title && (
              <p id="title-error" role="alert" className="mt-1 text-xs text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="idea-desc" className="block text-sm font-medium text-slate-300 mb-1.5">
              Description <span aria-hidden="true" className="text-red-400">*</span>
            </label>
            <textarea
              id="idea-desc"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Describe the problem you're trying to solve and how this feature would help."
              rows={4}
              maxLength={600}
              aria-required="true"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'desc-error' : undefined}
              className={'w-full bg-white/5 border rounded-lg px-3.5 py-2.5 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ' + (errors.description ? 'border-red-500' : 'border-white/15 hover:border-white/25')}
            />
            {errors.description && (
              <p id="desc-error" role="alert" className="mt-1 text-xs text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div className="mb-6">
            <label htmlFor="idea-category" className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
            <select
              id="idea-category"
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              className="w-full bg-slate-800 border border-white/15 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/15 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {submitting ? 'Submitting...' : 'Submit Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function WishlistPage() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('all');
  const [sortBy, setSortBy] = useState('votes');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);

  // ── Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  // ── Load ideas (from Supabase if table exists, else seed data)
  useEffect(() => {
    async function loadIdeas() {
      setLoading(true);
      try {
        // NOTE: Uncomment when `wishlist_ideas` table is created in Supabase
        // const { data, error } = await supabase
        //   .from('wishlist_ideas')
        //   .select('*, wishlist_votes(user_id)')
        //   .order('vote_count', { ascending: false });
        // if (error) throw error;
        // const userId = (await supabase.auth.getUser()).data?.user?.id;
        // setIdeas(data.map(d => ({
        //   ...d,
        //   votes: d.vote_count,
        //   voted: d.wishlist_votes?.some(v => v.user_id === userId),
        // })));

        // Using seed data until Supabase table is ready:
        await new Promise(r => setTimeout(r, 800));
        setIdeas(SEED_IDEAS);
      } catch (err) {
        console.error('Error loading ideas:', err);
        showToast('error', 'Could not load ideas. Please try again.');
        setIdeas(SEED_IDEAS);
      } finally {
        setLoading(false);
      }
    }
    loadIdeas();
  }, []);

  function showToast(type, message) {
    setToast({ type, message });
  }

  function handleVote(ideaId) {
    if (!user) {
      showToast('info', 'Please sign in to vote for feature ideas.');
      return;
    }
    setIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea;
      const nowVoted = !idea.voted;
      return { ...idea, voted: nowVoted, votes: nowVoted ? idea.votes + 1 : idea.votes - 1 };
    }));
    // TODO: persist to supabase wishlist_votes table
    // await supabase.from('wishlist_votes').upsert({ idea_id: ideaId, user_id: user.id }) or delete
  }

  async function handleSubmitIdea(form) {
    if (!user) {
      showToast('info', 'Please sign in to submit ideas.');
      return;
    }
    try {
      const newIdea = {
        id: Date.now(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        status: 'reviewing',
        votes: 1,
        voted: true,
      };
      // TODO: persist to Supabase
      // await supabase.from('wishlist_ideas').insert({ ...newIdea, user_id: user.id });
      setIdeas(prev => [newIdea, ...prev]);
      setShowModal(false);
      showToast('success', 'Your idea has been submitted. Thanks!');
    } catch (err) {
      console.error('Submit error:', err);
      showToast('error', 'Could not submit idea. Please try again.');
    }
  }

  // ── Filter + sort
  const filtered = ideas
    .filter(idea => {
      const matchSearch = !search || idea.title.toLowerCase().includes(search.toLowerCase()) || idea.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === 'All' || idea.category === activeCategory;
      const matchStatus = activeStatus === 'all' || idea.status === activeStatus;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      if (sortBy === 'newest') return b.id - a.id;
      return 0;
    });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'reviewing', label: 'Under Review' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10">
        {/* Decorative background dots */}
        <div aria-hidden="true" className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="inline-block text-indigo-400 text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            Feature Wishlist
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Help shape{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Syndicade</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Vote on the features you need most, or submit your own ideas. We build what matters to our community.
          </p>
          <button
            onClick={() => {
              if (!user) { showToast('info', 'Please sign in to submit ideas.'); return; }
              setShowModal(true);
            }}
            aria-label="Submit a new feature idea"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Submit an Idea
          </button>
        </div>
      </div>

      {/* ── Stats bar */}
      <div className="bg-slate-900/50 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-6">
          {[
            { label: 'Total Ideas', value: ideas.length },
            { label: 'In Progress', value: ideas.filter(i => i.status === 'in_progress').length },
            { label: 'Completed', value: ideas.filter(i => i.status === 'completed').length },
            { label: 'Total Votes', value: ideas.reduce((s, i) => s + i.votes, 0) },
          ].map(stat => (
            <div key={stat.label} className="text-center" aria-label={stat.label + ': ' + stat.value}>
              <div className="text-2xl font-bold text-indigo-400">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6" role="search" aria-label="Filter feature ideas">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ideas..."
              aria-label="Search feature ideas"
              className="w-full bg-white/5 border border-white/15 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Status filter */}
          <select
            value={activeStatus}
            onChange={e => setActiveStatus(e.target.value)}
            aria-label="Filter by status"
            className="bg-slate-800 border border-white/15 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort ideas"
            className="bg-slate-800 border border-white/15 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <option value="votes">Most Voted</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ' +
                (activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10')
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Ideas list */}
        {loading ? (
          <div className="space-y-4" aria-label="Loading feature ideas" aria-busy="true">
            {[1, 2, 3, 4].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-5" aria-hidden="true">
              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">No ideas found</h2>
            <p className="text-slate-400 text-sm mb-6">
              {search ? 'Try a different search term or clear your filters.' : 'Be the first to suggest something!'}
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); setActiveStatus('all'); }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-slate-300 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3" aria-label={'Feature ideas, ' + filtered.length + ' results'}>
            {filtered.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitIdea}
        />
      )}

      {/* ── Toast */}
      {toast && (
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}