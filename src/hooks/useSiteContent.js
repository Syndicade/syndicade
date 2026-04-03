/**
 * useSiteContent.js
 * Hook for reading live website content from the site_content table.
 *
 * Usage in any component:
 *   import { useSiteContent, useSiteContentMap } from '../hooks/useSiteContent';
 *
 * Single field:
 *   var headline = useSiteContent('hero_headline_main', 'Where Community');
 *
 * Multiple fields at once (more efficient — one query):
 *   var content = useSiteContentMap(['hero_headline_main', 'hero_subheadline']);
 *   content['hero_headline_main']  // → string value
 *
 * The second argument is the fallback shown while loading or if the key is missing.
 * Content updates in Supabase go live on the next page load — no deploy needed.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Single field hook ────────────────────────────────────────────────────────
export function useSiteContent(key, fallback) {
  var [value, setValue] = useState(fallback !== undefined ? fallback : '');

  useEffect(function () {
    supabase
      .from('site_content')
      .select('value')
      .eq('key', key)
      .single()
      .then(function (res) {
        if (!res.error && res.data?.value !== undefined) {
          setValue(res.data.value);
        }
      });
  }, [key]);

  return value;
}

// ─── Multi-field hook ─────────────────────────────────────────────────────────
// Pass an array of keys, receive an object of { key: value }.
// Optional fallbacks object: { hero_headline_main: 'Default text' }
export function useSiteContentMap(keys, fallbacks) {
  var defaultMap = {};
  keys.forEach(function (k) {
    defaultMap[k] = (fallbacks && fallbacks[k] !== undefined) ? fallbacks[k] : '';
  });

  var [map, setMap] = useState(defaultMap);

  useEffect(function () {
    if (!keys || keys.length === 0) return;
    supabase
      .from('site_content')
      .select('key, value')
      .in('key', keys)
      .then(function (res) {
        if (!res.error && res.data) {
          var updated = Object.assign({}, defaultMap);
          res.data.forEach(function (row) {
            updated[row.key] = row.value;
          });
          setMap(updated);
        }
      });
  }, [keys.join(',')]);

  return map;
}

// ─── Fetch all content (for the staff editor) ─────────────────────────────────
export async function fetchAllSiteContent() {
  var { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('section')
    .order('sort_order');
  return { data: data || [], error };
}

// ─── Save a single content field ──────────────────────────────────────────────
export async function saveSiteContent(key, value, staffUserId) {
  var { error } = await supabase
    .from('site_content')
    .update({ value: value, updated_at: new Date().toISOString(), updated_by: staffUserId })
    .eq('key', key);
  return { error };
}