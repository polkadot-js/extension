// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestDeriveCreateMultiple, RequestDeriveCreateV3, RequestDeriveValidateV2, RequestGetDeriveAccounts, ResponseDeriveValidateV2, ResponseGetDeriveAccounts } from '@subwallet/extension-base/background/KoniTypes';
import { ResponseDeriveValidate } from '@subwallet/extension-base/background/types';

import { sendMessage } from '../base';

export async function validateDerivePathV2 (request: RequestDeriveValidateV2): Promise<ResponseDeriveValidateV2> {
  return sendMessage('pri(derivation.validateV2)', request);
}

export async function getListDeriveAccounts (request: RequestGetDeriveAccounts): Promise<ResponseGetDeriveAccounts> {
  return sendMessage('pri(derivation.getList)', request);
}

export async function deriveMultiple (request: RequestDeriveCreateMultiple): Promise<boolean> {
  return sendMessage('pri(derivation.create.multiple)', request);
}

export async function deriveAccountV3 (request: RequestDeriveCreateV3): Promise<boolean> {
  return sendMessage('pri(derivation.createV3)', request);
}

export async function validateDerivationPath (parentAddress: string, suri: string, parentPassword: string): Promise<ResponseDeriveValidate> {
  return sendMessage('pri(derivation.validate)', { parentAddress, parentPassword, suri });
}

export async function deriveAccount (parentAddress: string, suri: string, parentPassword: string, name: string, password: string, genesisHash: string | null): Promise<boolean> {
  return sendMessage('pri(derivation.create)', { genesisHash, name, parentAddress, parentPassword, password, suri });
}

export async function deriveAccountV2 (parentAddress: string, suri: string, parentPassword: string, name: string, password: string, genesisHash: string | null, isAllowed: boolean): Promise<boolean> {
  return sendMessage('pri(derivation.createV2)', { genesisHash, name, parentAddress, suri, isAllowed });
}
