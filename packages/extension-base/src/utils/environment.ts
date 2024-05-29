// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isSupportWindow } from '@subwallet/extension-base/utils/mv3';
import Bowser from 'bowser';

import { EnvironmentSupport, RuntimeEnvironment, RuntimeEnvironmentInfo, TargetEnvironment } from '../background/KoniTypes';

function detectRuntimeEnvironment (): RuntimeEnvironmentInfo {
  if (isSupportWindow && typeof document !== 'undefined') {
    // Web environment
    return {
      environment: RuntimeEnvironment.Web,
      version: navigator?.userAgent,
      host: window.location?.host,
      protocol: window.location?.protocol
    };
  } else if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
    // Service Worker environment
    return {
      environment: RuntimeEnvironment.ServiceWorker,
      version: navigator?.userAgent,
      host: self.location?.host,
      protocol: 'https'
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
      host: window.location?.host,
      protocol: window.location?.protocol
    };
  } else if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
    // Extension environment (Firefox)
    return {
      environment: RuntimeEnvironment.ExtensionFirefox,
      version: browser.runtime.getManifest().version,
      host: window.location?.host,
      protocol: window.location?.protocol
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

// Todo: Support more in backend case
export const BowserParser = Bowser.getParser(typeof navigator !== 'undefined' ? navigator?.userAgent + '' : '');
export const isFirefox = BowserParser.getBrowserName(true) === 'firefox';
export const osName = BowserParser.getOSName();
export const isMobile = BowserParser.getPlatform().type === 'mobile';

export const TARGET_ENV = (process.env.TARGET_ENV || 'extension') as TargetEnvironment;
export const targetIsExtension = TARGET_ENV === 'extension';
export const targetIsWeb = TARGET_ENV === 'webapp';
export const targetIsMobile = TARGET_ENV === 'mobile';

export const MODULE_SUPPORT: EnvironmentSupport = {
  MANTA_ZK: false
};
