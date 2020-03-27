// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import {
  AccountJson,
  AuthorizeRequest,
  SigningRequest,
  RequestTypes,
  MessageTypes,
  ResponseTypes,
  SeedLengths,
  SubscriptionMessageTypes,
  MetadataRequest,
  MessageTypesWithNullRequest,
  MessageTypesWithNoSubscriptions,
  MessageTypesWithSubscriptions,
  ResponseDeriveValidate
} from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { KeypairType } from '@polkadot/util-crypto/types';

import extension from 'extensionizer';
import { PORT_EXTENSION } from '@polkadot/extension-base/defaults';
import { findChain } from '@polkadot/extension-chains';

interface Handler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriber?: (data: any) => void;
}

type Handlers = Record<string, Handler>;

const port = extension.runtime.connect({ name: PORT_EXTENSION });
const handlers: Handlers = {};
let idCounter = 0;

// setup a listener for messages, any incoming resolves the promise
port.onMessage.addListener((data): void => {
  const handler = handlers[data.id];

  if (!handler) {
    console.error(`Unknown response: ${JSON.stringify(data)}`);
    return;
  }

  if (!handler.subscriber) {
    delete handlers[data.id];
  }

  if (data.subscription) {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendMessage<TMessageType extends MessageTypes> (message: TMessageType, request?: RequestTypes[TMessageType], subscriber?: (data: any) => void): Promise<ResponseTypes[TMessageType]> {
  return new Promise((resolve, reject): void => {
    const id = `${Date.now()}.${++idCounter}`;

    handlers[id] = { resolve, reject, subscriber };

    port.postMessage({ id, message, request: request || {} });
  });
}

export async function editAccount (address: string, name: string): Promise<boolean> {
  return sendMessage('pri(accounts.edit)', { address, name });
}

export async function exportAccount (address: string, password: string): Promise<{ exportedJson: string }> {
  return sendMessage('pri(accounts.export)', { address, password });
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

export async function approveSignPassword (id: string, password: string): Promise<boolean> {
  return sendMessage('pri(signing.approve.password)', { id, password });
}

export async function approveSignSignature (id: string, signature: string): Promise<boolean> {
  return sendMessage('pri(signing.approve.signature)', { id, signature });
}

export async function createAccountExternal (name: string, address: string, genesisHash: string): Promise<boolean> {
  return sendMessage('pri(accounts.create.external)', { address, genesisHash, name });
}

export async function createAccountSuri (name: string, password: string, suri: string, type?: KeypairType): Promise<boolean> {
  return sendMessage('pri(accounts.create.suri)', { name, password, suri, type });
}

export async function createSeed (length?: SeedLengths, type?: KeypairType): Promise<{ address: string; seed: string }> {
  return sendMessage('pri(seed.create)', { length, type });
}

export async function getMetadata (genesisHash?: string | null): Promise<Chain | null> {
  const definitions = await sendMessage('pri(metadata.list)');

  return findChain(definitions || [], genesisHash);
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

export async function subscribeMetadataRequests (cb: (accounts: MetadataRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(metadata.requests)', null, cb);
}

export async function subscribeSigningRequests (cb: (accounts: SigningRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(signing.requests)', null, cb);
}

export async function validateSeed (suri: string, type?: KeypairType): Promise<{ address: string; suri: string }> {
  return sendMessage('pri(seed.validate)', { suri, type });
}

export async function windowOpen (): Promise<boolean> {
  return sendMessage('pri(window.open)', null);
}

export async function validateDerivationPath (parentAddress: string, suri: string, parentPassword: string): Promise<ResponseDeriveValidate> {
  return sendMessage('pri(derivation.validate)', { parentAddress, suri, parentPassword });
}

export async function deriveAccount (parentAddress: string, suri: string, parentPassword: string, name: string, password: string): Promise<boolean> {
  return sendMessage('pri(derivation.create)', { parentAddress, suri, parentPassword, name, password });
}
