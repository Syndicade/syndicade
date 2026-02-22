// src/lib/emailService.js
// Thin wrapper for calling the Supabase send-email Edge Function.
// Import this wherever you need to trigger emails.

import { supabase } from './supabase';

/**
 * Internal helper — invokes the Edge Function.
 * @param {string} type - 'contact_form' | 'event_registration' | 'member_invite'
 * @param {object} data - Payload matching the template for that type
 */
async function sendEmail(type, data) {
  const { data: result, error } = await supabase.functions.invoke('send-email', {
    body: { type, data },
  });

  if (error) throw new Error(error.message || 'Failed to send email');
  return result;
}

// ─── Public helpers ────────────────────────────────────────────────

/**
 * Notify admin about a new contact form submission.
 * Call from your landing page contact form.
 *
 * @param {{ name: string, email: string, message: string }} params
 */
export async function sendContactFormEmail({ name, email, message }) {
  return sendEmail('contact_form', { name, email, message });
}

/**
 * Confirm an event registration to the attendee.
 * Call after a successful RSVP insert in Supabase.
 *
 * @param {{
 *   memberEmail: string,
 *   memberName: string,
 *   eventTitle: string,
 *   eventDate: string,       // formatted string e.g. "Friday, March 14, 2026 at 7:00 PM"
 *   eventLocation: string,
 *   organizationName: string,
 *   eventUrl?: string,       // full URL to the event page
 * }} params
 */
export async function sendEventRegistrationEmail(params) {
  return sendEmail('event_registration', params);
}

/**
 * Send a membership invite to a new member.
 * Call after inserting a row into the invitations table.
 *
 * @param {{
 *   inviteeEmail: string,
 *   inviteeName?: string,    // optional — "Hi [name]" vs "Hi there"
 *   organizationName: string,
 *   inviterName: string,
 *   inviteUrl: string,       // e.g. https://syndicade.vercel.app/invite?token=abc123
 *   role?: string,           // e.g. 'member' | 'admin'
 * }} params
 */
export async function sendMemberInviteEmail(params) {
  return sendEmail('member_invite', params);
}