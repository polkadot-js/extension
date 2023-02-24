// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import ChainLogoMap from './logo';

export { default as LogosMap } from './logo';
export const AssetImageMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  loading: require('./loading.gif')
};

// preload all
[ChainLogoMap, AssetImageMap].forEach((imageSet): void => {
  Object.values(imageSet).forEach((src): void => {
    new Image().src = src;
  });
});
