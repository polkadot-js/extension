// Copyright 2019-2023 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getLatestPackageVersion } from "./utils.js";

// export const DEFAULT_SNAP_ORIGIN = `local:http://localhost:8080`; 
export const DEFAULT_SNAP_ORIGIN = `npm:@polkagate/snap`
export let DEFAULT_SNAP_VERSION = '0.1.11';
export const DEFAULT_SNAP_NAME = 'polkamask';

export const SUPPORTED_SNAPS = {
  [DEFAULT_SNAP_ORIGIN]: { version: `>=${DEFAULT_SNAP_VERSION}` },
//   'npm:@chainsafe/polkadot-snap': {},
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