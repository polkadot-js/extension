// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

// These code from https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#keep-sw-alive

/**
 * Tracks when a service worker was last alive and extends the service worker
 * lifetime by writing the current time to extension storage every 20 seconds.
 * You should still prepare for unexpected termination - for example, if the
 * extension process crashes or your extension is manually stopped at
 * chrome://serviceworker-internals.
 */

let heartbeatInterval: NodeJS.Timer | undefined;

async function runHeartbeat () {
  await chrome.storage.local.set({ 'last-heartbeat': new Date().getTime() });
}

/**
 * Starts the heartbeat interval which keeps the service worker alive. Call
 * this sparingly when you are doing work which requires persistence, and call
 * stopHeartbeat once that work is complete.
 */
export function startHeartbeat () {
  // Run the heartbeat once at service worker startup.
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  runHeartbeat().then(() => {
    // Then again every 20 seconds.
    heartbeatInterval = setInterval(() => {
      runHeartbeat().catch(console.error);
    }, 20 * 1000);
  }).catch(console.error);
}

export function stopHeartbeat () {
  clearInterval(heartbeatInterval);
  heartbeatInterval = undefined;
}

/**
 * Returns the last heartbeat stored in extension storage, or undefined if
 * the heartbeat has never run before.
 */
export async function getLastHeartbeat () {
  return (await chrome.storage.local.get('last-heartbeat'))['last-heartbeat'] as number | undefined;
}
