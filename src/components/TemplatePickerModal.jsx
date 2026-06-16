import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, FileText, ChevronRight } from 'lucide-react';

var cardBg      = '#FFFFFF';
var pageBg      = '#F8FAFC';
var borderColor = '#E2E8F0';
var elevatedBg  = '#F1F5F9';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

// ── Platform-seeded templates (hardcoded starter set) ─────────────────────────
export var PLATFORM_TEMPLATES = {
  opportunity: [
    {
      _id: 'pt-opp-1',
      title: 'Board Member Position',
      description: 'We are seeking dedicated board members to help guide our organization\'s strategic direction. Board members attend monthly meetings and serve on at least one committee.',
      role_types: ['Board Member'],
      compensation_type: 'unpaid',
      location_type: 'hybrid',
      commitment: '5–8 hrs/month',
      apply_method: 'form',
      tags: ['Civic Engagement', 'Community Building'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      deadline: '',
      city: '',
      salary_min: '',
      salary_max: '',
      compensation_details: '',
      apply_url: '',
      who_is_it_for: 'Community leaders with experience in nonprofit governance, finance, legal, marketing, or program management.',
      _desc: 'For organizations seeking strategic leadership.',
    },
    {
      _id: 'pt-opp-2',
      title: 'Event Volunteer',
      description: 'Help us run our community events! Volunteers assist with setup, registration, logistics, and guest support. Flexible scheduling — sign up for shifts that work for you.',
      role_types: ['Event Support', 'Volunteer Coordination'],
      compensation_type: 'unpaid',
      location_type: 'in_person',
      commitment: 'Per event (4–6 hrs)',
      apply_method: 'form',
      tags: ['Community Building', 'Youth Development'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      deadline: '',
      city: '',
      salary_min: '',
      salary_max: '',
      compensation_details: '',
      apply_url: '',
      who_is_it_for: 'Community members of all ages and experience levels. No prior experience required.',
      _desc: 'Flexible volunteer shifts for community events.',
    },
    {
      _id: 'pt-opp-3',
      title: 'Grant Writer',
      description: 'We are looking for an experienced grant writer to help identify and pursue funding opportunities. Responsibilities include researching foundations, writing proposals, and tracking deadlines.',
      role_types: ['Grant Writing'],
      compensation_type: 'stipend',
      location_type: 'remote',
      commitment: '10–15 hrs/month',
      apply_method: 'form',
      tags: ['Economic Development', 'Nonprofit Management'],
      visibility: 'draft',
      reach: 'national',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      deadline: '',
      city: '',
      salary_min: '',
      salary_max: '',
      compensation_details: 'Stipend amount commensurate with experience.',
      apply_url: '',
      who_is_it_for: 'Individuals with experience writing grants for nonprofit organizations.',
      _desc: 'Remote grant writing with stipend.',
    },
    {
      _id: 'pt-opp-4',
      title: 'Committee Volunteer',
      description: 'Join one of our standing committees and contribute your expertise to our programs. Committees meet monthly and work on specific areas including programs, finance, and outreach.',
      role_types: ['Administrative', 'Program Coordination'],
      compensation_type: 'unpaid',
      location_type: 'hybrid',
      commitment: '3–5 hrs/month',
      apply_method: 'form',
      tags: ['Community Building', 'Civic Engagement'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      deadline: '',
      city: '',
      salary_min: '',
      salary_max: '',
      compensation_details: '',
      apply_url: '',
      who_is_it_for: 'Community members interested in contributing skills to specific program areas.',
      _desc: 'Monthly committee work in specialized areas.',
    },
  ],
  funding: [
    {
      _id: 'pt-fund-1',
      title: 'Community Impact Scholarship',
      description: 'This scholarship supports students who demonstrate financial need and a commitment to serving their community. Recipients are selected based on academic achievement, community involvement, and a personal essay.',
      funding_type: 'scholarship',
      funding_type_other: '',
      amount_type: 'fixed',
      amount_min: 1000,
      amount_max: null,
      eligibility: 'High school seniors or current college students residing in the local area with demonstrated financial need.',
      apply_method: 'form',
      tags: ['Education', 'Youth Development'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      deadline: '',
      apply_url: '',
      who_is_it_for: 'High school seniors and college students in the local community.',
      _desc: 'Annual scholarship for local students.',
    },
    {
      _id: 'pt-fund-2',
      title: 'Emergency Assistance Fund',
      description: 'Our emergency assistance fund provides one-time financial support to community members facing unexpected hardship. Applications are reviewed on a rolling basis and decisions are made within 5 business days.',
      funding_type: 'emergency_fund',
      funding_type_other: '',
      amount_type: 'range',
      amount_min: 100,
      amount_max: 500,
      eligibility: 'Residents of the local area experiencing a financial emergency such as eviction, utility shutoff, or medical crisis.',
      apply_method: 'form',
      tags: ['Emergency Assistance', 'Poverty Reduction'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      deadline: '',
      apply_url: '',
      who_is_it_for: 'Community members facing unexpected financial emergencies.',
      _desc: 'Rolling emergency grants up to $500.',
    },
    {
      _id: 'pt-fund-3',
      title: 'Community Mini-Grant',
      description: 'We award small grants to community members and local groups running projects that benefit the neighborhood. Projects can focus on any area including arts, environment, education, or community building.',
      funding_type: 'grant',
      funding_type_other: '',
      amount_type: 'range',
      amount_min: 250,
      amount_max: 2500,
      eligibility: 'Individuals, informal groups, or nonprofit organizations with a community-benefit project. No prior grant experience required.',
      apply_method: 'form',
      tags: ['Community Building', 'Neighborhood Revitalization'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      deadline: '',
      apply_url: '',
      who_is_it_for: 'Community members and grassroots groups with a project idea.',
      _desc: 'Small grants for neighborhood projects.',
    },
    {
      _id: 'pt-fund-4',
      title: 'Fellowship Award',
      description: 'This fellowship supports emerging leaders who are committed to creating change in their communities. Fellows receive a stipend, mentorship, and access to a network of community leaders.',
      funding_type: 'fellowship',
      funding_type_other: '',
      amount_type: 'fixed',
      amount_min: 5000,
      amount_max: null,
      eligibility: 'Early-career individuals (0–5 years experience) with demonstrated commitment to community service and civic engagement.',
      apply_method: 'form',
      tags: ['Workforce Development', 'Youth Development', 'Civic Engagement'],
      visibility: 'draft',
      reach: 'national',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      deadline: '',
      apply_url: '',
      who_is_it_for: 'Emerging community leaders in the early stages of their careers.',
      _desc: 'Stipend + mentorship for emerging leaders.',
    },
  ],
  program: [
    {
      _id: 'pt-prog-1',
      name: 'Food Distribution',
      description: 'A recurring food distribution program providing fresh produce and pantry staples to community members in need. Volunteers help sort, pack, and distribute food to families.',
      type: 'Distribution',
      audience: 'Community members experiencing food insecurity',
      schedule: 'Every Saturday 9 AM – 12 PM',
      cost_type: 'free',
      cost_amount: '',
      requires_approval: false,
      registration_open: true,
      apply_method: 'form',
      tags: ['Food Access', 'Food Security'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      _desc: 'Weekly food distribution for families in need.',
    },
    {
      _id: 'pt-prog-2',
      name: 'Youth Tutoring Program',
      description: 'Free one-on-one tutoring for K–12 students in math, reading, and science. Volunteer tutors meet with students weekly at our community center or via video call.',
      type: 'After-School Program',
      audience: 'K–12 students',
      schedule: 'Weekday afternoons, flexible scheduling',
      cost_type: 'free',
      cost_amount: '',
      requires_approval: true,
      registration_open: true,
      apply_method: 'form',
      tags: ['Education', 'Youth Development'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      _desc: 'Free K–12 tutoring with volunteer tutors.',
    },
    {
      _id: 'pt-prog-3',
      name: 'Community Workshop Series',
      description: 'A series of skills-building workshops open to all community members. Topics rotate monthly and cover areas such as financial literacy, job readiness, health, and digital skills.',
      type: 'Workshop',
      audience: 'Adults 18+',
      schedule: 'Monthly — first Tuesday of each month, 6–8 PM',
      cost_type: 'free',
      cost_amount: '',
      requires_approval: false,
      registration_open: true,
      apply_method: 'form',
      tags: ['Financial Literacy', 'Employment & Workforce', 'Community Building'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      _desc: 'Monthly skills workshops for adults.',
    },
    {
      _id: 'pt-prog-4',
      name: 'Job Training Program',
      description: 'A structured job training program helping participants build workplace skills, create resumes, and prepare for interviews. Includes employer connections and career coaching.',
      type: 'Job Training',
      audience: 'Job seekers and career changers',
      schedule: '6-week cohorts, starts quarterly',
      cost_type: 'free',
      cost_amount: '',
      requires_approval: true,
      registration_open: true,
      apply_method: 'form',
      tags: ['Employment & Workforce', 'Workforce Development'],
      visibility: 'draft',
      reach: 'local',
      group_ids: [],
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      _desc: '6-week cohort for job seekers.',
    },
  ],
};

// ── Focus trap ────────────────────────────────────────────────────────────────
function useFocusTrap(isActive) {
  var ref = useRef(null);
  useEffect(function() {
    if (!isActive || !ref.current) return;
    var el = ref.current;
    var focusable = el.querySelectorAll(
      'button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    function trap(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    el.addEventListener('keydown', trap);
    if (first) first.focus();
    return function() { el.removeEventListener('keydown', trap); };
  }, [isActive]);
  return ref;
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ template, contentType, onSelect }) {
  var titleField = contentType === 'program' ? template.name : template.title;
  var desc       = template._desc || template.description || '';
  var shortDesc  = desc.length > 100 ? desc.slice(0, 100) + '...' : desc;

  return (
    <div style={{
      background: cardBg,
      border: '0.5px solid ' + borderColor,
      borderRadius: '10px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
    className="hover:shadow-sm"
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: elevatedBg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={16} color={textMuted} aria-hidden="true" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: '0 0 3px', lineHeight: 1.3 }}>{titleField}</p>
          <p style={{ fontSize: '12px', color: textSecondary, margin: 0, lineHeight: 1.5 }}>{shortDesc}</p>
        </div>
      </div>
      <button
        onClick={function() { onSelect(template, titleField); }}
        style={{
          flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '6px 12px',
          background: '#3B82F6', color: '#FFFFFF',
          border: 'none', borderRadius: '6px',
          fontSize: '12px', fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={'Use template: ' + titleField}
      >
        Use this <ChevronRight size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
function TemplatePickerModal({ contentType, organizationId, onClose, onSelect }) {
  var trapRef = useFocusTrap(true);
  var [orgTemplates, setOrgTemplates] = useState([]);
  var [loading, setLoading]           = useState(true);

  var platformTemplates = PLATFORM_TEMPLATES[contentType] || [];

  var tableMap = {
    opportunity: 'org_opportunities',
    funding:     'org_funding',
    program:     'org_programs',
  };

  var titleMap = {
    opportunity: 'Opportunity',
    funding:     'Funding',
    program:     'Program',
  };

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, []);

  useEffect(function() {
    async function loadOrgTemplates() {
      setLoading(true);
      var table = tableMap[contentType];
      if (!table) { setLoading(false); return; }
      var result = await supabase
        .from(table)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_template', true)
        .order('created_at', { ascending: false });
      setOrgTemplates(result.data || []);
      setLoading(false);
    }
    loadOrgTemplates();
  }, [contentType, organizationId]);

  function getTitleField(template) {
    return contentType === 'program' ? (template.name || template.title || '') : (template.title || '');
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', zIndex: 60, overflowY: 'auto',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tmpl-picker-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={trapRef}
        style={{
          background: cardBg,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          marginTop: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '0.5px solid ' + borderColor, flexShrink: 0,
        }}>
          <div>
            <h2 id="tmpl-picker-title" style={{ fontSize: '17px', fontWeight: 800, color: textPrimary, margin: 0 }}>
              Choose a Template
            </h2>
            <p style={{ fontSize: '12px', color: textMuted, margin: '3px 0 0' }}>
              Select a starting point — you can edit everything before posting.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Close template picker"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Syndicade templates */}
          <section aria-labelledby="tmpl-platform-heading">
            <p id="tmpl-platform-heading" style={{
              fontSize: '11px', fontWeight: 700, color: '#F5B731',
              textTransform: 'uppercase', letterSpacing: '4px',
              margin: '0 0 12px',
            }}>
              Syndicade Templates
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {platformTemplates.map(function(tmpl) {
                return (
                  <TemplateCard
                    key={tmpl._id}
                    template={tmpl}
                    contentType={contentType}
                    onSelect={onSelect}
                  />
                );
              })}
            </div>
          </section>

          {/* Org templates */}
          {(loading || orgTemplates.length > 0) && (
            <section aria-labelledby="tmpl-org-heading">
              <p id="tmpl-org-heading" style={{
                fontSize: '11px', fontWeight: 700, color: '#F5B731',
                textTransform: 'uppercase', letterSpacing: '4px',
                margin: '0 0 12px',
              }}>
                Your Templates
              </p>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2].map(function(i) {
                    return (
                      <div key={i} style={{ height: '66px', background: elevatedBg, borderRadius: '10px' }} className="animate-pulse" />
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orgTemplates.map(function(tmpl) {
                    return (
                      <TemplateCard
                        key={tmpl.id}
                        template={tmpl}
                        contentType={contentType}
                        onSelect={onSelect}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '0.5px solid ' + borderColor,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              background: 'transparent',
              color: textSecondary,
              border: '1px solid ' + borderColor,
              borderRadius: '8px',
              fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
            }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplatePickerModal;