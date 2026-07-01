// src/components/FundingCard.jsx
// Syndicade — Funding retrofit, Step 1
// Thin adapter around shared Card.jsx + ActionsDropdown.jsx. No hand-rolled markup,
// no hand-rolled dropdown. Follows the OpportunityCard.jsx reference pattern exactly.
// CODE RULE (§21): var only — never const/let.

import Card from './design-system/Card';
import ActionsDropdown from './design-system/ActionsDropdown';

var FUNDING_TYPE_LABELS = {
  scholarship: 'Scholarship',
  grant: 'Grant',
  emergency_fund: 'Emergency Fund',
  fellowship: 'Fellowship',
  award: 'Award / Recognition',
  other: 'Other',
};

var VISIBILITY_LABELS = {
  draft: 'Draft',
  members_only: 'Members Only',
  groups: 'Specific Groups', // UI-only value, never persisted — see CreateFunding.jsx
  public: 'Public',
};

function formatAmount(item) {
  if (item.amount_type === 'varies') { return 'Varies'; }
  if (item.amount_type === 'fixed' && item.amount_min) { return '$' + Number(item.amount_min).toLocaleString(); }
  if (item.amount_type === 'range') {
    if (item.amount_min && item.amount_max) { return '$' + Number(item.amount_min).toLocaleString() + ' \u2013 $' + Number(item.amount_max).toLocaleString(); }
    if (item.amount_min) { return 'From $' + Number(item.amount_min).toLocaleString(); }
    if (item.amount_max) { return 'Up to $' + Number(item.amount_max).toLocaleString(); }
  }
  return null;
}

function formatDeadline(item) {
  if (!item.deadline) { return null; }
  return new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Derives the badge visibility label. Since 'groups' is never persisted (only
// members_only + group_ids), a saved row with group_ids.length > 0 displays as
// "Specific Groups" even though its stored visibility is members_only.
function visibilityLabel(item) {
  if (item.visibility === 'members_only' && item.group_ids && item.group_ids.length > 0) {
    return VISIBILITY_LABELS.groups;
  }
  return VISIBILITY_LABELS[item.visibility] || item.visibility;
}

// props:
//   item: funding row
//   appCount: number — form-applications count for this listing (0 if apply_method !== 'form')
//   onEdit, onDuplicate, onMakeTemplate, onDelete, onUnpublish, onViewApps: fn(item)

function FundingCard(props) {
  var item = props.item;
  var appCount = props.appCount || 0;
  var isExpired = !!(item.deadline && new Date(item.deadline) < new Date());
  var hasFormApply = item.apply_method === 'form';
  var amount = formatAmount(item);
  var deadline = formatDeadline(item);

  var badges = [];
  badges.push({ variant: 'neutral', label: visibilityLabel(item) });
  badges.push({ variant: 'neutral', label: FUNDING_TYPE_LABELS[item.funding_type] || item.funding_type });
  if (item.is_featured) { badges.push({ variant: 'featured', label: 'Featured' }); }
  if (isExpired) { badges.push({ variant: 'urgent', label: 'Expired' }); }

  var metadata = [];
  if (amount) { metadata.push({ type: 'text', text: amount }); }
  if (deadline) { metadata.push({ type: 'calendar', text: 'Deadline: ' + deadline }); }

  var extraItems = [];
  if (hasFormApply) {
    extraItems.push({
      key: 'view-apps',
      label: 'View Applications',
      onClick: function () { props.onViewApps(item); },
      badge: appCount > 0 ? appCount : null,
    });
  }

  var actions = (
    <ActionsDropdown
      triggerLabel={'Actions for ' + item.title}
      onEdit={function () { props.onEdit(item); }}
      onDuplicate={function () { props.onDuplicate(item); }}
      onMakeTemplate={function () { props.onMakeTemplate(item); }}
      extraItems={extraItems}
      isLive={item.visibility === 'public'}
      onUnpublish={function () { props.onUnpublish(item); }}
      onDelete={function () { props.onDelete(item); }}
    />
  );

  return (
    <Card
      title={item.title}
      description={item.description}
      metadata={metadata}
      badges={badges}
      footerLeft={null}
      footerRight={actions}
      ariaLabel={item.title + ' funding listing'}
    />
  );
}

export default FundingCard;