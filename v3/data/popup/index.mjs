import {match} from '../../worker/core/utils.mjs';

// Cache DOM elements
const domElements = {
  localeElements: null,
  header: null,
  allowed: null,
  tmpDisable: null,
  releaseWindow: null,
  releaseRights: null,
  releaseLefts: null,
  releaseOtherWindows: null,
  releaseTabs: null
};

const cacheElements = () => {
  domElements.localeElements = [...document.querySelectorAll('[data-i18n]')];
  domElements.header = document.querySelector('header');
  domElements.allowed = document.getElementById('allowed');
  domElements.tmpDisable = document.getElementById('tmp_disable');
  domElements.releaseWindow = document.querySelector('[data-cmd=release-window]');
  domElements.releaseRights = document.querySelector('[data-cmd=release-rights]');
  domElements.releaseLefts = document.querySelector('[data-cmd=release-lefts]');
  domElements.releaseOtherWindows = document.querySelector('[data-cmd=release-other-windows]');
  domElements.releaseTabs = document.querySelector('[data-cmd=release-tabs]');
};

// localization
cacheElements();
domElements.localeElements.forEach(e => {
  e[e.dataset.i18nValue || 'textContent'] = chrome.i18n.getMessage(e.dataset.i18n);
  if (e.dataset.i18nTitle) {
    e.title = chrome.i18n.getMessage(e.dataset.i18nTitle);
  }
});
{
  if (domElements.header) {
    domElements.header.textContent = chrome.runtime.getManifest().name;
  }
}

let tab;

// works on all highlighted tabs in the current window
domElements.allowed.addEventListener('change', () => chrome.tabs.query({
  currentWindow: true,
  highlighted: true
}, async tabs => {
  for (const tab of tabs) {
    await new Promise(resolve => chrome.tabs.update(tab.id, {
      autoDiscardable: domElements.allowed.checked === false
    }, resolve));
  }
  chrome.runtime.sendMessage({
    method: 'run-check-on-action',
    ids: tabs.map(t => t.id)
  });
}));

const whitelist = {
  always: document.querySelector('[data-cmd=whitelist-domain]'),
  session: document.querySelector('[data-cmd=whitelist-session]')
};

// Store whitelist references in cache for faster access
domElements.whitelistAlways = whitelist.always;
domElements.whitelistSession = whitelist.session;

const queryTabs = options => new Promise(resolve => chrome.tabs.query(options, resolve));

const sendMessage = (message) => new Promise(resolve => chrome.runtime.sendMessage(message, resolve));

const getAlarm = () => new Promise(resolve => chrome.alarms.get('tmp.disable', resolve));

const init = async () => {
  // Get tmp.disable alarm and storage in parallel
  const [alarm, prefs] = await Promise.all([
    getAlarm(),
    sendMessage({
      'method': 'storage',
      'managed': {
        'tmp_disable': 0
      }
    })
  ]);
  domElements.tmpDisable.value = alarm ? prefs['tmp_disable'] : 0;

  const [activeTab] = await queryTabs({
    active: true,
    currentWindow: true
  });

  if (activeTab) {
    tab = activeTab;

    try {
      const {protocol = '', hostname} = new URL(tab.url);

      if (protocol.startsWith('http') || protocol.startsWith('ftp')) {
        const whitelistPrefs = await sendMessage({
          'method': 'storage',
          'managed': {
            'whitelist': []
          },
          'session': {
            'whitelist.session': []
          }
        });
        whitelist.session.checked = match(whitelistPrefs['whitelist.session'], hostname, tab.url) ? true : false;
        whitelist.always.checked = match(whitelistPrefs['whitelist'], hostname, tab.url) ? true : false;

        if (tab.autoDiscardable === false) {
          domElements.allowed.checked = true;
        }
        chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          func: () => document.title
        }).catch(e => {
          console.warn('Cannot access to this tab', e);
          domElements.allowed.parentElement.dataset.disabled = true;
        });
      }
      else {
        throw Error('no HTTP');
      }
    }
    catch (e) {
      whitelist.session.closest('.mlt').dataset.disabled = true;
      allowed.parentElement.dataset.disabled = true;
      tab = undefined;
    }
  }
  else {
    tab = undefined;
  }

  const [currentDiscarded, otherWindowDiscarded, allDiscarded] = await Promise.all([
    queryTabs({
      currentWindow: true,
      discarded: true
    }),
    queryTabs({
      currentWindow: false,
      discarded: true
    }),
    queryTabs({
      discarded: true
    })
  ]);

  /* disable unavailable releasing options */
  if (currentDiscarded.length === 0) {
    domElements.releaseWindow.classList.add('disabled');
  }
  if (!tab || currentDiscarded.some(t => t.index > tab.index) === false) {
    domElements.releaseRights.classList.add('disabled');
  }
  if (!tab || currentDiscarded.some(t => t.index < tab.index) === false) {
    domElements.releaseLefts.classList.add('disabled');
  }
  if (otherWindowDiscarded.length === 0) {
    domElements.releaseOtherWindows.classList.add('disabled');
  }
  if (allDiscarded.length === 0) {
    domElements.releaseTabs.classList.add('disabled');
  }
};
init().catch(console.error);

document.addEventListener('click', e => {
  const {target} = e;
  const cmd = target.dataset.cmd;

  if (cmd === 'open-options') {
    chrome.runtime.openOptionsPage();
    window.close();
  }
  else if (cmd && (cmd.startsWith('move-') || cmd === 'close')) {
    chrome.runtime.sendMessage({
      method: cmd,
      cmd
    }, init);
  }
  else if (cmd) {
    chrome.runtime.sendMessage({
      method: 'popup',
      cmd,
      shiftKey: e.shiftKey,
      checked: e.target.checked
    }, () => {
      if (['whitelist-session', 'whitelist-domain'].includes(cmd) === false) {
        window.close();
      }
      chrome.runtime.lastError;
    });
  }
});

domElements.tmpDisable.addEventListener('change', e => {
  chrome.storage.local.set({
    'tmp_disable': Number(e.target.value)
  });
});
