// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestJsonRestoreV2 } from '@subwallet/extension-base/background/KoniTypes';
import { ResponseJsonGetAccountInfo } from '@subwallet/extension-base/background/types';
import { KeyringPair$Json } from '@subwallet/keyring/types';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';

import { sendMessage } from '../base';

export async function jsonGetAccountInfo (json: KeyringPair$Json): Promise<ResponseJsonGetAccountInfo> {
  return sendMessage('pri(json.account.info)', json);
}

export async function jsonRestore (file: KeyringPair$Json, password: string, address: string): Promise<void> {
  return sendMessage('pri(json.restore)', { file, password, address });
}

export async function batchRestore (file: KeyringPairs$Json, password: string, address: string): Promise<void> {
  return sendMessage('pri(json.batchRestore)', { file, password, address });
}

export async function jsonRestoreV2 (request: RequestJsonRestoreV2): Promise<void> {
  return sendMessage('pri(json.restoreV2)', request);
}

export async function batchRestoreV2 (file: KeyringPairs$Json, password: string, accountsInfo: ResponseJsonGetAccountInfo[], isAllowed: boolean): Promise<void> {
  return sendMessage('pri(json.batchRestoreV2)', { file, password, accountsInfo, isAllowed });
}
