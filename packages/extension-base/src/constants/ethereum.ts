// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmRpcErrorHelperMap } from '@subwallet/extension-base/background/KoniTypes';

export const EVM_PROVIDER_RPC_ERRORS_MAP: EvmRpcErrorHelperMap = {
  USER_REJECTED_REQUEST: [4001, 'User Rejected Request'],
  UNAUTHORIZED: [4100, 'Unauthorized'],
  UNSUPPORTED_METHOD: [4200, 'Unsupported Method'],
  DISCONNECTED: [4900, 'Disconnected'],
  CHAIN_DISCONNECTED: [4901, 'Chain Disconnected'],
  INVALID_PARAMS: [-32602, 'Invalid Params'],
  INTERNAL_ERROR: [-32603, 'Internal Error']
};
