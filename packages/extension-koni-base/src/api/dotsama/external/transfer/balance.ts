// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signExtrinsic';
import { createTransferExtrinsic, doSignAndSend, getUnsupportedResponse, updateTransferResponseTxResult } from '@subwallet/extension-koni-base/api/dotsama/transfer';

interface MakeTransferExternalProps extends ExternalProps {
  recipientAddress: string;
  senderAddress: string;
  tokenInfo: undefined | TokenInfo;
  transferAll: boolean;
  value: string;
}

export const makeTransferExternal = async ({ apiProps,
  callback,
  id,
  network,
  recipientAddress,
  senderAddress,
  setState,
  signerType,
  tokenInfo,
  transferAll,
  updateState,
  value }: MakeTransferExternalProps): Promise<void> => {
  const networkKey = network.key;

  const [extrinsic, transferAmount] = await createTransferExtrinsic({
    apiProp: apiProps,
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

  const signFunction = async () => {
    await signExtrinsic({
      address: senderAddress,
      apiProps: apiProps,
      callback: callback,
      extrinsic: extrinsic,
      id: id,
      setState: setState,
      type: signerType
    });
  };

  await doSignAndSend({
    _updateResponseTxResult: updateTransferResponseTxResult,
    apiProps: apiProps,
    callback: callback,
    extrinsic: extrinsic,
    networkKey: networkKey,
    signFunction: signFunction,
    tokenInfo: tokenInfo,
    transferAmount: transferAmount,
    updateState: updateState
  });
};
