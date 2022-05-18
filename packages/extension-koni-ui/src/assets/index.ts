// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LogosMap from './logo';

export { default as LogosMap } from './logo';
export const AssetImageMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  loading: require('./loading.gif')
};

// preload all
[LogosMap, AssetImageMap].forEach((imageSet): void => {
  Object.values(imageSet).forEach((src): void => {
    new Image().src = src;
  });
});
