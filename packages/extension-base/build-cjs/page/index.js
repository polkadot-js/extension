"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.enable = enable;
exports.handleResponse = handleResponse;
exports.redirectIfPhishing = redirectIfPhishing;
exports.sendMessage = sendMessage;

var _defaults = require("../defaults");

var _getId = require("../utils/getId");

var _Injected = _interopRequireDefault(require("./Injected"));

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
const handlers = {}; // a generic message sender that creates an event, returning a promise that will
// resolve once the event is resolved (by the response listener just below this)

function sendMessage(message, request, subscriber) {
  return new Promise((resolve, reject) => {
    const id = (0, _getId.getId)();
    handlers[id] = {
      reject,
      resolve,
      subscriber
    };
    const transportRequestMessage = {
      id,
      message,
      origin: _defaults.MESSAGE_ORIGIN_PAGE,
      request: request || null
    };
    window.postMessage(transportRequestMessage, '*');
  });
} // the enable function, called by the dapp to allow access


async function enable(origin) {
  await sendMessage('pub(authorize.tabV2)', {
    origin
  });
  return new _Injected.default(sendMessage);
} // redirect users if this page is considered as phishing, otherwise return false


async function redirectIfPhishing() {
  const res = await sendMessage('pub(phishing.redirectIfDenied)');
  return res;
}

function handleResponse(data) {
  const handler = handlers[data.id];

  if (!handler) {
    console.error(`Unknown response: ${JSON.stringify(data)}`);
    return;
  }

  if (!handler.subscriber) {
    delete handlers[data.id];
  }

  if (data.subscription) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    handler.subscriber(data.subscription);
  } else if (data.error) {
    handler.reject(new Error(data.error));
  } else {
    handler.resolve(data.response);
  }
}