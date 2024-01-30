// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PhosphorIcon } from '@subwallet/extension-web-ui/types';
import * as Phosphor from 'phosphor-react';

export const getBannerButtonIcon = (icon: string | null): PhosphorIcon | undefined => {
  if (!icon) {
    return undefined;
  }

  if (!['Icon', 'IconProps', 'IconWeight', 'IconContext'].includes(icon) && icon in Phosphor) {
    // @ts-ignore
    return Phosphor[icon] as PhosphorIcon;
  }

  return undefined;
};
