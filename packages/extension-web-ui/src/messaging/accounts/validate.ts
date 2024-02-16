// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseCheckPublicAndSecretKey, ResponsePrivateKeyValidateV2, ResponseSeedValidateV2 } from '@subwallet/extension-base/background/KoniTypes';
import { sendMessage } from '@subwallet/extension-web-ui/messaging/base';

import { KeypairType } from '@polkadot/util-crypto/types';

export async function checkPublicAndPrivateKey (publicKey: string, secretKey: string): Promise<ResponseCheckPublicAndSecretKey> {
  return sendMessage('pri(accounts.checkPublicAndSecretKey)', { publicKey, secretKey });
}

export async function validateSeed (suri: string, type?: KeypairType): Promise<{ address: string; suri: string }> {
  return sendMessage('pri(seed.validate)', { suri, type });
}

export async function validateSeedV2 (suri: string, types: Array<KeypairType>): Promise<ResponseSeedValidateV2> {
  return sendMessage('pri(seed.validateV2)', { suri, types });
}

export async function validateMetamaskPrivateKeyV2 (suri: string, types: Array<KeypairType>): Promise<ResponsePrivateKeyValidateV2> {
  return sendMessage('pri(privateKey.validateV2)', { suri, types });
}
