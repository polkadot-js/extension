"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSubscription = createSubscription;
exports.isSubscriptionRunning = isSubscriptionRunning;
exports.unsubscribe = unsubscribe;
// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
const subscriptions = {}; // return a subscription callback, that will send the data to the caller via the port

function createSubscription(id, port) {
  subscriptions[id] = port;
  return subscription => {
    if (subscriptions[id]) {
      port.postMessage({
        id,
        subscription
      });
    }
  };
}

function isSubscriptionRunning(id) {
  return !!subscriptions[id];
} // clear a previous subscriber


function unsubscribe(id) {
  if (subscriptions[id]) {
    console.log(`Unsubscribing from ${id}`);
    delete subscriptions[id];
  } else {
    console.error(`Unable to unsubscribe from ${id}`);
  }
}