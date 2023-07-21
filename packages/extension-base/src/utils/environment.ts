// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EnvironmentSupport, RuntimeEnvironment, RuntimeEnvironmentInfo, TargetEnvironment } from '../background/KoniTypes';

function detectRuntimeEnvironment (): RuntimeEnvironmentInfo {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Web environment
    return {
      environment: RuntimeEnvironment.Web,
      version: navigator.userAgent,
      host: window.location.host,
      protocol: window.location.protocol
    };
  } else if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
    // Service Worker environment
    return {
      environment: RuntimeEnvironment.ServiceWorker,
      version: navigator.userAgent,
      host: self.location.host,
      protocol: window.location.protocol
    };
  } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Node.js environment
    return {
      environment: RuntimeEnvironment.Node,
      version: process.versions.node
    };
  } else if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') {
    // Extension environment (Chrome)
    return {
      environment: RuntimeEnvironment.ExtensionChrome,
      version: chrome.runtime.getManifest().version,
      host: window.location.host,
      protocol: window.location.protocol
    };
  } else if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
    // Extension environment (Firefox)
    return {
      environment: RuntimeEnvironment.ExtensionFirefox,
      version: browser.runtime.getManifest().version,
      host: window.location.host,
      protocol: window.location.protocol
    };
    // @ts-ignore
  } else if (typeof WorkerGlobalScope !== 'undefined') {
    // Web Worker environment
    return {
      environment: RuntimeEnvironment.WebWorker,
      version: ''
    };
  } else {
    // Unknown environment
    return {
      environment: RuntimeEnvironment.Unknown,
      version: ''
    };
  }
}

export const RuntimeInfo: RuntimeEnvironmentInfo = detectRuntimeEnvironment();

export const TARGET_ENV = (process.env.TARGET_ENV || 'extension') as TargetEnvironment;

export const MODULE_SUPPORT: EnvironmentSupport = {
  MANTA_ZK: TARGET_ENV === 'extension',
  CORS: TARGET_ENV !== 'extension'
};
