// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxResponse } from '@subwallet/extension-base/background/KoniTypes';
import { getTuringCancelCompoundingExtrinsic } from '@subwallet/extension-koni-base/api/bonding/paraChain';
import { ExternalProps } from '@subwallet/extension-koni-base/api/dotsama/external/shared';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signAndSendExtrinsic';

interface CancelCompoundExternalProps extends ExternalProps {
  address: string;
  taskId: string;
}

export const createCancelCompoundExternal = async ({ address,
  apiProps,
  callback,
  id,
  setState,
  signerType,
  taskId,
  updateState }: CancelCompoundExternalProps): Promise<void> => {
  const txState: BasicTxResponse = {};

  const extrinsic = await getTuringCancelCompoundingExtrinsic(apiProps, taskId);

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
    errorMessage: 'error cancelCompound'
  });
};
