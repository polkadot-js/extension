// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';

export interface InfoItemBase extends ThemeProps {
  label?: React.ReactNode,
  valueColorSchema?: 'default' | 'light' | 'gray' | 'success' | 'gold' | 'danger' | 'warning' | 'magenta' | 'green' | 'blue'
}
