// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PORT_CONTENT, PORT_EXTENSION } from '@polkadot/extension-base/defaults';

/**
 * @return Always use the port directly returned from this function to keep the
 * reference up to date - never reassign it.
 */
type GetContentPort = (tabId: number) => chrome.runtime.Port
/**
 * @return Always use the port directly returned from this function to keep the
 * reference up to date - never reassign it.
 */
type GetCurrentPort = () => chrome.runtime.Port

export default (cb: (getContentPort: GetContentPort, getCurrentPort: GetCurrentPort) => void) => {
  const contentPorts: {
    [tabId: string]: chrome.runtime.Port
  } = {};
  const extensionPorts: {
    // There is a special case in which the key is "undefined" representing the native extension popup
    [tabId: string]: chrome.runtime.Port
  } = {};

  const getContentPort = (tabId: number) => {
    const port = contentPorts[tabId];

    if (!port) {
      throw new Error(`Connection with the content script from tab "${tabId}" is not open.`);
    }

    return port;
  };

  chrome.runtime.onConnect.addListener((port) => {
    if (![PORT_CONTENT, PORT_EXTENSION].includes(port.name)) {
      // shouldn't happen, however... only listen to what we know about
      throw new Error(`Unknown connection from ${port.name}`);
    }

    const portsMap = port.name === PORT_CONTENT ? contentPorts : extensionPorts;

    portsMap[getPortTabAsString(port)] = port;
    port.onDisconnect.addListener(() => {
      delete portsMap[getPortTabAsString(port)];
    });

    /**
     * Not returning "port" directly in order to always return the fresh instance
     * of the port (i.e. with the same name).
     */
    const getCurrentPort = () => portsMap[getPortTabAsString(port)];

    cb(getContentPort, getCurrentPort);
  });
};

/**
 * @return If the port is not attached to any tab, the "undefined" string is returned.
 */
const getPortTabAsString = (port: chrome.runtime.Port): string =>
  (port.sender?.tab?.id as number || undefined)?.toString() || 'undefined';
