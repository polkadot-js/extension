// Copyright 2017-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'path';

import { createBundle } from '@polkadot/dev/config/rollup';

const pkgs = [
  '@polkadot/extension-dapp'
];

const external = [
  ...pkgs,
  '@polkadot/networks',
  '@polkadot/util',
  '@polkadot/util-crypto'
];

const entries = ['extension-base', 'extension-chains', 'extension-inject'].reduce((all, p) => ({
  ...all,
  [`@polkadot/${p}`]: path.resolve(process.cwd(), `packages/${p}/build`)
}), {});

const overrides = {};

export default pkgs.map((pkg) => {
  const override = (overrides[pkg] || {});

  return createBundle({
    external,
    pkg,
    ...override,
    entries: {
      ...entries,
      ...(override.entries || {})
    }
  });
});
