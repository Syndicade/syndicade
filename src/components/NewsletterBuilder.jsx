import { useState, useEffect, useRef } from 'react';
import {
  Layout, Type, Image as ImageIcon, Square, Minus, Columns, Share2,
  GripVertical, Trash2, Send, Save, Plus, X,
  AlignLeft, AlignCenter, AlignRight, ChevronUp, ChevronDown,
  Zap, Mail, Upload, Code, PanelLeft, PanelRight, Paperclip,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Link, Palette, Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import { supabase } from '../lib/supabase';
import { getStorageUsage } from '../lib/storageUtils';

// ── Light theme tokens ────────────────────────────────────────────────────────
var t = {
  pageBg:        '#F8FAFC',
  sectionBg:     '#FFFFFF',
  cardBg:        '#FFFFFF',
  elevatedBg:    '#F1F5F9',
  border:        '#E2E8F0',
  inputBg:       '#FFFFFF',
  textPrimary:   '#0E1523',
  textSecondary: '#475569',
  textMuted:     '#64748B',
  textTertiary:  '#94A3B8',
  yellow:        '#F5B731',
  blue:          '#3B82F6',
};

// ── Block definitions ─────────────────────────────────────────────────────────
var BLOCK_DEFS = [
  { type: 'header',     label: 'Header',       Icon: Layout,    defaultProps: { headline: 'Your Newsletter Headline', subtext: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), bgColor: '#0E1523', textColor: '#FFFFFF', align: 'center', fontSize: '28', bgImage: '', padding: 'lg' } },
  { type: 'text',       label: 'Text',         Icon: Type,      defaultProps: { content: '<p>Write your message here.</p>', bgColor: '', padding: 'md' } },
  { type: 'image',      label: 'Image',        Icon: ImageIcon, defaultProps: { url: '', alt: '', align: 'center', link: '', width: '100', rounded: false, caption: '', bgColor: '', padding: 'md' } },
  { type: 'image_text', label: 'Image + Text', Icon: PanelLeft, defaultProps: { imageUrl: '', imageAlt: '', imageLink: '', imageRatio: '40', imageRounded: false, content: '<p>Add your text here alongside the image.</p>', bgColor: '', padding: 'md', valign: 'middle', mobileStack: true } },
  { type: 'text_image', label: 'Text + Image', Icon: PanelRight,defaultProps: { imageUrl: '', imageAlt: '', imageLink: '', imageRatio: '40', imageRounded: false, content: '<p>Add your text here alongside the image.</p>', bgColor: '', padding: 'md', valign: 'middle', mobileStack: true } },
  { type: 'button',     label: 'Button',       Icon: Square,    defaultProps: { label: 'Learn More', url: '', bgColor: '#3B82F6', textColor: '#FFFFFF', align: 'center', borderRadius: '8', paddingV: '12', paddingH: '28', fullWidth: false, fontSize: '15' } },
  { type: 'two_column', label: '2 Columns',    Icon: Columns,   defaultProps: { leftContent: '<p>Left column content.</p>', rightContent: '<p>Right column content.</p>', split: '50', leftBg: '', rightBg: '', padding: 'md', divider: true, valign: 'top', mobileStack: true } },
  { type: 'divider',    label: 'Divider',      Icon: Minus,     defaultProps: { spacing: 'md', color: '#E5E7EB', lineStyle: 'solid', thickness: '1' } },
  { type: 'spacer',     label: 'Spacer',       Icon: Maximize2, defaultProps: { height: '32', bgColor: '' } },
  { type: 'social',     label: 'Social Links', Icon: Share2,    defaultProps: { label: 'Follow us', facebook: '', twitter: '', instagram: '', linkedin: '', website: '', bgColor: '', align: 'center' } },
  { type: 'html',       label: 'Custom HTML',  Icon: Code,      defaultProps: { code: '<p style="color:#374151;">Custom HTML block</p>' } },
];

var PICKER_GROUPS = [
  { label: 'Layout',  types: ['header', 'text', 'two_column', 'image_text', 'text_image'] },
  { label: 'Media',   types: ['image', 'social', 'button'] },
  { label: 'Utility', types: ['divider', 'spacer', 'html'] },
];

// ── HTML generators ───────────────────────────────────────────────────────────
var PADDING_MAP = { none: '0', sm: '12px', md: '24px', lg: '40px' };
function padStyle(p) { var v = PADDING_MAP[p] || '24px'; return 'padding:' + v + ' 32px;'; }
function bgStyle(c) { return c ? 'background:' + c + ';' : ''; }
function imgTag(url, alt, rounded) {
  if (!url) return '<div style="background:#f3f4f6;border:2px dashed #d1d5db;border-radius:8px;padding:24px;color:#9ca3af;font-size:13px;text-align:center;">Add an image URL or upload in settings</div>';
  return '<img src="' + url + '" alt="' + (alt || '') + '" style="max-width:100%;height:auto;display:block;' + (rounded ? 'border-radius:50%;' : 'border-radius:4px;') + '" />';
}
function genHeader(p) {
  var bgImg = p.bgImage ? 'background-image:url(' + p.bgImage + ');background-size:cover;background-position:center;' : '';
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + bgStyle(p.bgColor || '#0E1523') + bgImg + padStyle(p.padding || 'lg') + 'text-align:' + (p.align || 'center') + ';">' +
    '<h1 style="font-size:' + (p.fontSize || '28') + 'px;font-weight:800;color:' + (p.textColor || '#fff') + ';margin:0 0 10px;line-height:1.2;">' + (p.headline || '') + '</h1>' +
    (p.subtext ? '<p style="font-size:16px;color:' + (p.textColor || '#fff') + ';opacity:0.8;margin:0;">' + p.subtext + '</p>' : '') +
    '</td></tr></table>';
}
function genText(p) {
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + bgStyle(p.bgColor) + padStyle(p.padding || 'md') + 'font-size:15px;color:#374151;line-height:1.7;">' + (p.content || '') + '</td></tr></table>';
}
function genImage(p) {
  var align = p.align || 'center';
  var mStyle = align === 'center' ? 'margin:0 auto;' : align === 'right' ? 'margin-left:auto;' : '';
  var img = '<div style="' + mStyle + 'max-width:' + (p.width || '100') + '%;display:block;">' + imgTag(p.url, p.alt, p.rounded) + '</div>';
  var content = (p.url && p.link) ? '<a href="' + p.link + '" style="display:block;">' + img + '</a>' : img;
  var caption = p.caption ? '<p style="font-size:12px;color:#9ca3af;text-align:' + align + ';margin:8px 0 0;">' + p.caption + '</p>' : '';
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + bgStyle(p.bgColor) + padStyle(p.padding || 'md') + 'text-align:' + align + ';">' + content + caption + '</td></tr></table>';
}
function genImageText(p, imageLeft) {
  var ir = parseInt(p.imageRatio || '40');
  var img = imgTag(p.imageUrl, p.imageAlt, p.imageRounded);
  var imgCell = (p.imageUrl && p.imageLink) ? '<a href="' + p.imageLink + '">' + img + '</a>' : img;
  var textDiv = '<div style="font-size:15px;color:#374151;line-height:1.7;">' + (p.content || '') + '</div>';
  var left = imageLeft ? imgCell : textDiv;
  var right = imageLeft ? textDiv : imgCell;
  var lw = imageLeft ? ir : (100 - ir);
  var rw = imageLeft ? (100 - ir) : ir;
  var pad = PADDING_MAP[p.padding || 'md'] || '24px';
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + bgStyle(p.bgColor) + 'padding:' + pad + ';">' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td width="' + lw + '%" style="vertical-align:' + (p.valign || 'middle') + ';padding-right:16px;">' + left + '</td>' +
    '<td width="' + rw + '%" style="vertical-align:' + (p.valign || 'middle') + ';padding-left:16px;">' + right + '</td>' +
    '</tr></table></td></tr></table>';
}
function genButton(p) {
  var s = 'display:inline-block;padding:' + (p.paddingV || '12') + 'px ' + (p.paddingH || '28') + 'px;background:' + (p.bgColor || '#3B82F6') + ';color:' + (p.textColor || '#fff') + ';font-size:' + (p.fontSize || '15') + 'px;font-weight:700;text-decoration:none;border-radius:' + (p.borderRadius || '8') + 'px;' + (p.fullWidth ? 'display:block;text-align:center;' : '');
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:16px 32px;text-align:' + (p.align || 'center') + ';"><a href="' + (p.url || '#') + '" style="' + s + '">' + (p.label || 'Click here') + '</a></td></tr></table>';
}
function genDivider(p) {
  var v = PADDING_MAP[p.spacing] || '24px';
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:' + v + ' 32px;"><hr style="border:none;border-top:' + (p.thickness || '1') + 'px ' + (p.lineStyle || 'solid') + ' ' + (p.color || '#E5E7EB') + ';margin:0;" /></td></tr></table>';
}
function genSpacer(p) {
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + bgStyle(p.bgColor) + 'height:' + (p.height || '32') + 'px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>';
}
function genTwoColumn(p) {
  var lw = parseInt(p.split || '50');
  var pad = PADDING_MAP[p.padding || 'md'] || '24px';
  var divStyle = p.divider ? 'border-left:1px solid #F3F4F6;' : '';
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td width="' + lw + '%" style="' + bgStyle(p.leftBg) + 'padding:' + pad + ' 16px ' + pad + ' 32px;font-size:15px;color:#374151;line-height:1.7;vertical-align:' + (p.valign || 'top') + ';">' + (p.leftContent || '') + '</td>' +
    '<td width="' + (100 - lw) + '%" style="' + bgStyle(p.rightBg) + divStyle + 'padding:' + pad + ' 32px ' + pad + ' 16px;font-size:15px;color:#374151;line-height:1.7;vertical-align:' + (p.valign || 'top') + ';">' + (p.rightContent || '') + '</td>' +
    '</tr></table>';
}
function genSocial(p) {
  var defs = [{ key:'facebook',label:'Facebook',color:'#1877F2'},{key:'twitter',label:'Twitter/X',color:'#000'},{key:'instagram',label:'Instagram',color:'#E1306C'},{key:'linkedin',label:'LinkedIn',color:'#0A66C2'},{key:'website',label:'Website',color:'#6B7280'}];
  var links = defs.filter(function(s){return p[s.key];});
  if (!links.length) return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + bgStyle(p.bgColor) + 'padding:16px 32px;text-align:center;color:#9ca3af;font-size:13px;">Add social media links in the settings panel</td></tr></table>';
  var btns = links.map(function(s){return '<a href="'+p[s.key]+'" style="display:inline-block;margin:0 4px;padding:8px 14px;background:'+s.color+';color:#fff;font-size:12px;font-weight:700;text-decoration:none;border-radius:6px;">'+s.label+'</a>';}).join('');
  return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + bgStyle(p.bgColor) + 'padding:20px 32px;text-align:' + (p.align||'center') + ';">' + (p.label ? '<p style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">' + p.label + '</p>' : '') + btns + '</td></tr></table>';
}
function genHtml(p) { return '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0;">' + (p.code || '') + '</td></tr></table>'; }

function blockToHtml(block) {
  var p = block.props;
  if (block.type==='header')     return genHeader(p);
  if (block.type==='text')       return genText(p);
  if (block.type==='image')      return genImage(p);
  if (block.type==='image_text') return genImageText(p,true);
  if (block.type==='text_image') return genImageText(p,false);
  if (block.type==='button')     return genButton(p);
  if (block.type==='divider')    return genDivider(p);
  if (block.type==='spacer')     return genSpacer(p);
  if (block.type==='two_column') return genTwoColumn(p);
  if (block.type==='social')     return genSocial(p);
  if (block.type==='html')       return genHtml(p);
  return '';
}

function buildFullHtml(blocks, orgName, logoUrl) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;background:#e5e7eb;font-family:Arial,sans-serif;}*{box-sizing:border-box;}</style></head><body>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#e5e7eb;padding:24px 16px;"><tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.1);">' +
    (logoUrl ? '<tr><td style="background:#0E1523;padding:16px 32px;text-align:center;"><img src="'+logoUrl+'" alt="'+(orgName||'')+' logo" style="width:40px;height:40px;border-radius:50%;object-fit:cover;display:inline-block;" /></td></tr>' : '') +
    blocks.map(blockToHtml).join('\n') +
    '<tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">You received this email as a member of <strong>'+(orgName||'your organization')+'</strong>.</p><p style="font-size:11px;color:#d1d5db;margin:0;">Powered by <span style="color:#F5B731;font-weight:700;">Syndi</span><span style="color:#6b7280;font-weight:700;">cade</span></p></td></tr>' +
    '</table></td></tr></table></body></html>';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2,10); }
function makeBlock(type) {
  var def = BLOCK_DEFS.find(function(d){return d.type===type;});
  return { id: genId(), type: type, props: Object.assign({}, def ? def.defaultProps : {}) };
}

// ── Form primitives ───────────────────────────────────────────────────────────
function Field({ label, id, hint, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#F5B731', marginBottom:'6px' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize:'11px', color:'#64748B', marginTop:'4px' }}>{hint}</p>}
    </div>
  );
}
function ThemedInput({ id, value, onChange, placeholder, type, min, max }) {
  return (
    <input id={id} type={type||'text'} min={min} max={max} value={value||''} onChange={onChange} placeholder={placeholder||''}
      style={{ width:'100%', padding:'8px 12px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#0E1523', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
  );
}
function ThemedSelect({ id, value, onChange, children }) {
  return (
    <select id={id} value={value||''} onChange={onChange}
      style={{ width:'100%', padding:'8px 12px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#0E1523', fontSize:'13px', outline:'none', boxSizing:'border-box' }}>
      {children}
    </select>
  );
}
function ThemedTextarea({ id, value, onChange, placeholder, minHeight }) {
  return (
    <textarea id={id} value={value||''} onChange={onChange} placeholder={placeholder||''}
      style={{ width:'100%', minHeight:minHeight||'80px', padding:'8px 12px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#0E1523', fontSize:'12px', fontFamily:'monospace', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
  );
}
function ColorRow({ id, label, value, onChange }) {
  return (
    <Field label={label} id={id}>
      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
        <input id={id} type="color" value={value||'#ffffff'} onChange={function(e){onChange(e.target.value);}}
          style={{ width:'36px', height:'34px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#FFFFFF', cursor:'pointer', padding:'2px', flexShrink:0 }} aria-label={label} />
        <input value={value||''} onChange={function(e){onChange(e.target.value);}} placeholder="#000000 or empty"
          style={{ flex:1, padding:'8px 10px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#0E1523', fontSize:'12px', outline:'none' }} />
        {value && (
          <button onClick={function(){onChange('');}} style={{ color:'#64748B', background:'none', border:'none', cursor:'pointer', padding:'2px', flexShrink:0 }} aria-label="Clear color">
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>
    </Field>
  );
}
function AlignPicker({ value, onChange }) {
  var opts = [{val:'left',Icon:AlignLeft,label:'Left'},{val:'center',Icon:AlignCenter,label:'Center'},{val:'right',Icon:AlignRight,label:'Right'}];
  return (
    <div style={{ display:'flex', gap:'4px' }}>
      {opts.map(function(o) {
        var active = value===o.val;
        return (
          <button key={o.val} type="button" onClick={function(){onChange(o.val);}} aria-label={o.label+' align'} aria-pressed={active}
            style={{ flex:1, padding:'6px', borderRadius:'6px', border:'1px solid '+(active?'#3B82F6':'#E2E8F0'), background:active?'rgba(59,130,246,0.15)':'#FFFFFF', color:active?'#3B82F6':'#94A3B8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', outline:'none' }}>
            <o.Icon size={13} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
function PaddingPicker({ value, onChange }) {
  return (
    <Field label="Padding" id="pad-p">
      <div style={{ display:'flex', gap:'4px' }}>
        {['none','sm','md','lg'].map(function(v) {
          var active = value===v;
          return (
            <button key={v} type="button" onClick={function(){onChange(v);}} aria-pressed={active}
              style={{ flex:1, padding:'5px 2px', fontSize:'11px', fontWeight:600, borderRadius:'6px', border:'1px solid '+(active?'#3B82F6':'#E2E8F0'), background:active?'rgba(59,130,246,0.15)':'#FFFFFF', color:active?'#3B82F6':'#94A3B8', cursor:'pointer', outline:'none' }}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
function Toggle({ label, value, onChange, id }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <label htmlFor={id} style={{ fontSize:'13px', color:'#475569', cursor:'pointer' }}>{label}</label>
      <button id={id} role="switch" aria-checked={value} onClick={function(){onChange(!value);}}
        style={{ position:'relative', width:'36px', height:'20px', borderRadius:'99px', background:value?'#3B82F6':'#E2E8F0', border:'none', cursor:'pointer', transition:'background 0.2s', outline:'none' }}>
        <span style={{ position:'absolute', top:'2px', left:value?'18px':'2px', width:'16px', height:'16px', background:'#fff', borderRadius:'50%', boxShadow:'0 1px 3px rgba(0,0,0,0.3)', transition:'left 0.2s', display:'block' }} />
      </button>
    </div>
  );
}
function SectionDivider({ label }) {
  return (
    <div style={{ paddingTop:'8px', borderTop:'1px solid #E2E8F0' }}>
      <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#94A3B8', margin:0 }}>{label}</p>
    </div>
  );
}

// ── Rich text editor ──────────────────────────────────────────────────────────
function RichEditor({ value, onChange, id, minHeight }) {
  var editorRef = useRef(null);
  var lastValueRef = useRef(value);

  useEffect(function() {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, []);

  useEffect(function() {
    if (editorRef.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  function exec(cmd, val) {
    document.execCommand(cmd, false, val || null);
    if (editorRef.current) {
      var newVal = editorRef.current.innerHTML;
      lastValueRef.current = newVal;
      onChange(newVal);
    }
  }
  function insertLink() { var url = prompt('Enter URL:'); if (url) exec('createLink', url); }
  function insertTag(tag) {
    if (editorRef.current) editorRef.current.focus();
    document.execCommand('insertText', false, tag);
    if (editorRef.current) {
      var newVal = editorRef.current.innerHTML;
      lastValueRef.current = newVal;
      onChange(newVal);
    }
  }

  var toolBtns = [
    { cmd:'bold', Icon:Bold, label:'Bold' },
    { cmd:'italic', Icon:Italic, label:'Italic' },
    { cmd:'underline', Icon:Underline, label:'Underline' },
    { cmd:'strikeThrough', Icon:Strikethrough, label:'Strikethrough' }
  ];
  var alignBtns = [
    { cmd:'justifyLeft', Icon:AlignLeft, label:'Left' },
    { cmd:'justifyCenter', Icon:AlignCenter, label:'Center' },
    { cmd:'justifyRight', Icon:AlignRight, label:'Right' }
  ];
  var mergeTags = ['{{first_name}}', '{{last_name}}'];

  return (
    <div style={{ border:'1px solid #E2E8F0', borderRadius:'8px', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'2px', padding:'6px 8px', background:'#F1F5F9', borderBottom:'1px solid #E2E8F0', flexWrap:'wrap' }}>
        {toolBtns.map(function(btn) {
          return (
            <button key={btn.cmd} type="button"
              onMouseDown={function(e) { e.preventDefault(); exec(btn.cmd); }}
              aria-label={btn.label}
              style={{ width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'4px', border:'none', background:'transparent', color:'#475569', cursor:'pointer' }}>
              <btn.Icon size={13} aria-hidden="true" />
            </button>
          );
        })}
        <div style={{ width:'1px', height:'16px', background:'#E2E8F0', margin:'0 2px' }} aria-hidden="true" />
        <select onMouseDown={function(e) { e.preventDefault(); }} onChange={function(e) { exec('fontSize', e.target.value); }} defaultValue="3"
          style={{ height:'28px', padding:'0 4px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'4px', color:'#475569', fontSize:'11px', cursor:'pointer' }} aria-label="Font size">
          <option value="1">10px</option><option value="2">13px</option><option value="3">16px</option>
          <option value="4">18px</option><option value="5">24px</option><option value="6">32px</option><option value="7">48px</option>
        </select>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <Palette size={12} style={{ color:'#94A3B8' }} aria-hidden="true" />
          <input type="color" defaultValue="#374151"
            onMouseDown={function(e) { e.preventDefault(); }}
            onChange={function(e) { exec('foreColor', e.target.value); }}
            style={{ width:'24px', height:'24px', borderRadius:'4px', border:'1px solid #E2E8F0', background:'#FFFFFF', cursor:'pointer', padding:'1px' }} aria-label="Text color" />
        </div>
        <div style={{ width:'1px', height:'16px', background:'#E2E8F0', margin:'0 2px' }} aria-hidden="true" />
        {alignBtns.map(function(btn) {
          return (
            <button key={btn.cmd} type="button"
              onMouseDown={function(e) { e.preventDefault(); exec(btn.cmd); }}
              aria-label={btn.label + ' align'}
              style={{ width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'4px', border:'none', background:'transparent', color:'#475569', cursor:'pointer' }}>
              <btn.Icon size={13} aria-hidden="true" />
            </button>
          );
        })}
        <div style={{ width:'1px', height:'16px', background:'#E2E8F0', margin:'0 2px' }} aria-hidden="true" />
        <button type="button" onMouseDown={function(e) { e.preventDefault(); exec('insertUnorderedList'); }} aria-label="Bullet list"
          style={{ width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'4px', border:'none', background:'transparent', color:'#475569', cursor:'pointer' }}>
          <List size={13} aria-hidden="true" />
        </button>
        <button type="button" onMouseDown={function(e) { e.preventDefault(); exec('insertOrderedList'); }} aria-label="Numbered list"
          style={{ width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'4px', border:'none', background:'transparent', color:'#475569', cursor:'pointer' }}>
          <ListOrdered size={13} aria-hidden="true" />
        </button>
        <button type="button" onMouseDown={function(e) { e.preventDefault(); insertLink(); }} aria-label="Insert link"
          style={{ width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'4px', border:'none', background:'transparent', color:'#475569', cursor:'pointer' }}>
          <Link size={13} aria-hidden="true" />
        </button>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 8px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', flexWrap:'wrap' }}>
        <span style={{ fontSize:'10px', color:'#94A3B8', fontWeight:600, marginRight:'2px', whiteSpace:'nowrap' }}>INSERT:</span>
        {mergeTags.map(function(tag) {
          return (
            <button key={tag} type="button"
              onMouseDown={function(e) { e.preventDefault(); insertTag(tag); }}
              aria-label={'Insert ' + tag}
              style={{ padding:'2px 7px', borderRadius:'4px', border:'1px solid #E2E8F0', background:'#FFFFFF', color:'#475569', fontSize:'10px', fontFamily:'monospace', cursor:'pointer', whiteSpace:'nowrap' }}>
              {tag}
            </button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        id={id}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Email content"
        style={{ padding:'12px', fontSize:'14px', color:'#374151', background:'#FFFFFF', outline:'none', minHeight:minHeight||'140px', fontFamily:'Arial,sans-serif', lineHeight:1.6 }}
        onInput={function(e) {
          var newVal = e.currentTarget.innerHTML;
          lastValueRef.current = newVal;
          onChange(newVal);
        }}
      />
    </div>
  );
}

// ── Image upload field ────────────────────────────────────────────────────────
function ImageUploadField({ value, onChange, organizationId, label }) {
  var [uploading, setUploading] = useState(false);
  var [dragActive, setDragActive] = useState(false);
  var fileRef = useRef(null);

  async function uploadFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 10*1024*1024) { toast.error('Image must be under 10MB'); return; }
    var storageCheck = await getStorageUsage(organizationId);
    if (storageCheck && storageCheck.isBlocked) { mascotErrorToast('Storage limit reached.', 'Upgrade your plan to upload images.'); return; }
    if (storageCheck && storageCheck.isWarning) { toast('Storage is above 90% — consider upgrading soon.', { icon: null }); }
    setUploading(true);
    try {
      var ext = file.name.split('.').pop();
      var path = (organizationId||'shared') + '/' + genId() + '.' + ext;
      var { error } = await supabase.storage.from('newsletter-images').upload(path, file, { upsert:true });
      if (error) throw error;
      var { data: urlData } = supabase.storage.from('newsletter-images').getPublicUrl(path);
      onChange(urlData.publicUrl);
      mascotSuccessToast('Image uploaded!');
    } catch (err) {
      mascotErrorToast('Upload failed.', err.message);
    } finally { setUploading(false); }
  }

  function handleDrop(e) { e.preventDefault(); setDragActive(false); uploadFile(e.dataTransfer.files[0]); }

  return (
    <Field label={label||'Image'} id="img-up">
      <div
        onDragEnter={function(e){e.preventDefault();setDragActive(true);}} onDragLeave={function(){setDragActive(false);}}
        onDragOver={function(e){e.preventDefault();}} onDrop={handleDrop}
        onClick={function(){fileRef.current&&fileRef.current.click();}}
        role="button" tabIndex={0} aria-label="Upload image by clicking or dragging"
        onKeyDown={function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fileRef.current&&fileRef.current.click();}}}
        style={{ borderRadius:'8px', border:'2px dashed '+(dragActive?'#3B82F6':'#E2E8F0'), padding:'16px', textAlign:'center', cursor:'pointer', background:dragActive?'rgba(59,130,246,0.05)':'#FFFFFF', marginBottom:'8px', transition:'border-color 0.2s', outline:'none' }}
      >
        {uploading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'120px', height:'12px', borderRadius:'6px', background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize:'200% 100%' }} aria-hidden="true" />
            <span style={{ fontSize:'12px', color:'#64748B' }}>Uploading...</span>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <Upload size={18} style={{ color:'#94A3B8' }} aria-hidden="true" />
            <span style={{ fontSize:'12px', color:'#475569', fontWeight:600 }}>Drop image or click to upload</span>
            <span style={{ fontSize:'11px', color:'#94A3B8' }}>PNG, JPG, GIF up to 10MB</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={function(e){uploadFile(e.target.files[0]);}} aria-label="Image file input" />
      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
        <input value={value||''} onChange={function(e){onChange(e.target.value);}} placeholder="Or paste image URL..."
          style={{ flex:1, padding:'8px 10px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#0E1523', fontSize:'12px', outline:'none' }} />
        {value && <button onClick={function(){onChange('');}} style={{ color:'#64748B', background:'none', border:'none', cursor:'pointer' }} aria-label="Clear image"><X size={14} aria-hidden="true" /></button>}
      </div>
      {value && (
        <div style={{ marginTop:'8px', borderRadius:'8px', overflow:'hidden', border:'1px solid #E2E8F0', height:'80px' }}>
          <img src={value} alt="Preview" style={{ width:'100%', height:'80px', objectFit:'cover' }} />
        </div>
      )}
    </Field>
  );
}

// ── Settings panels ───────────────────────────────────────────────────────────
function HeaderSettings({props,onChange}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <Field label="Headline" id="hdr-h"><ThemedInput id="hdr-h" value={props.headline||''} onChange={function(e){onChange('headline',e.target.value);}} /></Field>
      <Field label="Subtext" id="hdr-s"><ThemedInput id="hdr-s" value={props.subtext||''} onChange={function(e){onChange('subtext',e.target.value);}} placeholder="Optional subtext" /></Field>
      <Field label="Font Size (px)" id="hdr-fs"><ThemedInput id="hdr-fs" type="number" min="16" max="72" value={props.fontSize||'28'} onChange={function(e){onChange('fontSize',e.target.value);}} /></Field>
      <Field label="Alignment" id="hdr-al"><AlignPicker value={props.align||'center'} onChange={function(v){onChange('align',v);}} /></Field>
      <SectionDivider label="Colors" />
      <ColorRow id="hdr-bg" label="Background Color" value={props.bgColor||'#0E1523'} onChange={function(v){onChange('bgColor',v);}} />
      <ColorRow id="hdr-tc" label="Text Color" value={props.textColor||'#FFFFFF'} onChange={function(v){onChange('textColor',v);}} />
      <Field label="Background Image URL" id="hdr-bi" hint="Overlays on background color"><ThemedInput id="hdr-bi" value={props.bgImage||''} onChange={function(e){onChange('bgImage',e.target.value);}} placeholder="https://..." /></Field>
      <SectionDivider label="Spacing" />
      <PaddingPicker value={props.padding||'lg'} onChange={function(v){onChange('padding',v);}} />
    </div>
  );
}
function TextSettings({props,onChange}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <Field label="Content" id="txt-c"><RichEditor id="txt-c" value={props.content||''} onChange={function(v){onChange('content',v);}} minHeight="200px" /></Field>
      <SectionDivider label="Block Style" />
      <ColorRow id="txt-bg" label="Background Color" value={props.bgColor||''} onChange={function(v){onChange('bgColor',v);}} />
      <PaddingPicker value={props.padding||'md'} onChange={function(v){onChange('padding',v);}} />
    </div>
  );
}
function ImageSettings({props,onChange,organizationId}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <ImageUploadField value={props.url||''} onChange={function(v){onChange('url',v);}} organizationId={organizationId} label="Image" />
      <Field label="Alt Text" id="img-a"><ThemedInput id="img-a" value={props.alt||''} onChange={function(e){onChange('alt',e.target.value);}} placeholder="Describe the image" /></Field>
      <Field label="Caption" id="img-cap"><ThemedInput id="img-cap" value={props.caption||''} onChange={function(e){onChange('caption',e.target.value);}} placeholder="Optional caption" /></Field>
      <Field label="Link URL" id="img-l"><ThemedInput id="img-l" value={props.link||''} onChange={function(e){onChange('link',e.target.value);}} placeholder="https://..." /></Field>
      <Field label="Width %" id="img-w"><ThemedInput id="img-w" type="number" min="20" max="100" value={props.width||'100'} onChange={function(e){onChange('width',e.target.value);}} /></Field>
      <Field label="Alignment" id="img-al"><AlignPicker value={props.align||'center'} onChange={function(v){onChange('align',v);}} /></Field>
      <Toggle label="Circular / rounded" id="img-round" value={!!props.rounded} onChange={function(v){onChange('rounded',v);}} />
      <SectionDivider label="Block Style" />
      <ColorRow id="img-bg" label="Background Color" value={props.bgColor||''} onChange={function(v){onChange('bgColor',v);}} />
      <PaddingPicker value={props.padding||'md'} onChange={function(v){onChange('padding',v);}} />
    </div>
  );
}
function ImageTextSettings({props,onChange,organizationId,imageLeft}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <p style={{fontSize:'12px',color:'#64748B',margin:0}}>{imageLeft?'Image left, text right.':'Text left, image right.'}</p>
      <ImageUploadField value={props.imageUrl||''} onChange={function(v){onChange('imageUrl',v);}} organizationId={organizationId} label="Image" />
      <Field label="Image Alt Text" id="it-alt"><ThemedInput id="it-alt" value={props.imageAlt||''} onChange={function(e){onChange('imageAlt',e.target.value);}} placeholder="Describe the image" /></Field>
      <Field label="Image Link URL" id="it-lnk"><ThemedInput id="it-lnk" value={props.imageLink||''} onChange={function(e){onChange('imageLink',e.target.value);}} placeholder="https://..." /></Field>
      <Toggle label="Circular image" id="it-round" value={!!props.imageRounded} onChange={function(v){onChange('imageRounded',v);}} />
      <Field label="Image Width %" id="it-ratio" hint={'Image: '+(props.imageRatio||'40')+'% · Text: '+(100-parseInt(props.imageRatio||'40'))+'%'}>
        <input id="it-ratio" type="range" min="20" max="60" value={props.imageRatio||'40'} onChange={function(e){onChange('imageRatio',e.target.value);}} style={{width:'100%',accentColor:'#3B82F6'}} aria-valuetext={(props.imageRatio||'40')+'% image'} />
      </Field>
      <SectionDivider label="Text Content" />
      <Field label="Text" id="it-txt"><RichEditor id="it-txt" value={props.content||''} onChange={function(v){onChange('content',v);}} /></Field>
      <SectionDivider label="Layout" />
      <Field label="Vertical Alignment" id="it-va">
        <ThemedSelect id="it-va" value={props.valign||'middle'} onChange={function(e){onChange('valign',e.target.value);}}>
          <option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option>
        </ThemedSelect>
      </Field>
      <Toggle label="Stack on mobile" id="it-mob" value={props.mobileStack!==false} onChange={function(v){onChange('mobileStack',v);}} />
      <SectionDivider label="Block Style" />
      <ColorRow id="it-bg" label="Background Color" value={props.bgColor||''} onChange={function(v){onChange('bgColor',v);}} />
      <PaddingPicker value={props.padding||'md'} onChange={function(v){onChange('padding',v);}} />
    </div>
  );
}
function ButtonSettings({props,onChange}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <Field label="Button Label" id="btn-l"><ThemedInput id="btn-l" value={props.label||''} onChange={function(e){onChange('label',e.target.value);}} /></Field>
      <Field label="URL" id="btn-u"><ThemedInput id="btn-u" value={props.url||''} onChange={function(e){onChange('url',e.target.value);}} placeholder="https://..." /></Field>
      <Field label="Font Size (px)" id="btn-fs"><ThemedInput id="btn-fs" type="number" min="12" max="24" value={props.fontSize||'15'} onChange={function(e){onChange('fontSize',e.target.value);}} /></Field>
      <Toggle label="Full width button" id="btn-fw" value={!!props.fullWidth} onChange={function(v){onChange('fullWidth',v);}} />
      <Field label="Alignment" id="btn-al"><AlignPicker value={props.align||'center'} onChange={function(v){onChange('align',v);}} /></Field>
      <SectionDivider label="Appearance" />
      <ColorRow id="btn-bg" label="Button Color" value={props.bgColor||'#3B82F6'} onChange={function(v){onChange('bgColor',v);}} />
      <ColorRow id="btn-tc" label="Text Color" value={props.textColor||'#FFFFFF'} onChange={function(v){onChange('textColor',v);}} />
      <Field label="Border Radius (px)" id="btn-br"><ThemedInput id="btn-br" type="number" min="0" max="99" value={props.borderRadius||'8'} onChange={function(e){onChange('borderRadius',e.target.value);}} /></Field>
      <SectionDivider label="Padding" />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
        <Field label="Vertical (px)" id="btn-pv"><ThemedInput id="btn-pv" type="number" min="4" max="40" value={props.paddingV||'12'} onChange={function(e){onChange('paddingV',e.target.value);}} /></Field>
        <Field label="Horizontal (px)" id="btn-ph"><ThemedInput id="btn-ph" type="number" min="8" max="80" value={props.paddingH||'28'} onChange={function(e){onChange('paddingH',e.target.value);}} /></Field>
      </div>
    </div>
  );
}
function DividerSettings({props,onChange}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <PaddingPicker value={props.spacing||'md'} onChange={function(v){onChange('spacing',v);}} />
      <Field label="Line Style" id="div-ls">
        <ThemedSelect id="div-ls" value={props.lineStyle||'solid'} onChange={function(e){onChange('lineStyle',e.target.value);}}>
          <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="none">None (spacer)</option>
        </ThemedSelect>
      </Field>
      <Field label="Thickness (px)" id="div-th"><ThemedInput id="div-th" type="number" min="1" max="8" value={props.thickness||'1'} onChange={function(e){onChange('thickness',e.target.value);}} /></Field>
      <ColorRow id="div-c" label="Line Color" value={props.color||'#E5E7EB'} onChange={function(v){onChange('color',v);}} />
    </div>
  );
}
function SpacerSettings({props,onChange}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <Field label="Height (px)" id="spc-h" hint={(props.height||'32')+'px'}>
        <input id="spc-h" type="range" min="8" max="120" value={props.height||'32'} onChange={function(e){onChange('height',e.target.value);}} style={{width:'100%',accentColor:'#3B82F6'}} />
      </Field>
      <ColorRow id="spc-bg" label="Background Color" value={props.bgColor||''} onChange={function(v){onChange('bgColor',v);}} />
    </div>
  );
}
function TwoColumnSettings({props,onChange}) {
  var lw = parseInt(props.split||'50');
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <Field label="Column Split" id="tc-split" hint={'Left: '+lw+'% · Right: '+(100-lw)+'%'}>
        <input id="tc-split" type="range" min="20" max="80" value={props.split||'50'} onChange={function(e){onChange('split',e.target.value);}} style={{width:'100%',accentColor:'#3B82F6'}} />
      </Field>
      <Field label="Vertical Alignment" id="tc-va">
        <ThemedSelect id="tc-va" value={props.valign||'top'} onChange={function(e){onChange('valign',e.target.value);}}>
          <option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option>
        </ThemedSelect>
      </Field>
      <Toggle label="Show column divider" id="tc-div" value={props.divider!==false} onChange={function(v){onChange('divider',v);}} />
      <Toggle label="Stack on mobile" id="tc-mob" value={props.mobileStack!==false} onChange={function(v){onChange('mobileStack',v);}} />
      <SectionDivider label="Left Column" />
      <Field label="Left Content" id="tc-l"><RichEditor id="tc-l" value={props.leftContent||''} onChange={function(v){onChange('leftContent',v);}} minHeight="100px" /></Field>
      <ColorRow id="tc-lbg" label="Left Background" value={props.leftBg||''} onChange={function(v){onChange('leftBg',v);}} />
      <SectionDivider label="Right Column" />
      <Field label="Right Content" id="tc-r"><RichEditor id="tc-r" value={props.rightContent||''} onChange={function(v){onChange('rightContent',v);}} minHeight="100px" /></Field>
      <ColorRow id="tc-rbg" label="Right Background" value={props.rightBg||''} onChange={function(v){onChange('rightBg',v);}} />
      <SectionDivider label="Block Spacing" />
      <PaddingPicker value={props.padding||'md'} onChange={function(v){onChange('padding',v);}} />
    </div>
  );
}
function SocialSettings({props,onChange}) {
  var platforms = [{key:'facebook',label:'Facebook URL'},{key:'twitter',label:'Twitter/X URL'},{key:'instagram',label:'Instagram URL'},{key:'linkedin',label:'LinkedIn URL'},{key:'website',label:'Website URL'}];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <Field label="Section Label" id="soc-lbl"><ThemedInput id="soc-lbl" value={props.label||''} onChange={function(e){onChange('label',e.target.value);}} placeholder="Follow us" /></Field>
      <Field label="Alignment" id="soc-al"><AlignPicker value={props.align||'center'} onChange={function(v){onChange('align',v);}} /></Field>
      {platforms.map(function(p){return(<Field key={p.key} label={p.label} id={'soc-'+p.key}><ThemedInput id={'soc-'+p.key} value={props[p.key]||''} onChange={function(e){onChange(p.key,e.target.value);}} placeholder="https://..." /></Field>);})}
      <SectionDivider label="Block Style" />
      <ColorRow id="soc-bg" label="Background Color" value={props.bgColor||''} onChange={function(v){onChange('bgColor',v);}} />
    </div>
  );
}
function HtmlSettings({props,onChange}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <Field label="HTML Code" id="html-c" hint="Raw HTML — test before sending.">
        <ThemedTextarea id="html-c" value={props.code||''} onChange={function(e){onChange('code',e.target.value);}} placeholder="<p>Custom HTML here...</p>" minHeight="200px" />
      </Field>
    </div>
  );
}

// ── Settings panel router ─────────────────────────────────────────────────────
function BlockSettingsPanel({block,onUpdate,organizationId}) {
  if (!block) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:'32px 16px',textAlign:'center'}}>
        <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px'}}>
          <Layout size={18} style={{color:'#E2E8F0'}} aria-hidden="true" />
        </div>
        <p style={{fontSize:'14px',fontWeight:600,color:'#0E1523',margin:'0 0 6px'}}>No block selected</p>
        <p style={{fontSize:'12px',color:'#94A3B8',margin:0}}>Click a block on the left to edit its settings.</p>
      </div>
    );
  }
  function updateProp(key,value) { onUpdate(Object.assign({},block,{props:Object.assign({},block.props,{[key]:value})})); }
  var def = BLOCK_DEFS.find(function(d){return d.type===block.type;});
  return (
    <div style={{padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',paddingBottom:'12px',borderBottom:'1px solid #E2E8F0',marginBottom:'16px'}}>
        {def&&<def.Icon size={13} style={{color:'#F5B731'}} aria-hidden="true" />}
        <p style={{fontSize:'10px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#F5B731',margin:0}}>{def?def.label:block.type} Settings</p>
      </div>
      {block.type==='header'     && <HeaderSettings     props={block.props} onChange={updateProp} />}
      {block.type==='text'       && <TextSettings       props={block.props} onChange={updateProp} />}
      {block.type==='image'      && <ImageSettings      props={block.props} onChange={updateProp} organizationId={organizationId} />}
      {block.type==='image_text' && <ImageTextSettings  props={block.props} onChange={updateProp} organizationId={organizationId} imageLeft={true} />}
      {block.type==='text_image' && <ImageTextSettings  props={block.props} onChange={updateProp} organizationId={organizationId} imageLeft={false} />}
      {block.type==='button'     && <ButtonSettings     props={block.props} onChange={updateProp} />}
      {block.type==='divider'    && <DividerSettings    props={block.props} onChange={updateProp} />}
      {block.type==='spacer'     && <SpacerSettings     props={block.props} onChange={updateProp} />}
      {block.type==='two_column' && <TwoColumnSettings  props={block.props} onChange={updateProp} />}
      {block.type==='social'     && <SocialSettings     props={block.props} onChange={updateProp} />}
      {block.type==='html'       && <HtmlSettings       props={block.props} onChange={updateProp} />}
    </div>
  );
}

// ── Block list item ───────────────────────────────────────────────────────────
function BlockListItem({block,index,total,isSelected,onSelect,onDelete,onMove,onDragStart,onDragOver,onDrop,onDragEnd,isDragOver}) {
  var def = BLOCK_DEFS.find(function(d){return d.type===block.type;});
  var Icon = def?def.Icon:Layout;
  var label = def?def.label:block.type;
  return (
    <div
      draggable
      onDragStart={function(){onDragStart(index);}} onDragOver={function(e){e.preventDefault();onDragOver(index);}}
      onDrop={function(e){e.preventDefault();onDrop(index);}} onDragEnd={onDragEnd}
      role="button" tabIndex={0} aria-label={'Select '+label+' block'} aria-pressed={isSelected}
      onClick={function(){onSelect(block.id);}}
      onKeyDown={function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(block.id);}}}
      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 8px', borderRadius:'8px', border:'1px solid '+(isSelected?'#3B82F6':(isDragOver?'#3B82F6':'#E2E8F0')), background:isSelected?'rgba(59,130,246,0.08)':'#FFFFFF', cursor:'pointer', marginBottom:'4px', opacity:isDragOver?0.5:1, userSelect:'none', transition:'border-color 0.15s,background 0.15s', outline:'none' }}
    >
      <div style={{color:'#E2E8F0',cursor:'grab',flexShrink:0}} aria-hidden="true" onClick={function(e){e.stopPropagation();}}>
        <GripVertical size={13} />
      </div>
      <div style={{width:'22px',height:'22px',borderRadius:'5px',background:isSelected?'rgba(59,130,246,0.12)':'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Icon size={12} style={{color:isSelected?'#3B82F6':'#64748B'}} aria-hidden="true" />
      </div>
      <span style={{fontSize:'12px',fontWeight:600,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:isSelected?'#3B82F6':'#475569'}}>{label}</span>
      <div style={{display:'flex',alignItems:'center',gap:'1px',flexShrink:0}} onClick={function(e){e.stopPropagation();}}>
        <button onClick={function(){onMove(index,-1);}} disabled={index===0} aria-label="Move up" style={{width:'18px',height:'18px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'4px',border:'none',background:'transparent',color:'#94A3B8',cursor:'pointer',opacity:index===0?0.2:1,outline:'none'}}>
          <ChevronUp size={11} aria-hidden="true" />
        </button>
        <button onClick={function(){onMove(index,1);}} disabled={index===total-1} aria-label="Move down" style={{width:'18px',height:'18px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'4px',border:'none',background:'transparent',color:'#94A3B8',cursor:'pointer',opacity:index===total-1?0.2:1,outline:'none'}}>
          <ChevronDown size={11} aria-hidden="true" />
        </button>
        <button onClick={function(){onDelete(block.id);}} aria-label={'Delete '+label} style={{width:'18px',height:'18px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'4px',border:'none',background:'transparent',color:'#94A3B8',cursor:'pointer',outline:'none'}}>
          <Trash2 size={11} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewsletterBuilder({organization,planKey,organizationId,usedThisMonth,planLimit,onSent}) {
  var isGrowthPlus = planKey==='growth'||planKey==='pro';

  var [blocks, setBlocks] = useState([makeBlock('header'),makeBlock('text')]);
  var [selectedId, setSelectedId] = useState(null);
  var [subject, setSubject] = useState('');
  var [audience, setAudience] = useState('all_members');
  var [attachments, setAttachments] = useState([]);
  var [sending, setSending] = useState(false);
  var [sendingTest, setSendingTest] = useState(false);
  var [showConfirm, setShowConfirm] = useState(false);
  var [showTestConfirm, setShowTestConfirm] = useState(false);
  var [showSaveModal, setShowSaveModal] = useState(false);
  var [saveName, setSaveName] = useState('');
  var [testUserEmail, setTestUserEmail] = useState('');
  var [dragIndex, setDragIndex] = useState(null);
  var [dropIndex, setDropIndex] = useState(null);
  var [showLogo, setShowLogo] = useState(true);
  var fileRef = useRef(null);

  var selectedBlock = blocks.find(function(b){return b.id===selectedId;})||null;
  var atLimit = planLimit!==Infinity&&usedThisMonth>=planLimit;
  var canSend = subject.trim()&&blocks.length>0&&!sending&&!atLimit&&isGrowthPlus;
  var previewHtml = buildFullHtml(blocks,organization?organization.name:'Your Organization',showLogo&&organization?organization.logo_url:null);

  function addBlock(type) { var nb=makeBlock(type); setBlocks(function(p){return p.concat([nb]);}); setSelectedId(nb.id); }
  function deleteBlock(id) { setBlocks(function(p){return p.filter(function(b){return b.id!==id;});}); if(selectedId===id) setSelectedId(null); }
  function updateBlock(updated) { setBlocks(function(p){return p.map(function(b){return b.id===updated.id?updated:b;});}); }
  function moveBlock(index,dir) { var nb=blocks.slice(); var t2=index+dir; if(t2<0||t2>=nb.length) return; var tmp=nb[index];nb[index]=nb[t2];nb[t2]=tmp; setBlocks(nb); }
  function handleDragStart(i){setDragIndex(i);}
  function handleDragOver(i){setDropIndex(i);}
  function handleDrop(i){if(dragIndex===null||dragIndex===i){setDragIndex(null);setDropIndex(null);return;}var nb=blocks.slice();var d=nb.splice(dragIndex,1)[0];nb.splice(i,0,d);setBlocks(nb);setDragIndex(null);setDropIndex(null);}
  function handleDragEnd(){setDragIndex(null);setDropIndex(null);}

  async function handleAttach(e) {
    var files=Array.from(e.target.files||[]);var MAX=5*1024*1024;var newAtts=[];
    for(var file of files){if(file.size>MAX){toast.error(file.name+' exceeds 5MB');continue;}
      var b64=await new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result.split(',')[1]);};r.onerror=rej;r.readAsDataURL(file);});
      newAtts.push({filename:file.name,content:b64,type:file.type});}
    setAttachments(function(p){return p.concat(newAtts);});e.target.value='';
  }

  async function openTestConfirm(){try{var{data:{user}}=await supabase.auth.getUser();setTestUserEmail(user?user.email:'');}catch(_){}setShowTestConfirm(true);}

  async function sendTestEmail(){
    setShowTestConfirm(false);setSendingTest(true);
    try{var{data:{session}}=await supabase.auth.getSession();var{data:{user}}=await supabase.auth.getUser();
      var res=await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/send-blast',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({org_id:organizationId,subject:'[TEST] '+(subject||'Newsletter Preview'),html_body:blocks.map(blockToHtml).join('\n'),audience:'test',test_email:user.email})});
      var data=await res.json();if(!res.ok) throw new Error(data.error||'Send failed');
      mascotSuccessToast('Test email sent!','Check '+user.email+' for the preview.');
    }catch(err){mascotErrorToast('Failed to send test.',err.message||'');}finally{setSendingTest(false);}
  }

  async function saveTemplate(){
    if(!saveName.trim()){toast.error('Enter a template name');return;}if(!subject.trim()){toast.error('Add a subject line first');return;}
    try{var{data:{user}}=await supabase.auth.getUser();
      var{error}=await supabase.from('email_templates').insert({org_id:organizationId,name:saveName.trim(),subject:subject,body:blocks.map(blockToHtml).join('\n'),category:'Newsletter',created_by:user.id});
      if(error) throw error;mascotSuccessToast('Template saved!',saveName.trim()+' added to your templates.');setShowSaveModal(false);setSaveName('');
    }catch(err){mascotErrorToast('Failed to save template.',err.message||'');}
  }

  async function sendNewsletter(){
    setShowConfirm(false);setSending(true);
    try{var{data:{session}}=await supabase.auth.getSession();
      var payload={org_id:organizationId,subject:subject,html_body:blocks.map(blockToHtml).join('\n'),audience:audience,template_name:'Newsletter'};
      if(attachments.length>0) payload.attachments=attachments.map(function(a){return{filename:a.filename,content:a.content,type:a.type};});
      var res=await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/send-blast',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify(payload)});
      var data=await res.json();if(!res.ok) throw new Error(data.error||'Send failed');
      mascotSuccessToast('Newsletter sent!',data.sent_count+' member'+(data.sent_count!==1?'s':'')+' received your newsletter.');
      if(onSent) onSent();
    }catch(err){mascotErrorToast('Failed to send newsletter.',err.message||'');}finally{setSending(false);}
  }

  var modalOverlay = {position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',background:'rgba(0,0,0,0.5)'};
  var modalBox = {background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'16px',width:'100%',maxWidth:'420px',padding:'24px'};

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}} aria-label="Newsletter Builder">

      {!isGrowthPlus && (
        <div role="alert" style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 20px',background:'rgba(245,183,49,0.08)',borderBottom:'1px solid rgba(245,183,49,0.2)',flexShrink:0}}>
          <Zap size={16} style={{color:'#F5B731',flexShrink:0}} aria-hidden="true" />
          <p style={{fontSize:'13px',color:'#F5B731',fontWeight:600,margin:0}}>
            Newsletter builder is available on Growth and Pro plans.
            <span style={{fontWeight:400,color:'#475569',marginLeft:'8px'}}>Design freely — upgrade to unlock sending.</span>
          </p>
        </div>
      )}

      {/* Top bar */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 16px',background:'#FFFFFF',borderBottom:'1px solid #E2E8F0',flexShrink:0,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:'180px'}}>
          <input type="text" value={subject} onChange={function(e){setSubject(e.target.value);}} placeholder="Email subject line..." aria-label="Newsletter subject"
            style={{width:'100%',padding:'8px 12px',background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#0E1523',fontSize:'13px',outline:'none',boxSizing:'border-box'}} />
        </div>
        <select value={audience} onChange={function(e){setAudience(e.target.value);}} aria-label="Audience"
          style={{padding:'8px 12px',background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#0E1523',fontSize:'13px',outline:'none'}}>
          <option value="all_members">All Members</option>
          <option value="admins_only">Admins Only</option>
        </select>
        {organization && organization.logo_url && (
          <button onClick={function(){setShowLogo(!showLogo);}} aria-pressed={showLogo} aria-label={showLogo?'Hide org logo':'Show org logo'}
            style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',background:showLogo?'rgba(59,130,246,0.08)':'transparent',border:'1px solid '+(showLogo?'#3B82F6':'#E2E8F0'),borderRadius:'8px',color:showLogo?'#3B82F6':'#64748B',fontSize:'12px',fontWeight:600,cursor:'pointer',outline:'none',whiteSpace:'nowrap'}}>
            <Layout size={12} aria-hidden="true" />
            {showLogo?'Logo: On':'Logo: Off'}
          </button>
        )}
        {planKey === 'growth' && (
          <div role="status" aria-label={'Email usage: '+usedThisMonth+' of '+planLimit+' emails used this month'}
            style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'8px',border:'1px solid '+(atLimit?'rgba(239,68,68,0.4)':usedThisMonth>=planLimit*0.8?'rgba(245,183,49,0.4)':'#E2E8F0'),background:atLimit?'rgba(239,68,68,0.08)':usedThisMonth>=planLimit*0.8?'rgba(245,183,49,0.08)':'#FFFFFF',fontSize:'12px',fontWeight:600,color:atLimit?'#EF4444':usedThisMonth>=planLimit*0.8?'#F5B731':'#64748B',flexShrink:0,whiteSpace:'nowrap'}}>
            <Mail size={12} aria-hidden="true" />
            {usedThisMonth+' / '+planLimit+' emails'}
            {atLimit&&<span style={{fontWeight:700}}> — Limit reached</span>}
          </div>
        )}
        <button onClick={openTestConfirm} disabled={blocks.length===0||sendingTest} aria-label="Send test email"
          style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'transparent',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#64748B',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:blocks.length===0||sendingTest?0.4:1,outline:'none'}}>
          {sendingTest?<div style={{width:'14px',height:'14px',border:'2px solid #94A3B8',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} aria-hidden="true" />:<Mail size={14} aria-hidden="true" />}
          Send Test
        </button>
        {isGrowthPlus && (
          <button onClick={function(){setShowSaveModal(true);}} disabled={blocks.length===0||!subject.trim()} aria-label="Save as template"
            style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'transparent',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#64748B',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:blocks.length===0||!subject.trim()?0.4:1,outline:'none'}}>
            <Save size={14} aria-hidden="true" />Save Template
          </button>
        )}
        <button onClick={function(){setShowConfirm(true);}} disabled={!canSend} aria-label="Send newsletter"
          style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',background:'#3B82F6',border:'none',borderRadius:'8px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:canSend?'pointer':'not-allowed',opacity:canSend?1:0.4,outline:'none'}}>
          {sending?<><div style={{width:'14px',height:'14px',border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} aria-hidden="true" />Sending...</>:<><Send size={14} aria-hidden="true" />Send Newsletter</>}
        </button>
      </div>

      {/* 3-panel layout */}
      <div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden'}}>

        {/* LEFT */}
        <aside style={{width:'220px',flexShrink:0,background:'#FFFFFF',borderRight:'1px solid #E2E8F0',overflowY:'auto',display:'flex',flexDirection:'column'}} aria-label="Block list and picker">
          <div style={{padding:'12px',flex:1}}>
            <p style={{fontSize:'10px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#F5B731',marginBottom:'8px'}}>
              Blocks{blocks.length>0?' ('+blocks.length+')':''}
            </p>
            {blocks.length===0
              ? <p style={{fontSize:'12px',color:'#94A3B8'}}>No blocks yet.</p>
              : <div role="list" aria-label="Email blocks">
                  {blocks.map(function(block,index){
                    return <BlockListItem key={block.id} block={block} index={index} total={blocks.length} isSelected={selectedId===block.id} onSelect={setSelectedId} onDelete={deleteBlock} onMove={moveBlock} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} isDragOver={dropIndex===index&&dragIndex!==index} />;
                  })}
                </div>
            }
          </div>
          <div style={{padding:'12px',borderTop:'1px solid #E2E8F0',flexShrink:0}}>
            <p style={{fontSize:'10px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#F5B731',marginBottom:'8px'}}>Add Block</p>
            {PICKER_GROUPS.map(function(group){
              return (
                <div key={group.label} style={{marginBottom:'10px'}}>
                  <p style={{fontSize:'10px',color:'#94A3B8',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'6px'}}>{group.label}</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px'}}>
                    {group.types.map(function(type){
                      var def=BLOCK_DEFS.find(function(d){return d.type===type;});
                      if(!def) return null;
                      return (
                        <button key={type} onClick={function(){addBlock(type);}} aria-label={'Add '+def.label+' block'}
                          style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',padding:'8px 4px',borderRadius:'8px',background:'#F8FAFC',border:'1px solid #E2E8F0',cursor:'pointer',transition:'border-color 0.15s',outline:'none'}}>
                          <def.Icon size={13} style={{color:'#64748B'}} aria-hidden="true" />
                          <span style={{fontSize:'10px',color:'#94A3B8',textAlign:'center',lineHeight:1.2}}>{def.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{padding:'12px',borderTop:'1px solid #E2E8F0',flexShrink:0}}>
            <p style={{fontSize:'10px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#F5B731',marginBottom:'8px'}}>Attachments</p>
            <button onClick={function(){fileRef.current&&fileRef.current.click();}} aria-label="Attach file"
              style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',background:'#F8FAFC',border:'1px dashed #E2E8F0',borderRadius:'8px',cursor:'pointer',boxSizing:'border-box',outline:'none'}}>
              <Paperclip size={13} style={{color:'#64748B'}} aria-hidden="true" />
              <span style={{fontSize:'12px',color:'#64748B'}}>Attach file (5MB max)</span>
            </button>
            <input ref={fileRef} type="file" multiple onChange={handleAttach} className="sr-only" tabIndex={-1} aria-label="Attachment input" />
            {attachments.length>0&&(
              <ul style={{marginTop:'8px',listStyle:'none',padding:0}} aria-label="Attached files">
                {attachments.map(function(att,i){
                  return(
                    <li key={i} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 8px',borderRadius:'6px',background:'#F8FAFC',border:'1px solid #E2E8F0',marginBottom:'4px'}}>
                      <Paperclip size={10} style={{color:'#64748B',flexShrink:0}} aria-hidden="true" />
                      <span style={{fontSize:'11px',color:'#475569',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{att.filename}</span>
                      <button onClick={function(){setAttachments(function(p){return p.filter(function(_,idx){return idx!==i;});});}} aria-label={'Remove '+att.filename}
                        style={{color:'#64748B',background:'none',border:'none',cursor:'pointer',padding:0,flexShrink:0,outline:'none'}}>
                        <X size={11} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* CENTER */}
        <main style={{flex:1,overflowY:'auto',background:'#e5e7eb',padding:'0 32px'}} aria-label="Live email preview" aria-live="polite">
          {blocks.length===0?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',textAlign:'center',padding:'48px 0'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'#FFFFFF',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
                <Mail size={24} style={{color:'#E2E8F0'}} aria-hidden="true" />
              </div>
              <h3 style={{fontSize:'15px',fontWeight:700,color:'#475569',margin:'0 0 8px'}}>Canvas is empty</h3>
              <p style={{fontSize:'13px',color:'#94A3B8',margin:'0 0 16px',maxWidth:'260px'}}>Add blocks from the left to start building your newsletter.</p>
              <button onClick={function(){addBlock('header');addBlock('text');}}
                style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',background:'#3B82F6',border:'none',borderRadius:'8px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',outline:'none'}}>
                <Plus size={14} aria-hidden="true" />Start with Header + Text
              </button>
            </div>
          ):(
            <div style={{paddingTop:'24px',paddingBottom:'24px'}}>
              <p style={{textAlign:'center',fontSize:'11px',color:'#9ca3af',marginBottom:'16px',fontWeight:600,textTransform:'uppercase',letterSpacing:'2px',userSelect:'none'}}>Live Preview — updates as you edit</p>
              <iframe srcDoc={previewHtml} title="Newsletter live preview" aria-label="Rendered email preview"
                style={{display:'block',width:'100%',maxWidth:'600px',minHeight:'500px',border:'none',margin:'0 auto',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'}}
                onLoad={function(e){try{var doc=e.target.contentDocument||(e.target.contentWindow&&e.target.contentWindow.document);if(doc&&doc.body)e.target.style.height=(doc.body.scrollHeight+40)+'px';}catch(_){}}} />
              <div style={{height:'32px'}} aria-hidden="true" />
            </div>
          )}
        </main>

        {/* RIGHT */}
        <aside style={{width:'300px',flexShrink:0,background:'#FFFFFF',borderLeft:'1px solid #E2E8F0',overflowY:'auto'}} aria-label="Block settings">
          <BlockSettingsPanel block={selectedBlock} onUpdate={updateBlock} organizationId={organizationId} />
        </aside>
      </div>

      {/* Confirm send */}
      {showConfirm&&(
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-nl-title" style={modalOverlay}>
          <div style={modalBox}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'16px',marginBottom:'20px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(59,130,246,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Send size={18} style={{color:'#3B82F6'}} aria-hidden="true" />
              </div>
              <div>
                <h2 id="confirm-nl-title" style={{fontSize:'15px',fontWeight:700,color:'#0E1523',margin:'0 0 6px'}}>Send Newsletter?</h2>
                <p style={{fontSize:'13px',color:'#64748B',margin:0}}>
                  Subject: <strong style={{color:'#0E1523'}}>"{subject}"</strong><br/>
                  To: <strong style={{color:'#0E1523'}}>{audience==='all_members'?'All active members':'Admins only'}</strong>
                  {attachments.length>0&&<><br/><span style={{fontSize:'11px',color:'#94A3B8'}}>{attachments.length} attachment{attachments.length!==1?'s':''}</span></>}
                </p>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={function(){setShowConfirm(false);}} style={{padding:'8px 16px',background:'transparent',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#64748B',fontSize:'13px',fontWeight:600,cursor:'pointer',outline:'none'}}>Cancel</button>
              <button onClick={sendNewsletter} style={{padding:'8px 20px',background:'#3B82F6',border:'none',borderRadius:'8px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',outline:'none'}}>
                <Send size={14} aria-hidden="true" />Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test email */}
      {showTestConfirm&&(
        <div role="dialog" aria-modal="true" aria-labelledby="test-nl-title" style={modalOverlay}>
          <div style={modalBox}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'16px',marginBottom:'20px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(245,183,49,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Mail size={18} style={{color:'#F5B731'}} aria-hidden="true" />
              </div>
              <div>
                <h2 id="test-nl-title" style={{fontSize:'15px',fontWeight:700,color:'#0E1523',margin:'0 0 6px'}}>Send Test Email</h2>
                <p style={{fontSize:'13px',color:'#64748B',margin:0}}>A preview will be sent to <strong style={{color:'#0E1523'}}>{testUserEmail}</strong>.<br/><span style={{fontSize:'11px',color:'#94A3B8'}}>Subject prefixed with [TEST]. Doesn't count toward your limit.</span></p>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={function(){setShowTestConfirm(false);}} style={{padding:'8px 16px',background:'transparent',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#64748B',fontSize:'13px',fontWeight:600,cursor:'pointer',outline:'none'}}>Cancel</button>
              <button onClick={sendTestEmail} style={{padding:'8px 20px',background:'#F5B731',border:'none',borderRadius:'8px',color:'#111827',fontSize:'13px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',outline:'none'}}>
                <Mail size={14} aria-hidden="true" />Send Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save template */}
      {showSaveModal&&(
        <div role="dialog" aria-modal="true" aria-labelledby="save-nl-title" style={modalOverlay}>
          <div style={modalBox}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
              <h2 id="save-nl-title" style={{fontSize:'15px',fontWeight:700,color:'#0E1523',margin:0}}>Save as Template</h2>
              <button onClick={function(){setShowSaveModal(false);}} aria-label="Close" style={{width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',background:'transparent',border:'none',color:'#64748B',cursor:'pointer',outline:'none'}}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <label htmlFor="nl-save-name" style={{display:'block',fontSize:'10px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#F5B731',marginBottom:'6px'}}>Template Name</label>
            <input id="nl-save-name" type="text" value={saveName} onChange={function(e){setSaveName(e.target.value);}} placeholder="e.g. April Newsletter" aria-required="true"
              style={{width:'100%',padding:'10px 12px',background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#0E1523',fontSize:'13px',outline:'none',boxSizing:'border-box',marginBottom:'16px'}} />
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={function(){setShowSaveModal(false);}} style={{padding:'8px 16px',background:'transparent',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#64748B',fontSize:'13px',fontWeight:600,cursor:'pointer',outline:'none'}}>Cancel</button>
              <button onClick={saveTemplate} style={{padding:'8px 16px',background:'#3B82F6',border:'none',borderRadius:'8px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',outline:'none'}}>
                <Save size={14} aria-hidden="true" />Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}