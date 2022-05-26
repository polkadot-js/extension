// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useContext } from 'react';

import { ToastContext } from '../contexts';

export default function useToast (): {show: (message: string, isError?: boolean) => void} {
  return useContext(ToastContext);
}
