// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const AssetImageMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  loading: require('./loading.gif')
};

// Preload images
[AssetImageMap].forEach((imageSet): void => {
  Object.values(imageSet).forEach((src): void => {
    new Image().src = src;
  });
});
