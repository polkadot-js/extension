// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LogosMap from './logo';

export { default as LogosMap } from './logo';
export const AssetImageMap: Record<string, string> = {
  loading: require('./loading.gif')
};

// preload all
[LogosMap, AssetImageMap].forEach((imageSet): void => {
  Object.values(imageSet).forEach((src): void => {
    new Image().src = src;
  });
});
