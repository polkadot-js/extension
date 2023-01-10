// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain/types';
import { BasicTxResponse } from '@subwallet/extension-base/background/KoniTypes';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signAndSendExtrinsic';
import { createTransferExtrinsic, getUnsupportedResponse, updateTransferResponseTxResult } from '@subwallet/extension-koni-base/api/dotsama/transfer';

import { EventRecord } from '@polkadot/types/interfaces';

interface MakeTransferExternalProps extends ExternalProps {
  recipientAddress: string;
  senderAddress: string;
  tokenInfo: _ChainAsset;
  transferAll: boolean;
  value: string;
}

export const makeTransferExternal = async ({ callback,
  chainInfo,
  id,
  recipientAddress,
  senderAddress,
  setState,
  signerType,
  substrateApi,
  tokenInfo,
  transferAll,
  updateState,
  value }: MakeTransferExternalProps): Promise<void> => {
  const networkKey = chainInfo.slug;
  const txState: BasicTxResponse = {};

  const [extrinsic, transferAmount] = await createTransferExtrinsic({
    substrateApi: substrateApi,
    from: senderAddress,
    networkKey: networkKey,
    to: recipientAddress,
    tokenInfo: tokenInfo,
    transferAll: transferAll,
    value: value
  });

  if (!extrinsic) {
    callback(getUnsupportedResponse());

    return;
  }

  const updateResponseTxResult = (response: BasicTxResponse, records: EventRecord[]) => {
    updateTransferResponseTxResult(networkKey, tokenInfo, response, records, transferAmount);
  };

  await signAndSendExtrinsic({
    id: id,
    setState: setState,
    type: signerType,
    updateState: updateState,
    substrateApi: substrateApi,
    callback: callback,
    extrinsic: extrinsic,
    txState: txState,
    address: senderAddress,
    updateResponseTxResult: updateResponseTxResult,
    errorMessage: 'error transfer'
  });
};
