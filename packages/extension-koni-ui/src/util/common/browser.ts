// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const openInNewTab = (url: string) => {
  return () => {
    window.open(url, '_blank');
  };
};
