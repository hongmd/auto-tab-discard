# Changelog

## Unreleased (MV3)
- Prevent browser-action handler from crashing in MV3 by falling back to stored preferences when `localStorage` is unavailable (`v3/worker/menu.mjs`).
- Stabilize popup initialization by awaiting active-tab lookup before accessing tab index, avoiding race conditions in the popup UI (`v3/data/popup/index.mjs`).

## 0.6.3 – 2025-10-27 (MV2)
- Fix number-based discarding so the extension drops the true excess tab count instead of stopping when filtered candidates are below the hard limit (`v2/modes/number.js`).
- Safely escape the title prefix injected during discards to keep custom strings from breaking the discard flow (`v2/background.js`).
- Clean up unused badge helpers, retain badge styling initialization, and clarify the Firefox `autoDiscardable` fallback (`v2/background.js`).
- Bump MV2 manifest version to `0.6.3` (`v2/manifest.json`).
