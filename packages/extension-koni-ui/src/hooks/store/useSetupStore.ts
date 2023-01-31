// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useSetupAssetRegistry from '@subwallet/extension-koni-ui/hooks/store/useSetupAssetRegistry';
import useSetupAuthUrl from '@subwallet/extension-koni-ui/hooks/store/useSetupAuthUrl';
import useSetupBalance from '@subwallet/extension-koni-ui/hooks/store/useSetupBalance';
import useSetupChainInfoMap from '@subwallet/extension-koni-ui/hooks/store/useSetupChainInfoMap';
import useSetupChainStateMap from '@subwallet/extension-koni-ui/hooks/store/useSetupChainStateMap';
import useSetupCrowdloan from '@subwallet/extension-koni-ui/hooks/store/useSetupCrowdloan';
import useSetupCustomToken from '@subwallet/extension-koni-ui/hooks/store/useSetupCustomToken';
import useSetupKeyringState from '@subwallet/extension-koni-ui/hooks/store/useSetupKeyringState';
import useSetupNft from '@subwallet/extension-koni-ui/hooks/store/useSetupNft';
import useSetupNftCollection from '@subwallet/extension-koni-ui/hooks/store/useSetupNftCollection';
import useSetupNftTransfer from '@subwallet/extension-koni-ui/hooks/store/useSetupNftTransfer';
import useSetupPrice from '@subwallet/extension-koni-ui/hooks/store/useSetupPrice';
import useSetupSettings from '@subwallet/extension-koni-ui/hooks/store/useSetupSettings';
import useSetupStakeUnlockingInfo from '@subwallet/extension-koni-ui/hooks/store/useSetupStakeUnlockingInfo';
import useSetupStaking from '@subwallet/extension-koni-ui/hooks/store/useSetupStaking';
import useSetupStakingReward from '@subwallet/extension-koni-ui/hooks/store/useSetupStakingReward';
import useSetupTransactionHistory from '@subwallet/extension-koni-ui/hooks/store/useSetupTransactionHistory';

// TODO: remove this
export default function useSetupStore (): void {
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
  useSetupCustomToken();
  useSetupStakeUnlockingInfo();
  useSetupAuthUrl();
  useSetupKeyringState();

  useSetupAssetRegistry();
  useSetupChainInfoMap();
  useSetupChainStateMap();
}
