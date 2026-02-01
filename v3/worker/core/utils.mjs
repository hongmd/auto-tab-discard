import { prefs } from './prefs.mjs';

const log = (...args) => prefs.log && console.log((new Date()).toLocaleTimeString(), ...args);

const notify = e => chrome.notifications.create({
  title: chrome.runtime.getManifest().name,
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  message: e.message || e
});

const query = options => new Promise(resolve => chrome.tabs.query(options, resolve));

/**
 * Match hostname/URL against whitelist patterns.
 * Supports:
 * - Exact hostname: google.com
 * - Wildcard patterns: *.google.com, google.*, *google*
 * - Regex patterns: re:.*\.google\.com
 */
const match = (list, hostname, href) => {
  for (const pattern of list) {
    // Skip empty patterns
    if (!pattern || !pattern.trim()) continue;

    const trimmed = pattern.trim();

    // Regex pattern (re: prefix)
    if (trimmed.startsWith('re:')) {
      try {
        if (new RegExp(trimmed.substring(3)).test(href)) {
          return true;
        }
      } catch (e) {
        // Invalid regex, skip
      }
      continue;
    }

    // Wildcard pattern (contains *)
    if (trimmed.includes('*')) {
      // Convert wildcard to regex:
      // - Escape regex special chars except *
      // - Replace * with .*
      const escaped = trimmed
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape special chars
        .replace(/\*/g, '.*');                   // Convert * to .*
      try {
        const regex = new RegExp(`^${escaped}$`, 'i');
        if (regex.test(hostname) || regex.test(href)) {
          return true;
        }
      } catch (e) {
        // Invalid pattern, skip
      }
      continue;
    }

    // Exact hostname match
    if (hostname === trimmed) {
      return true;
    }
  }
  return false;
};

export { query, notify, log, match };

