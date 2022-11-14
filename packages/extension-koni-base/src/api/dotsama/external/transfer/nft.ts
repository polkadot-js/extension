// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxResponse } from '@subwallet/extension-base/background/KoniTypes';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signAndSendExtrinsic';
import { getNftTransferExtrinsic } from '@subwallet/extension-koni-base/api/nft/transfer';
import { getPSP34TransferExtrinsic } from '@subwallet/extension-koni-base/api/tokens/wasm';

interface TransferNFTExternalProps extends ExternalProps {
  recipientAddress: string;
  params: Record<string, any>;
  senderAddress: string;
}

export async function makeNftTransferExternal ({ apiProps,
  callback,
  id,
  network,
  params,
  recipientAddress,
  senderAddress,
  setState,
  signerType,
  updateState }: TransferNFTExternalProps): Promise<void> {
  const txState: BasicTxResponse = {};
  const networkKey = network.key;
  const isPSP34 = params.isPsp34 as boolean | undefined;
  const extrinsic = !isPSP34
    ? getNftTransferExtrinsic(networkKey, apiProps, senderAddress, recipientAddress, params)
    : await getPSP34TransferExtrinsic(networkKey, apiProps, senderAddress, recipientAddress, params);

  await signAndSendExtrinsic({
    address: senderAddress,
    apiProps: apiProps,
    callback: callback,
    errorMessage: 'error transferring nft',
    extrinsic: extrinsic,
    id: id,
    setState: setState,
    txState: txState,
    type: signerType,
    updateState: updateState
  });
}
