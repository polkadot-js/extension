// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain/types';
import { HandleBasicTx, PrepareExternalRequest } from '@subwallet/extension-base/background/KoniTypes';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { SignerExternal } from '@subwallet/extension-base/signers/types';

export interface ExternalProps extends PrepareExternalRequest{
  substrateApi: _SubstrateApi;
  chainInfo: _ChainInfo;
  callback: HandleBasicTx;
  signerType: SignerExternal;
}
