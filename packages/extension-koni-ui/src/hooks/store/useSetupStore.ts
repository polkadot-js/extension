// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useSetupBalance from '@subwallet/extension-koni-ui/hooks/store/useSetupBalance';
import useSetupChainRegistry from '@subwallet/extension-koni-ui/hooks/store/useSetupChainRegistry';
import useSetupCrowdloan from '@subwallet/extension-koni-ui/hooks/store/useSetupCrowdloan';
import useSetupNetworkMap from '@subwallet/extension-koni-ui/hooks/store/useSetupNetworkMap';
import useSetupNft from '@subwallet/extension-koni-ui/hooks/store/useSetupNft';
import useSetupNftCollection from '@subwallet/extension-koni-ui/hooks/store/useSetupNftCollection';
import useSetupNftTransfer from '@subwallet/extension-koni-ui/hooks/store/useSetupNftTransfer';
import useSetupPrice from '@subwallet/extension-koni-ui/hooks/store/useSetupPrice';
import useSetupSettings from '@subwallet/extension-koni-ui/hooks/store/useSetupSettings';
import useSetupStaking from '@subwallet/extension-koni-ui/hooks/store/useSetupStaking';
import useSetupStakingReward from '@subwallet/extension-koni-ui/hooks/store/useSetupStakingReward';
import useSetupTransactionHistory from '@subwallet/extension-koni-ui/hooks/store/useSetupTransactionHistory';

export default function useSetupStore (): void {
  useSetupNetworkMap();
  useSetupChainRegistry();
  useSetupPrice();
  useSetupBalance();
  useSetupCrowdloan();
  useSetupNft();
  useSetupNftCollection();
  useSetupStaking();
  useSetupStakingReward();
  useSetupTransactionHistory();
  useSetupNftTransfer();
  useSetupSettings();
}
