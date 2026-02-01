# Changelog

## 0.8.0 – 2026-02-01 (MV3)
- **New Feature**: Added "Reload tab when restored" option (enabled by default).
- **New Feature**: "Smart Change Detection" in Options page - shows Save/Revert/Default bar only when settings are modified.
- **UI**: Major redesign of the Options page with a tabbed interface (General, Conditions, Exceptions, Plugins, Advanced).
- **UI**: Sleek, modern design for both Options page and Popup.
- **Whitelist**: Added support for wildcard patterns (`*`) in whitelisting (e.g., `*.example.com`).
- **Control**: Updated Support link to Buy Me a Coffee.
- **Fix**: Resolved broken FAQ links by fixing `homepage_url` handling.

## 0.7.2 – 2026-02-01 (MV3)
- **New Feature**: Added tooltips to the popup interface explaining the "Shift + Click" functionality for whitelist management.
- **UX**: Improved whitelist description in popup with clearer instructions.
- **Fix**: Removed unsupported `storage` property from manifest (Firefox compatibility).
- **Fix**: Switched from `service_worker` to `background.scripts` for better Firefox MV3 support.

## 0.6.5 / 0.7.1 – 2026-02-01 (MV2/MV3)
- **New Feature**: Wildcard whitelist patterns - now supports `*.google.com`, `google.*`, `*google*` in addition to exact hostnames and regex.
- **New Feature**: Added "Do not discard a tab when there is a paused media player" (synced from MV3 to MV2).
- **Control**: Added `discard-rights` and `discard-lefts` commands to MV2 manifest.
- **Refactor**: Completely refactored `v2/plugins.js` to use a loop-based loader, significantly reducing code duplication.
- **Localization**: Synced 15+ new message keys and improved English grammar across all messages.
- **Fix**: Corrected multiple shadow variable bugs in `v2/background.js` and `v2/menu.js`.
- **Fix**: Resolved "background.service_worker is currently disabled" error on Firefox by transitioning to `background.scripts` for Manifest V3.
- **Fix**: Fixed multiple occurrences of `resposne` typo across both MV2 and MV3.
- **Code Quality**: Improved arrow function spacing in `v3/worker/core/discard.mjs`.
- Bump manifest versions to synchronize improvements.


## Unreleased (MV3)
- Prevent browser-action handler from crashing in MV3 by falling back to stored preferences when `localStorage` is unavailable (`v3/worker/menu.mjs`).
- Stabilize popup initialization by awaiting active-tab lookup before accessing tab index, avoiding race conditions in the popup UI (`v3/data/popup/index.mjs`).

## 0.6.4 – 2025-10-27 (MV2)
- **Performance**: Implement regex pattern caching to eliminate recompilation overhead on every check cycle, reducing CPU usage with large whitelist rules (`v2/modes/number.js`).
- **Performance**: Cache DOM elements and Promise handlers in popup initialization to reduce querySelector() calls and callback nesting, improving popup responsiveness (`v3/data/popup/index.mjs`).
- **Code Quality**: Convert nested Promise chains to async/await in popup initialization for better error handling and readability (`v3/data/popup/index.mjs`).
- Automatically clear cached regex patterns when whitelist settings change (`v2/modes/number.js`).
- Bump MV2 manifest version to `0.6.4` (`v2/manifest.json`).

## 0.6.3 – 2025-10-27 (MV2)
- Fix number-based discarding so the extension drops the true excess tab count instead of stopping when filtered candidates are below the hard limit (`v2/modes/number.js`).
- Safely escape the title prefix injected during discards to keep custom strings from breaking the discard flow (`v2/background.js`).
- Clean up unused badge helpers, retain badge styling initialization, and clarify the Firefox `autoDiscardable` fallback (`v2/background.js`).
- Bump MV2 manifest version to `0.6.3` (`v2/manifest.json`).
