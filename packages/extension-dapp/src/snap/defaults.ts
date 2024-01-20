// Copyright 2019-2024 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

const PACKAGE_NAME = '@polkagate/snap';
const LOCAL_SNAP_ID = 'local:http://localhost:8080';
const NPM_SNAP_ID = `npm:${PACKAGE_NAME}`;

export const DEFAULT_SNAP_ORIGIN = process.env["NODE_ENV"] === 'development' ? LOCAL_SNAP_ID : NPM_SNAP_ID;

export let DEFAULT_SNAP_VERSION = '0.1.13';
export const DEFAULT_SNAP_NAME = 'polkamask';

export const SUPPORTED_SNAPS = {
  [DEFAULT_SNAP_ORIGIN]: { version: `>=${DEFAULT_SNAP_VERSION}` },
};