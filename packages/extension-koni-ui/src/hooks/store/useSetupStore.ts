// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useSetupBalance from '@polkadot/extension-koni-ui/hooks/store/useSetupBalance';
import useSetupChainRegistry from '@polkadot/extension-koni-ui/hooks/store/useSetupChainRegistry';
import useSetupCrowdloan from '@polkadot/extension-koni-ui/hooks/store/useSetupCrowdloan';
import useSetupNetworkMap from '@polkadot/extension-koni-ui/hooks/store/useSetupNetworkMap';
import useSetupNft from '@polkadot/extension-koni-ui/hooks/store/useSetupNft';
import useSetupNftCollection from '@polkadot/extension-koni-ui/hooks/store/useSetupNftCollection';
import useSetupNftTransfer from '@polkadot/extension-koni-ui/hooks/store/useSetupNftTransfer';
import useSetupPrice from '@polkadot/extension-koni-ui/hooks/store/useSetupPrice';
import useSetupStaking from '@polkadot/extension-koni-ui/hooks/store/useSetupStaking';
import useSetupStakingReward from '@polkadot/extension-koni-ui/hooks/store/useSetupStakingReward';
import useSetupTransactionHistory from '@polkadot/extension-koni-ui/hooks/store/useSetupTransactionHistory';

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
}
