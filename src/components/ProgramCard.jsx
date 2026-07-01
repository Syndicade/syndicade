// src/components/ProgramCard.jsx
// Syndicade — Programs retrofit onto shared design-system components (July 1, 2026)
// Reference implementation followed: Opportunities/Funding (Card.jsx + ActionsDropdown.jsx)
// CODE RULE (§21): var only — never const/let. String concat for className.

import { BookmarkIcon, BookmarkCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from './design-system/Card';
import ActionsDropdown from './design-system/ActionsDropdown';
import { Button } from './design-system/Button';

function formatDate(ds) {
  if (!ds) return null;
  var d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return null;
  var parts = t.split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

function costMeta(program) {
  if (!program.cost_type || program.cost_type === 'free') {
    return { variant: 'neutral', label: 'Free' };
  }
  if (program.cost_type === 'donation') {
    return { variant: 'neutral', label: 'Donation' };
  }
  var amt = program.cost_amount ? '$' + parseFloat(program.cost_amount).toFixed(2) : 'Paid';
  return { variant: 'paid', label: amt };
}

// visibility helper — falls back gracefully for legacy records (no real `visibility`
// column exists yet on org_programs, see PROG-VIS-COL, Master Status Group 6)
function programVisibility(p) {
  if (p.visibility) return p.visibility;
  if (p.is_public) return 'public';
  return 'draft';
}

var VISIBILITY_LABEL = {
  draft: 'Draft',
  members_only: 'Members Only',
  groups: 'Specific Groups',
  public: 'Public'
};

// props:
//   program, isAdmin, organizationId
//   isSaved, onToggleSave
//   myRegistration, onRegister, onCancelRegistration
//   onEdit, onDuplicate, onMakeTemplate, onViewRegistrations, onDelete
//   pendingRegCount: number — badge count for "View Registrations"
//   dragHandlers: { draggable, onDragStart, onDragOver, onDrop, onDragEnd } (admin custom-order only)
function ProgramCard(props) {
  var program = props.program;
  var isAdmin = props.isAdmin;
  var organizationId = props.organizationId;

  var cap = program.capacity;
  var enrolled = program.enrolled_count || 0;
  var isFull = cap != null && enrolled >= cap;
  var isClosed = program.status === 'closed';
  var regOpen = program.registration_open !== false && !isClosed;
  var cost = costMeta(program);
  var vis = programVisibility(program);

  var startFmt = formatDate(program.start_date);
  var endFmt = formatDate(program.end_date);
  var startTimeFmt = formatTime(program.start_time);
  var endTimeFmt = formatTime(program.end_time);

  // ── Metadata rows — max 3, icons limited to clock/calendar/location allowlist (§3/§8).
  // Person icons banned — audience ("Who is it for") renders as plain text, no icon.
  var metadata = [];
  if (startFmt || endFmt) {
    metadata.push({ type: 'calendar', text: startFmt && endFmt ? startFmt + ' – ' + endFmt : startFmt ? 'Starts ' + startFmt : 'Ends ' + endFmt });
  }
  if (startTimeFmt || endTimeFmt) {
    metadata.push({ type: 'clock', text: startTimeFmt && endTimeFmt ? startTimeFmt + ' – ' + endTimeFmt : (startTimeFmt || endTimeFmt) });
  }
  if (program.location_city || program.location_state) {
    metadata.push({ type: 'location', text: [program.location_city, program.location_state].filter(Boolean).join(', ') });
  }
  if (metadata.length < 3 && cap != null) {
    metadata.push({ type: 'text', text: (isFull ? 'Full — ' : '') + enrolled + ' of ' + cap + ' enrolled' });
  }
  if (metadata.length < 3 && program.audience) {
    metadata.push({ type: 'text', text: 'For: ' + program.audience });
  }
  metadata = metadata.slice(0, 3);

  // ── Badges
  var badges = [];
  if (program.status === 'active') badges.push({ variant: 'active', label: 'Active' });
  else if (program.status === 'upcoming') badges.push({ variant: 'neutral', label: 'Upcoming' });
  else badges.push({ variant: 'neutral', label: 'Closed' });

  badges.push({ variant: cost.variant, label: cost.label });

  if (isAdmin) {
    badges.push({ variant: 'neutral', label: VISIBILITY_LABEL[vis] || 'Draft' });
  }
  if (program.show_on_discover) badges.push({ variant: 'neutral', label: 'On Discover' });
  if (program.requires_approval) badges.push({ variant: 'neutral', label: 'Approval required' });
  if (!program.registration_open && !isClosed) badges.push({ variant: 'urgent', label: 'Registration closed' });
  if (program.tags && program.tags.length > 0) {
    program.tags.slice(0, 3).forEach(function (tag) {
      badges.push({ variant: 'neutral', label: tag });
    });
  }

  // ── Title action (bookmark) — member view only
  var titleAction = !isAdmin ? (
    <button
      type="button"
      onClick={function (e) { props.onToggleSave(e, program.id); }}
      style={{ padding: '4px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: props.isSaved ? '#F5B731' : '#64748B', display: 'flex' }}
      className={'focus:outline-none focus:ring-2 focus:ring-yellow-400 ' + (props.isSaved ? '' : 'hover:text-yellow-500')}
      aria-label={props.isSaved ? 'Remove bookmark for ' + program.name : 'Bookmark ' + program.name}
      aria-pressed={props.isSaved}
    >
      {props.isSaved ? <BookmarkCheck size={16} aria-hidden="true" /> : <BookmarkIcon size={16} aria-hidden="true" />}
    </button>
  ) : null;

  // ── Footer
  var footerLeft = isAdmin
    ? (cap != null ? enrolled + ' / ' + cap + ' enrolled' : 'No capacity limit')
    : '';

  var footerRight;
  if (isAdmin) {
    footerRight = (
      <ActionsDropdown
        triggerLabel={'Actions for ' + program.name}
        onEdit={function () { props.onEdit(program); }}
        onDuplicate={function () { props.onDuplicate(program); }}
        onMakeTemplate={function () { props.onMakeTemplate(program); }}
        extraItems={[{
          key: 'view-registrations',
          label: 'View Registrations',
          onClick: function () { props.onViewRegistrations(program); },
          badge: props.pendingRegCount > 0 ? props.pendingRegCount : null
        }]}
        onDelete={function () { props.onDelete(program.id, program.name); }}
      />
    );
  } else if (props.myRegistration) {
    var reg = props.myRegistration;
    var statusLabel = reg.status === 'enrolled' ? 'Enrolled' : reg.status === 'pending' ? 'Pending approval' : 'Cancelled';
    footerRight = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '99px', background: reg.status === 'enrolled' ? 'rgba(34,197,94,0.12)' : reg.status === 'pending' ? 'rgba(245,183,49,0.15)' : 'rgba(100,116,139,0.1)', color: reg.status === 'enrolled' ? '#22C55E' : reg.status === 'pending' ? '#B45309' : '#64748B' }}>
          {statusLabel}
        </span>
        {(reg.status === 'enrolled' || reg.status === 'pending') && (
          <button
            onClick={function (e) { props.onCancelRegistration(e, program); }}
            style={{ fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
            className="hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-400"
            aria-label={'Cancel registration for ' + program.name}
          >
            Cancel
          </button>
        )}
      </div>
    );
  } else if (regOpen && !isFull) {
    footerRight = (
      <Button variant="primary" onClick={function (e) { props.onRegister(e, program); }} ariaLabel={'Register for ' + program.name}>
        {program.requires_approval ? 'Request to Join' : 'Register'}
      </Button>
    );
  } else {
    footerRight = <span style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>{isFull ? 'Program is full' : 'Registration closed'}</span>;
  }

  var titleNode = (
    <Link
      to={'/organizations/' + organizationId + '/programs/' + program.id}
      state={{ from: 'org-programs' }}
      style={{ color: 'inherit', textDecoration: 'none' }}
      className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
    >
      {program.name}
    </Link>
  );

  return (
    <Card
      title={titleNode}
      ariaLabel={program.name + ' program'}
      description={program.description}
      metadata={metadata}
      badges={badges}
      titleAction={titleAction}
      footerLeft={footerLeft}
      footerRight={footerRight}
    />
  );
}

export default ProgramCard;
export { programVisibility };