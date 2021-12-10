// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AllowedPath, AuthorizeRequest, MessageTypes, MessageTypesWithNoSubscriptions, MessageTypesWithNullRequest, MessageTypesWithSubscriptions, MetadataRequest, RequestTypes, ResponseAuthorizeList, ResponseDeriveValidate, ResponseJsonGetAccountInfo, ResponseSigningIsLocked, ResponseTypes, SeedLengths, SigningRequest, SubscriptionMessageTypes } from '@polkadot/extension-base/background/types';
import type { Message } from '@polkadot/extension-base/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { KeyringPair$Json } from '@polkadot/keyring/types';
import type { KeyringPairs$Json } from '@polkadot/ui-keyring/types';
import type { HexString } from '@polkadot/util/types';
import type { KeypairType } from '@polkadot/util-crypto/types';

import { PORT_EXTENSION } from '@polkadot/extension-base/defaults';
import { getId } from '@polkadot/extension-base/utils/getId';
import { metadataExpand } from '@polkadot/extension-chains';
import { MetadataDef } from '@polkadot/extension-inject/types';

import allChains from './util/chains';
import { getSavedMeta, setSavedMeta } from './MetadataCache';

interface Handler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriber?: (data: any) => void;
}

type Handlers = Record<string, Handler>;

const port = chrome.runtime.connect({ name: PORT_EXTENSION });
const handlers: Handlers = {};

// setup a listener for messages, any incoming resolves the promise
port.onMessage.addListener((data: Message['data']): void => {
  const handler = handlers[data.id];

  if (!handler) {
    console.error(`Unknown response: ${JSON.stringify(data)}`);

    return;
  }

  if (!handler.subscriber) {
    delete handlers[data.id];
  }

  if (data.subscription) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    (handler.subscriber as Function)(data.subscription);
  } else if (data.error) {
    handler.reject(new Error(data.error));
  } else {
    handler.resolve(data.response);
  }
});

function sendMessage<TMessageType extends MessageTypesWithNullRequest>(message: TMessageType): Promise<ResponseTypes[TMessageType]>;
function sendMessage<TMessageType extends MessageTypesWithNoSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType]): Promise<ResponseTypes[TMessageType]>;
function sendMessage<TMessageType extends MessageTypesWithSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType], subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): Promise<ResponseTypes[TMessageType]>;
function sendMessage<TMessageType extends MessageTypes> (message: TMessageType, request?: RequestTypes[TMessageType], subscriber?: (data: unknown) => void): Promise<ResponseTypes[TMessageType]> {
  return new Promise((resolve, reject): void => {
    const id = getId();

    handlers[id] = { reject, resolve, subscriber };

    port.postMessage({ id, message, request: request || {} });
  });
}

export async function editAccount (address: string, name: string): Promise<boolean> {
  return sendMessage('pri(accounts.edit)', { address, name });
}

export async function showAccount (address: string, isShowing: boolean): Promise<boolean> {
  return sendMessage('pri(accounts.show)', { address, isShowing });
}

export async function tieAccount (address: string, genesisHash: string | null): Promise<boolean> {
  return sendMessage('pri(accounts.tie)', { address, genesisHash });
}

export async function exportAccount (address: string, password: string): Promise<{ exportedJson: KeyringPair$Json }> {
  return sendMessage('pri(accounts.export)', { address, password });
}

export async function exportAccounts (addresses: string[], password: string): Promise<{ exportedJson: KeyringPairs$Json }> {
  return sendMessage('pri(accounts.batchExport)', { addresses, password });
}

export async function validateAccount (address: string, password: string): Promise<boolean> {
  return sendMessage('pri(accounts.validate)', { address, password });
}

export async function forgetAccount (address: string): Promise<boolean> {
  return sendMessage('pri(accounts.forget)', { address });
}

export async function approveAuthRequest (id: string): Promise<boolean> {
  return sendMessage('pri(authorize.approve)', { id });
}

export async function approveMetaRequest (id: string): Promise<boolean> {
  return sendMessage('pri(metadata.approve)', { id });
}

export async function cancelSignRequest (id: string): Promise<boolean> {
  return sendMessage('pri(signing.cancel)', { id });
}

export async function isSignLocked (id: string): Promise<ResponseSigningIsLocked> {
  return sendMessage('pri(signing.isLocked)', { id });
}

export async function approveSignPassword (id: string, savePass: boolean, password?: string): Promise<boolean> {
  return sendMessage('pri(signing.approve.password)', { id, password, savePass });
}

export async function approveSignSignature (id: string, signature: HexString): Promise<boolean> {
  return sendMessage('pri(signing.approve.signature)', { id, signature });
}

export async function createAccountExternal (name: string, address: string, genesisHash: string): Promise<boolean> {
  return sendMessage('pri(accounts.create.external)', { address, genesisHash, name });
}

export async function createAccountHardware (address: string, hardwareType: string, accountIndex: number, addressOffset: number, name: string, genesisHash: string): Promise<boolean> {
  return sendMessage('pri(accounts.create.hardware)', { accountIndex, address, addressOffset, genesisHash, hardwareType, name });
}

export async function createAccountSuri (name: string, password: string, suri: string, type?: KeypairType, genesisHash?: string): Promise<boolean> {
  return sendMessage('pri(accounts.create.suri)', { genesisHash, name, password, suri, type });
}

export async function createSeed (length?: SeedLengths, seed?: string, type?: KeypairType): Promise<{ address: string; seed: string }> {
  return sendMessage('pri(seed.create)', { length, seed, type });
}

export async function getAllMetatdata (): Promise<MetadataDef[]> {
  return sendMessage('pri(metadata.list)');
}

export async function getMetadata (genesisHash?: string | null, isPartial = false): Promise<Chain | null> {
  if (!genesisHash) {
    return null;
  }

  let request = getSavedMeta(genesisHash);

  if (!request) {
    request = sendMessage('pri(metadata.get)', genesisHash || null);
    setSavedMeta(genesisHash, request);
  }

  const def = await request;

  if (def) {
    return metadataExpand(def, isPartial);
  } else if (isPartial) {
    const chain = allChains.find((chain) => chain.genesisHash === genesisHash);

    if (chain) {
      return metadataExpand({
        ...chain,
        specVersion: 0,
        tokenDecimals: 15,
        tokenSymbol: 'Unit',
        types: {}
      }, isPartial);
    }
  }

  return null;
}

export async function rejectAuthRequest (id: string): Promise<boolean> {
  return sendMessage('pri(authorize.reject)', { id });
}

export async function rejectMetaRequest (id: string): Promise<boolean> {
  return sendMessage('pri(metadata.reject)', { id });
}

export async function subscribeAccounts (cb: (accounts: AccountJson[]) => void): Promise<boolean> {
  return sendMessage('pri(accounts.subscribe)', null, cb);
}

export async function subscribeAuthorizeRequests (cb: (accounts: AuthorizeRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(authorize.requests)', null, cb);
}

export async function getAuthList (): Promise<ResponseAuthorizeList> {
  return sendMessage('pri(authorize.list)');
}

export async function toggleAuthorization (url: string): Promise<ResponseAuthorizeList> {
  return sendMessage('pri(authorize.toggle)', url);
}

export async function subscribeMetadataRequests (cb: (accounts: MetadataRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(metadata.requests)', null, cb);
}

export async function subscribeSigningRequests (cb: (accounts: SigningRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(signing.requests)', null, cb);
}

export async function validateSeed (suri: string, type?: KeypairType): Promise<{ address: string; suri: string }> {
  return sendMessage('pri(seed.validate)', { suri, type });
}

export async function validateDerivationPath (parentAddress: string, suri: string, parentPassword: string): Promise<ResponseDeriveValidate> {
  return sendMessage('pri(derivation.validate)', { parentAddress, parentPassword, suri });
}

export async function deriveAccount (parentAddress: string, suri: string, parentPassword: string, name: string, password: string, genesisHash: string | null): Promise<boolean> {
  return sendMessage('pri(derivation.create)', { genesisHash, name, parentAddress, parentPassword, password, suri });
}

export async function windowOpen (path: AllowedPath): Promise<boolean> {
  return sendMessage('pri(window.open)', path);
}

export async function jsonGetAccountInfo (json: KeyringPair$Json): Promise<ResponseJsonGetAccountInfo> {
  return sendMessage('pri(json.account.info)', json);
}

export async function jsonRestore (file: KeyringPair$Json, password: string): Promise<void> {
  return sendMessage('pri(json.restore)', { file, password });
}

export async function batchRestore (file: KeyringPairs$Json, password: string): Promise<void> {
  return sendMessage('pri(json.batchRestore)', { file, password });
}

export async function setNotification (notification: string): Promise<boolean> {
  return sendMessage('pri(settings.notification)', notification);
}
