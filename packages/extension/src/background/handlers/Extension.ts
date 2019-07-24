// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';
import { AuthorizeRequest, MessageAccountCreate, MessageAccountEdit, MessageAuthorizeApprove, MessageAuthorizeReject, MessageExtrinsicSignApprove, MessageExtrinsicSignCancel, MessageSeedCreate, MessageSeedCreateResponse, MessageSeedValidate, MessageSeedValidateResponse, MessageAccountForget, SigningRequest, RequestMessage } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { SignaturePayload } from '@polkadot/types';
import { mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
import { assert } from '@polkadot/util';

import State from './State';
import { createSubscription, unsubscribe } from './subscriptions';

const SEED_DEFAULT_LENGTH = 12;
const SEED_LENGTHS = [12, 24];

function transformAccounts (accounts: SubjectInfo): KeyringJson[] {
  return Object.values(accounts).map(({ json }): KeyringJson => json);
}

export default class Extension {
  private state: State;

  public constructor (state: State) {
    this.state = state;
  }

  private accountsCreate ({ name, password, suri, type }: MessageAccountCreate['payload']): boolean {
    keyring.addUri(suri, password, { name }, type);

    return true;
  }

  private accountsEdit ({ address, name }: MessageAccountEdit['payload']): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.meta, name });

    return true;
  }

  private accountsForget ({ address }: MessageAccountForget['payload']): boolean {
    keyring.forgetAccount(address);

    return true;
  }

  private accountsList (): KeyringJson[] {
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

  private authorizeApprove ({ id }: MessageAuthorizeApprove['payload']): boolean {
    const queued = this.state.getAuthRequest(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve(true);

    return true;
  }

  private authorizeReject ({ id }: MessageAuthorizeReject['payload']): boolean {
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

  private seedCreate ({ length = SEED_DEFAULT_LENGTH, type }: MessageSeedCreate['payload']): MessageSeedCreateResponse['payload'] {
    const seed = mnemonicGenerate(length);

    return {
      address: keyring.createFromUri(seed, {}, type).address,
      seed
    };
  }

  private seedValidate ({ seed, type }: MessageSeedValidate['payload']): MessageSeedValidateResponse['payload'] {
    assert(SEED_LENGTHS.includes(seed.split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`);
    assert(mnemonicValidate(seed), 'Not a valid mnemonic seed');

    return {
      address: keyring.createFromUri(seed, {}, type).address,
      seed
    };
  }

  private signingApprove ({ id, password }: MessageExtrinsicSignApprove['payload']): boolean {
    const queued = this.state.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { request, resolve, reject } = queued;
    const pair = keyring.getPair(request.address);

    if (!pair) {
      reject(new Error('Unable to find pair'));

      return false;
    }

    pair.decodePkcs8(password);

    const payload = new SignaturePayload(request, { version: request.version });
    const result = payload.sign(pair);

    pair.lock();

    resolve({
      id,
      ...result
    });

    return true;
  }

  private signingCancel ({ id }: MessageExtrinsicSignCancel['payload']): boolean {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async handle<TRequestMessage extends RequestMessage>(id: string, type: TRequestMessage['message'], request: TRequestMessage['payload'], port: chrome.runtime.Port): Promise<any> {
    switch (type) {
      case 'authorize.approve':
        return this.authorizeApprove(request as MessageAuthorizeApprove['payload']);

      case 'authorize.reject':
        return this.authorizeReject(request as MessageAuthorizeApprove['payload']);

      case 'authorize.requests':
        return this.authorizeRequests();

      case 'authorize.subscribe':
        return this.authorizeSubscribe(id, port);

      case 'accounts.create':
        return this.accountsCreate(request as MessageAccountCreate['payload']);

      case 'accounts.forget':
        return this.accountsForget(request as MessageAccountForget['payload']);

      case 'accounts.edit':
        return this.accountsEdit(request as MessageAccountEdit['payload']);

      case 'accounts.list':
        return this.accountsList();

      case 'accounts.subscribe':
        return this.accountsSubscribe(id, port);

      case 'seed.create':
        return this.seedCreate(request as MessageSeedCreate['payload']);

      case 'seed.validate':
        return this.seedValidate(request as MessageSeedValidate['payload']);

      case 'signing.approve':
        return this.signingApprove(request as MessageExtrinsicSignApprove['payload']);

      case 'signing.cancel':
        return this.signingCancel(request as MessageExtrinsicSignCancel['payload']);

      case 'signing.requests':
        return this.signingRequests();

      case 'signing.subscribe':
        return this.signingSubscribe(id, port);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
