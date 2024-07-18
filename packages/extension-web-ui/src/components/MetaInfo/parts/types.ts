// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React from 'react';

export interface InfoItemBase extends ThemeProps {
  label?: React.ReactNode,
  valueColorSchema?: 'default' | 'light' | 'gray' | 'success' | 'gold' | 'danger' | 'warning' | 'magenta' | 'green' | 'blue'
}
