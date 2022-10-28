// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxResponse } from '@subwallet/extension-base/background/KoniTypes';
import { getClaimRewardExtrinsic } from '@subwallet/extension-koni-base/api/bonding';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/signAndSend';

interface ClaimRewardExternalProps extends ExternalProps {
  address: string;
  validatorAddress?: string;
}

export const createClaimRewardExternal = async ({ address,
  apiProp,
  callback,
  id,
  network,
  setState,
  signerType,
  updateState,
  validatorAddress }: ClaimRewardExternalProps): Promise<void> => {
  const txState: BasicTxResponse = {};

  const extrinsic = await getClaimRewardExtrinsic(apiProp, network.key, address, validatorAddress);

  await signAndSendExtrinsic({
    type: signerType,
    callback: callback,
    id: id,
    setState: setState,
    apiProp: apiProp,
    addressOrPair: address,
    txState: txState,
    updateState: updateState,
    extrinsic: extrinsic,
    errorMessage: 'error claimReward'
  });
};
