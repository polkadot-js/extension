// Copyright 2019 @polkadot/extension-bg authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringJson } from '@polkadot/ui-keyring/types';
import { MessageTypes, MessageAccountCreate, MessageAccountEdit, MessageExtrinsicSignApprove, MessageExtrinsicSignCancel, MessageSeedCreate, MessageSeedCreate$Response, MessageSeedValidate, MessageSeedValidate$Response, MessageAccountForget, SigningRequest } from '../types';

import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
import { assert, u8aToHex } from '@polkadot/util';

import RawPayload from '../RawPayload';
import SigningRequests from './SigningRequests';

const SEED_DEFAULT_LENGTH = 12;
const SEED_LENGTHS = [12, 24];

export default class Extension {
  private signing: SigningRequests;

  constructor (signing: SigningRequests) {
    this.signing = signing;
  }

  private accountsCreate ({ name, password, suri, type }: MessageAccountCreate): boolean {
    keyring.addUri(suri, password, { name }, type);

    return true;
  }

  private accountsEdit ({ address, name }: MessageAccountEdit): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.getMeta(), name });

    return true;
  }

  private accountsForget ({ address }: MessageAccountForget): boolean {
    keyring.forgetAccount(address);

    return true;
  }

  private accountsList (): Array<KeyringJson> {
    return Object
      .values(accountsObservable.subject.getValue())
      .map(({ json }) => json);
  }

  private seedCreate ({ length = SEED_DEFAULT_LENGTH, type }: MessageSeedCreate): MessageSeedCreate$Response {
    const seed = mnemonicGenerate(length);

    return {
      address: keyring.createFromUri(seed, {}, type).address(),
      seed
    };
  }

  private seedValidate ({ seed, type }: MessageSeedValidate): MessageSeedValidate$Response {
    assert(SEED_LENGTHS.includes(seed.split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`);
    assert(mnemonicValidate(seed), 'Not a valid mnemonic seed');

    return {
      address: keyring.createFromUri(seed, {}, type).address(),
      seed
    };
  }

  private signingApprove ({ id, password }: MessageExtrinsicSignApprove): boolean {
    const queued = this.signing.get(id);

    assert(queued, 'Unable to find request');

    const { request: { address, blockHash, method, nonce }, resolve, reject } = queued;
    const pair = keyring.getPair(address);

    if (!pair) {
      reject(new Error('Unable to find pair'));

      return false;
    }

    pair.decodePkcs8(password);

    const payload = new RawPayload({ blockHash, method, nonce });
    const signature = u8aToHex(payload.sign(pair));

    pair.lock();

    resolve({
      id,
      signature
    });

    return true;
  }

  private signingCancel ({ id }: MessageExtrinsicSignCancel): boolean {
    const queued = this.signing.get(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Cancelled'));

    return true;
  }

  private signingRequests (): Array<SigningRequest> {
    return this.signing.requests;
  }

  async handle (type: MessageTypes, request: any): Promise<any> {
    switch (type) {
      case 'accounts.create':
        return this.accountsCreate(request);

      case 'accounts.forget':
        return this.accountsForget(request);

      case 'accounts.edit':
        return this.accountsEdit(request);

      case 'accounts.list':
        return this.accountsList();

      case 'seed.create':
        return this.seedCreate(request);

      case 'seed.validate':
        return this.seedValidate(request);

      case 'signing.approve':
        return this.signingApprove(request);

      case 'signing.cancel':
        return this.signingCancel(request);

      case 'signing.requests':
        return this.signingRequests();

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
