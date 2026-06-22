// src/components/OpportunityCard.jsx
// Adapter around the shared Card.jsx (Design System §8) — Opportunities retrofit, following
// the Sign-Up Forms reference pattern. Opportunity-specific data shaping lives here only;
// rendering delegates entirely to Card.jsx + ActionsDropdown.jsx.
// CODE RULE (§21): var only — never const/let.

import Card from './design-system/Card';
import ActionsDropdown from './design-system/ActionsDropdown';

var LOCATION_LABELS = {
  in_person: 'In-Person',
  remote: 'Remote',
  hybrid: 'Hybrid'
};

function relativeTime(isoString) {
  if (!isoString) {
    return '';
  }
  var then = new Date(isoString).getTime();
  var now = Date.now();
  var diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return 'Posted today';
  }
  if (diffDays === 1) {
    return 'Posted 1 day ago';
  }
  if (diffDays < 30) {
    return 'Posted ' + diffDays + ' days ago';
  }
  var diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) {
    return 'Posted 1 month ago';
  }
  return 'Posted ' + diffMonths + ' months ago';
}

function formatDeadline(dateStr) {
  var d = new Date(dateStr);
  return 'Deadline: ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function OpportunityCard(props) {
  var item = props.item;
  var appCount = props.appCount || 0;
  var onEdit = props.onEdit;
  var onDuplicate = props.onDuplicate;
  var onMakeTemplate = props.onMakeTemplate;
  var onDelete = props.onDelete;
  var onUnpublish = props.onUnpublish;
  var onViewApps = props.onViewApps;

  var isExpired = !!(item.deadline && new Date(item.deadline) < new Date());
  var hasFormApply = item.apply_method === 'form';

  // ── Metadata rows (max 2–3, per §8) ──
  var metadata = [];
  if (item.role_types && item.role_types.length > 0) {
    var roleText = item.role_types.slice(0, 2).join(', ') + (item.role_types.length > 2 ? ' +' + (item.role_types.length - 2) : '');
    metadata.push({ type: 'text', text: roleText });
  }
  if (item.deadline) {
    metadata.push({ type: 'calendar', text: formatDeadline(item.deadline) });
  }
  if (item.city || item.location_type) {
    var locText = [item.city, LOCATION_LABELS[item.location_type]].filter(Boolean).join(' · ');
    metadata.push({ type: 'location', text: locText });
  }

  // ── Status badges (above footer divider, per §8) ──
  var badges = [];
  var visLabel = item.visibility === 'public' ? 'Public' : item.visibility === 'members_only' ? 'Members Only' : 'Draft';
  badges.push({ variant: 'neutral', label: visLabel });
  if (isExpired) {
    badges.push({ variant: 'urgent', label: 'Expired' });
  }
  if (item.compensation_type === 'paid') {
    badges.push({ variant: 'paid', label: 'Paid' });
  }
  if (hasFormApply && appCount > 0) {
    badges.push({ variant: 'neutral', label: appCount + (appCount === 1 ? ' application' : ' applications') });
  }

  // ── Actions dropdown ──
  var extraItems = [];
  if (hasFormApply) {
    extraItems.push({
      key: 'view-apps',
      label: 'View Applications',
      onClick: function () { onViewApps(item); },
      badge: appCount > 0 ? appCount : null
    });
  }

  var actionsDropdown = (
    <ActionsDropdown
      triggerLabel={'Actions for ' + item.title}
      onEdit={function () { onEdit(item); }}
      onDuplicate={function () { onDuplicate(item); }}
      extraItems={extraItems}
      onMakeTemplate={function () { onMakeTemplate(item); }}
      isLive={item.visibility === 'public'}
      onUnpublish={function () { onUnpublish(item); }}
      onDelete={function () { onDelete(item); }}
    />
  );

  return (
    <Card
      title={item.title}
      description={item.description}
      metadata={metadata}
      badges={badges}
      footerLeft={relativeTime(item.created_at)}
      footerRight={actionsDropdown}
      ariaLabel={item.title + ' opportunity'}
    />
  );
}

export default OpportunityCard;