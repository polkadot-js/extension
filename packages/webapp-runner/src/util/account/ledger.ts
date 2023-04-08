// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LedgerNetwork } from "@subwallet/extension-base/background/KoniTypes";
import { _ChainState } from "@subwallet/extension-base/services/chain-service/types";
import { PredefinedLedgerNetwork } from "@subwallet-webapp/constants/ledger";

export const getSupportedLedger = (
  networkMap: Record<string, _ChainState>
): LedgerNetwork[] => {
  const supportedLedgerNetwork = [...PredefinedLedgerNetwork];
  const networkInfoItems: _ChainState[] = [];

  Object.values(networkMap).forEach((chainState) => {
    if (chainState.active) {
      networkInfoItems.push(chainState);
    }
  });

  return supportedLedgerNetwork.filter((ledgerNetwork) => {
    return networkInfoItems.find((ni) => ledgerNetwork.slug === ni.slug);
  });
};
