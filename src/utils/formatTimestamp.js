/**
 * Formats a Firestore Timestamp into a readable string
 * @param {Object} ts - Firestore Timestamp object
 * @returns {string} Formatted date string in "DD MMM YYYY • HH:MM" format
 */
export function formatTimestamp(ts) {
  if (!ts) {
    return "";
  }

  try {
    // Convert Firestore Timestamp to JavaScript Date
    const date = ts.toDate ? ts.toDate() : new Date(ts);

    // Get day, month, year
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();

    // Get hours and minutes
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year} • ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return "";
  }
}