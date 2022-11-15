// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxResponse, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { getClaimRewardExtrinsic } from '@subwallet/extension-koni-base/api/bonding';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signAndSendExtrinsic';

interface ClaimRewardExternalProps extends ExternalProps {
  address: string;
  validatorAddress?: string;
  stakingType: StakingType;
}

export const createClaimRewardExternal = async ({ address,
  apiProps,
  callback,
  id,
  network,
  setState,
  signerType,
  stakingType,
  updateState,
  validatorAddress }: ClaimRewardExternalProps): Promise<void> => {
  const txState: BasicTxResponse = {};

  const extrinsic = await getClaimRewardExtrinsic(apiProps, network.key, address, stakingType, validatorAddress);

  await signAndSendExtrinsic({
    type: signerType,
    callback: callback,
    id: id,
    setState: setState,
    apiProps: apiProps,
    address: address,
    txState: txState,
    updateState: updateState,
    extrinsic: extrinsic,
    errorMessage: 'error claimReward'
  });
};
