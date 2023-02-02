// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useContext } from 'react';

import { ToastContext } from '../components/contexts';
import { SnackbarTypes } from '../types';

export default function useToast(): { show: (message: string, type?: SnackbarTypes) => void } {
  return useContext(ToastContext);
}
