// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PhosphorIcon } from '@subwallet/extension-koni-ui/types/index';
import { TagProps } from '@subwallet/react-ui';
import { IconProps } from 'phosphor-react';

export interface EarningTagType {
  label: string;
  icon: PhosphorIcon;
  color: TagProps['color'];
  weight: IconProps['weight'];
}
