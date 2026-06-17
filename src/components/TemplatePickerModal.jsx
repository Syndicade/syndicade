import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, FileText, ChevronRight } from 'lucide-react';

var cardBg        = '#FFFFFF';
var pageBg        = '#F8FAFC';
var borderColor   = '#E2E8F0';
var elevatedBg    = '#F1F5F9';
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
  survey: [
    {
      _id: 'pt-survey-1',
      title: 'Annual Member Survey',
      description: 'Gather comprehensive feedback from members about programs, communication, and overall satisfaction with your organization.',
      anonymous_responses: true,
      allow_multiple_responses: false,
      show_results_after_submission: false,
      result_visibility: 'full',
      visibility: 'all_members',
      _questions: [
        { question_text: 'How satisfied are you with our organization overall?', question_type: 'rating', required: true, options: [] },
        { question_text: 'Which programs or services have you used this year?', question_type: 'multiple_choice', required: false, options: ['Community events', 'Educational programs', 'Volunteer opportunities', 'Member resources', 'Online community', 'None yet'] },
        { question_text: 'How would you rate our communication with members?', question_type: 'single_choice', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'I rarely hear from the organization'] },
        { question_text: 'What would most improve your experience as a member?', question_type: 'textarea', required: false, options: [] },
      ],
      _desc: 'Comprehensive yearly check-in on programs and satisfaction.',
    },
    {
      _id: 'pt-survey-2',
      title: 'Event Satisfaction Survey',
      description: 'Collect detailed feedback after an event to improve future programming and understand what worked well.',
      anonymous_responses: true,
      allow_multiple_responses: false,
      show_results_after_submission: true,
      result_visibility: 'full',
      visibility: 'all_members',
      _questions: [
        { question_text: 'How would you rate the event overall?', question_type: 'rating', required: true, options: [] },
        { question_text: 'How did you hear about this event?', question_type: 'single_choice', required: false, options: ['Email newsletter', 'Social media', 'Word of mouth', 'Organization website', 'Community board', 'Other'] },
        { question_text: 'Which aspects of the event did you enjoy?', question_type: 'multiple_choice', required: false, options: ['Content / topic', 'Speaker or presenter', 'Networking opportunities', 'Venue or format', 'Food or refreshments', 'Timing and length'] },
        { question_text: 'What could we do better next time?', question_type: 'textarea', required: false, options: [] },
        { question_text: 'Would you recommend our events to others?', question_type: 'single_choice', required: true, options: ['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not'] },
      ],
      _desc: 'Post-event feedback with rating, multiple choice, and open text.',
    },
    {
      _id: 'pt-survey-3',
      title: 'Program Feedback Survey',
      description: 'Evaluate the effectiveness of a specific program and understand participant outcomes and suggestions.',
      anonymous_responses: false,
      allow_multiple_responses: false,
      show_results_after_submission: false,
      result_visibility: 'full',
      visibility: 'all_members',
      _questions: [
        { question_text: 'How many sessions or meetings did you attend?', question_type: 'single_choice', required: true, options: ['All of them', 'Most of them (75%+)', 'About half', 'A few (less than half)', 'Just one'] },
        { question_text: 'How well did the program meet your needs?', question_type: 'rating', required: true, options: [] },
        { question_text: 'What skills or knowledge did you gain from this program?', question_type: 'multiple_choice', required: false, options: ['New technical skills', 'Leadership or soft skills', 'Community connections', 'Career opportunities', 'Personal development', 'I am still working on it'] },
        { question_text: 'What did you like most about the program?', question_type: 'textarea', required: false, options: [] },
        { question_text: 'Would you participate in this program again or recommend it?', question_type: 'single_choice', required: true, options: ['Yes, definitely', 'Yes, with some improvements', 'Not sure', 'No'] },
      ],
      _desc: 'Measure outcomes and satisfaction for a specific program.',
    },
    {
      _id: 'pt-survey-4',
      title: 'New Member Welcome Survey',
      description: 'Learn how new members found your organization, what they are looking for, and how to best support them.',
      anonymous_responses: false,
      allow_multiple_responses: false,
      show_results_after_submission: false,
      result_visibility: 'none',
      visibility: 'all_members',
      _questions: [
        { question_text: 'How did you hear about our organization?', question_type: 'single_choice', required: true, options: ['Friend or colleague', 'Social media', 'Internet search', 'Community event', 'Partner organization', 'Other'] },
        { question_text: 'What are you most hoping to get out of your membership?', question_type: 'multiple_choice', required: true, options: ['Networking and connections', 'Learning and development', 'Volunteer opportunities', 'Access to resources', 'Community and belonging', 'Professional recognition'] },
        { question_text: 'What skills or experience would you like to contribute?', question_type: 'textarea', required: false, options: [] },
        { question_text: 'How comfortable are you with our online platform so far?', question_type: 'single_choice', required: false, options: ['Very comfortable', 'Somewhat comfortable', 'Need a little help', 'Have not explored it yet'] },
      ],
      _desc: 'Onboarding survey to understand new member goals and background.',
    },
  ],
  poll: [
    {
      _id: 'pt-poll-1',
      title: 'Board Election Vote',
      description: 'Vote for your preferred candidate for the open board position. Each member may select one candidate. Results will be shared with all members after the voting period closes.',
      allow_anonymous: false,
      show_results_before_close: false,
      allow_vote_changes: false,
      result_visibility: 'full',
      _questions: [
        { question_text: 'Who is your preferred candidate for the open board seat?', question_type: 'single_choice', options: ['Candidate A', 'Candidate B', 'Candidate C', 'None of the above'] },
        { question_text: 'Do you feel there was adequate notice before this election?', question_type: 'yes_no_abstain', options: [] },
        { question_text: 'Which board committee would you most like the new member to lead?', question_type: 'multiple_choice', options: ['Finance', 'Programs', 'Outreach & Communications', 'Fundraising', 'No preference'] },
      ],
      _desc: 'Let members vote on candidates for open board positions.',
    },
    {
      _id: 'pt-poll-2',
      title: 'Event Feedback',
      description: 'Your feedback helps us improve future events for everyone. This poll takes less than 2 minutes to complete.',
      allow_anonymous: true,
      show_results_before_close: false,
      allow_vote_changes: false,
      result_visibility: 'full',
      _questions: [
        { question_text: 'How would you rate the event overall?', question_type: 'single_choice', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { question_text: 'What did you enjoy most about this event?', question_type: 'multiple_choice', options: ['The speakers / presenters', 'Networking opportunities', 'The venue or location', 'The activities or programming', 'The food or refreshments'] },
        { question_text: 'Would you attend a similar event again?', question_type: 'yes_no_abstain', options: [] },
      ],
      _desc: 'Gather quick satisfaction ratings after an event.',
    },
    {
      _id: 'pt-poll-3',
      title: 'Member Preference Poll',
      description: 'Help us plan programming that matters to you. Select all options that apply — there are no wrong answers.',
      allow_anonymous: true,
      show_results_before_close: false,
      allow_vote_changes: true,
      result_visibility: 'full',
      _questions: [
        { question_text: 'Which types of events would you like to see more of?', question_type: 'multiple_choice', options: ['Workshops and skill-building', 'Networking mixers', 'Community service days', 'Fundraisers', 'Webinars or online events', 'Family-friendly events'] },
        { question_text: 'What time of day works best for you to attend events?', question_type: 'single_choice', options: ['Morning (before noon)', 'Afternoon (noon – 5 PM)', 'Evening (after 5 PM)', 'Weekends only'] },
        { question_text: 'Are you interested in volunteering to help organize future events?', question_type: 'yes_no_abstain', options: [] },
      ],
      _desc: 'Find out what your members want more of.',
    },
    {
      _id: 'pt-poll-4',
      title: 'Budget Priority Poll',
      description: 'Help us understand what matters most to our members as we plan the upcoming budget cycle. Your input directly shapes how we allocate resources.',
      allow_anonymous: false,
      show_results_before_close: false,
      allow_vote_changes: false,
      result_visibility: 'full',
      _questions: [
        { question_text: 'Where should we focus our budget this year?', question_type: 'single_choice', options: ['Programs and services', 'Community events', 'Staff and operations', 'Technology and communications', 'Outreach and marketing'] },
        { question_text: 'Which of these would you support adding to our budget next year?', question_type: 'multiple_choice', options: ['Youth programming', 'Senior services', 'Mental health resources', 'Job training', 'Language access services', 'Emergency assistance fund'] },
        { question_text: 'Do you feel our current programs are meeting community needs?', question_type: 'yes_no_abstain', options: [] },
      ],
      _desc: 'Help members weigh in on where resources should go.',
    },
  ],

  // ── Sign-Up Form templates ──────────────────────────────────────────────────
  signup_form: [
    {
      _id: 'pt-sf-1',
      title: 'Volunteer Interest Form',
      description: 'Help us match you with the right opportunities! Sign up for one or more areas where you can contribute your time and skills.',
      _desc: 'Collect volunteer availability, skills, and areas of interest.',
      _items: [
        { item_name: 'Event Setup & Breakdown', description: 'Help set up and clean up before and after events. Typically 2–3 hrs per event.', max_slots: 10, slot_type: 'spots' },
        { item_name: 'Administrative Support', description: 'Data entry, filing, and office tasks. Flexible remote or in-person hours.', max_slots: 5, slot_type: 'spots' },
        { item_name: 'Outreach & Tabling', description: 'Represent the organization at community events and information tables.', max_slots: 8, slot_type: 'spots' },
        { item_name: 'Program Facilitation', description: 'Lead or co-facilitate a workshop or program session. Training provided.', max_slots: 4, slot_type: 'spots' },
      ],
    },
    {
      _id: 'pt-sf-2',
      title: 'Event Registration',
      description: 'Reserve your spot for our upcoming event. Space is limited — sign up early!',
      _desc: 'Simple RSVP with name, contact info, and optional dietary/accessibility notes.',
      _items: [
        { item_name: 'General Admission', description: 'Standard registration for the event.', max_slots: 50, slot_type: 'spots' },
        { item_name: 'VIP / Early Access', description: 'Includes early entry and reserved seating.', max_slots: 10, slot_type: 'spots' },
        { item_name: 'Volunteer (Day-of Help)', description: 'Register as a day-of volunteer. Includes event access.', max_slots: 8, slot_type: 'spots' },
      ],
    },
    {
      _id: 'pt-sf-3',
      title: 'Membership Application',
      description: 'Interested in becoming a member? Fill out this form and our team will follow up with next steps.',
      _desc: 'Gather background, interests, and motivation for joining.',
      _items: [
        { item_name: 'General Membership', description: 'Standard membership with access to all member benefits and events.', max_slots: 100, slot_type: 'spots' },
        { item_name: 'Student / Youth Membership', description: 'Discounted membership for students and members under 25.', max_slots: 30, slot_type: 'spots' },
        { item_name: 'Senior Membership', description: 'Membership for community members 65 and older.', max_slots: 30, slot_type: 'spots' },
      ],
    },
    {
      _id: 'pt-sf-4',
      title: 'Potluck & Supplies Sign-Up',
      description: 'Sign up to bring a dish or supplies to our community potluck. Coordinate with members so we have a good variety!',
      _desc: 'Open-ended sign-up for members to share what they will bring.',
      _items: [
        { item_name: 'Main Dish', description: 'A hearty entree to share (serves 8–10).', max_slots: 4, slot_type: 'spots' },
        { item_name: 'Side Dish or Salad', description: 'A side, salad, or vegetable dish (serves 8–10).', max_slots: 6, slot_type: 'spots' },
        { item_name: 'Dessert', description: 'A sweet treat to finish the meal (serves 8–10).', max_slots: 4, slot_type: 'spots' },
        { item_name: 'Drinks & Beverages', description: 'Non-alcoholic drinks, juice, or water for the group.', max_slots: 3, slot_type: 'spots' },
      ],
    },
  ],

  // ── Org-level Forms (form builder) templates ────────────────────────────────
  form: [
    {
      _id: 'pt-form-1',
      title: 'Flier / Graphic Design Request',
      description: 'Submit a request for a flier, social graphic, or other design asset.',
      requires_approval: false,
      status: 'draft',
      _desc: 'Collect project details, deadline, and format needed for design requests.',
      _fields: [
        { field_type: 'text', label: 'Project Name', placeholder: 'e.g. Spring Fundraiser Flier', required: true },
        { field_type: 'textarea', label: 'Description of Request', placeholder: 'What should the design include?', required: true },
        { field_type: 'date', label: 'Needed By', required: true },
        { field_type: 'dropdown', label: 'Format Needed', options: ['Digital Flier', 'Print Flier', 'Social Media Graphic', 'Other'], required: true },
        { field_type: 'textarea', label: 'Additional Notes', required: false },
      ],
    },
    {
      _id: 'pt-form-2',
      title: 'Press / PR Statement Request',
      description: 'Use this form to request a written statement or talking points.',
      requires_approval: true,
      status: 'draft',
      _desc: 'Request a press statement or messaging for local media or social channels.',
      _fields: [
        { field_type: 'text', label: 'Topic', required: true },
        { field_type: 'textarea', label: 'Key Points to Include', required: true },
        { field_type: 'dropdown', label: 'Audience', options: ['Local Press', 'Members', 'Social Media', 'Other'], required: true },
        { field_type: 'date', label: 'Deadline', required: false },
      ],
    },
    {
      _id: 'pt-form-3',
      title: 'Facility / Space Request',
      description: 'Request a space for your upcoming event or activity.',
      requires_approval: true,
      status: 'draft',
      _desc: 'Request use of a room, hall, or outdoor space for an event or activity.',
      _fields: [
        { field_type: 'text', label: 'Event / Activity Name', required: true },
        { field_type: 'date', label: 'Date Needed', required: true },
        { field_type: 'dropdown', label: 'Space Requested', options: ['Main Hall', 'Conference Room', 'Outdoor Space', 'Other'], required: true },
        { field_type: 'text', label: 'Expected Attendees', required: false },
        { field_type: 'textarea', label: 'Additional Needs', required: false },
      ],
    },
    {
      _id: 'pt-form-4',
      title: 'General Admin Request',
      description: 'Submit any general administrative request.',
      requires_approval: false,
      status: 'draft',
      _desc: 'Catch-all form for supply, IT, or scheduling requests.',
      _fields: [
        { field_type: 'dropdown', label: 'Request Type', options: ['Supplies', 'IT Support', 'Scheduling', 'Other'], required: true },
        { field_type: 'textarea', label: 'Details', required: true },
        { field_type: 'dropdown', label: 'Priority', options: ['Low', 'Medium', 'High'], required: true },
        { field_type: 'date', label: 'Needed By', required: false },
      ],
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

  // Show question count for polls/surveys, item count for signup forms, field count for forms
  var questionCount = template._questions ? template._questions.length : null;
  var itemCount     = template._items     ? template._items.length     : null;
  var fieldCount    = template._fields    ? template._fields.length    : null;

  var countLabel = null;
  if (questionCount !== null) countLabel = questionCount + ' question' + (questionCount !== 1 ? 's' : '');
  else if (itemCount !== null) countLabel = itemCount + ' item' + (itemCount !== 1 ? 's' : '');
  else if (fieldCount !== null) countLabel = fieldCount + ' field' + (fieldCount !== 1 ? 's' : '');

  return (
    <div
      style={{
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0, lineHeight: 1.3 }}>{titleField}</p>
            {countLabel && (
              <span style={{
                fontSize: '10px', fontWeight: 700, color: '#475569',
                background: elevatedBg, border: '0.5px solid ' + borderColor,
                borderRadius: '99px', padding: '1px 7px', whiteSpace: 'nowrap',
              }}>
                {countLabel}
              </span>
            )}
          </div>
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
          cursor: 'pointer', whiteSpace: 'nowrap',
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
    opportunity:  'org_opportunities',
    funding:      'org_funding',
    program:      'org_programs',
    poll:         'polls',
    survey:       'surveys',
    signup_form:  'signup_forms',
    form:         'org_forms',
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