import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { notifyOrganizationMembers } from '../lib/notificationService';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from './MascotToast';
import usePlanLimits from '../hooks/usePlanLimits';
import { Lock } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
var EVENT_TYPES = [
  'Arts & Culture','Charity & Fundraiser','Community Meeting',
  'Education & Workshop','Festival & Fair','Food & Drink',
  'Health & Wellness','Networking','Religious & Spiritual',
  'Social & Mixer','Sports & Recreation','Volunteer',
];
var AUDIENCE_OPTIONS = [
  'Adults (18+)','Children','Families','LGBTQ+',
  'Seniors','Students','Veterans','Women','Youth (13–17)',
];
var LANGUAGE_OPTIONS = [
  'Arabic','Chinese (Mandarin)','English','French','Haitian Creole',
  'Hindi','Portuguese','Russian','Somali','Spanish','Tagalog','Vietnamese',
];
var TABS = [
  { id: 'details',   label: 'Details' },
  { id: 'settings',  label: 'Settings' },
  { id: 'audience',  label: 'Audience & Tags' },
  { id: 'ticketing', label: 'Ticketing' },
  { id: 'publishing',label: 'Publishing' },
];
var TZ_MAP = {
  'America/New_York':'Eastern Time (EST/EDT)','America/Chicago':'Central Time (CST/CDT)',
  'America/Denver':'Mountain Time (MST/MDT)','America/Phoenix':'Mountain Time (MST)',
  'America/Los_Angeles':'Pacific Time (PST/PDT)','America/Anchorage':'Alaska (AKST)',
  'Pacific/Honolulu':'Hawaii (HST)','Europe/London':'London (GMT/BST)',
  'Europe/Paris':'Central Europe (CET)','Asia/Tokyo':'Japan (JST)',
  'Asia/Kolkata':'India (IST)','Australia/Sydney':'Australia East',
};
var STATE_MAP = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS',
  'kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD','massachusetts':'MA',
  'michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO','montana':'MT',
  'nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM',
  'new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK',
  'oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC',
  'south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT',
  'virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY',
};

var inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400';
var labelCls = 'block text-sm font-semibold text-gray-900 mb-2';

function blankTicketType() {
  return { name:'', price:'', early_bird_price:'', early_bird_ends_at:'', quantity_available:'' };
}
function defaultCheckoutFields() {
  return [
    { _key:'default-name',  label:'Full Name',     field_type:'text',  is_required:true,  is_default:true, options:null, sort_order:0 },
    { _key:'default-email', label:'Email Address', field_type:'email', is_required:true,  is_default:true, options:null, sort_order:1 },
    { _key:'default-phone', label:'Phone Number',  field_type:'phone', is_required:false, is_default:true, options:null, sort_order:2 },
  ];
}
function blankCustomField() {
  return { _key:'custom-'+Date.now(), label:'', field_type:'text', is_required:false, is_default:false, options:null, sort_order:99 };
}

// ── Primitives ───────────────────────────────────────────────────────────────
function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d,i){ return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d}/>; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path}/>}
    </svg>
  );
}

function Toggle({ checked, onChange, id, label }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} onClick={onChange}
      className={'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 '+(checked?'bg-blue-500':'bg-gray-300')}>
      <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all '+(checked?'left-[22px]':'left-0.5')} aria-hidden="true"/>
    </button>
  );
}

function MultiCheckbox({ options, selected, onChange, legend }) {
  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter(function(v){ return v!==val; }) : selected.concat([val]));
  }
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(function(opt){
          var checked = selected.includes(opt);
          return (
            <label key={opt} className={'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all '+(checked?'border-blue-500 bg-blue-50':'border-gray-200 bg-white hover:border-gray-300')}>
              <input type="checkbox" checked={checked} onChange={function(){ toggle(opt); }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// ── Tag Pill Input ───────────────────────────────────────────────────────────
function TagPillInput({ tags, onChange, placeholder, inputId }) {
  var [inputVal, setInputVal] = useState('');
  var inputRef = useRef(null);

  function addTag(raw) {
    var trimmed = raw.trim().toLowerCase().replace(/,/g, '');
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
      onChange(tags.concat([trimmed]));
    }
    setInputVal('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    }
    if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag) {
    onChange(tags.filter(function(t){ return t !== tag; }));
  }

  return (
    <div
      className="min-h-[48px] w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-text flex flex-wrap gap-1.5 items-center"
      onClick={function(){ if (inputRef.current) inputRef.current.focus(); }}
    >
      {tags.map(function(tag){
        return (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {tag}
            <button
              type="button"
              onClick={function(e){ e.stopPropagation(); removeTag(tag); }}
              className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full"
              aria-label={'Remove tag ' + tag}
            >
              <Icon path="M6 18L18 6M6 6l12 12" className="h-3 w-3"/>
            </button>
          </span>
        );
      })}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={inputVal}
        onChange={function(e){ setInputVal(e.target.value); }}
        onKeyDown={handleKeyDown}
        onBlur={function(){ if (inputVal.trim()) addTag(inputVal); }}
        placeholder={tags.length === 0 ? (placeholder || 'Type and press Enter…') : ''}
        className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400"
        aria-label="Add a tag"
      />
    </div>
  );
}

// ── Ticket Type Row ──────────────────────────────────────────────────────────
function TicketTypeRow({ ticket, index, onChange, onRemove, canRemove }) {
  var [showEarlyBird, setShowEarlyBird] = useState(!!(ticket.early_bird_price || ticket.early_bird_ends_at));

  function update(field, value) {
    onChange(index, Object.assign({}, ticket, { [field]: value }));
  }

  function toggleEarlyBird() {
    if (showEarlyBird) onChange(index, Object.assign({}, ticket, { early_bird_price:'', early_bird_ends_at:'' }));
    setShowEarlyBird(!showEarlyBird);
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ticket Type {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={function(){ onRemove(index); }}
            className="text-red-400 hover:text-red-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-0.5"
            aria-label={'Remove ticket type ' + (index+1)}>Remove</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={'tt-name-'+index} className="block text-xs font-semibold text-gray-700 mb-1">Name <span className="text-red-500" aria-hidden="true">*</span></label>
          <input id={'tt-name-'+index} type="text" value={ticket.name}
            onChange={function(e){ update('name', e.target.value); }}
            placeholder="e.g. General Admission" aria-required="true" className={inputCls}/>
        </div>
        <div>
          <label htmlFor={'tt-price-'+index} className="block text-xs font-semibold text-gray-700 mb-1">Price <span className="text-red-500" aria-hidden="true">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm" aria-hidden="true">$</span>
            <input id={'tt-price-'+index} type="number" min="0" step="0.01" value={ticket.price}
              onChange={function(e){ update('price', e.target.value); }}
              placeholder="0.00" aria-required="true" className={inputCls+' pl-7'}/>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor={'tt-qty-'+index} className="block text-xs font-semibold text-gray-700 mb-1">
          Quantity Available <span className="text-gray-400 font-normal">(leave blank for unlimited)</span>
        </label>
        <input id={'tt-qty-'+index} type="number" min="1" step="1" value={ticket.quantity_available}
          onChange={function(e){ update('quantity_available', e.target.value); }}
          placeholder="Unlimited" className={inputCls}/>
      </div>
      <div>
        <button type="button" onClick={toggleEarlyBird}
          className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-expanded={showEarlyBird}>
          <Icon path={showEarlyBird?'M19 9l-7 7-7-7':'M9 5l7 7-7 7'} className="h-3 w-3"/>
          {showEarlyBird ? 'Remove early bird pricing' : 'Add early bird pricing'}
        </button>
        {showEarlyBird && (
          <div className="mt-3 space-y-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={'tt-eb-price-'+index} className="block text-xs font-semibold text-yellow-800 mb-1">Early Bird Price <span className="text-red-500" aria-hidden="true">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm" aria-hidden="true">$</span>
                  <input id={'tt-eb-price-'+index} type="number" min="0" step="0.01" value={ticket.early_bird_price}
                    onChange={function(e){ update('early_bird_price', e.target.value); }}
                    placeholder="0.00" className={inputCls+' pl-7'}/>
                </div>
              </div>
              <div>
                <label htmlFor={'tt-eb-date-'+index} className="block text-xs font-semibold text-yellow-800 mb-1">Early Bird Ends <span className="text-red-500" aria-hidden="true">*</span></label>
                <input id={'tt-eb-date-'+index} type="datetime-local" value={ticket.early_bird_ends_at}
                  onChange={function(e){ update('early_bird_ends_at', e.target.value); }}
                  className={inputCls}/>
              </div>
            </div>
            <p className="text-xs text-yellow-700">After this date, the regular price applies automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Checkout Field Row ───────────────────────────────────────────────────────
function CheckoutFieldRow({ field, index, onChange, onRemove, canRemove }) {
  var [optionsText, setOptionsText] = useState(field.options ? field.options.join('\n') : '');

  function update(key, value) {
    onChange(index, Object.assign({}, field, { [key]: value }));
  }

  function handleOptionsChange(text) {
    setOptionsText(text);
    var opts = text.split('\n').map(function(s){ return s.trim(); }).filter(Boolean);
    onChange(index, Object.assign({}, field, { options: opts.length > 0 ? opts : null }));
  }

  var fieldTypeOptions = [
    { value:'text',     label:'Short Text' },
    { value:'email',    label:'Email' },
    { value:'phone',    label:'Phone' },
    { value:'dropdown', label:'Dropdown' },
    { value:'checkbox', label:'Checkbox (Yes/No)' },
  ];

  return (
    <div className={'border rounded-xl p-4 space-y-3 ' + (field.is_default ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white')}>
      <div className="flex items-center justify-between">
        <span className={'text-xs font-bold uppercase tracking-wide ' + (field.is_default ? 'text-blue-600' : 'text-gray-500')}>
          {field.is_default ? 'Default' : 'Custom Field'}
        </span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-semibold text-gray-600">Required</span>
            <Toggle checked={field.is_required} onChange={function(){ update('is_required', !field.is_required); }} id={'cf-req-'+index} label={'Toggle required for '+field.label}/>
          </label>
          {canRemove && (
            <button type="button" onClick={function(){ onRemove(index); }}
              className="text-red-400 hover:text-red-600 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-0.5"
              aria-label={'Remove field '+field.label}>Remove</button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={'cf-label-'+index} className="block text-xs font-semibold text-gray-700 mb-1">Field Label <span className="text-red-500" aria-hidden="true">*</span></label>
          <input id={'cf-label-'+index} type="text" value={field.label}
            onChange={function(e){ update('label', e.target.value); }}
            placeholder="e.g. T-shirt size" aria-required="true"
            className={inputCls} readOnly={field.is_default}/>
        </div>
        <div>
          <label htmlFor={'cf-type-'+index} className="block text-xs font-semibold text-gray-700 mb-1">Field Type</label>
          <select id={'cf-type-'+index} value={field.field_type}
            onChange={function(e){
              update('field_type', e.target.value);
              if (e.target.value !== 'dropdown') onChange(index, Object.assign({}, field, { field_type: e.target.value, options: null }));
            }}
            disabled={field.is_default} className={inputCls}>
            {fieldTypeOptions.map(function(o){ return <option key={o.value} value={o.value}>{o.label}</option>; })}
          </select>
        </div>
      </div>
      {field.field_type === 'dropdown' && (
        <div>
          <label htmlFor={'cf-opts-'+index} className="block text-xs font-semibold text-gray-700 mb-1">
            Options <span className="text-gray-400 font-normal">(one per line)</span>
          </label>
          <textarea id={'cf-opts-'+index} value={optionsText}
            onChange={function(e){ handleOptionsChange(e.target.value); }}
            placeholder={'Small\nMedium\nLarge\nXL'}
            rows={4} className={inputCls+' resize-none'}/>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
function CreateEvent({ isOpen, onClose, onSuccess, organizationId, organizationName, groupId, editingEvent }) {
  var [activeTab, setActiveTab] = useState('details');
  var planData = usePlanLimits(organizationId);
  var isAllowed = planData ? planData.isAllowed : function() { return false; };
  var canSellTickets = isAllowed('can_sell_tickets');
  var isGrowthPlus = planData && (planData.plan === 'growth' || planData.plan === 'pro');
  var [orgIsVerified, setOrgIsVerified] = useState(false);

  useEffect(function() {
    if (!organizationId) return;
    supabase.from('organizations').select('is_verified_nonprofit').eq('id', organizationId).single()
      .then(function(r) { if (r.data) setOrgIsVerified(r.data.is_verified_nonprofit || false); });
  }, [organizationId]);

  var [form, setForm] = useState({
    title:'', description:'', eventType:'in-person', isMultiDay:false,
    schedule:[{date:'',startTime:'',endTime:''}],
    locationName:'', fullAddress:'', city:'', state:'', zipCode:'',
    virtualLink:'', locationLink:'', maxAttendees:'',
    visibility:'members', requireRSVP:false, enableCheckIn:true,
  });

  var [loading, setLoading] = useState(false);
  var [geocoding, setGeocoding] = useState(false);
  var [error, setError] = useState(null);

  // Timezone
  var [showTimezoneSelector, setShowTimezoneSelector] = useState(false);
  var [selectedTimezone, setSelectedTimezone] = useState(null);
  var userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Address autocomplete
  var [addressInput, setAddressInput] = useState('');
  var [addressSuggestions, setAddressSuggestions] = useState([]);
  var [showSuggestions, setShowSuggestions] = useState(false);
  var [searchingAddress, setSearchingAddress] = useState(false);
  var [searchTimeout, setSearchTimeout] = useState(null);

  // Groups
  var [availableGroups, setAvailableGroups] = useState([]);
  var [selectedGroupIds, setSelectedGroupIds] = useState([]);
  var [loadingGroups, setLoadingGroups] = useState(false);

  // Recurring
  var [isRecurring, setIsRecurring] = useState(false);
  var [recurrenceType, setRecurrenceType] = useState('monthly');
  var [dayOfWeek, setDayOfWeek] = useState(1);
  var [weekOfMonth, setWeekOfMonth] = useState(1);
  var [weeklyDays, setWeeklyDays] = useState([1]);
  var [dailyInterval, setDailyInterval] = useState(1);
  var [weekdaysOnly, setWeekdaysOnly] = useState(false);
  var [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Audience & Tags tab
  var [eventTypes, setEventTypes] = useState([]);
  var [audience, setAudience] = useState([]);
  var [languages, setLanguages] = useState([]);
  var [eventTags, setEventTags] = useState([]);
  var [volunteerSignup, setVolunteerSignup] = useState(false);
  var [donationDropoff, setDonationDropoff] = useState(false);

  // Publishing tab
  var [publishToDiscovery, setPublishToDiscovery] = useState(false);
  var [publishToWebsite, setPublishToWebsite] = useState(false);
  var [isFeatured, setIsFeatured] = useState(false);

  // Details tab
  var [flierFile, setFlierFile] = useState(null);

  // Ticketing tab
  var [isPaid, setIsPaid] = useState(false);
  var [ticketTypes, setTicketTypes] = useState([blankTicketType()]);
  var [checkoutFields, setCheckoutFields] = useState(defaultCheckoutFields());

  var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var fullDayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  useEffect(function(){
    if (form.visibility === 'groups' && organizationId) fetchGroups();
  }, [form.visibility, organizationId]);

  useEffect(function(){
    if (!isOpen) { resetAll(); return; }
    if (!editingEvent) return;

    function parseDT(isoStr) {
      if (!isoStr) return { date:'', time:'' };
      var d = new Date(isoStr);
      return {
        date: d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),
        time: String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),
      };
    }

    var start = parseDT(editingEvent.start_time);
    var end   = parseDT(editingEvent.end_time);
    var fmt = 'in-person';
    if (editingEvent.is_virtual && editingEvent.location === 'Virtual Event') fmt = 'virtual';
    else if (editingEvent.is_virtual) fmt = 'hybrid';
    var isMulti = start.date && end.date && start.date !== end.date;
    var schedule = isMulti
      ? [{date:start.date,startTime:start.time,endTime:''},{date:end.date,startTime:'',endTime:end.time}]
      : [{date:start.date,startTime:start.time,endTime:end.time}];

    setForm({
      title:editingEvent.title||'', description:editingEvent.description||'',
      eventType:fmt, isMultiDay:isMulti, schedule:schedule,
      locationName:(fmt!=='virtual'?(editingEvent.full_address||editingEvent.location||''):''),
      fullAddress:editingEvent.full_address||'', city:editingEvent.city||'',
      state:editingEvent.state||'', zipCode:editingEvent.zip_code||'',
      virtualLink:editingEvent.virtual_link||'', locationLink:'',
      maxAttendees:editingEvent.max_attendees?String(editingEvent.max_attendees):'',
      visibility:editingEvent.visibility||'members',
      requireRSVP:editingEvent.require_rsvp||false,
      enableCheckIn:editingEvent.enable_check_in!==false,
    });

    setEventTypes(editingEvent.event_types||[]);
    setAudience(editingEvent.audience||[]);
    setLanguages(editingEvent.languages||[]);
    setEventTags(editingEvent.event_tags||[]);
    setVolunteerSignup(editingEvent.volunteer_signup||false);
    setDonationDropoff(editingEvent.donation_dropoff||false);
    setPublishToDiscovery(editingEvent.publish_to_discovery||false);
    setPublishToWebsite(editingEvent.publish_to_website||false);
    setIsFeatured(editingEvent.is_featured||false);

    var wasPaid = editingEvent.is_paid||false;
    setIsPaid(wasPaid);

    if (wasPaid) {
      supabase.from('event_ticket_types').select('*').eq('event_id', editingEvent.id).order('sort_order')
        .then(function(res){
          if (res.data && res.data.length > 0) {
            setTicketTypes(res.data.map(function(tt){
              var ebEndsAt = '';
              if (tt.early_bird_ends_at) {
                var d = new Date(tt.early_bird_ends_at);
                ebEndsAt = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
              }
              return { name:tt.name||'', price:tt.price!=null?String(tt.price):'', early_bird_price:tt.early_bird_price!=null?String(tt.early_bird_price):'', early_bird_ends_at:ebEndsAt, quantity_available:tt.quantity_available!=null?String(tt.quantity_available):'' };
            }));
          } else {
            setTicketTypes([blankTicketType()]);
          }
        });

      supabase.from('event_checkout_fields').select('*').eq('event_id', editingEvent.id).order('sort_order')
        .then(function(res){
          if (res.data && res.data.length > 0) {
            setCheckoutFields(res.data.map(function(f, i){
              return { _key:f.id||('field-'+i), label:f.label, field_type:f.field_type, is_required:f.is_required, is_default:f.is_default, options:f.options, sort_order:f.sort_order };
            }));
          } else {
            setCheckoutFields(defaultCheckoutFields());
          }
        });
    } else {
      setTicketTypes([blankTicketType()]);
      setCheckoutFields(defaultCheckoutFields());
    }

    if (editingEvent.is_recurring && editingEvent.recurrence_rule) {
      var rr = editingEvent.recurrence_rule;
      setIsRecurring(true); setRecurrenceType(rr.type||'monthly');
      if (rr.type==='monthly') { setDayOfWeek(rr.dayOfWeek!=null?rr.dayOfWeek:1); setWeekOfMonth(rr.weekOfMonth!=null?rr.weekOfMonth:1); }
      else if (rr.type==='weekly') { setWeeklyDays(rr.daysOfWeek||[1]); }
      else if (rr.type==='daily') { setDailyInterval(rr.interval||1); setWeekdaysOnly(rr.weekdaysOnly||false); }
      if (editingEvent.recurrence_end_date) {
        var red = new Date(editingEvent.recurrence_end_date);
        setRecurrenceEndDate(red.getFullYear()+'-'+String(red.getMonth()+1).padStart(2,'0')+'-'+String(red.getDate()).padStart(2,'0'));
      }
    }
  }, [isOpen, editingEvent]);

  function resetAll() {
    setActiveTab('details');
    setForm({title:'',description:'',eventType:'in-person',isMultiDay:false,schedule:[{date:'',startTime:'',endTime:''}],locationName:'',fullAddress:'',city:'',state:'',zipCode:'',virtualLink:'',locationLink:'',maxAttendees:'',visibility:'members',requireRSVP:false,enableCheckIn:true});
    setShowTimezoneSelector(false); setSelectedTimezone(null);
    setAddressInput(''); setAddressSuggestions([]); setShowSuggestions(false);
    setSelectedGroupIds([]); setAvailableGroups([]);
    setIsRecurring(false); setRecurrenceType('monthly'); setDayOfWeek(1); setWeekOfMonth(1);
    setWeeklyDays([1]); setDailyInterval(1); setWeekdaysOnly(false); setRecurrenceEndDate('');
    setEventTypes([]); setAudience([]); setLanguages([]); setEventTags([]);
    setVolunteerSignup(false); setDonationDropoff(false);
    setPublishToDiscovery(false); setPublishToWebsite(false); setIsFeatured(false);
    setFlierFile(null);
    setIsPaid(false); setTicketTypes([blankTicketType()]); setCheckoutFields(defaultCheckoutFields());
    setError(null);
  }

  async function fetchGroups() {
    setLoadingGroups(true);
    try {
      var { data, error:e } = await supabase.from('org_groups').select('id,name,description').eq('organization_id', organizationId).order('name');
      if (e) throw e;
      setAvailableGroups(data||[]);
    } catch(err) { toast.error('Could not load groups'); }
    finally { setLoadingGroups(false); }
  }

  function handleChange(e) {
    var name = e.target.name, value = e.target.type==='checkbox' ? e.target.checked : e.target.value;
    setForm(function(prev){ return Object.assign({}, prev, {[name]:value}); });
  }

  function handleScheduleChange(index, field, value) {
    var s = form.schedule.slice(); s[index] = Object.assign({}, s[index], {[field]:value});
    setForm(function(prev){ return Object.assign({}, prev, {schedule:s}); });
  }

  function addDay() {
    if (form.schedule.length < 5) setForm(function(prev){ return Object.assign({}, prev, {schedule:prev.schedule.concat([{date:'',startTime:'',endTime:''}])}); });
  }

  function removeDay(index) {
    if (form.schedule.length > 1) setForm(function(prev){ return Object.assign({}, prev, {schedule:prev.schedule.filter(function(_,i){ return i!==index; })}); });
  }

  function toggleWeeklyDay(day) {
    setWeeklyDays(function(prev){
      if (prev.includes(day)) { if (prev.length===1) return prev; return prev.filter(function(d){ return d!==day; }); }
      return prev.concat([day]).sort(function(a,b){ return a-b; });
    });
  }

  function handleTicketTypeChange(index, updated) {
    setTicketTypes(function(prev){ var next=prev.slice(); next[index]=updated; return next; });
  }
  function addTicketType() { setTicketTypes(function(prev){ return prev.concat([blankTicketType()]); }); }
  function removeTicketType(index) { setTicketTypes(function(prev){ return prev.filter(function(_,i){ return i!==index; }); }); }

  function handleCheckoutFieldChange(index, updated) {
    setCheckoutFields(function(prev){ var next=prev.slice(); next[index]=updated; return next; });
  }
  function addCustomField() { setCheckoutFields(function(prev){ return prev.concat([blankCustomField()]); }); }
  function removeCheckoutField(index) { setCheckoutFields(function(prev){ return prev.filter(function(_,i){ return i!==index; }); }); }

  function extractState(s) {
    if (!s) return '';
    var n = s.toLowerCase().trim();
    if (STATE_MAP[n]) return STATE_MAP[n];
    if (s.length === 2) return s.toUpperCase();
    return s.substring(0, 2).toUpperCase();
  }

  function formatAddressDisplay(address) {
    var num=address.house_number||'', road=address.road||'';
    var city=address.city||address.town||address.village||'';
    var parts=[]; var street=(num+' '+road).trim();
    if (street) parts.push(street); if (city) parts.push(city);
    if (address.state) parts.push(extractState(address.state)); if (address.postcode) parts.push(address.postcode);
    return parts.join(', ');
  }

  async function searchAddresses(query) {
    setSearchingAddress(true);
    try {
      var res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(query)+',USA&limit=8&addressdetails=1',{headers:{'Accept':'application/json'}});
      if (!res.ok) return;
      var data = await res.json();
      var filtered = data.filter(function(item){ var a=item.address||{}; return (a.road||a.house_number)&&(a.city||a.town||a.village); }).map(function(item){ return Object.assign({},item,{formatted:formatAddressDisplay(item.address)}); });
      setAddressSuggestions(filtered); setShowSuggestions(filtered.length > 0);
    } catch(err){ console.error(err); } finally { setSearchingAddress(false); }
  }

  function handleAddressInputChange(e) {
    var val = e.target.value; setAddressInput(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (val.length >= 3) { var t = setTimeout(function(){ searchAddresses(val); }, 500); setSearchTimeout(t); }
    else { setAddressSuggestions([]); setShowSuggestions(false); }
  }

  function selectAddress(s) {
    var a = s.address;
    setForm(function(prev){ return Object.assign({},prev,{locationName:s.formatted,fullAddress:s.formatted,city:a.city||a.town||a.village||'',state:extractState(a.state||''),zipCode:a.postcode||''}); });
    setAddressInput(''); setShowSuggestions(false); setAddressSuggestions([]);
  }

  async function geocodeAddress(address) {
    setGeocoding(true);
    try {
      var res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(address)+',USA&limit=1&addressdetails=1',{headers:{'Accept':'application/json'}});
      if (!res.ok) return null;
      var data = await res.json();
      if (data && data.length > 0) return {latitude:parseFloat(data[0].lat),longitude:parseFloat(data[0].lon)};
      return null;
    } catch(err){ return null; } finally { setGeocoding(false); }
  }

  function formatForPostgres(date) {
    var yr=date.getFullYear(),mo=String(date.getMonth()+1).padStart(2,'0'),dy=String(date.getDate()).padStart(2,'0');
    var hr=String(date.getHours()).padStart(2,'0'),mn=String(date.getMinutes()).padStart(2,'0');
    var offset=-date.getTimezoneOffset();
    var oh=String(Math.floor(Math.abs(offset)/60)).padStart(2,'0'),om=String(Math.abs(offset)%60).padStart(2,'0');
    return yr+'-'+mo+'-'+dy+' '+hr+':'+mn+':00'+(offset>=0?'+':'-')+oh+':'+om;
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null);
    if (form.title.trim().length < 3) { toast.error('Event title must be at least 3 characters'); setActiveTab('details'); return; }
    if (!form.schedule[0].date || !form.schedule[0].startTime) { toast.error('Please provide a date and start time'); setActiveTab('details'); return; }
    if (form.eventType==='virtual' && !form.virtualLink.trim()) { toast.error('Virtual events require a meeting link'); setActiveTab('details'); return; }
    if ((form.eventType==='in-person'||form.eventType==='hybrid') && !form.locationName.trim()) { toast.error('Please provide a location'); setActiveTab('details'); return; }
    if (form.eventType==='hybrid' && !form.virtualLink.trim()) { toast.error('Hybrid events require a virtual meeting link'); setActiveTab('details'); return; }
    if (form.visibility==='groups' && selectedGroupIds.length===0) { toast.error('Please select at least one group'); setActiveTab('settings'); return; }

    if (isPaid) {
      for (var ti=0; ti<ticketTypes.length; ti++) {
        var tt = ticketTypes[ti];
        if (!tt.name.trim()) { toast.error('Ticket type '+(ti+1)+' needs a name'); setActiveTab('ticketing'); return; }
        if (!tt.price || parseFloat(tt.price)<0) { toast.error('Ticket type '+(ti+1)+' needs a valid price'); setActiveTab('ticketing'); return; }
        if (tt.early_bird_price && !tt.early_bird_ends_at) { toast.error('Ticket type '+(ti+1)+': early bird needs an end date'); setActiveTab('ticketing'); return; }
        if (tt.early_bird_ends_at && !tt.early_bird_price) { toast.error('Ticket type '+(ti+1)+': early bird needs a price'); setActiveTab('ticketing'); return; }
        if (tt.early_bird_price && parseFloat(tt.early_bird_price)>=parseFloat(tt.price)) { toast.error('Ticket type '+(ti+1)+': early bird price must be less than regular price'); setActiveTab('ticketing'); return; }
      }

      var planTicketMax = planData && planData.plan === 'pro' ? 500 : 200;
      for (var qi = 0; qi < ticketTypes.length; qi++) {
        var ttQty = parseInt(ticketTypes[qi].quantity_available);
        if (ttQty && ttQty > planTicketMax) {
          toast.error('Ticket type "' + (ticketTypes[qi].name || ('Type ' + (qi + 1))) + '" exceeds your plan limit of ' + planTicketMax + ' tickets per event.');
          setActiveTab('ticketing');
          return;
        }
      }

      for (var fi=0; fi<checkoutFields.length; fi++) {
        var cf = checkoutFields[fi];
        if (!cf.label.trim()) { toast.error('Checkout field '+(fi+1)+' needs a label'); setActiveTab('ticketing'); return; }
        if (cf.field_type==='dropdown' && (!cf.options||cf.options.length===0)) { toast.error('Dropdown field "'+cf.label+'" needs at least one option'); setActiveTab('ticketing'); return; }
      }
    }

    setLoading(true);
    try {
      var first = form.schedule[0];
      var startParts = first.date.split('-'); var timeParts = first.startTime.split(':');
      var startDT = new Date(+startParts[0],+startParts[1]-1,+startParts[2],+timeParts[0],+timeParts[1],0);
      var endDT = null;
      if (form.isMultiDay && form.schedule.length > 1) {
        var last = form.schedule[form.schedule.length-1];
        if (last.date && last.endTime) { var ep=last.date.split('-'); var et=last.endTime.split(':'); endDT=new Date(+ep[0],+ep[1]-1,+ep[2],+et[0],+et[1],0); }
      } else if (first.endTime) {
        var ep2=first.date.split('-'); var et2=first.endTime.split(':');
        endDT=new Date(+ep2[0],+ep2[1]-1,+ep2[2],+et2[0],+et2[1],0);
      }

      var {data:{user},error:userErr} = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error('You must be logged in');

      var memberResult = await supabase.from('memberships').select('role').eq('organization_id',organizationId).eq('member_id',user.id).eq('status','active').maybeSingle();
      var userRole = memberResult.data ? memberResult.data.role : 'member';
      var approvalStatus = userRole==='admin' ? 'approved' : 'pending';

      var lat=null, lng=null;
      if ((form.eventType==='in-person'||form.eventType==='hybrid') && form.locationName) {
        var coords = await geocodeAddress(form.locationName);
        if (coords) { lat=coords.latitude; lng=coords.longitude; }
      }

      var flierUrl = null;
      if (flierFile) {
        if (flierFile.size > 5*1024*1024) { toast.error('File must be under 5MB'); setLoading(false); return; }
        var fileExt = flierFile.name.split('.').pop();
        var fileName = organizationId+'/'+Date.now()+'.'+fileExt;
        var {error:uploadErr} = await supabase.storage.from('event-fliers').upload(fileName, flierFile, {upsert:true});
        if (uploadErr) { toast.error('File upload failed'); setLoading(false); return; }
        var {data:urlData} = supabase.storage.from('event-fliers').getPublicUrl(fileName);
        flierUrl = urlData.publicUrl;
      }

      var recurrenceRule = null;
      if (isRecurring) {
        if (recurrenceType==='monthly') recurrenceRule={type:'monthly',dayOfWeek,weekOfMonth,time:first.startTime+':00'};
        else if (recurrenceType==='weekly') recurrenceRule={type:'weekly',daysOfWeek:weeklyDays,time:first.startTime+':00'};
        else recurrenceRule={type:'daily',interval:dailyInterval,weekdaysOnly,time:first.startTime+':00'};
      }

      var eventData = {
        organization_id:organizationId, title:form.title.trim(), description:form.description.trim(),
        start_time:formatForPostgres(startDT), end_time:endDT?formatForPostgres(endDT):null,
        location:form.eventType==='virtual'?'Virtual Event':form.locationName.trim(),
        full_address:(form.eventType==='in-person'||form.eventType==='hybrid')?form.locationName.trim():null,
        city:form.city.trim()||null, state:form.state||null, zip_code:form.zipCode.trim()||null,
        latitude:lat, longitude:lng,
        is_virtual:form.eventType==='virtual'||form.eventType==='hybrid',
        virtual_link:(form.eventType==='virtual'||form.eventType==='hybrid')?form.virtualLink.trim():null,
        location_link:null,
        max_attendees:form.maxAttendees?parseInt(form.maxAttendees):null,
        visibility:form.visibility, require_rsvp:form.requireRSVP, created_by:user.id,
        is_recurring:isRecurring, recurrence_rule:recurrenceRule,
        recurrence_end_date:isRecurring&&recurrenceEndDate?new Date(recurrenceEndDate).toISOString():null,
        parent_event_id:null,
        event_timezone:showTimezoneSelector?selectedTimezone:null,
        event_types:eventTypes.length>0?eventTypes:null,
        audience:audience.length>0?audience:null,
        languages:languages.length>0?languages:null,
        event_tags:eventTags.length>0?eventTags:null,
        volunteer_signup:volunteerSignup, donation_dropoff:donationDropoff,
        is_public:form.visibility==='public'||publishToDiscovery,
        publish_to_discovery:publishToDiscovery, publish_to_website:publishToWebsite,
        is_paid:isPaid, is_featured:isGrowthPlus?isFeatured:false,
        enable_check_in:form.enableCheckIn,
        approval_status:approvalStatus, flier_url:flierUrl,
      };

      var dbResult;
      if (editingEvent) {
        var {data:updatedEvt, error:eventErr} = await supabase.from('events').update(eventData).eq('id', editingEvent.id).select().single();
        if (eventErr) throw eventErr; dbResult = updatedEvt;
      } else {
        var {data:newEvent, error:eventErr2} = await supabase.from('events').insert([eventData]).select().single();
        if (eventErr2) throw eventErr2; dbResult = newEvent;
      }
      var savedEvent = dbResult;

      // Ticket types
      await supabase.from('event_ticket_types').delete().eq('event_id', savedEvent.id);
      if (isPaid) {
        var ticketRows = ticketTypes.map(function(tt2,i){
          return { event_id:savedEvent.id, name:tt2.name.trim(), price:parseFloat(tt2.price), early_bird_price:tt2.early_bird_price?parseFloat(tt2.early_bird_price):null, early_bird_ends_at:tt2.early_bird_ends_at?new Date(tt2.early_bird_ends_at).toISOString():null, quantity_available:tt2.quantity_available?parseInt(tt2.quantity_available):null, quantity_sold:0, sort_order:i };
        });
        var {error:ttErr} = await supabase.from('event_ticket_types').insert(ticketRows);
        if (ttErr) toast.error('Event saved but ticket types failed: '+ttErr.message);

        await supabase.from('event_checkout_fields').delete().eq('event_id', savedEvent.id);
        var fieldRows = checkoutFields.map(function(cf2,i){
          return { event_id:savedEvent.id, label:cf2.label.trim(), field_type:cf2.field_type, options:cf2.options||null, is_required:cf2.is_required, is_default:cf2.is_default||false, sort_order:i };
        });
        var {error:cfErr} = await supabase.from('event_checkout_fields').insert(fieldRows);
        if (cfErr) toast.error('Event saved but checkout fields failed: '+cfErr.message);
      } else {
        await supabase.from('event_checkout_fields').delete().eq('event_id', savedEvent.id);
      }

      // Groups
      var groupIdsToLink = [].concat(groupId?[groupId]:[]).concat(form.visibility==='groups'?selectedGroupIds.filter(function(id){ return id!==groupId; }):[]);
      if (!editingEvent && groupIdsToLink.length > 0) {
        var {error:grpErr} = await supabase.from('event_groups').insert(groupIdsToLink.map(function(gId){ return {event_id:savedEvent.id,group_id:gId}; }));
        if (grpErr) toast.error('Event created but group link failed.');
      }

      if (editingEvent) {
        mascotSuccessToast('"'+savedEvent.title+'" updated!');
      } else if (approvalStatus === 'pending') {
        mascotSuccessToast('Event submitted!', 'Pending admin approval.');
      } else {
        mascotSuccessToast('"'+savedEvent.title+'" created!'+(isRecurring?' Recurring instances generated for 6 months.':''));
      }

      if (onSuccess) onSuccess(savedEvent);

      if (!editingEvent && approvalStatus==='approved') {
        try {
          var notifRes = await notifyOrganizationMembers({organizationId,type:'event',title:'New Event',message:form.title+' — '+new Date(form.schedule[0].date).toLocaleDateString(),link:'/organizations/'+organizationId+'/events',excludeUserId:null});
          if (!notifRes.error) window.dispatchEvent(new CustomEvent('notificationCreated'));
        } catch(ne){ console.error('Notification failed:', ne); }
      }
      resetAll(); onClose();
    } catch(err) {
      console.error('CreateEvent error:', err);
      toast.error('Failed to save event: '+err.message);
      setError(err.message);
    } finally { setLoading(false); }
  }

  if (!isOpen) return null;

  // ── Tab indicator helpers ──────────────────────────────────────────────────
  function tabHasContent(tabId) {
    if (tabId==='audience') return eventTypes.length>0||audience.length>0||languages.length>0||eventTags.length>0||volunteerSignup||donationDropoff;
    if (tabId==='ticketing') return isPaid;
    if (tabId==='publishing') return publishToDiscovery||publishToWebsite||isFeatured;
    if (tabId==='settings') return isRecurring||form.visibility!=='members'||form.requireRSVP||form.maxAttendees;
    return false;
  }

  // ── Tab panels ─────────────────────────────────────────────────────────────

  function renderDetails() {
    return (
      <div className="space-y-6">

        {/* Title */}
        <div>
          <label htmlFor="event-title" className={labelCls}>Event Title <span className="text-red-500" aria-hidden="true">*</span></label>
          <input id="event-title" name="title" type="text" required aria-required="true" value={form.title} onChange={handleChange}
            placeholder="e.g. Community Cleanup Day" maxLength={200} className={inputCls}/>
          <p className="text-xs text-gray-400 mt-1" aria-live="polite">{form.title.length}/200</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="event-description" className={labelCls}>Description</label>
          <textarea id="event-description" name="description" value={form.description} onChange={handleChange}
            placeholder="Describe what this event is about…" rows={3} maxLength={1000}
            className={inputCls+' resize-none'} aria-describedby="desc-count"/>
          <p id="desc-count" className="text-xs text-gray-400 mt-1" aria-live="polite">{form.description.length}/1000</p>
        </div>

        {/* Event Format */}
        <div>
          <label className={labelCls}>Event Format <span className="text-red-500" aria-hidden="true">*</span></label>
          <div className="space-y-2" role="radiogroup" aria-label="Event format">
            {[
              {value:'in-person',label:'In-Person',desc:'Physical location only'},
              {value:'virtual', label:'Virtual',   desc:'Online only'},
              {value:'hybrid',  label:'Hybrid',    desc:'Both in-person and virtual'},
            ].map(function(opt){
              var checked = form.eventType===opt.value;
              return (
                <label key={opt.value} className={'flex items-center p-3 border-2 rounded-xl cursor-pointer transition-colors '+(checked?'border-blue-500 bg-blue-50':'border-gray-200 hover:bg-gray-50')}>
                  <input type="radio" name="eventType" value={opt.value} checked={checked} onChange={handleChange} className="w-4 h-4 text-blue-600"/>
                  <div className="ml-3"><p className="font-semibold text-gray-900 text-sm">{opt.label}</p><p className="text-xs text-gray-500">{opt.desc}</p></div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className={labelCls}>Schedule <span className="text-red-500" aria-hidden="true">*</span></label>
          <div className="space-y-3">
            {form.schedule.map(function(day, index){
              return (
                <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900">{form.isMultiDay?'Day '+(index+1):'Event Date & Time'}</p>
                    {form.isMultiDay&&form.schedule.length>1&&(
                      <button type="button" onClick={function(){ removeDay(index); }}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 rounded">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {id:'date-'+index,type:'date', label:'Date',       field:'date',      req:true},
                      {id:'start-'+index,type:'time',label:'Start Time', field:'startTime', req:true},
                      {id:'end-'+index,  type:'time',label:'End Time',   field:'endTime',   req:false},
                    ].map(function(f){
                      return (
                        <div key={f.id}>
                          <label htmlFor={f.id} className="block text-xs text-gray-500 mb-1">{f.label}</label>
                          <input id={f.id} type={f.type} required={f.req} value={day[f.field]}
                            onChange={function(e){ handleScheduleChange(index, f.field, e.target.value); }}
                            className={inputCls}/>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="isMultiDay" checked={form.isMultiDay} onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                <span className="text-sm font-semibold text-gray-900">Multi-Day Event</span>
              </label>
              {form.isMultiDay&&form.schedule.length<5&&(
                <button type="button" onClick={addDay}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">Add Day</button>
              )}
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Event Timezone</span>
            <button type="button" onClick={function(){ setShowTimezoneSelector(!showTimezoneSelector); }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              {showTimezoneSelector ? 'Use auto-detect' : 'Specify timezone'}
            </button>
          </div>
          {!showTimezoneSelector ? (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
              <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-4 w-4 text-green-500"/>
              Auto-detected: <strong className="text-gray-700">{TZ_MAP[userTimezone]||userTimezone}</strong>
            </p>
          ) : (
            <div className="mt-3">
              <label htmlFor="event-timezone" className="sr-only">Select event timezone</label>
              <select id="event-timezone" value={selectedTimezone||userTimezone}
                onChange={function(e){ setSelectedTimezone(e.target.value); }}
                className={inputCls}>
                <optgroup label="United States">
                  {[['America/New_York','Eastern (ET)'],['America/Chicago','Central (CT)'],['America/Denver','Mountain (MT)'],['America/Phoenix','Mountain - AZ'],['America/Los_Angeles','Pacific (PT)'],['America/Anchorage','Alaska'],['Pacific/Honolulu','Hawaii']].map(function(o){ return <option key={o[0]} value={o[0]}>{o[1]}</option>; })}
                </optgroup>
                <optgroup label="International">
                  {[['America/Toronto','Toronto'],['Europe/London','London'],['Europe/Paris','Central Europe'],['Asia/Tokyo','Japan'],['Asia/Kolkata','India'],['Australia/Sydney','Australia East']].map(function(o){ return <option key={o[0]} value={o[0]}>{o[1]}</option>; })}
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* Virtual link */}
        {(form.eventType==='virtual'||form.eventType==='hybrid') && (
          <div>
            <label htmlFor="virtual-link" className={labelCls}>Meeting Link <span className="text-red-500" aria-hidden="true">*</span></label>
            <input id="virtual-link" name="virtualLink" type="url" required value={form.virtualLink} onChange={handleChange}
              placeholder="https://zoom.us/j/…" className={inputCls}/>
          </div>
        )}

        {/* Physical location */}
        {(form.eventType==='in-person'||form.eventType==='hybrid') && (
          <div className="space-y-4">
            <div>
              <label htmlFor="location-name" className={labelCls}>Location <span className="text-red-500" aria-hidden="true">*</span></label>
              <input id="location-name" name="locationName" type="text" required value={form.locationName} onChange={handleChange}
                placeholder="123 Main St, Toledo, OH 43604" className={inputCls}/>
            </div>
            <div className="relative">
              <label htmlFor="address-search" className={labelCls}>
                Address Search <span className="text-gray-400 font-normal">(optional helper)</span>
              </label>
              <div className="relative">
                <input id="address-search" type="text" value={addressInput} onChange={handleAddressInputChange}
                  placeholder="Type to search…" className={inputCls} autoComplete="off"/>
                {searchingAddress && (
                  <div className="absolute right-3 top-3.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" aria-hidden="true"/>
                  </div>
                )}
              </div>
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map(function(s, i){
                    return (
                      <button key={i} type="button" onMouseDown={function(e){ e.preventDefault(); selectAddress(s); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-left border-b border-gray-100 last:border-0">
                        <Icon path={['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z','M15 11a3 3 0 11-6 0 3 3 0 016 0z']} className="h-4 w-4 text-blue-500 flex-shrink-0"/>
                        <p className="text-sm text-gray-900">{s.formatted}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {(form.city||form.state||form.zipCode) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-4 w-4 text-green-500 flex-shrink-0"/>
                <p className="text-xs text-green-700">Auto-detected: {[form.city,form.state,form.zipCode].filter(Boolean).join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Flier */}
        <div>
          <label htmlFor="event-flier" className={labelCls}>Flier or Image <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center gap-3">
            <label htmlFor="event-flier" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500">
              <Icon path="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" className="h-4 w-4 text-gray-500"/>
              <span>Choose file</span>
              <input id="event-flier" type="file" accept="image/*,.pdf" className="sr-only"
                onChange={function(e){ setFlierFile(e.target.files[0]||null); }} aria-label="Upload event flier"/>
            </label>
            {flierFile ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-gray-700 truncate">{flierFile.name}</span>
                <button type="button" onClick={function(){ setFlierFile(null); }}
                  className="text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded flex-shrink-0"
                  aria-label="Remove file">
                  <Icon path="M6 18L18 6M6 6l12 12" className="h-4 w-4"/>
                </button>
              </div>
            ) : (
              <span className="text-xs text-gray-400">JPG, PNG, or PDF — max 5MB</span>
            )}
          </div>
        </div>

      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="space-y-6">

        {/* Visibility */}
        <div>
          <label className={labelCls}>Who can see this event?</label>
          <div className="space-y-2" role="radiogroup" aria-label="Event visibility">
            {[
              {value:'public',  label:'Public',           desc:'Anyone can see this event'},
              {value:'members', label:'All Members',      desc:'All active members'},
              {value:'groups',  label:'Specific Groups',  desc:'Only members of selected groups'},
              {value:'draft',   label:'Draft',            desc:'Only visible to admins'},
            ].map(function(opt){
              var checked = form.visibility===opt.value;
              return (
                <label key={opt.value} className={'flex items-start p-3 border-2 rounded-xl cursor-pointer transition-colors '+(checked?'border-blue-500 bg-blue-50':'border-gray-200 hover:bg-gray-50')}>
                  <input type="radio" name="visibility" value={opt.value} checked={checked} onChange={handleChange} className="w-4 h-4 text-blue-600 mt-0.5"/>
                  <div className="ml-3"><p className="font-semibold text-gray-900 text-sm">{opt.label}</p><p className="text-xs text-gray-500">{opt.desc}</p></div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Group selector */}
        {form.visibility==='groups' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4" role="group" aria-labelledby="group-label">
            <p id="group-label" className="text-sm font-semibold text-purple-900 mb-3">
              Select groups <span className="text-red-500" aria-hidden="true">*</span>
            </p>
            {loadingGroups ? (
              <div className="space-y-2">{[1,2].map(function(i){ return <div key={i} className="h-10 bg-purple-100 rounded-lg animate-pulse"/>; })}</div>
            ) : availableGroups.length===0 ? (
              <p className="text-sm text-gray-500">No groups found.</p>
            ) : (
              <div className="space-y-2">
                {availableGroups.map(function(g){
                  var sel = selectedGroupIds.includes(g.id);
                  return (
                    <label key={g.id} className={'flex items-start p-3 border-2 rounded-xl cursor-pointer transition-colors '+(sel?'border-purple-500 bg-white':'border-gray-200 bg-white hover:border-purple-300')}>
                      <input type="checkbox" checked={sel}
                        onChange={function(){ setSelectedGroupIds(function(prev){ return prev.includes(g.id)?prev.filter(function(id){ return id!==g.id; }):prev.concat([g.id]); }); }}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-0.5" aria-label={'Select group '+g.name}/>
                      <div className="ml-3"><p className="font-semibold text-gray-900 text-sm">{g.name}</p>{g.description&&<p className="text-xs text-gray-500">{g.description}</p>}</div>
                    </label>
                  );
                })}
              </div>
            )}
            {selectedGroupIds.length > 0 && (
              <p className="mt-3 text-xs text-purple-700 font-medium">{selectedGroupIds.length} group{selectedGroupIds.length!==1?'s':''} selected</p>
            )}
          </div>
        )}

        {/* Max Attendees */}
        <div>
          <label htmlFor="max-attendees" className={labelCls}>Max Attendees <span className="text-gray-400 font-normal">(optional)</span></label>
          <input id="max-attendees" name="maxAttendees" type="number" min="1" value={form.maxAttendees} onChange={handleChange}
            placeholder="Leave blank for unlimited" className={inputCls}/>
        </div>

        {/* Require RSVP */}
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <input id="require-rsvp" name="requireRSVP" type="checkbox" checked={form.requireRSVP} onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"/>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Require RSVP</p>
            <p className="text-xs text-gray-500">Members must RSVP to attend this event.</p>
          </div>
        </label>

        {/* Enable Check-In */}
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <input id="enable-check-in" name="enableCheckIn" type="checkbox" checked={form.enableCheckIn} onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"/>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Enable Attendance Check-In</p>
            <p className="text-xs text-gray-500">Show the check-in widget on the event page. Only active on the day of the event.</p>
          </div>
        </label>

        {/* Recurring Event */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <label className="flex items-center gap-3 cursor-pointer mb-1">
            <input type="checkbox" checked={isRecurring} onChange={function(e){ setIsRecurring(e.target.checked); }}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
            <span className="font-semibold text-gray-900 text-sm">Recurring Event</span>
          </label>
          <p className="text-xs text-gray-500 mb-3 ml-7">Automatically create this event on a regular schedule.</p>

          {isRecurring && (
            <div className="space-y-4 border-l-4 border-blue-400 pl-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Recurrence Pattern</label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily','weekly','monthly'].map(function(t){
                    return (
                      <button key={t} type="button" onClick={function(){ setRecurrenceType(t); }}
                        className={'px-3 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 '+(recurrenceType===t?'bg-blue-600 text-white':'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>
                        {t.charAt(0).toUpperCase()+t.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {recurrenceType==='daily' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label htmlFor="daily-interval" className="text-xs text-gray-600 whitespace-nowrap">Every</label>
                    <input id="daily-interval" type="number" min="1" max="30" value={dailyInterval}
                      onChange={function(e){ setDailyInterval(parseInt(e.target.value)||1); }}
                      className={inputCls+' w-20'}/>
                    <span className="text-xs text-gray-600">day(s)</span>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={weekdaysOnly} onChange={function(e){ setWeekdaysOnly(e.target.checked); }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                    <span className="text-sm text-gray-700">Weekdays only (Mon–Fri)</span>
                  </label>
                </div>
              )}

              {recurrenceType==='weekly' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Days of the week</label>
                  <div className="grid grid-cols-7 gap-1">
                    {dayNames.map(function(d, i){
                      var sel = weeklyDays.includes(i);
                      return (
                        <button key={i} type="button" onClick={function(){ toggleWeeklyDay(i); }}
                          className={'py-2 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 '+(sel?'bg-blue-600 text-white':'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recurrenceType==='monthly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="week-of-month" className="block text-xs text-gray-600 mb-1">Which week?</label>
                    <select id="week-of-month" value={weekOfMonth} onChange={function(e){ setWeekOfMonth(parseInt(e.target.value)); }} className={inputCls}>
                      {[['1','First'],['2','Second'],['3','Third'],['4','Fourth'],['-1','Last']].map(function(o){ return <option key={o[0]} value={o[0]}>{o[1]}</option>; })}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="day-of-week" className="block text-xs text-gray-600 mb-1">Which day?</label>
                    <select id="day-of-week" value={dayOfWeek} onChange={function(e){ setDayOfWeek(parseInt(e.target.value)); }} className={inputCls}>
                      {fullDayNames.map(function(n, i){ return <option key={i} value={i}>{n}</option>; })}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="recurrence-end" className="block text-xs text-gray-600 mb-1">End Date <span className="text-gray-400">(optional)</span></label>
                <input id="recurrence-end" type="date" value={recurrenceEndDate} min={form.schedule[0].date}
                  onChange={function(e){ setRecurrenceEndDate(e.target.value); }}
                  className={inputCls}/>
                <p className="text-xs text-gray-400 mt-1">Leave blank — instances generated 6 months in advance.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  function renderAudience() {
    return (
      <div className="space-y-6">

        {/* Event Types */}
        <div>
          <p className={labelCls}>Event Types</p>
          <p className="text-xs text-gray-500 mb-3">Select all categories that apply.</p>
          <MultiCheckbox options={EVENT_TYPES} selected={eventTypes} onChange={setEventTypes} legend="Event types"/>
        </div>

        <div className="border-t border-gray-100"/>

        {/* Audience */}
        <div>
          <p className={labelCls}>Audience</p>
          <p className="text-xs text-gray-500 mb-3">Who is this event intended for?</p>
          <MultiCheckbox options={AUDIENCE_OPTIONS} selected={audience} onChange={setAudience} legend="Audience"/>
        </div>

        <div className="border-t border-gray-100"/>

        {/* Languages */}
        <div>
          <p className={labelCls}>Languages Supported</p>
          <p className="text-xs text-gray-500 mb-3">Which languages will this event be conducted in?</p>
          <MultiCheckbox options={LANGUAGE_OPTIONS} selected={languages} onChange={setLanguages} legend="Languages"/>
        </div>

        <div className="border-t border-gray-100"/>

        {/* Tags */}
        <div>
          <label htmlFor="event-tags-input" className={labelCls}>Tags &amp; Keywords</label>
          <p className="text-xs text-gray-500 mb-3">
            Help people find this event on the Discover page. Type a tag and press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> or comma to add.
          </p>
          <TagPillInput tags={eventTags} onChange={setEventTags} placeholder="e.g. food pantry, immigration, back to school…" inputId="event-tags-input"/>
          {eventTags.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">{eventTags.length}/20 tags added</p>
          )}
        </div>

        <div className="border-t border-gray-100"/>

        {/* Additional flags */}
        <div>
          <p className={labelCls}>Additional Options</p>
          <div className="space-y-3">
            {[
              {id:'volunteer', checked:volunteerSignup, onChange:function(){ setVolunteerSignup(!volunteerSignup); }, label:'Volunteer Sign-Up Available', desc:'This event needs volunteers.'},
              {id:'donation',  checked:donationDropoff, onChange:function(){ setDonationDropoff(!donationDropoff); }, label:'Donation Drop-Off',           desc:'Physical donations can be dropped off at this event.'},
            ].map(function(item){
              return (
                <div key={item.id} className={'flex items-center justify-between p-4 rounded-xl border '+(item.checked?'border-blue-400 bg-blue-50':'border-gray-200 bg-white')}>
                  <div><p className="font-semibold text-gray-900 text-sm">{item.label}</p><p className="text-xs text-gray-500 mt-0.5">{item.desc}</p></div>
                  <Toggle checked={item.checked} onChange={item.onChange} id={item.id} label={item.label}/>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  function renderTicketing() {
    if (!canSellTickets) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Lock size={22} color="#3B82F6" aria-hidden="true" />
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3B82F6', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Growth Plan
          </span>
          <h3 className="text-base font-bold text-gray-900 mb-2">Sell tickets to your events</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
            Upgrade to Growth to sell tickets with early bird pricing, custom checkout fields, and zero platform fees.
          </p>
          <a href={'/organizations/' + organizationId + '/billing'}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-sm bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Upgrade to Growth
          </a>
          <p className="text-xs text-gray-400 mt-4">Free events don't require ticketing — only paid events need Growth.</p>
        </div>
      );
    }

    var planTicketLimit = planData && planData.plan === 'pro' ? 500 : 200;

    return (
      <div className="space-y-6">

        {/* Paid Event toggle */}
        <div className={'flex items-center justify-between p-4 rounded-xl border ' + (isPaid ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white')}>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Paid Event</p>
            <p className="text-xs text-gray-500 mt-0.5">Require payment to RSVP. Syndicade takes no cut — Stripe fees only.</p>
          </div>
          <Toggle checked={isPaid} onChange={function(){ setIsPaid(!isPaid); if (!isPaid){ setTicketTypes([blankTicketType()]); setCheckoutFields(defaultCheckoutFields()); } }} id="is-paid" label="Paid Event"/>
        </div>

        {!isPaid && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3" aria-hidden="true">
              <Icon path="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" className="h-6 w-6 text-gray-400"/>
            </div>
            <p className="text-sm font-semibold text-gray-700">Free event</p>
            <p className="text-xs text-gray-400 mt-1">Toggle the switch above to add ticketing and payment.</p>
          </div>
        )}

        {isPaid && (
          <div className="space-y-6">

            {/* Ticket Types */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ticket Types</p>
                <span className="text-xs text-gray-400">Plan limit: {planTicketLimit} tickets per type</span>
              </div>
              <div className="space-y-3" role="list" aria-label="Ticket types">
                {ticketTypes.map(function(tt, i){
                  var qty = parseInt(tt.quantity_available) || 0;
                  var overLimit = qty > 0 && qty > planTicketLimit;
                  var nearLimit = qty > 0 && qty > Math.floor(planTicketLimit * 0.8) && qty <= planTicketLimit;
                  return (
                    <div key={i} role="listitem">
                      <TicketTypeRow ticket={tt} index={i} onChange={handleTicketTypeChange} onRemove={removeTicketType} canRemove={ticketTypes.length > 1}/>
                      {overLimit && (
                        <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg" role="alert">
                          <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"/>
                          <p className="text-xs text-red-700 font-medium">
                            {planData && planData.plan === 'pro'
                              ? 'Pro plan maximum is 500 tickets per event. Contact us for larger events.'
                              : 'Growth plan maximum is 200 tickets per event. Upgrade to Pro for up to 500.'}
                          </p>
                        </div>
                      )}
                      {nearLimit && (
                        <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5"/>
                          <p className="text-xs text-amber-700 font-medium">
                            Approaching your plan limit of {planTicketLimit} tickets per event.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={addTicketType}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Icon path="M12 4v16m8-8H4" className="h-4 w-4"/>
                Add Ticket Type
              </button>
            </div>

            <div className="border-t border-gray-200"/>

            {/* Checkout Fields */}
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Checkout Fields</p>
              <p className="text-xs text-gray-500 mb-3">Collected from buyers before payment. Toggle required, remove defaults, or add custom fields.</p>
              <div className="space-y-3" role="list" aria-label="Checkout fields">
                {checkoutFields.map(function(cf, i){
                  return (
                    <div key={cf._key||i} role="listitem">
                      <CheckoutFieldRow field={cf} index={i} onChange={handleCheckoutFieldChange} onRemove={removeCheckoutField} canRemove={true}/>
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={addCustomField}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-purple-400 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <Icon path="M12 4v16m8-8H4" className="h-4 w-4"/>
                Add Custom Field
              </button>
            </div>

          </div>
        )}

      </div>
    );
  }

  function renderPublishing() {
    return (
      <div className="space-y-6">

        <div>
          <p className={labelCls}>Where should this event appear?</p>
          <p className="text-xs text-gray-500 mb-4">Choose where this event is visible beyond your member list.</p>

          <div className="space-y-3">

            {/* Featured event — Growth+ only */}
            {isGrowthPlus ? (
              <div className={'flex items-start justify-between p-4 rounded-xl border gap-4 ' + (isFeatured ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white')}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">Feature this event</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(245,183,49,0.15)', border: '1px solid rgba(245,183,49,0.4)', color: '#B45309' }}>
                      $15/week
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Your event gets a highlighted border and Featured badge on the public Discover page.</p>
                  {isFeatured && (
                    <p className="text-xs text-yellow-700 font-medium mt-1.5 flex items-center gap-1">
                      <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-3.5 w-3.5"/>
                      Will appear as featured on the Discover page
                    </p>
                  )}
                </div>
                <Toggle checked={isFeatured} onChange={function(){ setIsFeatured(!isFeatured); }} id="is-featured" label="Feature this event"/>
              </div>
            ) : (
              <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 gap-4"
                style={{ opacity: 0.7 }}
                aria-label="Feature this event — available on Growth plan">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-500 text-sm">Feature this event</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3B82F6' }}>
                      <Lock size={10} aria-hidden="true"/>
                      Growth
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Highlighted border and Featured badge on the public Discover page. Available on Growth and above.</p>
                </div>
                <div className="flex-shrink-0" aria-hidden="true">
                  <div className="w-11 h-6 rounded-full bg-gray-200 relative cursor-not-allowed">
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"/>
                  </div>
                </div>
              </div>
            )}

            {/* Discover page */}
            <div className={'flex items-start justify-between p-4 rounded-xl border gap-4 ' + (!orgIsVerified ? 'border-gray-200 bg-gray-50 opacity-60' : publishToDiscovery ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white')}>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Discover Events page</p>
                <p className="text-xs text-gray-500 mt-0.5">Visible to anyone browsing public events at <span className="font-mono">/discover</span>. Your org must be a verified nonprofit to appear here.</p>
                {publishToDiscovery && (
                  <p className="text-xs text-green-700 font-medium mt-1.5 flex items-center gap-1">
                    <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-3.5 w-3.5"/>
                    Will appear on the discover page
                  </p>
                )}
              </div>
              <Toggle checked={publishToDiscovery} onChange={function(){ if (orgIsVerified) setPublishToDiscovery(!publishToDiscovery); }} id="pub-discovery" label="Show on Discover Events page"/>
            </div>

            {/* Org website */}
            <div className={'flex items-start justify-between p-4 rounded-xl border gap-4 ' + (publishToWebsite ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white')}>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Organization website</p>
                <p className="text-xs text-gray-500 mt-0.5">Appears on your org's public website page so visitors can see upcoming events.</p>
                {publishToWebsite && (
                  <p className="text-xs text-green-700 font-medium mt-1.5 flex items-center gap-1">
                    <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-3.5 w-3.5"/>
                    Will appear on your public website
                  </p>
                )}
              </div>
              <Toggle checked={publishToWebsite} onChange={function(){ setPublishToWebsite(!publishToWebsite); }} id="pub-website" label="Show on organization's website"/>
            </div>

          </div>
        </div>

        {!publishToDiscovery && !publishToWebsite && !isFeatured && (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3" aria-hidden="true">
              <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="h-6 w-6 text-gray-400"/>
            </div>
            <p className="text-sm font-semibold text-gray-700">Members only</p>
            <p className="text-xs text-gray-400 mt-1">This event will only be visible to your members. Toggle the options above to publish it more broadly.</p>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog" aria-modal="true" aria-labelledby="create-event-title"
      onKeyDown={function(e){ if(e.key==='Escape') onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 id="create-event-title" className="text-2xl font-bold text-gray-900">{editingEvent?'Edit Event':'Create New Event'}</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {organizationName}
              {groupId && <span className="ml-1 text-blue-600 font-medium">(linked to this group)</span>}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close dialog">
            <Icon path="M6 18L18 6M6 6l12 12" className="h-5 w-5"/>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto" role="tablist" aria-label="Event form sections">
          {TABS.map(function(tab){
            var isActive = activeTab===tab.id;
            var hasDot = tabHasContent(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={'tab-panel-'+tab.id}
                onClick={function(){ setActiveTab(tab.id); }}
                className={'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 '+(isActive?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
                {tab.label}
                {hasDot && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" aria-label="has content"/>
                )}
              </button>
            );
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex-shrink-0" role="alert">
            <p className="text-red-800 font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Tab panels */}
        <div className="overflow-y-auto flex-1 px-6 py-6" id={'tab-panel-'+activeTab} role="tabpanel" aria-labelledby={activeTab}>
          {activeTab==='details'    && renderDetails()}
          {activeTab==='settings'   && renderSettings()}
          {activeTab==='audience'   && renderAudience()}
          {activeTab==='ticketing'  && renderTicketing()}
          {activeTab==='publishing' && renderPublishing()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-2">
            {TABS.map(function(tab){
              var isActive = activeTab===tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={function(){ setActiveTab(tab.id); }}
                  className={'w-2 h-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 '+(isActive?'bg-blue-500':'bg-gray-300')}
                  aria-label={'Go to '+tab.label+' tab'}
                />
              );
            })}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={loading||geocoding}
              className="px-6 py-3 bg-transparent border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading||geocoding}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2">
              {loading||geocoding ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  {geocoding ? 'Finding location…' : (editingEvent ? 'Saving…' : 'Creating event…')}
                </>
              ) : (
                editingEvent ? 'Save Changes' : 'Create Event'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CreateEvent;