// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LedgerNetwork, MigrationLedgerNetwork } from '@subwallet/extension-base/background/KoniTypes';
import { PredefinedLedgerNetwork, PredefinedMigrationLedgerNetwork } from '@subwallet/extension-koni-ui/constants/ledger';
import { useMemo } from 'react';

const useGetSupportedLedger = () => {
  return useMemo<[LedgerNetwork[], MigrationLedgerNetwork[]]>(() => [[...PredefinedLedgerNetwork], [...PredefinedMigrationLedgerNetwork]], []);
};

export default useGetSupportedLedger;
