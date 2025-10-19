#!/usr/bin/env node
/* eslint-disable no-undef */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const makeEvent = () => ({
  _listeners: [],
  addListener(fn) {
    this._listeners.push(fn);
  },
  removeListener(fn) {
    const index = this._listeners.indexOf(fn);
    if (index > -1) {
      this._listeners.splice(index, 1);
    }
  },
  hasListener(fn) {
    return this._listeners.includes(fn);
  }
});

const rawTabs = [{id: 1, active: true, currentWindow: true}];

const baseUpdateCalls = [];
function baseUpdate(tabId, updateProperties, callback) {
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

  baseUpdateCalls.push({targetId, props});
  cb({
    id: targetId !== undefined ? targetId : rawTabs[0].id
  });
}

const baseQueryCalls = [];
function baseQuery(queryInfo, callback) {
  baseQueryCalls.push(queryInfo);
  callback(rawTabs.map(tab => Object.assign({}, tab)));
}

const onRemovedEvent = makeEvent();
const onCreatedEvent = makeEvent();
const onUpdatedEvent = makeEvent();

const sandbox = {
  navigator: {
    userAgent: 'Firefox/120.0'
  },
  InstallTrigger: {},
  chrome: {
    tabs: {
      update: baseUpdate,
      query: baseQuery,
      onRemoved: onRemovedEvent,
      onCreated: onCreatedEvent,
      onUpdated: onUpdatedEvent
    },
    runtime: {
      lastError: null
    }
  },
  console,
  setTimeout,
  clearTimeout
};
sandbox.global = sandbox;

const context = vm.createContext(sandbox);
const firefoxShim = fs.readFileSync(path.resolve(__dirname, '../../v2/firefox.js'), 'utf8');
vm.runInContext(firefoxShim, context, {filename: 'firefox.js'});

const update = sandbox.chrome.tabs.update;
const query = sandbox.chrome.tabs.query;

let callbackInvoked = false;
update({autoDiscardable: false}, tab => {
  callbackInvoked = true;
  if (!tab || tab.id !== 1) {
    throw new Error('Expected active tab in callback');
  }
});
if (!callbackInvoked) {
  throw new Error('Expected callback to be invoked for toggle without tabId');
}

query({autoDiscardable: true}, tabs => {
  if (tabs.length !== 0) {
    throw new Error('Expected no tabs when filtering for autoDiscardable=true after disabling');
  }
});

query({autoDiscardable: false}, tabs => {
  if (tabs.length !== 1 || tabs[0].autoDiscardable !== false) {
    throw new Error('Expected cached autoDiscardable=false tab');
  }
});

update(1, {autoDiscardable: true}, () => {});

query({autoDiscardable: true}, tabs => {
  if (tabs.length !== 1 || tabs[0].autoDiscardable !== true) {
    throw new Error('Expected tab to reappear after enabling autoDiscardable');
  }
});

update(1, {url: 'https://example.com', autoDiscardable: false}, () => {});
const lastCall = baseUpdateCalls.pop();
if (!lastCall || lastCall.props.autoDiscardable !== undefined || lastCall.props.url !== 'https://example.com') {
  throw new Error('Expected autoDiscardable to be stripped before invoking native update');
}

console.log('Firefox autoDiscardable shim smoke test passed');
