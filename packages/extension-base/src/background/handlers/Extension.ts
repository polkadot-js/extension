// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataDef } from '@polkadot/extension-inject/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { AccountJson, AuthorizeRequest, MessageTypes, MetadataRequest, RequestAccountCreateExternal, RequestAccountCreateSuri, RequestAccountEdit, RequestAccountExport, RequestAccountShow, RequestAccountTie, RequestAccountValidate, RequestAuthorizeApprove, RequestAuthorizeReject, RequestDeriveCreate, ResponseDeriveValidate, RequestMetadataApprove, RequestMetadataReject, RequestSigningApprovePassword, RequestSigningApproveSignature, RequestSigningCancel, RequestSigningIsLocked, RequestSeedCreate, RequestTypes, ResponseAccountExport, RequestAccountForget, ResponseSeedCreate, RequestSeedValidate, RequestDeriveValidate, ResponseSeedValidate, ResponseType, SigningRequest, RequestJsonRestore, ResponseJsonRestore, RequestAccountChangePassword } from '../types';

import chrome from '@polkadot/extension-inject/chrome';
import keyring from '@polkadot/ui-keyring';
import accountsObservable from '@polkadot/ui-keyring/observable/accounts';
import { TypeRegistry } from '@polkadot/types';
import { KeyringPair, KeyringPair$Meta } from '@polkadot/keyring/types';
import { assert, isHex, isObject } from '@polkadot/util';
import { keyExtractSuri, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';

import State from './State';
import { createSubscription, unsubscribe } from './subscriptions';

type CachedUnlocks = Record<string, number>;

const SEED_DEFAULT_LENGTH = 12;
const SEED_LENGTHS = [12, 15, 18, 21, 24];
const PASSWORD_EXPIRY = 15 * 60 * 1000;

// a global registry to use internally
const registry = new TypeRegistry();

function transformAccounts (accounts: SubjectInfo): AccountJson[] {
  return Object.values(accounts).map(({ json: { address, meta } }): AccountJson => ({
    address,
    ...meta
  }));
}

export default class Extension {
  readonly #cachedUnlocks: CachedUnlocks;

  readonly #state: State;

  constructor (state: State) {
    this.#cachedUnlocks = {};
    this.#state = state;
  }

  private accountsCreateExternal ({ address, genesisHash, name }: RequestAccountCreateExternal): boolean {
    keyring.addExternal(address, { genesisHash, name });

    return true;
  }

  private accountsCreateSuri ({ genesisHash, name, password, suri, type }: RequestAccountCreateSuri): boolean {
    keyring.addUri(suri, password, { genesisHash, name }, type);

    return true;
  }

  private accountsChangePassword ({ address, newPass, oldPass }: RequestAccountChangePassword): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    try {
      if (!pair.isLocked) {
        pair.lock();
      }

      pair.decodePkcs8(oldPass);
    } catch (error) {
      throw new Error('oldPass is invalid');
    }

    keyring.encryptAccount(pair, newPass);

    return true;
  }

  private accountsEdit ({ address, name }: RequestAccountEdit): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.meta, name });

    return true;
  }

  private accountsExport ({ address, password }: RequestAccountExport): ResponseAccountExport {
    return { exportedJson: JSON.stringify(keyring.backupAccount(keyring.getPair(address), password)) };
  }

  private accountsForget ({ address }: RequestAccountForget): boolean {
    keyring.forgetAccount(address);

    return true;
  }

  private accountsShow ({ address, isShowing }: RequestAccountShow): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.meta, isHidden: !isShowing });

    return true;
  }

  private accountsTie ({ address, genesisHash }: RequestAccountTie): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.meta, genesisHash });

    return true;
  }

  private accountsValidate ({ address, password }: RequestAccountValidate): boolean {
    try {
      keyring.backupAccount(keyring.getPair(address), password);

      return true;
    } catch (e) {
      return false;
    }
  }

  // FIXME This looks very much like what we have in Tabs
  private accountsSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(accounts.subscribe)'>(id, port);
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
    const queued = this.#state.getAuthRequest(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve(true);

    return true;
  }

  private authorizeReject ({ id }: RequestAuthorizeReject): boolean {
    const queued = this.#state.getAuthRequest(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Rejected'));

    return true;
  }

  // FIXME This looks very much like what we have in accounts
  private authorizeSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.requests)'>(id, port);
    const subscription = this.#state.authSubject.subscribe((requests: AuthorizeRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private metadataApprove ({ id }: RequestMetadataApprove): boolean {
    const queued = this.#state.getMetaRequest(id);

    assert(queued, 'Unable to find request');

    const { request, resolve } = queued;

    this.#state.saveMetadata(request);

    resolve(true);

    return true;
  }

  private metadataGet (genesisHash: string | null): MetadataDef | null {
    return this.#state.knownMetadata.find((result) => result.genesisHash === genesisHash) || null;
  }

  private metadataList (): MetadataDef[] {
    return this.#state.knownMetadata;
  }

  private metadataReject ({ id }: RequestMetadataReject): boolean {
    const queued = this.#state.getMetaRequest(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Rejected'));

    return true;
  }

  private metadataSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(metadata.requests)'>(id, port);
    const subscription = this.#state.metaSubject.subscribe((requests: MetadataRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private jsonRestore ({ json, password }: RequestJsonRestore): ResponseJsonRestore {
    try {
      const pair = keyring.restoreAccount(json, password);

      if (pair) {
        return { error: null };
      }
    } catch (error) {
      return { error: (error as Error).message };
    }

    return { error: 'Could not restore account.' };
  }

  private jsonVerifyFile ({ json }: RequestJsonRestore): boolean {
    try {
      const publicKey = keyring.decodeAddress(json.address, true);
      const isFileValid = publicKey.length === 32 && !!json.encoded && isObject(json.meta) && (
        Array.isArray(json.encoding.content)
          ? json.encoding.content[0] === 'pkcs8'
          : json.encoding.content === 'pkcs8'
      );

      return isFileValid;
    } catch (error) {
      console.error(error);
    }

    return false;
  }

  private jsonVerifyPassword (password: string): boolean {
    return keyring.isPassValid(password);
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

    if (isHex(phrase)) {
      assert(isHex(phrase, 256), 'Hex seed needs to be 256-bits');
    } else {
      // sadly isHex detects as string, so we need a cast here
      assert(SEED_LENGTHS.includes((phrase as string).split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`);
      assert(mnemonicValidate(phrase), 'Not a valid mnemonic seed');
    }

    return {
      address: keyring.createFromUri(suri, {}, type).address,
      suri
    };
  }

  private signingApprovePassword ({ id, isSavedPass, password }: RequestSigningApprovePassword): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { reject, request, resolve } = queued;
    const pair = keyring.getPair(request.payload.address);

    if (!pair) {
      reject(new Error('Unable to find pair'));

      return false;
    }

    const now = Date.now();

    if (pair.isLocked || password) {
      pair.decodePkcs8(password);
    }

    const result = request.sign(registry, pair);
    const savedExpiry = this.#cachedUnlocks[request.payload.address] || 0;

    if (isSavedPass) {
      this.#cachedUnlocks[request.payload.address] = now + PASSWORD_EXPIRY;
    } else if (savedExpiry < now) {
      this.#cachedUnlocks[request.payload.address] = 0;
      pair.lock();
    }

    resolve({
      id,
      ...result
    });

    return true;
  }

  private signingApproveSignature ({ id, signature }: RequestSigningApproveSignature): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve({ id, signature });

    return true;
  }

  private signingCancel ({ id }: RequestSigningCancel): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Cancelled'));

    return true;
  }

  private signingIsLocked ({ id }: RequestSigningIsLocked): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { request } = queued;
    const pair = keyring.getPair(request.payload.address);

    assert(pair, 'Unable to find pair');

    return pair.isLocked || ((this.#cachedUnlocks[request.payload.address] || 0) < Date.now());
  }

  // FIXME This looks very much like what we have in authorization
  private signingSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(signing.requests)'>(id, port);
    const subscription = this.#state.signSubject.subscribe((requests: SigningRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private windowOpen (path = '/'): boolean {
    console.error('open', `${chrome.extension.getURL('index.html')}#${path}`);

    chrome.tabs.create({
      url: `${chrome.extension.getURL('index.html')}#${path}`
    });

    return true;
  }

  private derive (parentAddress: string, suri: string, password: string, metadata: KeyringPair$Meta): KeyringPair {
    const parentPair = keyring.getPair(parentAddress);

    try {
      parentPair.decodePkcs8(password);
    } catch (e) {
      throw new Error('invalid password');
    }

    try {
      return parentPair.derive(suri, metadata);
    } catch (err) {
      throw new Error(`"${suri}" is not a valid derivation path`);
    }
  }

  private derivationValidate ({ parentAddress, parentPassword, suri }: RequestDeriveValidate): ResponseDeriveValidate {
    const childPair = this.derive(parentAddress, suri, parentPassword, {});

    return {
      address: childPair.address,
      suri
    };
  }

  private derivationCreate ({ genesisHash, name, parentAddress, parentPassword, password, suri }: RequestDeriveCreate): boolean {
    const childPair = this.derive(parentAddress, suri, parentPassword, {
      genesisHash,
      name,
      parentAddress,
      suri
    });

    keyring.addPair(childPair, password);

    return true;
  }

  // Weird thought, the eslint override is not needed in Tabs
  // eslint-disable-next-line @typescript-eslint/require-await
  public async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case 'pri(authorize.approve)':
        return this.authorizeApprove(request as RequestAuthorizeApprove);

      case 'pri(authorize.reject)':
        return this.authorizeReject(request as RequestAuthorizeReject);

      case 'pri(authorize.requests)':
        return this.authorizeSubscribe(id, port);

      case 'pri(accounts.create.external)':
        return this.accountsCreateExternal(request as RequestAccountCreateExternal);

      case 'pri(accounts.create.suri)':
        return this.accountsCreateSuri(request as RequestAccountCreateSuri);

      case 'pri(accounts.changePassword)':
        return this.accountsChangePassword(request as RequestAccountChangePassword);

      case 'pri(accounts.edit)':
        return this.accountsEdit(request as RequestAccountEdit);

      case 'pri(accounts.export)':
        return this.accountsExport(request as RequestAccountExport);

      case 'pri(accounts.forget)':
        return this.accountsForget(request as RequestAccountForget);

      case 'pri(accounts.show)':
        return this.accountsShow(request as RequestAccountShow);

      case 'pri(accounts.subscribe)':
        return this.accountsSubscribe(id, port);

      case 'pri(accounts.tie)':
        return this.accountsTie(request as RequestAccountTie);

      case 'pri(accounts.validate)':
        return this.accountsValidate(request as RequestAccountValidate);

      case 'pri(metadata.approve)':
        return this.metadataApprove(request as RequestMetadataApprove);

      case 'pri(metadata.get)':
        return this.metadataGet(request as string);

      case 'pri(metadata.list)':
        return this.metadataList();

      case 'pri(metadata.reject)':
        return this.metadataReject(request as RequestMetadataReject);

      case 'pri(metadata.requests)':
        return this.metadataSubscribe(id, port);

      case 'pri(derivation.create)':
        return this.derivationCreate(request as RequestDeriveCreate);

      case 'pri(derivation.validate)':
        return this.derivationValidate(request as RequestDeriveValidate);

      case 'pri(json.restore)':
        return this.jsonRestore(request as RequestJsonRestore);

      case 'pri(json.verify.file)':
        return this.jsonVerifyFile(request as RequestJsonRestore);

      case 'pri(json.verify.password)':
        return this.jsonVerifyPassword(request as string);

      case 'pri(seed.create)':
        return this.seedCreate(request as RequestSeedCreate);

      case 'pri(seed.validate)':
        return this.seedValidate(request as RequestSeedValidate);

      case 'pri(signing.approve.password)':
        return this.signingApprovePassword(request as RequestSigningApprovePassword);

      case 'pri(signing.approve.signature)':
        return this.signingApproveSignature(request as RequestSigningApproveSignature);

      case 'pri(signing.cancel)':
        return this.signingCancel(request as RequestSigningCancel);

      case 'pri(signing.isLocked)':
        return this.signingIsLocked(request as RequestSigningIsLocked);

      case 'pri(signing.requests)':
        return this.signingSubscribe(id, port);

      case 'pri(window.open)':
        return this.windowOpen();

      case 'pri(window.open.json)':
        return this.windowOpen('/account/restore-json');

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
