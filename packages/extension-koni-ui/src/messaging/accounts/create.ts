// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountExternalError, RequestAccountCreateExternalV2, RequestAccountCreateHardwareMultiple, RequestAccountCreateHardwareV2, RequestAccountCreateSuriV2, RequestAccountCreateWithSecretKey, ResponseAccountCreateSuriV2, ResponseAccountCreateWithSecretKey, ResponseSeedCreateV2 } from '@subwallet/extension-base/background/KoniTypes';
import { SeedLengths } from '@subwallet/extension-base/background/types';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging/base';

import { KeypairType } from '@polkadot/util-crypto/types';

// Create seed

export async function createSeed (length?: SeedLengths, seed?: string, type?: KeypairType): Promise<{ address: string; seed: string }> {
  return sendMessage('pri(seed.create)', { length, seed, type });
}

export async function createSeedV2 (length?: SeedLengths, seed?: string, types?: Array<KeypairType>): Promise<ResponseSeedCreateV2> {
  return sendMessage('pri(seed.createV2)', { length, seed, types });
}

/// Suri: seed or private key for evm

export async function createAccountSuri (name: string, password: string, suri: string, type?: KeypairType, genesisHash?: string): Promise<boolean> {
  return sendMessage('pri(accounts.create.suri)', { genesisHash, name, password, suri, type });
}

export async function createAccountSuriV2 (request: RequestAccountCreateSuriV2): Promise<ResponseAccountCreateSuriV2> {
  return sendMessage('pri(accounts.create.suriV2)', request);
}

// Private key for substrate

export async function createAccountWithSecret (request: RequestAccountCreateWithSecretKey): Promise<ResponseAccountCreateWithSecretKey> {
  return sendMessage('pri(accounts.create.withSecret)', request);
}

// Qr, read-only
export async function createAccountExternal (name: string, address: string, genesisHash: string): Promise<boolean> {
  return sendMessage('pri(accounts.create.external)', { address, genesisHash, name });
}

export async function createAccountExternalV2 (request: RequestAccountCreateExternalV2): Promise<AccountExternalError[]> {
  return sendMessage('pri(accounts.create.externalV2)', request);
}

// Hardware

export async function createAccountHardware (address: string, hardwareType: string, accountIndex: number, addressOffset: number, name: string, genesisHash: string): Promise<boolean> {
  return sendMessage('pri(accounts.create.hardware)', { accountIndex, address, addressOffset, genesisHash, hardwareType, name });
}

export async function createAccountHardwareV2 (request: RequestAccountCreateHardwareV2): Promise<boolean> {
  return sendMessage('pri(accounts.create.hardwareV2)', request);
}

export async function createAccountHardwareMultiple (request: RequestAccountCreateHardwareMultiple): Promise<boolean> {
  return sendMessage('pri(accounts.create.hardwareMultiple)', request);
}
