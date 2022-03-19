// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useContext } from 'react';

import { ToastContext } from '../components/contexts';

export default function useToast (): {show: (message: string) => void, setToastError: (isError: boolean) => void} {
  return useContext(ToastContext);
}
