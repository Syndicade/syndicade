import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Icon({ path, size }) {
  var s = size || 20;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  arrow:      'M13 7l5 5m0 0l-5 5m5-5H6',
  check:      'M5 13l4 4L19 7',
  users:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  calendar:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  megaphone:  ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  document:   ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  chart:      ['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
  globe:      ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  mail:       'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  creditCard: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  monitor:    'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  qrCode:     ['M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 4h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'],
  poll:       ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
  clipboard:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  chat:       ['M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'],
  bell:       'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  shield:     ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  ticket:     ['M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'],
  star:       'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  ai:         ['M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'],
};

var FEATURE_SECTIONS = [
  {
    label: 'Member Management',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    iconKey: 'users',
    headline: 'Manage your members, not a spreadsheet',
    description: 'A real member directory built for volunteer orgs — not repurposed HR software.',
    features: [
      { name: 'Member directory with profiles', desc: 'Photos, bios, contact info, and custom fields.', plans: ['Starter','Growth','Pro'] },
      { name: 'Invite members by email', desc: 'Bulk or individual invitations with role assignment.', plans: ['Starter','Growth','Pro'] },
      { name: 'Member numbers (auto-assigned)', desc: 'YYMMDD### format, assigned on join.', plans: ['Starter','Growth','Pro'] },
      { name: 'Role management (Admin, Member)', desc: 'Control who can manage events, send blasts, and edit the public page.', plans: ['Starter','Growth','Pro'] },
      { name: 'Membership tiers', desc: 'Create different membership levels with dues and perks.', plans: ['Growth','Pro'] },
      { name: 'Dues collection', desc: 'Collect membership dues via Stripe, 0% platform fee.', plans: ['Growth','Pro'] },
      { name: 'Multi-org unified dashboard', desc: 'Members in multiple orgs see everything in one place. No other platform does this.', plans: ['Starter','Growth','Pro'] },
    ],
  },
  {
    label: 'Events',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.1)',
    iconKey: 'calendar',
    headline: 'Events that actually fill up',
    description: 'From free neighborhood meetups to paid fundraising galas — one system handles both.',
    features: [
      { name: 'Event creation + calendar', desc: 'Public or members-only events with date, location, and details.', plans: ['Starter','Growth','Pro'] },
      { name: 'RSVP + guest tracking', desc: 'Going / Maybe / Not Going with guest count per RSVP.', plans: ['Starter','Growth','Pro'] },
      { name: 'Recurring events', desc: 'Weekly, monthly, or custom recurrence patterns.', plans: ['Starter','Growth','Pro'] },
      { name: 'Public events (no login required)', desc: 'Anyone can view and RSVP without creating an account.', plans: ['Starter','Growth','Pro'] },
      { name: 'QR codes + attendance check-in', desc: 'Day-of QR scan check-in on any device. No hardware needed.', plans: ['Starter','Growth','Pro'] },
      { name: 'Paid event tickets', desc: 'Ticket types, early bird pricing, and 0% platform fee. $1/ticket fee applies.', plans: ['Growth','Pro'] },
      { name: 'Custom checkout fields', desc: 'Collect t-shirt sizes, dietary restrictions, or anything else at checkout.', plans: ['Pro'] },
      { name: 'Ticket confirmation emails', desc: 'Automatic email with ticket details and calendar invite.', plans: ['Growth','Pro'] },
      { name: 'Featured event placement', desc: 'Promote your event on the public discovery board. $15/wk or $40/30 days.', plans: ['Growth','Pro'] },
      { name: 'Export to .ics (Google Calendar/iCal)', desc: 'One-click calendar file download.', plans: ['Starter','Growth','Pro'] },
    ],
  },
  {
    label: 'Communications',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.1)',
    iconKey: 'megaphone',
    headline: 'Reach every member, every time',
    description: 'No algorithm. No feed burial. When you post an announcement, every member sees it.',
    features: [
      { name: 'Announcements', desc: 'Pinned updates, priority levels, and read tracking per member.', plans: ['Starter','Growth','Pro'] },
      { name: 'In-app notifications', desc: 'Real-time notification bell for events, announcements, and mentions.', plans: ['Starter','Growth','Pro'] },
      { name: 'Transactional emails', desc: 'System-generated emails for event reminders, RSVP confirmations, and invitations.', plans: ['Starter','Growth','Pro'] },
      { name: 'Email blasts', desc: 'Manual sends to your full member list or targeted segments. 500/mo on Growth.', plans: ['Growth','Pro'] },
      { name: 'Newsletter builder', desc: 'Drag-and-drop editor with 11 block types and live preview.', plans: ['Growth','Pro'] },
      { name: 'Unlimited email sends', desc: 'No monthly send cap.', plans: ['Pro'] },
      { name: 'Email analytics', desc: 'Open rates, click rates, bounce rates, and per-recipient tracking.', plans: ['Growth','Pro'] },
      { name: 'Admin inbox', desc: 'Centralized message inbox for contact form submissions and member requests.', plans: ['Growth','Pro'] },
      { name: 'Chat channels', desc: 'Internal org chat for members and committees.', plans: ['Starter','Growth','Pro'] },
      { name: 'AI content assistant', desc: 'Draft announcements, event descriptions, and bios with AI.', plans: ['Pro'] },
    ],
  },
  {
    label: 'Content & Documents',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.1)',
    iconKey: 'document',
    headline: 'Stop losing files in email threads',
    description: 'A real document library your whole organization can actually find and use.',
    features: [
      { name: 'Document library', desc: 'Upload PDFs, Word docs, spreadsheets, and more. Searchable.', plans: ['Starter','Growth','Pro'] },
      { name: 'Polls', desc: 'Single choice, multiple choice, or yes/no/abstain. Anonymous option.', plans: ['Starter','Growth','Pro'] },
      { name: 'Surveys', desc: 'Multi-page surveys with skip logic and conditional fields.', plans: ['Starter','Growth','Pro'] },
      { name: 'Sign-up forms', desc: 'Volunteer slots with live spot counts — no phone tag.', plans: ['Starter','Growth','Pro'] },
      { name: 'Programs', desc: 'Publish recurring programs with descriptions, schedules, and enrollment.', plans: ['Starter','Growth','Pro'] },
      { name: '2 GB storage', desc: 'Documents, images, attachments — all in one bucket.', plans: ['Starter'] },
      { name: '10 GB storage', desc: '', plans: ['Growth'] },
      { name: '30 GB storage', desc: '', plans: ['Pro'] },
    ],
  },
  {
    label: 'Public Website',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    iconKey: 'monitor',
    headline: 'Your public page, no developer needed',
    description: 'Every org gets a mobile-ready website. Set it up in the wizard, update it any time.',
    features: [
      { name: 'orgname.syndicade.com subdomain', desc: 'Clean public URL included on every plan.', plans: ['Starter','Growth','Pro'] },
      { name: '1 scrollable page', desc: 'One full-length public page with unlimited content blocks.', plans: ['Starter'] },
      { name: 'Up to 7 pages', desc: 'Main page + About, Programs, Team, Gallery, Donate, Contact.', plans: ['Growth'] },
      { name: 'Unlimited pages', desc: 'Campaign pages, program pages, blog-style content — no ceiling.', plans: ['Pro'] },
      { name: 'Website setup wizard', desc: 'Step-by-step guided setup. Live in minutes.', plans: ['Starter','Growth','Pro'] },
      { name: 'Donation page', desc: 'Stripe-powered donation page. 0% platform fee.', plans: ['Starter','Growth','Pro'] },
      { name: 'Custom domain', desc: 'Connect a domain you already own. $50/yr add-on on Growth, included on Pro.', plans: ['Growth','Pro'] },
      { name: 'Remove Syndicade branding', desc: '$10/mo add-on on Growth, included on Pro.', plans: ['Growth','Pro'] },
      { name: 'Public event listing', desc: 'Your public events auto-populate on your org page.', plans: ['Starter','Growth','Pro'] },
    ],
  },
  {
    label: 'Discovery & Community',
    color: '#14B8A6',
    bg: 'rgba(20,184,166,0.1)',
    iconKey: 'globe',
    headline: 'Get found. Build together.',
    description: 'Verified nonprofits appear on the public discovery board. Community members can find your org and events without needing an account.',
    features: [
      { name: 'Public org discovery (/explore)', desc: 'Searchable directory of verified nonprofits by cause, location, and keyword.', plans: ['Starter','Growth','Pro'] },
      { name: 'Public event discovery (/discover)', desc: 'Anyone can browse upcoming public events from verified orgs.', plans: ['Starter','Growth','Pro'] },
      { name: 'Verified nonprofit badge', desc: 'IRS 501(c)(3) verification badge on your public org page.', plans: ['Starter','Growth','Pro'] },
      { name: 'Community Board access', desc: 'Private board for verified org admins to post needs, share resources, and find collaborators.', plans: ['Starter','Growth','Pro'] },
      { name: 'Featured event placement', desc: 'Highlight events on the discovery board for 7 or 30 days.', plans: ['Growth','Pro'] },
    ],
    verifiedOnly: true,
  },
  {
    label: 'Analytics & Reporting',
    color: '#F5B731',
    bg: 'rgba(245,183,49,0.1)',
    iconKey: 'chart',
    headline: 'Know what is working',
    description: 'Real data about your members, events, and communications — not vanity metrics.',
    features: [
      { name: 'Basic stats', desc: 'Member count, event attendance, and document usage.', plans: ['Starter','Growth','Pro'] },
      { name: 'Full analytics dashboard', desc: 'Engagement trends, RSVP rates, and member activity over time.', plans: ['Growth','Pro'] },
      { name: 'Attendance + revenue reports', desc: 'Per-event attendance and ticket revenue breakdowns.', plans: ['Growth','Pro'] },
      { name: 'Email analytics', desc: 'Open, click, and bounce rates per blast.', plans: ['Growth','Pro'] },
      { name: 'CSV exports', desc: 'Export members, attendance, and event data any time.', plans: ['Starter','Growth','Pro'] },
    ],
  },
  {
    label: 'Payments',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.1)',
    iconKey: 'creditCard',
    headline: '0% platform fee. Always.',
    description: 'We never take a cut of your dues, ticket sales, or donations. Only Stripe\'s standard processing fees apply.',
    features: [
      { name: 'Donation pages', desc: 'Stripe-powered one-time and recurring donations. 0% platform fee.', plans: ['Starter','Growth','Pro'] },
      { name: 'Event ticket sales', desc: '$1/ticket fee + Stripe processing. No percentage cuts.', plans: ['Growth','Pro'] },
      { name: 'Membership dues', desc: 'Collect recurring dues via Stripe.', plans: ['Growth','Pro'] },
      { name: 'Stripe Customer Portal', desc: 'Members manage their own payment methods and billing history.', plans: ['Growth','Pro'] },
      { name: '200 tickets max per event', desc: '', plans: ['Growth'] },
      { name: '500 tickets max per event', desc: '', plans: ['Pro'] },
    ],
  },
];

var PLAN_COLORS = {
  Starter: { bg: 'rgba(245,183,49,0.15)', text: '#D4A017', border: 'rgba(245,183,49,0.3)' },
  Growth:  { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
  Pro:     { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E', border: 'rgba(34,197,94,0.3)'  },
};

function PlanBadge({ plan }) {
  var c = PLAN_COLORS[plan];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: c.bg, color: c.text, border: '1px solid ' + c.border, whiteSpace: 'nowrap' }}>
      {plan}
    </span>
  );
}

export default function FeaturesPage() {
  var navigate = useNavigate();
  var { isDark } = useTheme();

  var pageBg      = isDark ? '#0E1523' : '#F8FAFC';
  var sectionBg   = isDark ? '#151B2D' : '#FFFFFF';
  var cardBg      = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var textMuted   = isDark ? '#94A3B8'  : '#64748B';
  var rowHover    = isDark ? '#1E2845'  : '#F8FAFC';

  return (
    <div style={{ background: pageBg, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: textPrimary }}>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:outline-none" style={{ background: '#F5B731', color: '#111827' }}>
        Skip to main content
      </a>

      {/* ── Nav ── */}
      <header role="banner" style={{ background: isDark ? '#0E1523' : '#FFFFFF', borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <button onClick={function() { navigate('/'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" aria-label="Go to homepage" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0E1523' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/pricing" className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}>
              Pricing
            </Link>
            <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}>
              Log In
            </button>
            <button onClick={function() { navigate('/signup'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-xl" style={{ fontSize: '14px', fontWeight: 700, color: '#111827', background: '#F5B731', border: 'none', cursor: 'pointer', padding: '9px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(245,183,49,0.4)' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
              Start Free — 14 Days
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">

        {/* ── Hero ── */}
        <section aria-labelledby="features-hero-heading" style={{ background: '#0E1523', padding: '72px 24px 64px', textAlign: 'center', borderBottom: '1px solid #2A3550' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '16px' }}>Everything included</p>
            <h1 id="features-hero-heading" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: '20px' }}>
              Every feature your org needs,<br />
              <span style={{ color: '#F5B731' }}>in one place.</span>
            </h1>
            <p style={{ fontSize: '17px', color: '#CBD5E1', lineHeight: 1.7, marginBottom: '36px' }}>
              Syndicade replaces the fragmented stack of spreadsheets, email chains, and disconnected tools that volunteer orgs rely on. Here's everything that's included.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '36px' }}>
              <button onClick={function() { navigate('/signup'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,183,49,0.35)' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                Start Free — 14 Days <Icon path={ICONS.arrow} size={16} />
              </button>
              <Link to="/pricing" className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded-xl" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', fontSize: '15px', fontWeight: 600, background: 'none', color: '#CBD5E1', border: '1px solid #2A3550', borderRadius: '12px', textDecoration: 'none' }} onMouseOver={function(e) { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = '#2A3550'; e.currentTarget.style.color = '#CBD5E1'; }}>
                View Pricing
              </Link>
            </div>
            {/* Plan legend */}
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {['Starter','Growth','Pro'].map(function(p) { return <PlanBadge key={p} plan={p} />; })}
              <span style={{ fontSize: '12px', color: '#64748B', alignSelf: 'center' }}>— badge indicates which plans include the feature</span>
            </div>
          </div>
        </section>

        {/* ── Feature Sections ── */}
        {FEATURE_SECTIONS.map(function(section, si) {
          var isEven = si % 2 === 0;
          return (
            <section
              key={section.label}
              aria-labelledby={'section-' + si}
              style={{ padding: '72px 24px', background: isEven ? pageBg : sectionBg, borderBottom: '1px solid ' + borderColor }}
            >
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Section header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '32px', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '0 0 auto' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: section.bg, border: '1px solid ' + section.color.replace(')', ',0.3)').replace('rgb', 'rgba'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.color, flexShrink: 0 }}>
                      <Icon path={ICONS[section.iconKey]} size={26} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: section.color, marginBottom: '6px' }}>{section.label}</p>
                    <h2 id={'section-' + si} style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: textPrimary, marginBottom: '8px', lineHeight: 1.2 }}>{section.headline}</h2>
                    <p style={{ fontSize: '15px', color: textSecondary, lineHeight: 1.6 }}>
                      {section.description}
                      {section.verifiedOnly && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px', padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: 'rgba(245,183,49,0.12)', color: '#F5B731', border: '1px solid rgba(245,183,49,0.3)' }}>
                          Verified nonprofits only
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Feature rows */}
                <div style={{ border: '1px solid ' + borderColor, borderRadius: '14px', overflow: 'hidden' }} role="list" aria-label={section.label + ' features'}>
                  {section.features.map(function(feat, fi) {
                    return (
                      <div
                        key={feat.name}
                        role="listitem"
                        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '16px 20px', background: cardBg, borderTop: fi > 0 ? '1px solid ' + borderColor : 'none', flexWrap: 'wrap' }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = rowHover; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = cardBg; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                          <span aria-hidden="true" style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: section.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', color: section.color }}>
                            <Icon path={ICONS.check} size={11} />
                          </span>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, marginBottom: feat.desc ? '2px' : 0 }}>{feat.name}</p>
                            {feat.desc && <p style={{ fontSize: '13px', color: textMuted, lineHeight: 1.5 }}>{feat.desc}</p>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                          {feat.plans.map(function(p) { return <PlanBadge key={p} plan={p} />; })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </section>
          );
        })}

        {/* ── Final CTA ── */}
        <section aria-labelledby="features-cta-heading" style={{ padding: '96px 24px', background: '#0E1523', textAlign: 'center' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <img src="/mascot-pair.png" alt="" aria-hidden="true" style={{ width: '140px', height: 'auto', marginBottom: '28px' }} onError={function(e) { e.currentTarget.style.display = 'none'; }} />
            <h2 id="features-cta-heading" style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '16px' }}>
              Ready to replace your fragmented stack?
            </h2>
            <p style={{ fontSize: '16px', color: '#CBD5E1', marginBottom: '12px', lineHeight: 1.6 }}>
              Everything above is included. Start with the plan that fits your org and upgrade when you need more.
            </p>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '36px' }}>14-day free trial · No credit card · Cancel any time</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <button onClick={function() { navigate('/signup'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '16px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,183,49,0.4)' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                Start Free — 14 Days <Icon path={ICONS.arrow} size={18} />
              </button>
              <Link to="/pricing" className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded-xl" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', fontSize: '16px', fontWeight: 600, background: 'none', color: '#CBD5E1', border: '1px solid #2A3550', borderRadius: '12px', textDecoration: 'none' }} onMouseOver={function(e) { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = '#2A3550'; e.currentTarget.style.color = '#CBD5E1'; }}>
                Compare Plans
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer role="contentinfo" style={{ background: '#060E1A', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {[['Discover Events','/discover'],['Explore Organizations','/explore'],['Pricing','/pricing'],['Terms of Service','/legal']].map(function(item) {
              return (
                <Link key={item[0]} to={item[1]} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#64748B'; }}>
                  {item[0]}
                </Link>
              );
            })}
          </div>
          <p style={{ fontSize: '12px', color: '#475569' }}>&copy; {new Date().getFullYear()} Syndicade. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}