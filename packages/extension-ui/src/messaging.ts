// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AuthorizeRequest, MessageTypes, SigningRequest } from '@polkadot/extension/background/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';
import { KeypairType } from '@polkadot/util-crypto/types';

import extension from 'extensionizer';
import { PORT_POPUP } from '@polkadot/extension/defaults';

interface Handler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriber?: (data: any) => void;
}

type Handlers = Record<string, Handler>;

const port = extension.runtime.connect({ name: PORT_POPUP });
const handlers: Handlers = {};
let idCounter = 0;

// setup a listener for messages, any incoming resolves the promise
port.onMessage.addListener((data): void => {
  const handler = handlers[data.id];

  if (!handler) {
    console.error(`Uknown response: ${JSON.stringify(data)}`);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendMessage (message: MessageTypes, request: any = {}, subscriber?: (data: any) => void): Promise<any> {
  return new Promise((resolve, reject): void => {
    const id = `${Date.now()}.${++idCounter}`;

    handlers[id] = { resolve, reject, subscriber };

    port.postMessage({ id, message, request });
  });
}

export async function editAccount (address: string, name: string): Promise<boolean> {
  return sendMessage('accounts.edit', { address, name });
}

export async function forgetAccount (address: string): Promise<boolean> {
  return sendMessage('accounts.forget', { address });
}

export async function getAccounts (): Promise<KeyringJson[]> {
  return sendMessage('accounts.list');
}

export async function getAuthRequests (): Promise<AuthorizeRequest[]> {
  return sendMessage('authorize.requests');
}

export async function rejectAuthRequest (id: string): Promise<boolean> {
  return sendMessage('authorize.reject', { id });
}

export async function approveAuthRequest (id: string): Promise<boolean> {
  return sendMessage('authorize.approve', { id });
}

export async function getSignRequests (): Promise<SigningRequest[]> {
  return sendMessage('signing.requests');
}

export async function cancelSignRequest (id: string): Promise<boolean> {
  return sendMessage('signing.cancel', { id });
}

export async function approveSignRequest (id: string, password: string): Promise<boolean> {
  return sendMessage('signing.approve', { id, password });
}

export async function createAccountExt (name: string, address: string, genesisHash: string): Promise<boolean> {
  return sendMessage('accounts.create.ext', { address, genesisHash, name });
}

export async function createAccountInt (name: string, password: string, suri: string, type?: KeypairType): Promise<boolean> {
  return sendMessage('accounts.create.int', { name, password, suri, type });
}

export async function createSeed (length?: number, type?: KeypairType): Promise<{ address: string; seed: string }> {
  return sendMessage('seed.create', { length, type });
}

export async function subscribeAccounts (cb: (accounts: KeyringJson[]) => void): Promise<boolean> {
  return sendMessage('accounts.subscribe', {}, cb);
}

export async function subscribeAuthorize (cb: (accounts: AuthorizeRequest[]) => void): Promise<boolean> {
  return sendMessage('authorize.subscribe', {}, cb);
}

export async function subscribeSigning (cb: (accounts: SigningRequest[]) => void): Promise<boolean> {
  return sendMessage('signing.subscribe', {}, cb);
}

export async function validateSeed (suri: string, type?: KeypairType): Promise<{ address: string; suri: string }> {
  return sendMessage('seed.validate', { suri, type });
}
