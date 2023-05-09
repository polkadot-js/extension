// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthRequestV2, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationsQueueItemOptions, ConfirmationType, RequestConfirmationComplete } from '@subwallet/extension-base/background/KoniTypes';
import { AccountAuthType, AccountJson, AuthorizeRequest, MetadataRequest, RequestAuthorizeTab, RequestSign, ResponseSigning, SigningRequest } from '@subwallet/extension-base/background/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { KeyringService } from '@subwallet/extension-base/services/keyring-service';
import AuthRequestHandler from '@subwallet/extension-base/services/request-service/handler/AuthRequestHandler';
import EvmRequestHandler from '@subwallet/extension-base/services/request-service/handler/EvmRequestHandler';
import MetadataRequestHandler from '@subwallet/extension-base/services/request-service/handler/MetadataRequestHandler';
import PopupHandler from '@subwallet/extension-base/services/request-service/handler/PopupHandler';
import SubstrateRequestHandler from '@subwallet/extension-base/services/request-service/handler/SubstrateRequestHandler';
import { AuthUrls, MetaRequest } from '@subwallet/extension-base/services/request-service/types';
import SettingService from '@subwallet/extension-base/services/setting-service/SettingService';
import { MetadataDef } from '@subwallet/extension-inject/types';
import { BehaviorSubject, Subject } from 'rxjs';

import { SignerPayloadJSON } from '@polkadot/types/types/extrinsic';

export default class RequestService {
  // Common
  readonly #chainService: ChainService;
  readonly settingService: SettingService;
  readonly #popupHandler: PopupHandler;
  readonly #metadataRequestHandler: MetadataRequestHandler;
  readonly #authRequestHandler: AuthRequestHandler;
  readonly #substrateRequestHandler: SubstrateRequestHandler;
  readonly #evmRequestHandler: EvmRequestHandler;

  // Common
  constructor (chainService: ChainService, settingService: SettingService, private keyringService: KeyringService) {
    this.#chainService = chainService;
    this.settingService = settingService;
    this.#popupHandler = new PopupHandler(this);
    this.#metadataRequestHandler = new MetadataRequestHandler(this);
    this.#authRequestHandler = new AuthRequestHandler(this, this.#chainService, this.keyringService);
    this.#substrateRequestHandler = new SubstrateRequestHandler(this);
    this.#evmRequestHandler = new EvmRequestHandler(this);

    // Reset icon on start service
    this.updateIconV2();
  }

  public get numAllRequests () {
    return this.allSubstrateRequests.length + this.numEvmRequests;
  }

  public updateIconV2 (shouldClose?: boolean): void {
    this.#popupHandler.updateIconV2(shouldClose);
  }

  getAddressList (value = false): Record<string, boolean> {
    const addressList = Object.keys(this.keyringService.accounts);

    return addressList.reduce((addressList, v) => ({ ...addressList, [v]: value }), {});
  }

  // Popup
  public get popup () {
    return this.#popupHandler.popup;
  }

  public popupClose (): void {
    this.#popupHandler.popupClose();
  }

  public popupOpen (): void {
    // Not open new popup and use existed
    const popupList = this.#popupHandler.popup;

    if (popupList && popupList.length > 0) {
      chrome.windows.update(popupList[0], { focused: true })?.catch(console.error);
    } else {
      this.#popupHandler.popupOpen();
    }
  }

  // Metadata
  public get metaSubject (): BehaviorSubject<MetadataRequest[]> {
    return this.#metadataRequestHandler.metaSubject;
  }

  public get knownMetadata (): MetadataDef[] {
    return this.#metadataRequestHandler.knownMetadata;
  }

  public get numMetaRequests (): number {
    return this.#metadataRequestHandler.numMetaRequests;
  }

  public injectMetadata (url: string, request: MetadataDef): Promise<boolean> {
    return this.#metadataRequestHandler.injectMetadata(url, request);
  }

  public getMetaRequest (id: string): MetaRequest {
    return this.#metadataRequestHandler.getMetaRequest(id);
  }

  public saveMetadata (meta: MetadataDef): void {
    this.#metadataRequestHandler.saveMetadata(meta);
  }

  // Auth
  public get authSubjectV2 (): BehaviorSubject<AuthorizeRequest[]> {
    return this.#authRequestHandler.authSubjectV2;
  }

  public get numAuthRequests (): number {
    return this.#authRequestHandler.numAuthRequestsV2;
  }

  public setAuthorize (data: AuthUrls, callback?: () => void): void {
    this.#authRequestHandler.setAuthorize(data, callback);
  }

  public getAuthorize (update: (value: AuthUrls) => void): void {
    this.#authRequestHandler.getAuthorize(update);
  }

  public getAuthList (): Promise<AuthUrls> {
    return this.#authRequestHandler.getAuthList();
  }

  public async authorizeUrlV2 (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    return this.#authRequestHandler.authorizeUrlV2(url, request);
  }

  public getAuthRequestV2 (id: string): AuthRequestV2 {
    return this.#authRequestHandler.getAuthRequestV2(id);
  }

  public getDAppChainInfo (options: {accessType: AccountAuthType, autoActive?: boolean, defaultChain?: string, url?: string}) {
    return this.#authRequestHandler.getDAppChainInfo(options);
  }

  public get subscribeEvmChainChange (): Subject<AuthUrls> {
    return this.#authRequestHandler.subscribeEvmChainChange;
  }

  public get subscribeAuthorizeUrlSubject (): Subject<AuthUrls> {
    return this.#authRequestHandler.subscribeAuthorizeUrlSubject;
  }

  public ensureUrlAuthorizedV2 (url: string): Promise<boolean> {
    return this.#authRequestHandler.ensureUrlAuthorizedV2(url);
  }

  // Substrate requests
  public get signSubject (): BehaviorSubject<SigningRequest[]> {
    return this.#substrateRequestHandler.signSubject;
  }

  public get allSubstrateRequests (): SigningRequest[] {
    return this.#substrateRequestHandler.allSubstrateRequests;
  }

  public sign (url: string, request: RequestSign, account: AccountJson): Promise<ResponseSigning> {
    return this.#substrateRequestHandler.sign(url, request, account);
  }

  public get numSubstrateRequests (): number {
    return this.#substrateRequestHandler.numSubstrateRequests;
  }

  // Evm requests
  public get numEvmRequests (): number {
    return this.#evmRequestHandler.numEvmRequests;
  }

  public get confirmationsQueueSubject (): BehaviorSubject<ConfirmationsQueue> {
    return this.#evmRequestHandler.getConfirmationsQueueSubject();
  }

  public getSignRequest (id: string) {
    return this.#substrateRequestHandler.getSignRequest(id);
  }

  public async signInternalTransaction (id: string, address: string, url: string, payload: SignerPayloadJSON): Promise<ResponseSigning> {
    return this.#substrateRequestHandler.signTransaction(id, address, url, payload);
  }

  public addConfirmation<CT extends ConfirmationType> (
    id: string,
    url: string,
    type: CT,
    payload: ConfirmationDefinitions[CT][0]['payload'],
    options: ConfirmationsQueueItemOptions = {},
    validator?: (input: ConfirmationDefinitions[CT][1]) => Error | undefined
  ): Promise<ConfirmationDefinitions[CT][1]> {
    return this.#evmRequestHandler.addConfirmation(id, url, type, payload, options, validator);
  }

  public async completeConfirmation (request: RequestConfirmationComplete): Promise<boolean> {
    return await this.#evmRequestHandler.completeConfirmation(request);
  }

  // General methods
  public get numRequests (): number {
    return this.numMetaRequests + this.numAuthRequests + this.numSubstrateRequests + this.numEvmRequests;
  }

  public resetWallet (): void {
    this.#authRequestHandler.resetWallet();
    this.#substrateRequestHandler.resetWallet();
    this.#evmRequestHandler.resetWallet();
    this.#metadataRequestHandler.resetWallet();
  }
}
