// Copyright 2019-2023 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getLatestPackageVersion } from "./utils.js";

// const LOCAL_SNAP_ID = 'local:http://localhost:8080';
const NPM_SNAP_ID = 'npm:@polkagate/snap';

export const DEFAULT_SNAP_ORIGIN =  NPM_SNAP_ID ;

export let DEFAULT_SNAP_VERSION = '0.1.11';
export const DEFAULT_SNAP_NAME = 'polkamask';

export const SUPPORTED_SNAPS = {
  [DEFAULT_SNAP_ORIGIN]: { version: `>=${DEFAULT_SNAP_VERSION}` },
};


/** get latest published version of snap from npm */
getLatestPackageVersion(DEFAULT_SNAP_ORIGIN) // TODO: CORS issue while using in local
  .then((latestVersion) => {
    DEFAULT_SNAP_VERSION = latestVersion;
    console.log(`Latest version of ${DEFAULT_SNAP_ORIGIN}: ${latestVersion}`);
  })
  .catch((error) => {
    console.error('Failed to get the latest version:', error);
  });