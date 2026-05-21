import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

// ─── Theme constants ──────────────────────────────────────────────
var BG     = '#F8FAFC';
var CARD   = '#FFFFFF';
var BDR    = '#E2E8F0';
var ELEV   = '#F1F5F9';
var TEXT   = '#0E1523';
var TEXT2  = '#475569';
var MUTED  = '#64748B';
var YELLOW = '#F5B731';
var BLUE   = '#3B82F6';

// ─── Status config ────────────────────────────────────────────────
var STATUS = {
  planned:     { label: 'Planned',      bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
  in_progress: { label: 'In Progress',  bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  completed:   { label: 'Completed',    bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' },
  reviewing:   { label: 'Under Review', bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' },
  declined:    { label: 'Declined',     bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
};

var CATEGORIES = ['All', 'Events', 'Members', 'Communications', 'Dashboard', 'Payments', 'Mobile', 'Other'];

var STATUS_OPTIONS = [
  { value: 'all',         label: 'All Status' },
  { value: 'reviewing',   label: 'Under Review' },
  { value: 'planned',     label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
];

// ─── Seed data ────────────────────────────────────────────────────
var SEED_IDEAS = [
  { id: 1, title: 'Recurring event templates',     description: 'Save event settings as a template so weekly meetings are a one-click creation.', category: 'Events',         status: 'in_progress', votes: 142, voted: false },
  { id: 2, title: 'Member birthday notifications', description: 'Automatically send birthday emails to members and notify admins.',                 category: 'Members',        status: 'planned',     votes: 98,  voted: false },
  { id: 3, title: 'Bulk email campaigns',          description: 'Send rich-text newsletters to all members or filtered segments.',                  category: 'Communications', status: 'planned',     votes: 87,  voted: false },
  { id: 4, title: 'Mobile app (iOS & Android)',    description: 'Native apps with push notifications for events and announcements.',                category: 'Mobile',         status: 'reviewing',   votes: 231, voted: false },
  { id: 5, title: 'Stripe payment integration',    description: 'Collect dues, event fees, and donations through the platform.',                   category: 'Payments',       status: 'in_progress', votes: 189, voted: false },
  { id: 6, title: 'Calendar export (Google / iCal)', description: 'One-click add-to-calendar for all events.',                                    category: 'Events',         status: 'completed',   votes: 76,  voted: false },
  { id: 7, title: 'Dark mode toggle',              description: 'This was considered but the platform will remain light-theme only.',              category: 'Dashboard',      status: 'declined',    votes: 64,  voted: false },
  { id: 8, title: 'Member-to-member messaging',   description: 'Private direct messages between organization members.',                            category: 'Members',        status: 'planned',     votes: 55,  voted: false },
];

// ─── SkeletonCard ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse" aria-hidden="true">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-14 h-16 bg-slate-200 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-4/5" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
            <div className="h-5 w-24 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── IdeaCard ─────────────────────────────────────────────────────
function IdeaCard({ idea, onVote }) {
  var statusCfg = STATUS[idea.status] || STATUS.reviewing;
  var isDisabled = idea.status === 'completed' || idea.status === 'declined';

  return (
    <article
      role="listitem"
      className={'bg-white border border-slate-200 rounded-xl p-5 transition-all duration-200 ' + (isDisabled ? 'opacity-70' : 'hover:border-blue-200 hover:shadow-sm')}
      aria-label={'Feature request: ' + idea.title + ', ' + idea.votes + ' votes, status: ' + statusCfg.label}
    >
      <div className="flex gap-4">
        {/* Vote button */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onVote(idea.id)}
            disabled={isDisabled}
            aria-label={(idea.voted ? 'Remove vote from' : 'Vote for') + ' ' + idea.title}
            aria-pressed={idea.voted}
            className={
              'flex flex-col items-center justify-center w-14 h-16 rounded-lg border transition-all duration-150 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
              (idea.voted
                ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50') +
              (isDisabled ? ' cursor-not-allowed' : ' cursor-pointer')
            }
          >
            <svg
              className="w-4 h-4 mb-1"
              fill={idea.voted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            <span>{idea.votes}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 style={{ color: TEXT }} className="font-semibold text-base leading-snug mb-1">{idea.title}</h3>
          <p style={{ color: TEXT2 }} className="text-sm leading-relaxed mb-3">{idea.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{ background: statusCfg.bg, color: statusCfg.color, border: '1px solid ' + statusCfg.border }}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
            >
              {statusCfg.label}
            </span>
            <span
              style={{ background: ELEV, color: MUTED, border: '1px solid ' + BDR }}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
            >
              {idea.category}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── SubmitModal ──────────────────────────────────────────────────
function SubmitModal({ onClose, onSubmit }) {
  var [form, setForm] = useState({ title: '', description: '', category: 'Other' });
  var [errors, setErrors] = useState({});
  var [submitting, setSubmitting] = useState(false);

  function validate() {
    var e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    else if (form.title.trim().length < 10) e.title = 'Please be more descriptive (10+ characters).';
    if (!form.description.trim()) e.description = 'Description is required.';
    else if (form.description.trim().length < 20) e.description = 'Please add more detail (20+ characters).';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  }

  function handleChange(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => { var n = { ...prev }; delete n[field]; return n; });
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
    >
      <div
        style={{ background: CARD, border: '1px solid ' + BDR }}
        className="rounded-2xl shadow-xl w-full max-w-lg p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 id="submit-modal-title" style={{ color: TEXT }} className="text-xl font-bold">
            Submit a Feature Idea
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="mb-4">
            <label htmlFor="idea-title" style={{ color: TEXT2 }} className="block text-sm font-medium mb-1.5">
              Title <span aria-hidden="true" className="text-red-500">*</span>
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
              style={{ color: TEXT }}
              className={'w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ' + (errors.title ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300')}
            />
            {errors.title && (
              <p id="title-error" role="alert" className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="idea-desc" style={{ color: TEXT2 }} className="block text-sm font-medium mb-1.5">
              Description <span aria-hidden="true" className="text-red-500">*</span>
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
              style={{ color: TEXT }}
              className={'w-full border rounded-lg px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ' + (errors.description ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300')}
            />
            {errors.description && (
              <p id="desc-error" role="alert" className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div className="mb-6">
            <label htmlFor="idea-category" style={{ color: TEXT2 }} className="block text-sm font-medium mb-1.5">
              Category
            </label>
            <select
              id="idea-category"
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              style={{ color: TEXT, background: CARD, border: '1px solid ' + BDR }}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
  var [ideas, setIdeas]               = useState([]);
  var [loading, setLoading]           = useState(true);
  var [search, setSearch]             = useState('');
  var [activeCategory, setActiveCategory] = useState('All');
  var [activeStatus, setActiveStatus] = useState('all');
  var [sortBy, setSortBy]             = useState('votes');
  var [showModal, setShowModal]       = useState(false);
  var [user, setUser]                 = useState(null);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  // Load ideas
  useEffect(() => {
    async function loadIdeas() {
      setLoading(true);
      try {
        // NOTE: Uncomment when `wishlist_ideas` table is created in Supabase:
        // const { data, error } = await supabase
        //   .from('wishlist_ideas')
        //   .select('*, wishlist_votes(user_id)')
        //   .order('votes', { ascending: false });
        // if (error) throw error;
        // const userId = (await supabase.auth.getUser()).data?.user?.id;
        // setIdeas(data.map(d => ({
        //   ...d,
        //   voted: d.wishlist_votes?.some(v => v.user_id === userId),
        // })));

        await new Promise(r => setTimeout(r, 700));
        setIdeas(SEED_IDEAS);
      } catch (err) {
        console.error('Error loading ideas:', err);
        mascotErrorToast('Could not load ideas.', 'Please refresh and try again.');
        setIdeas(SEED_IDEAS);
      } finally {
        setLoading(false);
      }
    }
    loadIdeas();
  }, []);

  function handleVote(ideaId) {
    if (!user) {
      toast.error('Sign in to vote for feature ideas.');
      return;
    }
    setIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea;
      var nowVoted = !idea.voted;
      return { ...idea, voted: nowVoted, votes: nowVoted ? idea.votes + 1 : idea.votes - 1 };
    }));
    // TODO: persist to supabase wishlist_votes
  }

  async function handleSubmitIdea(form) {
    if (!user) {
      toast.error('Sign in to submit ideas.');
      return;
    }
    try {
      var newIdea = {
        id: Date.now(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        status: 'reviewing',
        votes: 1,
        voted: true,
      };
      // TODO: persist to Supabase wishlist_ideas
      setIdeas(prev => [newIdea, ...prev]);
      setShowModal(false);
      mascotSuccessToast('Idea submitted!', 'Thanks for helping shape Syndicade.');
    } catch (err) {
      console.error('Submit error:', err);
      mascotErrorToast('Could not submit idea.', 'Please try again.');
    }
  }

  // Filter + sort
  var filtered = ideas
    .filter(idea => {
      var q = search.toLowerCase();
      var matchSearch = !search ||
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q);
      var matchCategory = activeCategory === 'All' || idea.category === activeCategory;
      var matchStatus   = activeStatus === 'all'   || idea.status === activeStatus;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'votes')  return b.votes - a.votes;
      if (sortBy === 'newest') return b.id - a.id;
      return 0;
    });

  var totalVotes    = ideas.reduce((s, i) => s + i.votes, 0);
  var inProgressCt  = ideas.filter(i => i.status === 'in_progress').length;
  var completedCt   = ideas.filter(i => i.status === 'completed').length;

  return (
    <div style={{ background: BG }} className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ background: CARD, borderBottom: '1px solid ' + BDR }} className="py-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section label */}
          <p style={{ color: YELLOW, letterSpacing: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
            Feature Wishlist
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <h1 style={{ color: TEXT, fontSize: '32px', fontWeight: 800, lineHeight: 1.2, marginBottom: '8px' }}>
                Help shape{' '}
                <span style={{ color: TEXT }}>Syndi</span>
                <span style={{ color: YELLOW }}>cade</span>
              </h1>
              <p style={{ color: TEXT2, fontSize: '16px', maxWidth: '480px', lineHeight: 1.6 }}>
                Vote on the features you need most, or submit your own ideas. We build what matters to our community.
              </p>
            </div>
            <button
              onClick={() => {
                if (!user) { toast.error('Sign in to submit ideas.'); return; }
                setShowModal(true);
              }}
              aria-label="Submit a new feature idea"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Submit an Idea
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <div style={{ background: ELEV, borderBottom: '1px solid ' + BDR }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center" aria-label={'Total ideas: ' + ideas.length}>
              <div className="text-3xl font-extrabold text-blue-600">{ideas.length}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-1">Total Ideas</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center" aria-label={'In progress: ' + inProgressCt}>
              <div className="text-3xl font-extrabold text-amber-600">{inProgressCt}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-1">In Progress</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center" aria-label={'Completed: ' + completedCt}>
              <div className="text-3xl font-extrabold text-green-600">{completedCt}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-1">Completed</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center" aria-label={'Total votes: ' + totalVotes}>
              <div className="text-3xl font-extrabold text-purple-600">{totalVotes}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-1">Total Votes</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5" role="search" aria-label="Filter feature ideas">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ideas..."
              aria-label="Search feature ideas"
              style={{ color: TEXT }}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-slate-300"
            />
          </div>

          {/* Status filter */}
          <select
            value={activeStatus}
            onChange={e => setActiveStatus(e.target.value)}
            aria-label="Filter by status"
            style={{ color: TEXT2, background: CARD, border: '1px solid ' + BDR }}
            className="rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort ideas"
            style={{ color: TEXT2, background: CARD, border: '1px solid ' + BDR }}
            className="rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="votes">Most Voted</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-5" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border ' +
                (activeCategory === cat
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600')
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        {!loading && (
          <p style={{ color: MUTED, fontSize: '13px', marginBottom: '16px' }} aria-live="polite">
            {filtered.length === ideas.length
              ? filtered.length + ' ideas'
              : filtered.length + ' of ' + ideas.length + ' ideas'}
          </p>
        )}

        {/* Ideas list */}
        {loading ? (
          <div className="space-y-4" aria-label="Loading feature ideas" aria-busy="true">
            {[1, 2, 3, 4].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20" role="region" aria-label="No results found">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
              aria-hidden="true"
            >
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 style={{ color: TEXT }} className="text-xl font-bold mb-2">No ideas found</h2>
            <p style={{ color: TEXT2 }} className="text-sm mb-6">
              {search
                ? 'Try a different search term or clear your filters.'
                : 'Be the first to suggest something for Syndicade.'}
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => { setSearch(''); setActiveCategory('All'); setActiveStatus('all'); }}
                style={{ color: TEXT2, border: '1px solid ' + BDR }}
                className="px-4 py-2 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
              {user && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Submit an Idea
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label={'Feature ideas, ' + filtered.length + ' shown'}>
            {filtered.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />
            ))}
          </div>
        )}

        {/* Sign-in nudge for guests */}
        {!user && !loading && ideas.length > 0 && (
          <div
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
            className="mt-8 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100" aria-hidden="true">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p style={{ color: TEXT, fontWeight: 600, fontSize: '14px' }}>Sign in to vote and submit ideas</p>
              <p style={{ color: TEXT2, fontSize: '13px' }}>Your votes help us prioritize what to build next.</p>
            </div>
            <a
              href="/login"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
            >
              Sign In
            </a>
          </div>
        )}
      </main>

      {/* ── Submit modal ───────────────────────────────────────── */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitIdea}
        />
      )}
    </div>
  );
}