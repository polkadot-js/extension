// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AllowedPath, AuthorizeRequest, MessageTypes, MessageTypesWithNoSubscriptions, MessageTypesWithNullRequest, MessageTypesWithSubscriptions, MetadataRequest, RequestTypes, ResponseAuthorizeList, ResponseDeriveValidate, ResponseJsonGetAccountInfo, ResponseSigningIsLocked, ResponseTypes, SeedLengths, SigningRequest, SubscriptionMessageTypes } from '@subwallet/extension-base/background/types';
import type { Message } from '@subwallet/extension-base/types';
import type { Chain } from '@subwallet/extension-chains/types';
import type { KeyringPair$Json } from '@polkadot/keyring/types';
import type { KeyringPairs$Json } from '@polkadot/ui-keyring/types';
import type { HexString } from '@polkadot/util/types';
import type { KeypairType } from '@polkadot/util-crypto/types';

import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { AccountsWithCurrentAddress, BalanceJson, ChainRegistry, CrowdloanJson, CurrentAccountInfo, CustomEvmToken, DeleteEvmTokenParams, DisableNetworkResponse, EvmNftSubmitTransaction, EvmNftTransaction, EvmNftTransactionRequest, EvmTokenJson, NetworkJson, NftCollectionJson, NftJson, NftTransactionResponse, NftTransferExtra, OptionInputAddress, PriceJson, RequestCheckTransfer, RequestFreeBalance, RequestNftForceUpdate, RequestSettingsType, RequestSubscribeBalance, RequestSubscribeBalancesVisibility, RequestSubscribeCrowdloan, RequestSubscribeNft, RequestSubscribePrice, RequestSubscribeStaking, RequestSubscribeStakingReward, RequestTransfer, RequestTransferCheckReferenceCount, RequestTransferCheckSupporting, RequestTransferExistentialDeposit, ResponseAccountCreateSuriV2, ResponseCheckTransfer, ResponsePrivateKeyValidateV2, ResponseSeedCreateV2, ResponseSeedValidateV2, ResponseSettingsType, ResponseTransfer, StakingJson, StakingRewardJson, SubstrateNftSubmitTransaction, SubstrateNftTransaction, SubstrateNftTransactionRequest, SupportTransferResponse, ThemeTypes, TransactionHistoryItemType, TransferError, ValidateEvmTokenRequest, ValidateNetworkResponse } from '@subwallet/extension-base/background/KoniTypes';
import { RequestCurrentAccountAddress } from '@subwallet/extension-base/background/types';
import { PORT_EXTENSION } from '@subwallet/extension-base/defaults';
import { getId } from '@subwallet/extension-base/utils/getId';
import { metadataExpand } from '@subwallet/extension-chains';
import { MetadataDef } from '@subwallet/extension-inject/types';

import { SingleAddress } from '@polkadot/ui-keyring/observable/types';

import { _getKnownHashes } from './util/defaultChains';
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

function sendMessage<TMessageType extends MessageTypesWithNullRequest> (message: TMessageType): Promise<ResponseTypes[TMessageType]>;
function sendMessage<TMessageType extends MessageTypesWithNoSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType]): Promise<ResponseTypes[TMessageType]>;
function sendMessage<TMessageType extends MessageTypesWithSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType], subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): Promise<ResponseTypes[TMessageType]>;
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

export async function saveCurrentAccountAddress (data: RequestCurrentAccountAddress, callback: (data: CurrentAccountInfo) => void): Promise<boolean> {
  return sendMessage('pri(currentAccount.saveAddress)', data, callback);
}

export async function toggleBalancesVisibility (callback: (data: RequestSettingsType) => void): Promise<boolean> {
  return sendMessage('pri(currentAccount.changeBalancesVisibility)', null, callback);
}

export async function saveAccountAllLogo (accountAllLogo: string, callback: (data: RequestSettingsType) => void): Promise<boolean> {
  return sendMessage('pri(currentAccount.saveAccountAllLogo)', accountAllLogo, callback);
}

export async function saveTheme (theme: ThemeTypes, callback: (data: RequestSettingsType) => void): Promise<boolean> {
  return sendMessage('pri(currentAccount.saveTheme)', theme, callback);
}

export async function subscribeSettings (data: RequestSubscribeBalancesVisibility, callback: (data: ResponseSettingsType) => void): Promise<ResponseSettingsType> {
  return sendMessage('pri(currentAccount.subscribeSettings)', data, callback);
}

export async function tieAccount (address: string, genesisHash: string | null): Promise<boolean> {
  return sendMessage('pri(accounts.tie)', { address, genesisHash });
}

export async function exportAccount (address: string, password: string): Promise<{ exportedJson: KeyringPair$Json }> {
  return sendMessage('pri(accounts.export)', { address, password });
}

export async function exportAccountPrivateKey (address: string, password: string): Promise<{ privateKey: string }> {
  return sendMessage('pri(accounts.exportPrivateKey)', { address, password });
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

export async function approveAuthRequestV2 (id: string, accounts: string[]): Promise<boolean> {
  return sendMessage('pri(authorize.approveV2)', { id, accounts });
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

export async function createAccountSuriV2 (name: string, password: string, suri: string, isAllowed: boolean, types?: Array<KeypairType>, genesisHash?: string): Promise<ResponseAccountCreateSuriV2> {
  return sendMessage('pri(accounts.create.suriV2)', { genesisHash, name, password, suri, types, isAllowed });
}

export async function createSeed (length?: SeedLengths, seed?: string, type?: KeypairType): Promise<{ address: string; seed: string }> {
  return sendMessage('pri(seed.create)', { length, seed, type });
}

export async function createSeedV2 (length?: SeedLengths, seed?: string, types?: Array<KeypairType>): Promise<ResponseSeedCreateV2> {
  return sendMessage('pri(seed.createV2)', { length, seed, types });
}

export async function getAllMetatdata (): Promise<MetadataDef[]> {
  return sendMessage('pri(metadata.list)');
}

export async function getMetadata (genesisHash?: string | null, isPartial = false): Promise<Chain | null> {
  if (!genesisHash) {
    return null;
  }

  const chains = await getNetworkMap();
  const parsedChains = _getKnownHashes(chains);

  let request = getSavedMeta(genesisHash);

  if (!request) {
    request = sendMessage('pri(metadata.get)', genesisHash || null);
    setSavedMeta(genesisHash, request);
  }

  const def = await request;

  if (def) {
    return metadataExpand(def, isPartial);
  } else if (isPartial) {
    const chain = parsedChains.find((chain) => chain.genesisHash === genesisHash);

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

export async function rejectAuthRequestV2 (id: string): Promise<boolean> {
  return sendMessage('pri(authorize.rejectV2)', { id });
}

export async function rejectMetaRequest (id: string): Promise<boolean> {
  return sendMessage('pri(metadata.reject)', { id });
}

export async function subscribeAccounts (cb: (accounts: AccountJson[]) => void): Promise<boolean> {
  return sendMessage('pri(accounts.subscribe)', null, cb);
}

export async function subscribeAccountsWithCurrentAddress (cb: (data: AccountsWithCurrentAddress) => void): Promise<boolean> {
  return sendMessage('pri(accounts.subscribeWithCurrentAddress)', null, cb);
}

export async function subscribeAccountsInputAddress (cb: (data: OptionInputAddress) => void): Promise<string> {
  return sendMessage('pri(accounts.subscribeAccountsInputAddress)', null, cb);
}

export async function saveRecentAccountId (accountId: string): Promise<SingleAddress> {
  return sendMessage('pri(accounts.saveRecent)', { accountId });
}

export async function triggerAccountsSubscription (): Promise<boolean> {
  return sendMessage('pri(accounts.triggerSubscription)');
}

export async function subscribeAuthorizeRequests (cb: (accounts: AuthorizeRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(authorize.requests)', null, cb);
}

export async function subscribeAuthorizeRequestsV2 (cb: (accounts: AuthorizeRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(authorize.requestsV2)', null, cb);
}

export async function getAuthList (): Promise<ResponseAuthorizeList> {
  return sendMessage('pri(authorize.list)');
}

export async function getAuthListV2 (): Promise<ResponseAuthorizeList> {
  return sendMessage('pri(authorize.listV2)');
}

export async function toggleAuthorization (url: string): Promise<ResponseAuthorizeList> {
  return sendMessage('pri(authorize.toggle)', url);
}

export async function changeAuthorizationAll (connectValue: boolean, callback: (data: AuthUrls) => void): Promise<boolean> {
  return sendMessage('pri(authorize.changeSiteAll)', { connectValue }, callback);
}

export async function changeAuthorization (connectValue: boolean, url: string, callback: (data: AuthUrls) => void): Promise<boolean> {
  return sendMessage('pri(authorize.changeSite)', { url, connectValue }, callback);
}

export async function changeAuthorizationPerAcc (address: string, connectValue: boolean, url: string, callback: (data: AuthUrls) => void): Promise<boolean> {
  return sendMessage('pri(authorize.changeSitePerAccount)', { address, url, connectValue }, callback);
}

export async function forgetSite (url: string, callback: (data: AuthUrls) => void): Promise<boolean> {
  return sendMessage('pri(authorize.forgetSite)', { url }, callback);
}

export async function forgetAllSite (callback: (data: AuthUrls) => void): Promise<boolean> {
  return sendMessage('pri(authorize.forgetAllSite)', null, callback);
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

export async function validateSeedV2 (suri: string, types: Array<KeypairType>): Promise<ResponseSeedValidateV2> {
  return sendMessage('pri(seed.validateV2)', { suri, types });
}

export async function validateMetamaskPrivateKeyV2 (suri: string, types: Array<KeypairType>): Promise<ResponsePrivateKeyValidateV2> {
  return sendMessage('pri(privateKey.validateV2)', { suri, types });
}

export async function validateDerivationPath (parentAddress: string, suri: string, parentPassword: string): Promise<ResponseDeriveValidate> {
  return sendMessage('pri(derivation.validate)', { parentAddress, parentPassword, suri });
}

export async function deriveAccount (parentAddress: string, suri: string, parentPassword: string, name: string, password: string, genesisHash: string | null): Promise<boolean> {
  return sendMessage('pri(derivation.create)', { genesisHash, name, parentAddress, parentPassword, password, suri });
}

export async function deriveAccountV2 (parentAddress: string, suri: string, parentPassword: string, name: string, password: string, genesisHash: string | null, isAllowed: boolean): Promise<boolean> {
  return sendMessage('pri(derivation.createV2)', { genesisHash, name, parentAddress, parentPassword, password, suri, isAllowed });
}

export async function windowOpen (path: AllowedPath): Promise<boolean> {
  return sendMessage('pri(window.open)', path);
}

export async function jsonGetAccountInfo (json: KeyringPair$Json): Promise<ResponseJsonGetAccountInfo> {
  return sendMessage('pri(json.account.info)', json);
}

export async function jsonRestore (file: KeyringPair$Json, password: string, address: string): Promise<void> {
  return sendMessage('pri(json.restore)', { file, password, address });
}

export async function batchRestore (file: KeyringPairs$Json, password: string, address: string): Promise<void> {
  return sendMessage('pri(json.batchRestore)', { file, password, address });
}

export async function jsonRestoreV2 (file: KeyringPair$Json, password: string, address: string, isAllowed: boolean): Promise<void> {
  return sendMessage('pri(json.restoreV2)', { file, password, address, isAllowed });
}

export async function batchRestoreV2 (file: KeyringPairs$Json, password: string, accountsInfo: ResponseJsonGetAccountInfo[], isAllowed: boolean): Promise<void> {
  return sendMessage('pri(json.batchRestoreV2)', { file, password, accountsInfo, isAllowed });
}

export async function setNotification (notification: string): Promise<boolean> {
  return sendMessage('pri(settings.notification)', notification);
}

export async function getPrice (): Promise<PriceJson> {
  return sendMessage('pri(price.getPrice)', null);
}

export async function subscribePrice (request: RequestSubscribePrice, callback: (priceData: PriceJson) => void): Promise<PriceJson> {
  return sendMessage('pri(price.getSubscription)', request, callback);
}

export async function getBalance (): Promise<BalanceJson> {
  return sendMessage('pri(balance.getBalance)', null);
}

export async function subscribeBalance (request: RequestSubscribeBalance, callback: (balanceData: BalanceJson) => void): Promise<BalanceJson> {
  return sendMessage('pri(balance.getSubscription)', request, callback);
}

export async function getCrowdloan (): Promise<CrowdloanJson> {
  return sendMessage('pri(crowdloan.getCrowdloan)', null);
}

export async function subscribeCrowdloan (request: RequestSubscribeCrowdloan, callback: (crowdloanData: CrowdloanJson) => void): Promise<CrowdloanJson> {
  return sendMessage('pri(crowdloan.getSubscription)', request, callback);
}

export async function subscribeChainRegistry (callback: (map: Record<string, ChainRegistry>) => void): Promise<Record<string, ChainRegistry>> {
  return sendMessage('pri(chainRegistry.getSubscription)', null, callback);
}

export async function subscribeHistory (callback: (historyMap: Record<string, TransactionHistoryItemType[]>) => void): Promise<Record<string, TransactionHistoryItemType[]>> {
  return sendMessage('pri(transaction.history.getSubscription)', null, callback);
}

export async function updateTransactionHistory (address: string, networkKey: string, item: TransactionHistoryItemType, callback: (items: TransactionHistoryItemType[]) => void): Promise<boolean> {
  return sendMessage('pri(transaction.history.add)', { address, networkKey, item }, callback);
}

export async function getNft (account: string): Promise<NftJson> {
  // @ts-ignore
  return sendMessage('pri(nft.getNft)', account);
}

export async function subscribeNft (request: RequestSubscribeNft, callback: (nftData: NftJson) => void): Promise<NftJson> {
  return sendMessage('pri(nft.getSubscription)', request, callback);
}

export async function subscribeNftCollection (callback: (data: NftCollectionJson) => void): Promise<NftCollectionJson> {
  return sendMessage('pri(nftCollection.getSubscription)', null, callback);
}

export async function getStaking (account: string): Promise<StakingJson> {
  // @ts-ignore
  return sendMessage('pri(staking.getStaking)', account);
}

export async function subscribeStaking (request: RequestSubscribeStaking, callback: (stakingData: StakingJson) => void): Promise<StakingJson> {
  return sendMessage('pri(staking.getSubscription)', request, callback);
}

export async function getStakingReward (): Promise<StakingRewardJson> {
  return sendMessage('pri(stakingReward.getStakingReward)');
}

export async function subscribeStakingReward (request: RequestSubscribeStakingReward, callback: (stakingRewardData: StakingRewardJson) => void): Promise<StakingRewardJson> {
  return sendMessage('pri(stakingReward.getSubscription)', request, callback);
}

export async function nftForceUpdate (request: RequestNftForceUpdate): Promise<boolean> {
  return sendMessage('pri(nft.forceUpdate)', request);
}

export async function getNftTransfer (): Promise<NftTransferExtra> {
  return sendMessage('pri(nftTransfer.getNftTransfer)', null);
}

export async function subscribeNftTransfer (callback: (data: NftTransferExtra) => void): Promise<NftTransferExtra> {
  return sendMessage('pri(nftTransfer.getSubscription)', null, callback);
}

export async function setNftTransfer (request: NftTransferExtra): Promise<boolean> {
  return sendMessage('pri(nftTransfer.setNftTransfer)', request);
}

export async function checkTransfer (request: RequestCheckTransfer): Promise<ResponseCheckTransfer> {
  return sendMessage('pri(accounts.checkTransfer)', request);
}

export async function makeTransfer (request: RequestTransfer, callback: (data: ResponseTransfer) => void): Promise<Array<TransferError>> {
  return sendMessage('pri(accounts.transfer)', request, callback);
}

export async function evmNftGetTransaction (request: EvmNftTransactionRequest): Promise<EvmNftTransaction> {
  return sendMessage('pri(evmNft.getTransaction)', request);
}

export async function evmNftSubmitTransaction (request: EvmNftSubmitTransaction, callback: (data: NftTransactionResponse) => void): Promise<NftTransactionResponse> {
  return sendMessage('pri(evmNft.submitTransaction)', request, callback);
}

export async function subscribeNetworkMap (callback: (data: Record<string, NetworkJson>) => void): Promise<Record<string, NetworkJson>> {
  return sendMessage('pri(networkMap.getSubscription)', null, callback);
}

export async function upsertNetworkMap (data: NetworkJson): Promise<boolean> {
  return sendMessage('pri(networkMap.upsert)', data);
}

export async function getNetworkMap (): Promise<Record<string, NetworkJson>> {
  return sendMessage('pri(networkMap.getNetworkMap)');
}

export async function removeNetworkMap (networkKey: string): Promise<boolean> {
  return sendMessage('pri(networkMap.removeOne)', networkKey);
}

export async function disableNetworkMap (networkKey: string): Promise<DisableNetworkResponse> {
  return sendMessage('pri(networkMap.disableOne)', networkKey);
}

export async function enableNetworkMap (networkKey: string): Promise<boolean> {
  return sendMessage('pri(networkMap.enableOne)', networkKey);
}

export async function validateNetwork (provider: string, isEthereum: boolean, existedNetwork?: NetworkJson): Promise<ValidateNetworkResponse> {
  return sendMessage('pri(apiMap.validate)', { provider, isEthereum, existedNetwork });
}

export async function disableAllNetwork (): Promise<boolean> {
  return sendMessage('pri(networkMap.disableAll)', null);
}

export async function enableAllNetwork (): Promise<boolean> {
  return sendMessage('pri(networkMap.enableAll)', null);
}

export async function resetDefaultNetwork (): Promise<boolean> {
  return sendMessage('pri(networkMap.resetDefault)', null);
}

export async function subscribeEvmToken (callback: (data: EvmTokenJson) => void): Promise<EvmTokenJson> {
  return sendMessage('pri(evmTokenState.getSubscription)', null, callback);
}

export async function getEvmTokenState (): Promise<EvmTokenJson> {
  return sendMessage('pri(evmTokenState.getEvmTokenState)', null);
}

export async function upsertEvmToken (data: CustomEvmToken): Promise<boolean> {
  return sendMessage('pri(evmTokenState.upsertEvmTokenState)', data);
}

export async function deleteEvmTokens (data: DeleteEvmTokenParams[]) {
  return sendMessage('pri(evmTokenState.deleteMany)', data);
}

export async function validateEvmToken (data: ValidateEvmTokenRequest) {
  return sendMessage('pri(evmTokenState.validateEvmToken)', data);
}

export async function transferCheckReferenceCount (request: RequestTransferCheckReferenceCount): Promise<boolean> {
  return sendMessage('pri(transfer.checkReferenceCount)', request);
}

export async function transferCheckSupporting (request: RequestTransferCheckSupporting): Promise<SupportTransferResponse> {
  return sendMessage('pri(transfer.checkSupporting)', request);
}

export async function transferGetExistentialDeposit (request: RequestTransferExistentialDeposit): Promise<string> {
  return sendMessage('pri(transfer.getExistentialDeposit)', request);
}

export async function cancelSubscription (request: string): Promise<boolean> {
  return sendMessage('pri(subscription.cancel)', request);
}

export async function subscribeFreeBalance (request: RequestFreeBalance, callback: (balance: string) => void): Promise<string> {
  return sendMessage('pri(freeBalance.subscribe)', request, callback);
}

export async function substrateNftGetTransaction (request: SubstrateNftTransactionRequest): Promise<SubstrateNftTransaction> {
  return sendMessage('pri(substrateNft.getTransaction)', request);
}

export async function substrateNftSubmitTransaction (request: SubstrateNftSubmitTransaction, callback: (data: NftTransactionResponse) => void): Promise<NftTransactionResponse> {
  return sendMessage('pri(substrateNft.submitTransaction)', request, callback);
}

export async function recoverDotSamaApi (request: string): Promise<boolean> {
  return sendMessage('pri(networkMap.recoverDotSama)', request);
}
