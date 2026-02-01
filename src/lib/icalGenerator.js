/**
 * iCal (.ics) File Generator
 * Generates calendar files that work with Google Calendar, Apple Calendar, Outlook, etc.
 * 
 * Format follows RFC 5545 standard
 */

/**
 * Generate iCal file content for an event
 * @param {Object} event - Event object from database
 * @returns {string} - iCal formatted string
 */
export function generateICS(event) {
  // Format date to iCal format: YYYYMMDDTHHMMSSZ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Escape special characters for iCal format
  const escapeText = (text) => {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  // Build location string
  const getLocation = () => {
    if (event.is_virtual && event.virtual_link) {
      return escapeText(event.virtual_link);
    }
    if (event.location) {
      return escapeText(event.location);
    }
    return '';
  };

  // Build description with all event details
  const getDescription = () => {
    let description = escapeText(event.description || '');
    
    // Add virtual link if hybrid
    if (event.is_virtual && event.virtual_link && event.location !== 'Virtual Event') {
      description += `\\n\\nVirtual Link: ${escapeText(event.virtual_link)}`;
    }
    
    // Add physical location if hybrid
    if (event.location && event.location !== 'Virtual Event' && event.is_virtual) {
      description += `\\n\\nIn-Person Location: ${escapeText(event.location)}`;
    }

    // Add location link if available
    if (event.location_link) {
      description += `\\n\\nDirections: ${escapeText(event.location_link)}`;
    }

    return description;
  };

  // Generate unique ID for event
  const uid = `${event.id}@syndicade.app`;

  // Current timestamp for DTSTAMP
  const now = formatDate(new Date().toISOString());

  // Build iCal content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Syndicade//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDate(event.start_time)}`,
    event.end_time ? `DTEND:${formatDate(event.end_time)}` : '',
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${getDescription()}`,
    `LOCATION:${getLocation()}`,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    // Add organizer info if available
    event.organizations?.name ? `ORGANIZER;CN=${escapeText(event.organizations.name)}:noreply@syndicade.app` : '',
    // Add reminder (24 hours before)
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event Reminder',
    'TRIGGER:-PT24H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(line => line) // Remove empty lines
    .join('\r\n');

  return icsContent;
}

/**
 * Download iCal file
 * @param {Object} event - Event object
 */
export function downloadICS(event) {
  const icsContent = generateICS(event);
  
  // Create blob
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  
  // Create download link
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  
  // Generate filename: "event-title-2026-02-15.ics"
  const eventDate = new Date(event.start_time).toISOString().split('T')[0];
  const filename = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${eventDate}.ics`;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  window.URL.revokeObjectURL(link.href);
}