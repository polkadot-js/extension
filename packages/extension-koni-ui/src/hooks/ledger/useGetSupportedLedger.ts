// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PredefinedLedgerNetwork } from '@subwallet/extension-koni-ui/constants/ledger';
import { useMemo } from 'react';

const useGetSupportedLedger = () => {
  return useMemo(() => [...PredefinedLedgerNetwork], []);
};

export default useGetSupportedLedger;
