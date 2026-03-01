import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { notifyOrganizationMembers } from '../lib/notificationService';
import toast from 'react-hot-toast';

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

var inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400';
var labelCls = 'block text-sm font-semibold text-gray-900 mb-2';

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

var TZ_MAP = {
  'America/New_York':'Eastern Time (EST/EDT)','America/Chicago':'Central Time (CST/CDT)',
  'America/Denver':'Mountain Time (MST/MDT)','America/Phoenix':'Mountain Time (MST)',
  'America/Los_Angeles':'Pacific Time (PST/PDT)','America/Anchorage':'Alaska (AKST)',
  'Pacific/Honolulu':'Hawaii (HST)','Europe/London':'London (GMT/BST)',
  'Europe/Paris':'Central Europe (CET)','Asia/Tokyo':'Japan (JST)',
  'Asia/Kolkata':'India (IST)','Australia/Sydney':'Australia East',
};

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

// ── Main Component ───────────────────────────────────────────────────────────
function CreateEvent({ isOpen, onClose, onSuccess, organizationId, organizationName, groupId }) {
  var [form, setForm] = useState({
    title:'', description:'', eventType:'in-person', isMultiDay:false,
    schedule:[{date:'',startTime:'',endTime:''}],
    locationName:'', fullAddress:'', city:'', state:'', zipCode:'',
    virtualLink:'', locationLink:'', maxAttendees:'', visibility:'members', requireRSVP:false,
  });
  var [loading, setLoading] = useState(false);
  var [geocoding, setGeocoding] = useState(false);
  var [error, setError] = useState(null);

  var [addressInput, setAddressInput] = useState('');
  var [addressSuggestions, setAddressSuggestions] = useState([]);
  var [showSuggestions, setShowSuggestions] = useState(false);
  var [searchingAddress, setSearchingAddress] = useState(false);
  var [searchTimeout, setSearchTimeout] = useState(null);

  var [availableGroups, setAvailableGroups] = useState([]);
  var [selectedGroupIds, setSelectedGroupIds] = useState([]);
  var [loadingGroups, setLoadingGroups] = useState(false);

  var [isRecurring, setIsRecurring] = useState(false);
  var [recurrenceType, setRecurrenceType] = useState('monthly');
  var [dayOfWeek, setDayOfWeek] = useState(1);
  var [weekOfMonth, setWeekOfMonth] = useState(1);
  var [weeklyDays, setWeeklyDays] = useState([1]);
  var [dailyInterval, setDailyInterval] = useState(1);
  var [weekdaysOnly, setWeekdaysOnly] = useState(false);
  var [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  var [showTimezoneSelector, setShowTimezoneSelector] = useState(false);
  var [selectedTimezone, setSelectedTimezone] = useState(null);
  var userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  var [showAdvanced, setShowAdvanced] = useState(false);
  var [eventTypes, setEventTypes] = useState([]);
  var [audience, setAudience] = useState([]);
  var [languages, setLanguages] = useState([]);
  var [volunteerSignup, setVolunteerSignup] = useState(false);
  var [donationDropoff, setDonationDropoff] = useState(false);
  var [publishToDiscovery, setPublishToDiscovery] = useState(false);
  var [publishToWebsite, setPublishToWebsite] = useState(false);
  var [flierFile, setFlierFile] = useState(null);

  var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var fullDayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  useEffect(function(){
    if (form.visibility==='groups'&&organizationId) fetchGroups();
  }, [form.visibility, organizationId]);

  useEffect(function(){
    if (!isOpen) resetAll();
  }, [isOpen]);

  function resetAll() {
    setForm({title:'',description:'',eventType:'in-person',isMultiDay:false,schedule:[{date:'',startTime:'',endTime:''}],locationName:'',fullAddress:'',city:'',state:'',zipCode:'',virtualLink:'',locationLink:'',maxAttendees:'',visibility:'members',requireRSVP:false});
    setAddressInput(''); setAddressSuggestions([]); setShowSuggestions(false);
    setSelectedGroupIds([]); setAvailableGroups([]);
    setIsRecurring(false); setRecurrenceType('monthly'); setDayOfWeek(1); setWeekOfMonth(1);
    setWeeklyDays([1]); setDailyInterval(1); setWeekdaysOnly(false); setRecurrenceEndDate('');
    setShowTimezoneSelector(false); setSelectedTimezone(null);
    setShowAdvanced(false); setEventTypes([]); setAudience([]); setLanguages([]);
    setVolunteerSignup(false); setDonationDropoff(false); setPublishToDiscovery(false); setPublishToWebsite(false); setFlierFile(null);
    setError(null);
  }

  async function fetchGroups() {
    setLoadingGroups(true);
    try {
      var { data, error:e } = await supabase.from('org_groups').select('id,name,description').eq('organization_id',organizationId).order('name');
      if (e) throw e;
      setAvailableGroups(data||[]);
    } catch(err) { toast.error('Could not load groups'); }
    finally { setLoadingGroups(false); }
  }

  function handleChange(e) {
    var name=e.target.name, value=e.target.type==='checkbox'?e.target.checked:e.target.value;
    setForm(function(prev){ var u={}; u[name]=value; return Object.assign({},prev,u); });
  }

  function handleScheduleChange(index, field, value) {
    var s=form.schedule.slice(); s[index]=Object.assign({},s[index]); s[index][field]=value;
    setForm(function(prev){ return Object.assign({},prev,{schedule:s}); });
  }

  function addDay() {
    if (form.schedule.length<5)
      setForm(function(prev){ return Object.assign({},prev,{schedule:prev.schedule.concat([{date:'',startTime:'',endTime:''}])}); });
  }

  function removeDay(index) {
    if (form.schedule.length>1)
      setForm(function(prev){ return Object.assign({},prev,{schedule:prev.schedule.filter(function(_,i){ return i!==index; })}); });
  }

  function toggleWeeklyDay(day) {
    setWeeklyDays(function(prev){
      if (prev.includes(day)) { if(prev.length===1) return prev; return prev.filter(function(d){ return d!==day; }); }
      return prev.concat([day]).sort(function(a,b){ return a-b; });
    });
  }

  function extractState(s) {
    if (!s) return '';
    var n=s.toLowerCase().trim();
    if (STATE_MAP[n]) return STATE_MAP[n];
    if (s.length===2) return s.toUpperCase();
    return s.substring(0,2).toUpperCase();
  }

  function formatAddressDisplay(address) {
    var num=address.house_number||'', road=address.road||'';
    var city=address.city||address.town||address.village||'';
    var parts=[];
    var street=(num+' '+road).trim();
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (address.state) parts.push(extractState(address.state));
    if (address.postcode) parts.push(address.postcode);
    return parts.join(', ');
  }

  async function searchAddresses(query) {
    setSearchingAddress(true);
    try {
      var res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(query)+',USA&limit=8&addressdetails=1',{headers:{'Accept':'application/json'}});
      if (!res.ok) return;
      var data = await res.json();
      var filtered = data
        .filter(function(item){ var a=item.address||{}; return (a.road||a.house_number)&&(a.city||a.town||a.village); })
        .map(function(item){ return Object.assign({},item,{formatted:formatAddressDisplay(item.address)}); });
      setAddressSuggestions(filtered);
      setShowSuggestions(filtered.length>0);
    } catch(err){ console.error(err); }
    finally { setSearchingAddress(false); }
  }

  function handleAddressInputChange(e) {
    var val=e.target.value; setAddressInput(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (val.length>=3) { var t=setTimeout(function(){ searchAddresses(val); },500); setSearchTimeout(t); }
    else { setAddressSuggestions([]); setShowSuggestions(false); }
  }

  function selectAddress(s) {
    var a=s.address;
    setForm(function(prev){ return Object.assign({},prev,{locationName:s.formatted,fullAddress:s.formatted,city:a.city||a.town||a.village||'',state:extractState(a.state||''),zipCode:a.postcode||''}); });
    setAddressInput(''); setShowSuggestions(false); setAddressSuggestions([]);
  }

  async function geocodeAddress(address) {
    setGeocoding(true);
    try {
      var res=await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(address)+',USA&limit=1&addressdetails=1',{headers:{'Accept':'application/json'}});
      if (!res.ok) return null;
      var data=await res.json();
      if (data&&data.length>0) return {latitude:parseFloat(data[0].lat),longitude:parseFloat(data[0].lon)};
      return null;
    } catch(err){ return null; }
    finally { setGeocoding(false); }
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
    if (form.title.trim().length<3) { toast.error('Event title must be at least 3 characters'); return; }
    if (!form.schedule[0].date||!form.schedule[0].startTime) { toast.error('Please provide a date and start time'); return; }
    if (form.eventType==='virtual'&&!form.virtualLink.trim()) { toast.error('Virtual events require a meeting link'); return; }
    if ((form.eventType==='in-person'||form.eventType==='hybrid')&&!form.locationName.trim()) { toast.error('Please provide a location'); return; }
    if (form.eventType==='hybrid'&&!form.virtualLink.trim()) { toast.error('Hybrid events require a virtual meeting link'); return; }
    if (form.visibility==='groups'&&selectedGroupIds.length===0) { toast.error('Please select at least one group'); return; }

    setLoading(true);
    try {
      var first=form.schedule[0];
      var [yr,mo,dy]=first.date.split('-'); var [hr,mn]=first.startTime.split(':');
      var startDT=new Date(+yr,+mo-1,+dy,+hr,+mn,0);
      var endDT=null;
      if (form.isMultiDay&&form.schedule.length>1) {
        var last=form.schedule[form.schedule.length-1];
        if (last.date&&last.endTime) { var [ey,em,ed]=last.date.split('-'); var [eh,emin]=last.endTime.split(':'); endDT=new Date(+ey,+em-1,+ed,+eh,+emin,0); }
      } else if (first.endTime) {
        var [eh2,emin2]=first.endTime.split(':'); endDT=new Date(+yr,+mo-1,+dy,+eh2,+emin2,0);
      }

      var {data:{user},error:userErr}=await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error('You must be logged in');

      var lat=null,lng=null;
      if ((form.eventType==='in-person'||form.eventType==='hybrid')&&form.locationName) {
        var coords=await geocodeAddress(form.locationName);
        if (coords) { lat=coords.latitude; lng=coords.longitude; }
      }

      var eventData={
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
        is_recurring:isRecurring,
        recurrence_rule:isRecurring?(
          recurrenceType==='monthly'?{type:'monthly',dayOfWeek,weekOfMonth,time:first.startTime+':00'}:
          recurrenceType==='weekly'?{type:'weekly',daysOfWeek:weeklyDays,time:first.startTime+':00'}:
          {type:'daily',interval:dailyInterval,weekdaysOnly,time:first.startTime+':00'}
        ):null,
        recurrence_end_date:isRecurring&&recurrenceEndDate?new Date(recurrenceEndDate).toISOString():null,
        parent_event_id:null,
        event_timezone:showTimezoneSelector?selectedTimezone:null,
        event_types:eventTypes.length>0?eventTypes:null,
        audience:audience.length>0?audience:null,
        languages:languages.length>0?languages:null,
        volunteer_signup:volunteerSignup,
        donation_dropoff:donationDropoff,
        publish_to_discovery:publishToDiscovery,
        publish_to_website:publishToWebsite,
        approval_status:'approved',
        flier_url:flierUrl,
      };

      // Upload flier if attached
      var flierUrl = null;
      if (flierFile) {
        if (flierFile.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); setLoading(false); return; }
        var fileExt = flierFile.name.split('.').pop();
        var fileName = organizationId + '/' + Date.now() + '.' + fileExt;
        var { error: uploadErr } = await supabase.storage.from('event-fliers').upload(fileName, flierFile, { upsert: true });
        if (uploadErr) { toast.error('File upload failed — event not created'); setLoading(false); return; }
        var { data: urlData } = supabase.storage.from('event-fliers').getPublicUrl(fileName);
        flierUrl = urlData.publicUrl;
      }
      var {data:newEvent,error:eventErr}=await supabase.from('events').insert([eventData]).select().single();
      if (eventErr) throw eventErr;

      var groupIdsToLink=[...(groupId?[groupId]:[]),...(form.visibility==='groups'?selectedGroupIds.filter(function(id){ return id!==groupId; }):[] )];
      if (groupIdsToLink.length>0) {
        var {error:grpErr}=await supabase.from('event_groups').insert(groupIdsToLink.map(function(gId){ return {event_id:newEvent.id,group_id:gId}; }));
        if (grpErr) toast.error('Event created but group link failed.');
      }

      toast.success('"'+newEvent.title+'" created!'+(isRecurring?' Recurring instances generated for 6 months.':''));
      if (onSuccess) onSuccess(newEvent);

      try {
        var notifRes=await notifyOrganizationMembers({organizationId,type:'event',title:'New Event',message:form.title+' — '+new Date(form.schedule[0].date).toLocaleDateString(),link:'/organizations/'+organizationId+'/events',excludeUserId:null});
        if (!notifRes.error) window.dispatchEvent(new CustomEvent('notificationCreated'));
      } catch(ne){ console.error('Notification failed:',ne); }

      resetAll(); onClose();
    } catch(err) {
      console.error('CreateEvent error:',err);
      toast.error('Failed to create event: '+err.message);
      setError(err.message);
    } finally { setLoading(false); }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog" aria-modal="true" aria-labelledby="create-event-title"
      onKeyDown={function(e){ if(e.key==='Escape') onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 id="create-event-title" className="text-2xl font-bold text-gray-900">Create New Event</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {organizationName}
              {groupId && <span className="ml-1 text-blue-600 font-medium">(linked to this group)</span>}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Close create event dialog">
            <Icon path="M6 18L18 6M6 6l12 12" className="h-5 w-5"/>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-800 font-semibold text-sm">{error}</p>
            </div>
          )}

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
              placeholder="Describe what this event is about..." rows={3} maxLength={1000}
              className={inputCls+' resize-none'} aria-describedby="desc-count"/>
            <p id="desc-count" className="text-xs text-gray-400 mt-1" aria-live="polite">{form.description.length}/1000</p>
          </div>

          {/* Event Format */}
          <div>
            <label className={labelCls}>Event Format <span className="text-red-500" aria-hidden="true">*</span></label>
            <div className="space-y-2" role="radiogroup" aria-label="Event format">
              {[
                {value:'in-person',label:'In-Person',desc:'Physical location only'},
                {value:'virtual',  label:'Virtual',  desc:'Online only (Zoom, Google Meet, etc.)'},
                {value:'hybrid',   label:'Hybrid',   desc:'Both in-person and virtual options'},
              ].map(function(opt){
                var checked=form.eventType===opt.value;
                return (
                  <label key={opt.value} className={'flex items-center p-3 border-2 rounded-xl cursor-pointer transition-colors '+(checked?'border-blue-500 bg-blue-50':'border-gray-200 hover:bg-gray-50')}>
                    <input type="radio" name="eventType" value={opt.value} checked={checked} onChange={handleChange} className="w-4 h-4 text-blue-600"/>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className={labelCls}>Schedule <span className="text-red-500" aria-hidden="true">*</span></label>
            <div className="space-y-3">
              {form.schedule.map(function(day,index){
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
                        {id:'date-'+index,type:'date',label:'Date',field:'date',req:true},
                        {id:'start-'+index,type:'time',label:'Start Time',field:'startTime',req:true},
                        {id:'end-'+index,type:'time',label:'End Time',field:'endTime',req:false},
                      ].map(function(f){
                        return (
                          <div key={f.id}>
                            <label htmlFor={f.id} className="block text-xs text-gray-500 mb-1">{f.label}</label>
                            <input id={f.id} type={f.type} required={f.req} value={day[f.field]}
                              onChange={function(e){ handleScheduleChange(index,f.field,e.target.value); }}
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
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                    Add Day
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Virtual link */}
          {(form.eventType==='virtual'||form.eventType==='hybrid') && (
            <div>
              <label htmlFor="virtual-link" className={labelCls}>Meeting Link <span className="text-red-500" aria-hidden="true">*</span></label>
              <input id="virtual-link" name="virtualLink" type="url" required value={form.virtualLink} onChange={handleChange}
                placeholder="https://zoom.us/j/..." className={inputCls}/>
              <p className="text-xs text-gray-400 mt-1">Zoom, Google Meet, Microsoft Teams, etc.</p>
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
                <label htmlFor="address-search" className={labelCls}>Address Search <span className="text-gray-400 font-normal">(optional helper)</span></label>
                <div className="relative">
                  <input id="address-search" type="text" value={addressInput} onChange={handleAddressInputChange}
                    placeholder="Type to search for an address..." className={inputCls} autoComplete="off"/>
                  {searchingAddress&&(
                    <div className="absolute right-3 top-3.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" aria-hidden="true"/>
                    </div>
                  )}
                </div>
                {showSuggestions&&addressSuggestions.length>0&&(
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {addressSuggestions.map(function(s,i){
                      return (
                        <button key={i} type="button" onMouseDown={function(e){ e.preventDefault(); selectAddress(s); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-left border-b border-gray-100 last:border-0 transition-colors">
                          <Icon path={['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z','M15 11a3 3 0 11-6 0 3 3 0 016 0z']} className="h-4 w-4 text-blue-500 flex-shrink-0"/>
                          <p className="text-sm text-gray-900">{s.formatted}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {(form.city||form.state||form.zipCode)&&(
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-4 w-4 text-green-500 flex-shrink-0"/>
                  <p className="text-xs text-green-700">Auto-detected: {[form.city,form.state,form.zipCode].filter(Boolean).join(', ')}</p>
                </div>
              )}

                <div className="flex items-center gap-3">
                </div>
              </div>
          )}

          {/* Max Attendees */}
          <div>
            <label htmlFor="max-attendees" className={labelCls}>Max Attendees <span className="text-gray-400 font-normal">(optional)</span></label>
            <input id="max-attendees" name="maxAttendees" type="number" min="1" value={form.maxAttendees} onChange={handleChange}
              placeholder="Leave blank for unlimited" className={inputCls}/>
          </div>

          {/* Recurring */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <label className="flex items-center gap-3 cursor-pointer mb-1">
              <input type="checkbox" checked={isRecurring} onChange={function(e){ setIsRecurring(e.target.checked); }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
              <span className="font-semibold text-gray-900 text-sm">Recurring Event</span>
            </label>
            <p className="text-xs text-gray-500 mb-3 ml-7">Automatically create this event on a regular schedule.</p>

            {isRecurring&&(
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

                {recurrenceType==='daily'&&(
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label htmlFor="daily-interval" className="text-xs text-gray-600 whitespace-nowrap">Every</label>
                      <input id="daily-interval" type="number" min="1" max="30" value={dailyInterval}
                        onChange={function(e){ setDailyInterval(parseInt(e.target.value)||1); }} className={inputCls+' w-20'}/>
                      <span className="text-xs text-gray-600">day(s)</span>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={weekdaysOnly} onChange={function(e){ setWeekdaysOnly(e.target.checked); }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                      <span className="text-sm text-gray-700">Weekdays only (Mon–Fri)</span>
                    </label>
                  </div>
                )}

                {recurrenceType==='weekly'&&(
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Days of the week</label>
                    <div className="grid grid-cols-7 gap-1">
                      {dayNames.map(function(d,i){
                        var sel=weeklyDays.includes(i);
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

                {recurrenceType==='monthly'&&(
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
                        {fullDayNames.map(function(n,i){ return <option key={i} value={i}>{n}</option>; })}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="recurrence-end" className="block text-xs text-gray-600 mb-1">End Date <span className="text-gray-400">(optional)</span></label>
                  <input id="recurrence-end" type="date" value={recurrenceEndDate} min={form.schedule[0].date}
                    onChange={function(e){ setRecurrenceEndDate(e.target.value); }} className={inputCls}/>
                  <p className="text-xs text-gray-400 mt-1">Leave blank — instances generated 6 months in advance.</p>
                </div>
              </div>
            )}
          </div>

          {/* Timezone */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Event Timezone</span>
              <button type="button" onClick={function(){ setShowTimezoneSelector(!showTimezoneSelector); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors">
                {showTimezoneSelector?'Use auto-detect':'Specify timezone'}
              </button>
            </div>
            {!showTimezoneSelector?(
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-4 w-4 text-green-500"/>
                Auto-detected: <strong className="text-gray-700">{TZ_MAP[userTimezone]||userTimezone}</strong>
              </p>
            ):(
              <div className="mt-3">
                <label htmlFor="event-timezone" className="sr-only">Select event timezone</label>
                <select id="event-timezone" value={selectedTimezone||userTimezone} onChange={function(e){ setSelectedTimezone(e.target.value); }} className={inputCls}>
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
<label htmlFor="event-flier" className={labelCls}>Flier or Image <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="flex items-center gap-3">
                <label htmlFor="event-flier"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 transition-colors">
                  <Icon path="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" className="h-4 w-4 text-gray-500"/>
                  <span>Choose file</span>
                  <input id="event-flier" type="file" accept="image/*,.pdf" className="sr-only"
                    onChange={function(e){ setFlierFile(e.target.files[0]||null); }}
                    aria-label="Upload event flier or image"/>
                </label>
                {flierFile ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-gray-700 truncate">{flierFile.name}</span>
                    <button type="button" onClick={function(){ setFlierFile(null); }}
                      className="text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded flex-shrink-0" aria-label="Remove file">
                      <Icon path="M6 18L18 6M6 6l12 12" className="h-4 w-4"/>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">JPG, PNG, or PDF — max 5MB</span>
                )}
              </div>
          {/* Visibility */}
          <div>
            <label className={labelCls}>Who can see this event?</label>
            <div className="space-y-2" role="radiogroup" aria-label="Event visibility">
              {[
                {value:'public', label:'Public',         desc:'Anyone can see this event'},
                {value:'members',label:'All Members',    desc:'All active members of this organization'},
                {value:'groups', label:'Specific Groups',desc:'Only members of the groups you select'},
                {value:'draft',  label:'Draft',          desc:'Only visible to admins'},
              ].map(function(opt){
                var checked=form.visibility===opt.value;
                return (
                  <label key={opt.value} className={'flex items-start p-3 border-2 rounded-xl cursor-pointer transition-colors '+(checked?'border-blue-500 bg-blue-50':'border-gray-200 hover:bg-gray-50')}>
                    <input type="radio" name="visibility" value={opt.value} checked={checked} onChange={handleChange} className="w-4 h-4 text-blue-600 mt-0.5"/>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Group selector */}
          {form.visibility==='groups'&&(
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4" role="group" aria-labelledby="group-label">
              <p id="group-label" className="text-sm font-semibold text-purple-900 mb-3">
                Select groups <span className="text-red-500" aria-hidden="true">*</span>
              </p>
              {loadingGroups?(
                <div className="space-y-2">
                  {[1,2].map(function(i){ return <div key={i} className="h-10 bg-purple-100 rounded-lg animate-pulse"/>; })}
                </div>
              ):availableGroups.length===0?(
                <p className="text-sm text-gray-500">No groups found. Create groups first in the Groups tab.</p>
              ):(
                <div className="space-y-2">
                  {availableGroups.map(function(g){
                    var sel=selectedGroupIds.includes(g.id);
                    return (
                      <label key={g.id} className={'flex items-start p-3 border-2 rounded-xl cursor-pointer transition-colors '+(sel?'border-purple-500 bg-white':'border-gray-200 bg-white hover:border-purple-300')}>
                        <input type="checkbox" checked={sel}
                          onChange={function(){ setSelectedGroupIds(function(prev){ return prev.includes(g.id)?prev.filter(function(id){ return id!==g.id; }):prev.concat([g.id]); }); }}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-0.5" aria-label={'Select group '+g.name}/>
                        <div className="ml-3">
                          <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                          {g.description&&<p className="text-xs text-gray-500">{g.description}</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {selectedGroupIds.length>0&&(
                <p className="mt-3 text-xs text-purple-700 font-medium">{selectedGroupIds.length} group{selectedGroupIds.length!==1?'s':''} selected</p>
              )}
            </div>
          )}

          {/* Require RSVP */}
          <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <input id="require-rsvp" name="requireRSVP" type="checkbox" checked={form.requireRSVP} onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"/>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Require RSVP</p>
              <p className="text-xs text-gray-500">Members must RSVP to attend this event.</p>
            </div>
          </label>

          {/* ── Advanced Settings ── */}
          <div>
            <button type="button" onClick={function(){ setShowAdvanced(!showAdvanced); }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-expanded={showAdvanced} aria-controls="advanced-panel">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <Icon path="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" className="h-4 w-4 text-gray-500"/>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">Advanced Settings</p>
                  <p className="text-xs text-gray-500">Event types, audience, publishing — all optional</p>
                </div>
              </div>
              <Icon path={showAdvanced?'M5 15l7-7 7 7':'M19 9l-7 7-7-7'} className="h-4 w-4 text-gray-400"/>
            </button>

            {showAdvanced&&(
              <div id="advanced-panel" className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-5 space-y-6">

                  {/* Event Types */}
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Event Types</p>
                    <p className="text-xs text-gray-500 mb-3">Select all categories that apply to this event.</p>
                    <MultiCheckbox options={EVENT_TYPES} selected={eventTypes} onChange={setEventTypes} legend="Event types"/>
                  </div>

                  {/* Audience */}
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Audience</p>
                    <p className="text-xs text-gray-500 mb-3">Who is this event intended for?</p>
                    <MultiCheckbox options={AUDIENCE_OPTIONS} selected={audience} onChange={setAudience} legend="Audience"/>
                  </div>

                  {/* Languages */}
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Languages Supported</p>
                    <p className="text-xs text-gray-500 mb-3">Which languages will this event be conducted in?</p>
                    <MultiCheckbox options={LANGUAGE_OPTIONS} selected={languages} onChange={setLanguages} legend="Languages"/>
                  </div>

                  {/* Additional flags */}
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-3">Additional Options</p>
                    <div className="space-y-3">
                      {[
                        {id:'volunteer',checked:volunteerSignup,onChange:function(){ setVolunteerSignup(!volunteerSignup); },label:'Volunteer Sign-Up Available',desc:'This event needs volunteers.'},
                        {id:'donation', checked:donationDropoff,onChange:function(){ setDonationDropoff(!donationDropoff); },label:'Donation Drop-Off',           desc:'Physical donations can be dropped off at this event.'},
                      ].map(function(item){
                        return (
                          <div key={item.id} className={'flex items-center justify-between p-4 rounded-xl border '+(item.checked?'border-blue-400 bg-blue-50':'border-gray-200 bg-white')}>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                            <Toggle checked={item.checked} onChange={item.onChange} id={item.id} label={item.label}/>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Publishing */}
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Publishing</p>
                    <p className="text-xs text-gray-500 mb-3">Choose where this event appears beyond your members.</p>
                    <div className="space-y-3">
                      {[
                        {id:'pub-discovery',checked:publishToDiscovery,onChange:function(){ setPublishToDiscovery(!publishToDiscovery); },label:'Show on Discover Events page',    desc:'Visible to anyone browsing public events at /discover.'},
                        {id:'pub-website',  checked:publishToWebsite,  onChange:function(){ setPublishToWebsite(!publishToWebsite); },   label:"Show on organization's website",desc:"Appears on your org's public website page."},
                      ].map(function(item){
                        return (
                          <div key={item.id} className={'flex items-center justify-between p-4 rounded-xl border '+(item.checked?'border-green-400 bg-green-50':'border-gray-200 bg-white')}>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                            <Toggle checked={item.checked} onChange={item.onChange} id={item.id} label={item.label}/>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={loading||geocoding}
            className="px-6 py-3 bg-transparent border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading||geocoding}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2">
            {loading||geocoding?(
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>{geocoding?'Finding location...':'Creating event...'}</>
            ):'Create Event'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreateEvent;