// Copyright 2019-2024 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

const PACKAGE_NAME = '@polkagate/snap';
const NPM_SNAP_ID = `npm:${PACKAGE_NAME}`;

export const DEFAULT_SNAP_ORIGIN = NPM_SNAP_ID;

export const DEFAULT_SNAP_VERSION = '0.2.2';
export const DEFAULT_SNAP_NAME = 'polkagate-snap';

export const SUPPORTED_SNAPS = {
  [DEFAULT_SNAP_ORIGIN]: { version: `>=${DEFAULT_SNAP_VERSION}` }
};
