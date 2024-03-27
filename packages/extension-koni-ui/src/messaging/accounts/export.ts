// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestAccountBatchExportV2, ResponseAccountExportPrivateKey } from '@subwallet/extension-base/background/KoniTypes';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging';
import { KeyringPair$Json } from '@subwallet/keyring/types';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';

// JSON
export async function exportAccount (address: string, password: string): Promise<{ exportedJson: KeyringPair$Json }> {
  return sendMessage('pri(accounts.export)', { address, password });
}

export async function exportAccountPrivateKey (address: string, password: string): Promise<ResponseAccountExportPrivateKey> {
  return sendMessage('pri(accounts.exportPrivateKey)', { address, password });
}

export async function exportAccountsV2 (request: RequestAccountBatchExportV2): Promise<{ exportedJson: KeyringPairs$Json }> {
  return sendMessage('pri(accounts.batchExportV2)', request);
}
