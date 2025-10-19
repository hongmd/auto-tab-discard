/*
  add "autoDiscardable" support to "chrome.tabs.query" and "chrome.tabs.update"
*/

const isFirefox = /Firefox/.test(navigator.userAgent) || typeof InstallTrigger !== 'undefined';

if (isFirefox) {
  const cache = {};
  const query = chrome.tabs.query;
  chrome.tabs.query = function(queryInfo, callback = () => {}) {
    if ('status' in queryInfo) {
      callback([]);
      return;
    }

    const b = 'autoDiscardable' in queryInfo;
    const v = queryInfo.autoDiscardable;
    delete queryInfo.autoDiscardable;

    query.apply(this, [queryInfo, tabs => {
      if (b) {
        tabs = tabs.filter(tab => v ? cache[tab.id] !== false : cache[tab.id] === false);
      }
      for (const tab of tabs) {
        tab.autoDiscardable = tab.id in cache ? cache[tab.id] : true;
      }
      callback(tabs);
    }]);
  };
  const update = chrome.tabs.update;
  chrome.tabs.update = function(tabId, updateProperties, callback) {
    let targetId = tabId;
    let props = updateProperties;
    let cb = callback;

    if (typeof targetId === 'object' || targetId === undefined) {
      cb = props;
      props = targetId || {};
      targetId = undefined;
    }

    if (typeof cb !== 'function') {
      cb = () => {};
    }
    props = props || {};

    const hasAutoDiscardable = Object.prototype.hasOwnProperty.call(props, 'autoDiscardable');
    const autoDiscardable = props.autoDiscardable;
    if (hasAutoDiscardable) {
      delete props.autoDiscardable;
    }

    const assignCache = tab => {
      if (hasAutoDiscardable && tab && typeof tab.id === 'number') {
        cache[tab.id] = autoDiscardable;
      }
    };

    if (targetId === undefined) {
      const wrapped = tab => {
        assignCache(tab);
        cb(tab);
      };

      if (Object.keys(props).length) {
        update.call(this, props, wrapped);
      }
      else if (hasAutoDiscardable) {
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, tabs => {
          const tab = tabs && tabs[0];
          assignCache(tab);
          cb(tab);
        });
      }
      else {
        update.call(this, props, wrapped);
      }
    }
    else {
      const next = () => {
        if (hasAutoDiscardable) {
          cache[targetId] = autoDiscardable;
        }
        cb();
      };
      if (Object.keys(props).length) {
        update.apply(this, [targetId, props, next]);
      }
      else {
        next();
      }
    }
  };
  chrome.tabs.onRemoved.addListener(tabId => delete cache[tabId]);
}

// FF onCreated is called when tab.url is still about:blank
if (isFirefox) {
  const pa = chrome.tabs.onCreated.addListener;
  chrome.tabs.onCreated.addListener = c => {
    c._ = tab => {
      if (tab.url === 'about:blank') {
        const observe = (id, info) => {
          if (id === tab.id && info.title) {
            chrome.tabs.onUpdated.removeListener(observe);
            setTimeout(c, 1000, tab);
          }
        };
        chrome.tabs.onUpdated.addListener(observe);
        setTimeout(() => {
          if (chrome.tabs.onUpdated.hasListener(observe)) {
            c(tab);
            chrome.tabs.onUpdated.removeListener(observe);
          }
        }, 10000);
      }
      else {
        c(tab);
      }
    };
    pa.call(chrome.tabs.onCreated, c._);
  };
  const pr = chrome.tabs.onCreated.removeListener;
  chrome.tabs.onCreated.removeListener = c => {
    pr.call(this, c._ || c);
  };
}
