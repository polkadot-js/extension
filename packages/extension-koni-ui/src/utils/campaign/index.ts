// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PhosphorIcon } from '@subwallet/extension-koni-ui/types';
import { ArrowCircleRight, XCircle } from 'phosphor-react';

export const getBannerButtonIcon = (icon: string | null): PhosphorIcon | undefined => {
  if (!icon) {
    return undefined;
  }

  switch (icon) {
    case 'XCircle':
      return XCircle;
    case 'ArrowCircleRight':
      return ArrowCircleRight;
  }

  return undefined;
};
