// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthRequestV2, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationsQueueItemOptions, ConfirmationType, RequestConfirmationComplete } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AuthorizeRequest, MetadataRequest, RequestAuthorizeTab, RequestSign, ResponseSigning } from '@subwallet/extension-base/background/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import AuthRequestHandler from '@subwallet/extension-base/services/request-service/handler/AuthRequestHandler';
import EvmRequestHandler from '@subwallet/extension-base/services/request-service/handler/EvmRequestHandler';
import MetadataRequestHandler from '@subwallet/extension-base/services/request-service/handler/MetadataRequestHandler';
import PopupHandler from '@subwallet/extension-base/services/request-service/handler/PopupHandler';
import SubstrateRequestHandler from '@subwallet/extension-base/services/request-service/handler/SubstrateRequestHandler';
import { AuthUrls, MetaRequest, SigningRequest, SignRequest } from '@subwallet/extension-base/services/request-service/types';
import { MetadataDef } from '@subwallet/extension-inject/types';
import { accounts } from '@subwallet/ui-keyring/observable/accounts';
import { BehaviorSubject, Subject } from 'rxjs';

export default class RequestService {
  // Common
  readonly #chainService: ChainService;
  readonly #popupHandler: PopupHandler;
  readonly #metadataRequestHandler: MetadataRequestHandler;
  readonly #authRequestHandler: AuthRequestHandler;
  readonly #substrateRequestHandler: SubstrateRequestHandler;
  readonly #evmRequestHandler: EvmRequestHandler;

  // Common
  constructor (chainService: ChainService) {
    this.#chainService = chainService;
    this.#popupHandler = new PopupHandler(this);
    this.#metadataRequestHandler = new MetadataRequestHandler(this);
    this.#authRequestHandler = new AuthRequestHandler(this, this.#chainService);
    this.#substrateRequestHandler = new SubstrateRequestHandler(this);
    this.#evmRequestHandler = new EvmRequestHandler(this);
  }

  public get numAllRequests () {
    return this.allSubstrateRequests.length + this.numEvmRequests;
  }

  public updateIconV2 (shouldClose?: boolean): void {
    this.#popupHandler.updateIconV2(shouldClose);
  }

  getAddressList (value = false): Record<string, boolean> {
    const addressList = Object.keys(accounts.subject.value);

    return addressList.reduce((addressList, v) => ({ ...addressList, [v]: value }), {});
  }

  // Popup

  public setNotification (notification: string): boolean {
    this.#popupHandler.setNotification(notification);

    return true;
  }

  public get popup () {
    return this.#popupHandler.popup;
  }

  public popupClose (): void {
    this.#popupHandler.popupClose();
  }

  public popupOpen (): void {
    this.#popupHandler.popupOpen();
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

  public getSignRequest (id: string): SignRequest {
    return this.#substrateRequestHandler.getSignRequest(id);
  }

  // Evm requests
  public get numEvmRequests (): number {
    return this.#evmRequestHandler.numEvmRequests;
  }

  public get confirmationsQueueSubject (): BehaviorSubject<ConfirmationsQueue> {
    return this.#evmRequestHandler.getConfirmationsQueueSubject();
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

  public completeConfirmation (request: RequestConfirmationComplete): boolean {
    return this.#evmRequestHandler.completeConfirmation(request);
  }
}
