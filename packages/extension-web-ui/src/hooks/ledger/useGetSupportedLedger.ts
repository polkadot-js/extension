// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PredefinedLedgerNetwork } from '@subwallet/extension-web-ui/constants/ledger';
import { useMemo } from 'react';

const useGetSupportedLedger = () => {
  return useMemo(() => [...PredefinedLedgerNetwork], []);
};

export default useGetSupportedLedger;
