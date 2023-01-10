// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxResponse } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { getTuringCompoundExtrinsic } from '@subwallet/extension-koni-base/api/bonding/paraChain';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signAndSendExtrinsic';

interface CreateCompoundExternalProps extends ExternalProps {
  address: string;
  collatorAddress: string;
  accountMinimum: string;
  bondedAmount: string;
}

export const createCreateCompoundExternal = async ({ accountMinimum,
  address,
  bondedAmount,
  callback,
  chainInfo,
  collatorAddress,
  id,
  setState,
  signerType,
  substrateApi,
  updateState }: CreateCompoundExternalProps): Promise<void> => {
  const txState: BasicTxResponse = {};
  const { decimals } = _getChainNativeTokenInfo(chainInfo);
  const parsedAccountMinimum = parseFloat(accountMinimum) * 10 ** decimals;

  const extrinsic = await getTuringCompoundExtrinsic(substrateApi, address, collatorAddress, parsedAccountMinimum.toString(), bondedAmount);

  await signAndSendExtrinsic({
    type: signerType,
    callback: callback,
    id: id,
    setState: setState,
    substrateApi: substrateApi,
    address: address,
    txState: txState,
    updateState: updateState,
    extrinsic: extrinsic,
    errorMessage: 'error createCompound'
  });
};
