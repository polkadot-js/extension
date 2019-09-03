// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { AccountJson, AuthorizeRequest, MessageTypes, MessageAccountCreateInt, MessageAccountCreateExt, MessageAccountEdit, MessageAuthorizeApprove, MessageAuthorizeReject, MessageExtrinsicSignApprove, MessageExtrinsicSignSignature, MessageExtrinsicSignCancel, MessageSeedCreate, MessageSeedCreateResponse, MessageSeedValidate, MessageSeedValidateResponse, MessageAccountForget, SigningRequest } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { createType } from '@polkadot/types';
import { keyExtractSuri, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
import { assert } from '@polkadot/util';

import State from './State';
import { createSubscription, unsubscribe } from './subscriptions';

const SEED_DEFAULT_LENGTH = 12;
const SEED_LENGTHS = [12, 24];

function transformAccounts (accounts: SubjectInfo): AccountJson[] {
  return Object.values(accounts).map(({ json }): AccountJson => json);
}

export default class Extension {
  private state: State;

  public constructor (state: State) {
    this.state = state;
  }

  private accountsCreateInt ({ name, password, suri, type }: MessageAccountCreateInt): boolean {
    keyring.addUri(suri, password, { name }, type);

    return true;
  }

  private accountsCreateExt ({ address, genesisHash, name }: MessageAccountCreateExt): boolean {
    keyring.addExternal(address, { name, genesisHash });

    return true;
  }

  private accountsEdit ({ address, name }: MessageAccountEdit): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.meta, name });

    return true;
  }

  private accountsForget ({ address }: MessageAccountForget): boolean {
    keyring.forgetAccount(address);

    return true;
  }

  private accountsList (): AccountJson[] {
    return transformAccounts(accountsObservable.subject.getValue());
  }

  // FIXME This looks very much like what we have in Tabs
  private accountsSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription(id, port);
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void =>
      cb(transformAccounts(accounts))
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private authorizeApprove ({ id }: MessageAuthorizeApprove): boolean {
    const queued = this.state.getAuthRequest(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve(true);

    return true;
  }

  private authorizeReject ({ id }: MessageAuthorizeReject): boolean {
    const queued = this.state.getAuthRequest(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Rejected'));

    return true;
  }

  private authorizeRequests (): AuthorizeRequest[] {
    return this.state.allAuthRequests;
  }

  // FIXME This looks very much like what we have in accounts
  private authorizeSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription(id, port);
    const subscription = this.state.authSubject.subscribe((requests: AuthorizeRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private seedCreate ({ length = SEED_DEFAULT_LENGTH, type }: MessageSeedCreate): MessageSeedCreateResponse {
    const seed = mnemonicGenerate(length);

    return {
      address: keyring.createFromUri(seed, {}, type).address,
      seed
    };
  }

  private seedValidate ({ suri, type }: MessageSeedValidate): MessageSeedValidateResponse {
    const { phrase } = keyExtractSuri(suri);

    assert(SEED_LENGTHS.includes(phrase.split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`);
    assert(mnemonicValidate(phrase), 'Not a valid mnemonic seed');

    return {
      address: keyring.createFromUri(suri, {}, type).address,
      suri
    };
  }

  private signingApprovePassword ({ id, password }: MessageExtrinsicSignApprove): boolean {
    const queued = this.state.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { request, resolve, reject } = queued;
    const pair = keyring.getPair(request.address);

    if (!pair) {
      reject(new Error('Unable to find pair'));

      return false;
    }

    pair.decodePkcs8(password);

    const payload = createType('ExtrinsicPayload', request, { version: request.version });
    const result = payload.sign(pair);

    pair.lock();

    resolve({
      id,
      ...result
    });

    return true;
  }

  private signingApproveSignature ({ id, signature }: MessageExtrinsicSignSignature): boolean {
    const queued = this.state.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve({ id, signature });

    return true;
  }

  private signingCancel ({ id }: MessageExtrinsicSignCancel): boolean {
    const queued = this.state.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Cancelled'));

    return true;
  }

  private signingRequests (): SigningRequest[] {
    return this.state.allSignRequests;
  }

  // FIXME This looks very much like what we have in authorization
  private signingSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription(id, port);
    const subscription = this.state.signSubject.subscribe((requests: SigningRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/require-await
  public async handle (id: string, type: MessageTypes, request: any, port: chrome.runtime.Port): Promise<any> {
    switch (type) {
      case 'authorize.approve':
        return this.authorizeApprove(request);

      case 'authorize.reject':
        return this.authorizeReject(request);

      case 'authorize.requests':
        return this.authorizeRequests();

      case 'authorize.subscribe':
        return this.authorizeSubscribe(id, port);

      case 'accounts.create.ext':
        return this.accountsCreateExt(request);

      case 'accounts.create.int':
        return this.accountsCreateInt(request);

      case 'accounts.forget':
        return this.accountsForget(request);

      case 'accounts.edit':
        return this.accountsEdit(request);

      case 'accounts.list':
        return this.accountsList();

      case 'accounts.subscribe':
        return this.accountsSubscribe(id, port);

      case 'seed.create':
        return this.seedCreate(request);

      case 'seed.validate':
        return this.seedValidate(request);

      case 'signing.approve.password':
        return this.signingApprovePassword(request);

      case 'signing.approve.signature':
        return this.signingApproveSignature(request);

      case 'signing.cancel':
        return this.signingCancel(request);

      case 'signing.requests':
        return this.signingRequests();

      case 'signing.subscribe':
        return this.signingSubscribe(id, port);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
