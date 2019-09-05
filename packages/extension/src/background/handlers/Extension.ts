// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { AuthorizeRequest, RequestAccountCreate, RequestAccountEdit, RequestAuthorizeApprove, RequestAuthorizeReject, RequestSigningApprove, RequestSigningCancel, RequestSeedCreate, ResponseSeedCreate, RequestSeedValidate, ResponseSeedValidate, RequestAccountForget, SigningRequest, RequestTypes, ResponseTypes, MessageTypes } from '../types';
import { InjectedAccount } from '@polkadot/extension-inject/types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { createType } from '@polkadot/types';
import { keyExtractSuri, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
import { assert } from '@polkadot/util';

import State from './State';
import { createSubscription, unsubscribe } from './subscriptions';

const SEED_DEFAULT_LENGTH = 12;
const SEED_LENGTHS = [12, 24];

function transformAccounts (accounts: SubjectInfo): InjectedAccount[] {
  return Object.values(accounts).map(({ json }): InjectedAccount => ({ ...json, name: json.meta && json.meta.name }));
}

export default class Extension {
  private state: State;

  public constructor (state: State) {
    this.state = state;
  }

  private accountsCreate ({ name, password, suri, type }: RequestAccountCreate): boolean {
    keyring.addUri(suri, password, { name }, type);

    return true;
  }

  private accountsEdit ({ address, name }: RequestAccountEdit): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.meta, name });

    return true;
  }

  private accountsForget ({ address }: RequestAccountForget): boolean {
    keyring.forgetAccount(address);

    return true;
  }

  private accountsList (): InjectedAccount[] {
    return transformAccounts(accountsObservable.subject.getValue());
  }

  // FIXME This looks very much like what we have in Tabs
  private accountsSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'accounts.subscribe'>(id, port);
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void =>
      cb(transformAccounts(accounts))
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private authorizeApprove ({ id }: RequestAuthorizeApprove): boolean {
    const queued = this.state.getAuthRequest(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve(true);

    return true;
  }

  private authorizeReject ({ id }: RequestAuthorizeReject): boolean {
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
    const cb = createSubscription<'authorize.subscribe'>(id, port);
    const subscription = this.state.authSubject.subscribe((requests: AuthorizeRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private seedCreate ({ length = SEED_DEFAULT_LENGTH, type }: RequestSeedCreate): ResponseSeedCreate {
    const seed = mnemonicGenerate(length);

    return {
      address: keyring.createFromUri(seed, {}, type).address,
      seed
    };
  }

  private seedValidate ({ suri, type }: RequestSeedValidate): ResponseSeedValidate {
    const { phrase } = keyExtractSuri(suri);

    assert(SEED_LENGTHS.includes(phrase.split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`);
    assert(mnemonicValidate(phrase), 'Not a valid mnemonic seed');

    return {
      address: keyring.createFromUri(suri, {}, type).address,
      suri
    };
  }

  private signingApprove ({ id, password }: RequestSigningApprove): boolean {
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

  private signingCancel ({ id }: RequestSigningCancel): boolean {
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
    const cb = createSubscription<'signing.subscribe'>(id, port);
    const subscription = this.state.signSubject.subscribe((requests: SigningRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  public handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    return new Promise((resolve, reject): void => {
      switch (type) {
        case 'authorize.approve':
          return resolve(this.authorizeApprove(request as RequestAuthorizeApprove));

        case 'authorize.reject':
          return resolve(this.authorizeReject(request as RequestAuthorizeApprove));

        case 'authorize.requests':
          return resolve(this.authorizeRequests());

        case 'authorize.subscribe':
          return resolve(this.authorizeSubscribe(id, port));

        case 'accounts.create':
          return resolve(this.accountsCreate(request as RequestAccountCreate));

        case 'accounts.forget':
          return resolve(this.accountsForget(request as RequestAccountForget));

        case 'accounts.edit':
          return resolve(this.accountsEdit(request as RequestAccountEdit));

        case 'accounts.list':
          return resolve(this.accountsList());

        case 'accounts.subscribe':
          return resolve(this.accountsSubscribe(id, port));

        case 'seed.create':
          return resolve(this.seedCreate(request as RequestSeedCreate));

        case 'seed.validate':
          return resolve(this.seedValidate(request as RequestSeedValidate));

        case 'signing.approve':
          return resolve(this.signingApprove(request as RequestSigningApprove));

        case 'signing.cancel':
          return resolve(this.signingCancel(request as RequestSigningCancel));

        case 'signing.requests':
          return resolve(this.signingRequests());

        case 'signing.subscribe':
          return resolve(this.signingSubscribe(id, port));

        default:
          return reject(new Error(`Unable to handle message of type ${type}`));
      }
    });
  }
}
