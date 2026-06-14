/**
 * platformTags.js
 * Single source of truth for all platform tags.
 * Fetches from the platform_tags table (managed via Staff Dashboard → Manage Tags).
 * Results are cached in memory for the session — no repeated DB calls.
 *
 * Usage:
 *   import { getTagsByGroup, getTagsForContent, ALL_CONTENT_TYPES } from '../lib/platformTags';
 *
 *   // Get all tags for a specific group
 *   var causeAreaTags = await getTagsByGroup('Cause Area');
 *
 *   // Get all tag groups that apply to a content type
 *   var eventTags = await getTagsForContent('event');
 *
 *   // Get a flat list of all platform tag labels (for soft-block detection)
 *   var allLabels = await getAllPlatformTagLabels();
 */

import { supabase } from './supabase';

// ─── Cache ────────────────────────────────────────────────────────────────────

var _cache = null;
var _cacheTime = null;
var CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid() {
  return _cache !== null && _cacheTime !== null && (Date.now() - _cacheTime) < CACHE_TTL_MS;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

/**
 * Fetches all platform tags from DB. Returns cached result if fresh.
 * @returns {Promise<Array>} Array of tag objects: { id, label, group_name, applies_to, sort_order }
 */
async function fetchAllTags() {
  if (isCacheValid()) return _cache;
  var res = await supabase
    .from('platform_tags')
    .select('id, label, group_name, applies_to, sort_order')
    .order('group_name')
    .order('sort_order')
    .order('label');
  if (res.error) {
    console.error('[platformTags] fetch error:', res.error.message);
    // Return cache if stale but available, otherwise return empty
    return _cache || [];
  }
  _cache = res.data || [];
  _cacheTime = Date.now();
  return _cache;
}

/**
 * Invalidates the cache. Call after Staff Dashboard adds/retires a tag
 * so the next fetch picks up the change.
 */
function invalidateTagCache() {
  _cache = null;
  _cacheTime = null;
}

// ─── Group constants ──────────────────────────────────────────────────────────

var GROUP_CAUSE_AREA      = 'Cause Area';
var GROUP_AUDIENCE        = 'Audience Served';
var GROUP_ACTIVITY        = 'Activity Type';
var GROUP_ROLE_TYPE       = 'Role Type';
var GROUP_FUNDING_TYPE    = 'Funding Type';
var GROUP_FORMAT          = 'Format';
var GROUP_LANGUAGE        = 'Language';
var GROUP_ORG_TYPE        = 'Organization Type';

// Content type constants matching platform_tags.applies_to values
var CONTENT_EVENT       = 'event';
var CONTENT_PROGRAM     = 'program';
var CONTENT_OPPORTUNITY = 'opportunity';
var CONTENT_FUNDING     = 'funding';
var CONTENT_ORG         = 'org';

var ALL_CONTENT_TYPES = [
  CONTENT_EVENT,
  CONTENT_PROGRAM,
  CONTENT_OPPORTUNITY,
  CONTENT_FUNDING,
  CONTENT_ORG,
];

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * Returns all tag labels for a specific group.
 * @param {string} groupName — one of the GROUP_* constants
 * @returns {Promise<string[]>}
 */
async function getTagsByGroup(groupName) {
  var tags = await fetchAllTags();
  return tags
    .filter(function(t) { return t.group_name === groupName; })
    .map(function(t) { return t.label; });
}

/**
 * Returns all tag groups (with labels) that apply to a given content type.
 * Returns an array of { groupName, tags: string[] } objects.
 * @param {string} contentType — 'event' | 'program' | 'opportunity' | 'funding' | 'org'
 * @returns {Promise<Array<{ groupName: string, tags: string[] }>>}
 */
async function getTagsForContent(contentType) {
  var tags = await fetchAllTags();
  var filtered = tags.filter(function(t) {
    return Array.isArray(t.applies_to) && t.applies_to.includes(contentType);
  });
  // Group them
  var groups = {};
  filtered.forEach(function(t) {
    if (!groups[t.group_name]) groups[t.group_name] = [];
    groups[t.group_name].push(t.label);
  });
  return Object.keys(groups).map(function(name) {
    return { groupName: name, tags: groups[name] };
  });
}

/**
 * Returns a flat Set of all platform tag labels (lowercased).
 * Used for soft-block detection in custom tag inputs.
 * @returns {Promise<Set<string>>}
 */
async function getAllPlatformTagLabels() {
  var tags = await fetchAllTags();
  return new Set(tags.map(function(t) { return t.label.toLowerCase(); }));
}

/**
 * Returns all cause area tag labels.
 * Used by: OrganizationSettings, CreateOrganization, all content modals, discovery filters.
 * @returns {Promise<string[]>}
 */
async function getCauseAreaTags() {
  return getTagsByGroup(GROUP_CAUSE_AREA);
}

/**
 * Returns all audience served tag labels.
 * Used by: OrganizationSettings, CreateOrganization, OrgCard, all content modals, discovery filters.
 * @returns {Promise<string[]>}
 */
async function getAudienceTags() {
  return getTagsByGroup(GROUP_AUDIENCE);
}

/**
 * Returns all language tag labels.
 * Used by: OrganizationSettings, CreateOrganization, OrgCard, all content modals, discovery filters.
 * @returns {Promise<string[]>}
 */
async function getLanguageTags() {
  return getTagsByGroup(GROUP_LANGUAGE);
}

/**
 * Returns all activity type tag labels.
 * Used by: CreateEvent, OrgPrograms.
 * @returns {Promise<string[]>}
 */
async function getActivityTypeTags() {
  return getTagsByGroup(GROUP_ACTIVITY);
}

/**
 * Returns all role type tag labels.
 * Used by: OrgOpportunities, OpportunityDiscovery.
 * @returns {Promise<string[]>}
 */
async function getRoleTypeTags() {
  return getTagsByGroup(GROUP_ROLE_TYPE);
}

/**
 * Returns all funding type tag labels.
 * Used by: OrgFunding, FundingDiscovery.
 * @returns {Promise<string[]>}
 */
async function getFundingTypeTags() {
  return getTagsByGroup(GROUP_FUNDING_TYPE);
}

/**
 * Returns all format tag labels.
 * Used by: CreateEvent, OrgOpportunities.
 * @returns {Promise<string[]>}
 */
async function getFormatTags() {
  return getTagsByGroup(GROUP_FORMAT);
}

/**
 * Returns all organization type tag labels.
 * Used by: DiscoveryFilters (/explore sidebar).
 * @returns {Promise<string[]>}
 */
async function getOrgTypeTags() {
  return getTagsByGroup(GROUP_ORG_TYPE);
}

/**
 * Convenience: returns all tags needed for OrganizationSettings and CreateOrganization.
 * @returns {Promise<{ causeAreas: string[], audience: string[], languages: string[] }>}
 */
async function getOrgTagSets() {
  var tags = await fetchAllTags();
  function byGroup(name) {
    return tags.filter(function(t) { return t.group_name === name; }).map(function(t) { return t.label; });
  }
  return {
    causeAreas: byGroup(GROUP_CAUSE_AREA),
    audience:   byGroup(GROUP_AUDIENCE),
    languages:  byGroup(GROUP_LANGUAGE),
  };
}

/**
 * Convenience: returns all tags needed for a content creation modal.
 * Groups are filtered to only those that apply to the given content type.
 * @param {string} contentType
 * @returns {Promise<{ causeAreas, audience, languages, activityTypes, roleTypes, fundingTypes, formats }>}
 */
async function getContentModalTags(contentType) {
  var tags = await fetchAllTags();
  function byGroup(name) {
    return tags
      .filter(function(t) {
        return t.group_name === name &&
          Array.isArray(t.applies_to) &&
          t.applies_to.includes(contentType);
      })
      .map(function(t) { return t.label; });
  }
  return {
    causeAreas:    byGroup(GROUP_CAUSE_AREA),
    audience:      byGroup(GROUP_AUDIENCE),
    languages:     byGroup(GROUP_LANGUAGE),
    activityTypes: byGroup(GROUP_ACTIVITY),
    roleTypes:     byGroup(GROUP_ROLE_TYPE),
    fundingTypes:  byGroup(GROUP_FUNDING_TYPE),
    formats:       byGroup(GROUP_FORMAT),
  };
}

/**
 * Convenience: returns all tags needed for a discovery filter sidebar.
 * Same as getContentModalTags but also includes orgTypes.
 * @param {string} contentType
 * @returns {Promise<{ causeAreas, audience, languages, activityTypes, roleTypes, fundingTypes, formats, orgTypes }>}
 */
async function getDiscoveryFilterTags(contentType) {
  var tags = await fetchAllTags();
  function byGroup(name) {
    return tags
      .filter(function(t) {
        return t.group_name === name &&
          Array.isArray(t.applies_to) &&
          t.applies_to.includes(contentType);
      })
      .map(function(t) { return t.label; });
  }
  return {
    causeAreas:    byGroup(GROUP_CAUSE_AREA),
    audience:      byGroup(GROUP_AUDIENCE),
    languages:     byGroup(GROUP_LANGUAGE),
    activityTypes: byGroup(GROUP_ACTIVITY),
    roleTypes:     byGroup(GROUP_ROLE_TYPE),
    fundingTypes:  byGroup(GROUP_FUNDING_TYPE),
    formats:       byGroup(GROUP_FORMAT),
    orgTypes:      tags.filter(function(t) { return t.group_name === GROUP_ORG_TYPE; }).map(function(t) { return t.label; }),
  };
}

// ─── Soft-block fuzzy match ───────────────────────────────────────────────────

/**
 * Given a custom tag string typed by an admin, returns the closest
 * platform tag label if similarity is above the threshold.
 * Used for the "Did you mean X?" soft-block suggestion.
 *
 * Simple implementation: checks if the input is a substring of a platform tag
 * or vice versa, or if the normalized strings share enough characters.
 *
 * For production fuzzy match, the DB uses pg_trgm — this client-side version
 * is a lightweight approximation for immediate UI feedback.
 *
 * @param {string} input
 * @param {string[]} platformLabels
 * @param {number} threshold — 0 to 1, default 0.75
 * @returns {string|null} closest match label or null
 */
function findSoftBlockMatch(input, platformLabels, threshold) {
  if (!input || !platformLabels || platformLabels.length === 0) return null;
  threshold = threshold !== undefined ? threshold : 0.75;
  var inputLower = input.toLowerCase().trim();
  if (!inputLower) return null;

  var best = null;
  var bestScore = 0;

  platformLabels.forEach(function(label) {
    var labelLower = label.toLowerCase();
    // Exact match — no suggestion needed
    if (inputLower === labelLower) { best = label; bestScore = 1; return; }
    // Substring check
    if (labelLower.includes(inputLower) || inputLower.includes(labelLower)) {
      var score = Math.min(inputLower.length, labelLower.length) / Math.max(inputLower.length, labelLower.length);
      if (score > bestScore) { best = label; bestScore = score; }
      return;
    }
    // Character overlap ratio (simple bigram-ish approximation)
    var inputChars = inputLower.split('');
    var labelChars = labelLower.split('');
    var matches = inputChars.filter(function(c) { return labelChars.includes(c); }).length;
    var score2 = (2 * matches) / (inputChars.length + labelChars.length);
    if (score2 > bestScore) { best = label; bestScore = score2; }
  });

  return bestScore >= threshold ? best : null;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  // Cache control
  invalidateTagCache,

  // Group name constants
  GROUP_CAUSE_AREA,
  GROUP_AUDIENCE,
  GROUP_ACTIVITY,
  GROUP_ROLE_TYPE,
  GROUP_FUNDING_TYPE,
  GROUP_FORMAT,
  GROUP_LANGUAGE,
  GROUP_ORG_TYPE,

  // Content type constants
  CONTENT_EVENT,
  CONTENT_PROGRAM,
  CONTENT_OPPORTUNITY,
  CONTENT_FUNDING,
  CONTENT_ORG,
  ALL_CONTENT_TYPES,

  // Core
  fetchAllTags,
  getTagsByGroup,
  getTagsForContent,
  getAllPlatformTagLabels,

  // Per-group helpers
  getCauseAreaTags,
  getAudienceTags,
  getLanguageTags,
  getActivityTypeTags,
  getRoleTypeTags,
  getFundingTypeTags,
  getFormatTags,
  getOrgTypeTags,

  // Convenience bundles
  getOrgTagSets,
  getContentModalTags,
  getDiscoveryFilterTags,

  // Soft-block
  findSoftBlockMatch,
};