// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, HandleBasicTx, NetworkJson, PrepareExternalRequest } from '@subwallet/extension-base/background/KoniTypes';
import { SignerExternal } from '@subwallet/extension-base/signers/types';

export interface ExternalProps extends PrepareExternalRequest{
  apiProps: ApiProps;
  network: NetworkJson;
  callback: HandleBasicTx;
  signerType: SignerExternal;
}
