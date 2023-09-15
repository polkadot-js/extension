// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AuthorizeRequest, MetadataRequest, ResponseAuthorizeList, ResponseDeriveValidate, ResponseJsonGetAccountInfo, ResponseSigningIsLocked, SigningRequest, WindowOpenParams } from '@subwallet/extension-base/background/types';
import type { KeyringPair$Json } from '@subwallet/keyring/types';
import type { KeyringPairs$Json } from '@subwallet/ui-keyring/types';
import type { HexString } from '@polkadot/util/types';

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { AccountsWithCurrentAddress, AllLogoMap, AmountData, AssetSettingUpdateReq, BalanceJson, ChainStakingMetadata, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationType, CronReloadRequest, CrowdloanJson, KeyringState, MantaPayConfig, MantaPayEnableParams, MantaPaySyncState, NftCollection, NftJson, NftTransactionRequest, NominationPoolInfo, NominatorMetadata, Notification, OptionInputAddress, PriceJson, RequestAccountMeta, RequestAuthorizationBlock, RequestAuthorizationPerSite, RequestBondingSubmit, RequestChangeMasterPassword, RequestCrossChainTransfer, RequestDeriveCreateMultiple, RequestDeriveCreateV3, RequestDeriveValidateV2, RequestFreeBalance, RequestGetDeriveAccounts, RequestGetTransaction, RequestJsonRestoreV2, RequestKeyringExportMnemonic, RequestMaxTransferable, RequestMigratePassword, RequestParseEvmContractInput, RequestParseTransactionSubstrate, RequestQrSignEvm, RequestQrSignSubstrate, RequestResetWallet, RequestSigningApprovePasswordV2, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestStakePoolingBonding, RequestStakePoolingUnbonding, RequestStakeWithdrawal, RequestSubscribeBalance, RequestSubscribeCrowdloan, RequestSubscribeNft, RequestSubscribePrice, RequestSubscribeStaking, RequestSubscribeStakingReward, RequestTransfer, RequestTransferCheckReferenceCount, RequestTransferCheckSupporting, RequestTransferExistentialDeposit, RequestTuringCancelStakeCompound, RequestTuringStakeCompound, RequestUnbondingSubmit, RequestUnlockKeyring, ResolveAddressToDomainRequest, ResolveDomainRequest, ResponseAccountIsLocked, ResponseAccountMeta, ResponseChangeMasterPassword, ResponseDeriveValidateV2, ResponseGetDeriveAccounts, ResponseKeyringExportMnemonic, ResponseMigratePassword, ResponseParseEvmContractInput, ResponseParseTransactionSubstrate, ResponseQrParseRLP, ResponseQrSignEvm, ResponseQrSignSubstrate, ResponseResetWallet, ResponseUnlockKeyring, StakingJson, StakingRewardJson, StakingType, SupportTransferResponse, TransactionHistoryItem, ValidateNetworkResponse, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountExternalError, AccountsWithCurrentAddress, AllLogoMap, AmountData, AssetSettingUpdateReq, BalanceJson, BrowserConfirmationType, ChainStakingMetadata, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationType, CronReloadRequest, CrowdloanJson, CurrentAccountInfo, KeyringState, LanguageType, MantaPayConfig, MantaPayEnableParams, MantaPaySyncState, NftCollection, NftJson, NftTransactionRequest, NominationPoolInfo, NominatorMetadata, Notification, OptimalYieldPathRequest, OptionInputAddress, PriceJson, RequestAccountCreateExternalV2, RequestAccountCreateHardwareMultiple, RequestAccountCreateHardwareV2, RequestAccountCreateSuriV2, RequestAccountCreateWithSecretKey, RequestAccountMeta, RequestApproveConnectWalletSession, RequestApproveWalletConnectNotSupport, RequestAuthorizationBlock, RequestAuthorizationPerSite, RequestBondingSubmit, RequestChangeMasterPassword, RequestConnectWalletConnect, RequestCrossChainTransfer, RequestDeriveCreateMultiple, RequestDeriveCreateV3, RequestDeriveValidateV2, RequestFreeBalance, RequestGetDeriveAccounts, RequestGetTransaction, RequestJsonRestoreV2, RequestKeyringExportMnemonic, RequestMaxTransferable, RequestMigratePassword, RequestParseEvmContractInput, RequestParseTransactionSubstrate, RequestQrSignEvm, RequestQrSignSubstrate, RequestRejectConnectWalletSession, RequestRejectWalletConnectNotSupport, RequestResetWallet, RequestSettingsType, RequestSigningApprovePasswordV2, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestStakePoolingBonding, RequestStakePoolingUnbonding, RequestStakeWithdrawal, RequestSubscribeBalance, RequestSubscribeBalancesVisibility, RequestSubscribeCrowdloan, RequestSubscribeNft, RequestSubscribePrice, RequestSubscribeStaking, RequestSubscribeStakingReward, RequestTransfer, RequestTransferCheckReferenceCount, RequestTransferCheckSupporting, RequestTransferExistentialDeposit, RequestTuringCancelStakeCompound, RequestTuringStakeCompound, RequestUnbondingSubmit, RequestUnlockKeyring, RequestYieldStepSubmit, ResolveAddressToDomainRequest, ResolveDomainRequest, ResponseAccountCreateSuriV2, ResponseAccountCreateWithSecretKey, ResponseAccountExportPrivateKey, ResponseAccountIsLocked, ResponseAccountMeta, ResponseChangeMasterPassword, ResponseCheckPublicAndSecretKey, ResponseDeriveValidateV2, ResponseGetDeriveAccounts, ResponseKeyringExportMnemonic, ResponseMigratePassword, ResponseParseEvmContractInput, ResponseParseTransactionSubstrate, ResponsePrivateKeyValidateV2, ResponseQrParseRLP, ResponseQrSignEvm, ResponseQrSignSubstrate, ResponseResetWallet, ResponseSeedCreateV2, ResponseSeedValidateV2, ResponseUnlockKeyring, StakingJson, StakingRewardJson, StakingType, SupportTransferResponse, ThemeNames, TransactionHistoryItem, UiSettings, ValidateNetworkResponse, ValidatorInfo, WalletUnlockType, YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { RequestCurrentAccountAddress } from '@subwallet/extension-base/background/types';
import { _ChainState, _NetworkUpsertParams, _ValidateCustomAssetRequest, _ValidateCustomAssetResponse } from '@subwallet/extension-base/services/chain-service/types';
import { SWTransactionResponse, SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging/base';

export async function editAccount (address: string, name: string): Promise<boolean> {
  return sendMessage('pri(accounts.edit)', { address, name });
}

export async function showAccount (address: string, isShowing: boolean): Promise<boolean> {
  return sendMessage('pri(accounts.show)', { address, isShowing });
}

export async function tieAccount (address: string, genesisHash: string | null): Promise<boolean> {
  return sendMessage('pri(accounts.tie)', { address, genesisHash });
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

export async function approveSignPasswordV2 (request: RequestSigningApprovePasswordV2): Promise<boolean> {
  return sendMessage('pri(signing.approve.passwordV2)', request);
}

export async function approveSignSignature (id: string, signature: HexString): Promise<boolean> {
  return sendMessage('pri(signing.approve.signature)', { id, signature });
}

export async function rejectAuthRequest (id: string): Promise<boolean> {
  return sendMessage('pri(authorize.reject)', { id });
}

export async function rejectAuthRequestV2 (id: string): Promise<boolean> {
  return sendMessage('pri(authorize.rejectV2)', { id });
}

export async function cancelAuthRequestV2 (id: string): Promise<boolean> {
  return sendMessage('pri(authorize.cancelV2)', { id });
}

export async function rejectMetaRequest (id: string): Promise<boolean> {
  return sendMessage('pri(metadata.reject)', { id });
}

export async function subscribeAccounts (cb: (accounts: AccountJson[]) => void): Promise<AccountJson[]> {
  return sendMessage('pri(accounts.subscribe)', {}, cb);
}

export async function subscribeAccountsWithCurrentAddress (cb: (data: AccountsWithCurrentAddress) => void): Promise<AccountsWithCurrentAddress> {
  return sendMessage('pri(accounts.subscribeWithCurrentAddress)', {}, cb);
}

export async function subscribeAccountsInputAddress (cb: (data: OptionInputAddress) => void): Promise<string> {
  return sendMessage('pri(accounts.subscribeAccountsInputAddress)', {}, cb);
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

export async function changeAuthorizationPerAccount (address: string, connectValue: boolean, url: string, callback: (data: AuthUrls) => void): Promise<boolean> {
  return sendMessage('pri(authorize.changeSitePerAccount)', { address, url, connectValue }, callback);
}

export async function changeAuthorizationPerSite (request: RequestAuthorizationPerSite): Promise<boolean> {
  return sendMessage('pri(authorize.changeSitePerSite)', request);
}

export async function changeAuthorizationBlock (request: RequestAuthorizationBlock): Promise<boolean> {
  return sendMessage('pri(authorize.changeSiteBlock)', request);
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

export async function validateDerivationPath (parentAddress: string, suri: string, parentPassword: string): Promise<ResponseDeriveValidate> {
  return sendMessage('pri(derivation.validate)', { parentAddress, parentPassword, suri });
}

export async function deriveAccount (parentAddress: string, suri: string, parentPassword: string, name: string, password: string, genesisHash: string | null): Promise<boolean> {
  return sendMessage('pri(derivation.create)', { genesisHash, name, parentAddress, parentPassword, password, suri });
}

export async function deriveAccountV2 (parentAddress: string, suri: string, parentPassword: string, name: string, password: string, genesisHash: string | null, isAllowed: boolean): Promise<boolean> {
  return sendMessage('pri(derivation.createV2)', { genesisHash, name, parentAddress, suri, isAllowed });
}

export async function windowOpen (params: WindowOpenParams): Promise<boolean> {
  return sendMessage('pri(window.open)', params);
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

export async function jsonRestoreV2 (request: RequestJsonRestoreV2): Promise<void> {
  return sendMessage('pri(json.restoreV2)', request);
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

// TODO: remove, deprecated
export async function subscribeAssetRegistry (callback: (map: Record<string, _ChainAsset>) => void): Promise<Record<string, _ChainAsset>> {
  return sendMessage('pri(chainService.subscribeAssetRegistry)', null, callback);
}

export async function subscribeHistory (callback: (historyMap: TransactionHistoryItem[]) => void): Promise<TransactionHistoryItem[]> {
  return sendMessage('pri(transaction.history.getSubscription)', null, callback);
}

export async function getNft (account: string): Promise<NftJson> {
  // @ts-ignore
  return sendMessage('pri(nft.getNft)', account);
}

export async function subscribeNft (request: RequestSubscribeNft, callback: (nftData: NftJson) => void): Promise<NftJson> {
  return sendMessage('pri(nft.getSubscription)', request, callback);
}

export async function subscribeNftCollection (callback: (data: NftCollection[]) => void): Promise<NftCollection[]> {
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

export async function makeTransfer (request: RequestTransfer): Promise<SWTransactionResponse> {
  return sendMessage('pri(accounts.transfer)', request);
}

export async function makeCrossChainTransfer (request: RequestCrossChainTransfer): Promise<SWTransactionResponse> {
  return sendMessage('pri(accounts.crossChainTransfer)', request);
}

export async function evmNftSubmitTransaction (request: NftTransactionRequest): Promise<SWTransactionResponse> {
  return sendMessage('pri(evmNft.submitTransaction)', request);
}

// ChainService -------------------------------------------------------------------------------------

export async function subscribeChainInfoMap (callback: (data: Record<string, _ChainInfo>) => void): Promise<Record<string, _ChainInfo>> {
  return sendMessage('pri(chainService.subscribeChainInfoMap)', null, callback);
}

export async function subscribeChainStateMap (callback: (data: Record<string, _ChainState>) => void): Promise<Record<string, _ChainState>> {
  return sendMessage('pri(chainService.subscribeChainStateMap)', null, callback);
}

export async function removeChain (networkKey: string): Promise<boolean> {
  return sendMessage('pri(chainService.removeChain)', networkKey);
}

export async function updateChainActiveState (chain: string, active: boolean): Promise<boolean> {
  if (active) {
    return await enableChain(chain);
  } else {
    return await disableChain(chain);
  }
}

export async function disableChain (networkKey: string): Promise<boolean> {
  return sendMessage('pri(chainService.disableChain)', networkKey);
}

export async function enableChain (networkKey: string, enableTokens = true): Promise<boolean> {
  return sendMessage('pri(chainService.enableChain)', { chainSlug: networkKey, enableTokens });
}

export async function enableChains (targetKeys: string[], enableTokens = true): Promise<boolean> {
  return sendMessage('pri(chainService.enableChains)', { chainSlugs: targetKeys, enableTokens });
}

export async function disableChains (targetKeys: string[]): Promise<boolean> {
  return sendMessage('pri(chainService.disableChains)', targetKeys);
}

export async function upsertChain (data: _NetworkUpsertParams): Promise<boolean> {
  return sendMessage('pri(chainService.upsertChain)', data);
}

export async function getSupportedContractTypes (): Promise<string[]> {
  return sendMessage('pri(chainService.getSupportedContractTypes)', null);
}

export async function upsertCustomToken (data: _ChainAsset): Promise<boolean> {
  return sendMessage('pri(chainService.upsertCustomAsset)', data);
}

export async function deleteCustomAssets (assetSlug: string): Promise<boolean> {
  return sendMessage('pri(chainService.deleteCustomAsset)', assetSlug);
}

export async function validateCustomToken (data: _ValidateCustomAssetRequest): Promise<_ValidateCustomAssetResponse> {
  return sendMessage('pri(chainService.validateCustomAsset)', data);
}

export async function resetDefaultNetwork (): Promise<boolean> {
  return sendMessage('pri(chainService.resetDefaultChains)', null);
}

export async function updateAssetSetting (data: AssetSettingUpdateReq): Promise<boolean> {
  return sendMessage('pri(assetSetting.update)', data);
}

// -------------------------------------------------------------------------------------

export async function validateCustomChain (provider: string, existedChainSlug?: string): Promise<ValidateNetworkResponse> {
  return sendMessage('pri(chainService.validateCustomChain)', { provider, existedChainSlug });
}

export async function disableAllNetwork (): Promise<boolean> {
  return sendMessage('pri(chainService.disableAllChains)', null);
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

export async function getFreeBalance (request: RequestFreeBalance): Promise<AmountData> {
  return sendMessage('pri(freeBalance.get)', request);
}

export async function getMaxTransfer (request: RequestMaxTransferable): Promise<AmountData> {
  return sendMessage('pri(transfer.getMaxTransferable)', request);
}

export async function subscribeFreeBalance (request: RequestFreeBalance, callback: (balance: AmountData) => void): Promise<AmountData> {
  return sendMessage('pri(freeBalance.subscribe)', request, callback);
}

export async function substrateNftSubmitTransaction (request: NftTransactionRequest): Promise<SWTransactionResponse> {
  return sendMessage('pri(substrateNft.submitTransaction)', request);
}

export async function recoverDotSamaApi (request: string): Promise<boolean> {
  return sendMessage('pri(chainService.recoverSubstrateApi)', request);
}

// Sign Qr

export async function accountIsLocked (address: string): Promise<ResponseAccountIsLocked> {
  return sendMessage('pri(account.isLocked)', { address });
}

export async function qrSignSubstrate (request: RequestQrSignSubstrate): Promise<ResponseQrSignSubstrate> {
  return sendMessage('pri(qr.sign.substrate)', request);
}

export async function qrSignEvm (request: RequestQrSignEvm): Promise<ResponseQrSignEvm> {
  return sendMessage('pri(qr.sign.evm)', request);
}

export async function parseSubstrateTransaction (request: RequestParseTransactionSubstrate): Promise<ResponseParseTransactionSubstrate> {
  return sendMessage('pri(qr.transaction.parse.substrate)', request);
}

export async function parseEVMTransaction (data: string): Promise<ResponseQrParseRLP> {
  return sendMessage('pri(qr.transaction.parse.evm)', { data });
}

export async function getAccountMeta (request: RequestAccountMeta): Promise<ResponseAccountMeta> {
  return sendMessage('pri(accounts.get.meta)', request);
}

export async function subscribeConfirmations (callback: (data: ConfirmationsQueue) => void): Promise<ConfirmationsQueue> {
  return sendMessage('pri(confirmations.subscribe)', null, callback);
}

export async function completeConfirmation<CT extends ConfirmationType> (type: CT, payload: ConfirmationDefinitions[CT][1]): Promise<boolean> {
  return sendMessage('pri(confirmations.complete)', { [type]: payload });
}

export async function getBondingOptions (networkKey: string, type: StakingType): Promise<ValidatorInfo[]> {
  return sendMessage('pri(bonding.getBondingOptions)', { chain: networkKey, type });
}

export async function getNominationPoolOptions (chain: string): Promise<NominationPoolInfo[]> {
  return sendMessage('pri(bonding.getNominationPoolOptions)', chain);
}

export async function subscribeChainStakingMetadata (callback: (data: ChainStakingMetadata[]) => void): Promise<ChainStakingMetadata[]> {
  return sendMessage('pri(bonding.subscribeChainStakingMetadata)', null, callback);
}

export async function subscribeStakingNominatorMetadata (callback: (data: NominatorMetadata[]) => void): Promise<NominatorMetadata[]> {
  return sendMessage('pri(bonding.subscribeNominatorMetadata)', null, callback);
}

export async function submitPoolBonding (request: RequestStakePoolingBonding): Promise<SWTransactionResponse> {
  return sendMessage('pri(bonding.nominationPool.submitBonding)', request);
}

export async function submitPoolUnbonding (request: RequestStakePoolingUnbonding): Promise<SWTransactionResponse> {
  return sendMessage('pri(bonding.nominationPool.submitUnbonding)', request);
}

export async function submitBonding (request: RequestBondingSubmit): Promise<SWTransactionResponse> {
  return sendMessage('pri(bonding.submitBondingTransaction)', request);
}

export async function submitUnbonding (request: RequestUnbondingSubmit): Promise<SWTransactionResponse> {
  return sendMessage('pri(unbonding.submitTransaction)', request);
}

export async function submitStakeWithdrawal (params: RequestStakeWithdrawal): Promise<SWTransactionResponse> {
  return sendMessage('pri(unbonding.submitWithdrawal)', params);
}

export async function submitStakeClaimReward (request: RequestStakeClaimReward): Promise<SWTransactionResponse> {
  return sendMessage('pri(staking.submitClaimReward)', request);
}

export async function submitStakeCancelWithdrawal (request: RequestStakeCancelWithdrawal): Promise<SWTransactionResponse> {
  return sendMessage('pri(staking.submitCancelWithdrawal)', request);
}

export async function parseEVMTransactionInput (request: RequestParseEvmContractInput): Promise<ResponseParseEvmContractInput> {
  return sendMessage('pri(evm.transaction.parse.input)', request);
}

export async function subscribeAuthUrl (callback: (data: AuthUrls) => void): Promise<AuthUrls> {
  return sendMessage('pri(authorize.subscribe)', null, callback);
}

export async function submitTuringStakeCompounding (request: RequestTuringStakeCompound): Promise<SWTransactionResponse> {
  return sendMessage('pri(staking.submitTuringCompound)', request);
}

export async function submitTuringCancelStakeCompounding (request: RequestTuringCancelStakeCompound): Promise<SWTransactionResponse> {
  return sendMessage('pri(staking.submitTuringCancelCompound)', request);
}

// Keyring state
export async function keyringStateSubscribe (cb: (value: KeyringState) => void): Promise<KeyringState> {
  return sendMessage('pri(keyring.subscribe)', null, cb);
}

export async function keyringChangeMasterPassword (request: RequestChangeMasterPassword): Promise<ResponseChangeMasterPassword> {
  return sendMessage('pri(keyring.change)', request);
}

export async function keyringMigrateMasterPassword (request: RequestMigratePassword): Promise<ResponseMigratePassword> {
  return sendMessage('pri(keyring.migrate)', request);
}

export async function keyringUnlock (request: RequestUnlockKeyring): Promise<ResponseUnlockKeyring> {
  return sendMessage('pri(keyring.unlock)', request);
}

export async function keyringLock (): Promise<void> {
  return sendMessage('pri(keyring.lock)', null);
}

export async function keyringExportMnemonic (request: RequestKeyringExportMnemonic): Promise<ResponseKeyringExportMnemonic> {
  return sendMessage('pri(keyring.export.mnemonic)', request);
}

export async function resetWallet (request: RequestResetWallet): Promise<ResponseResetWallet> {
  return sendMessage('pri(keyring.reset)', request);
}

/// Derive
export async function validateDerivePathV2 (request: RequestDeriveValidateV2): Promise<ResponseDeriveValidateV2> {
  return sendMessage('pri(derivation.validateV2)', request);
}

export async function getListDeriveAccounts (request: RequestGetDeriveAccounts): Promise<ResponseGetDeriveAccounts> {
  return sendMessage('pri(derivation.getList)', request);
}

export async function deriveMultiple (request: RequestDeriveCreateMultiple): Promise<boolean> {
  return sendMessage('pri(derivation.create.multiple)', request);
}

export async function deriveAccountV3 (request: RequestDeriveCreateV3): Promise<boolean> {
  return sendMessage('pri(derivation.createV3)', request);
}

export async function getTransaction (request: RequestGetTransaction): Promise<SWTransactionResult> {
  return sendMessage('pri(transactions.getOne)', request);
}

export async function subscribeTransactions (callback: (rs: Record<string, SWTransactionResult>) => void): Promise<Record<string, SWTransactionResult>> {
  return sendMessage('pri(transactions.subscribe)', null, callback);
}

export async function subscribeNotifications (callback: (rs: Notification[]) => void): Promise<Notification[]> {
  return sendMessage('pri(notifications.subscribe)', null, callback);
}

export async function getLogoMap (): Promise<AllLogoMap> {
  return sendMessage('pri(settings.getLogoMaps)', null);
}

export async function reloadCron (request: CronReloadRequest): Promise<boolean> {
  return sendMessage('pri(cron.reload)', request);
}

// Phishing page
export async function passPhishingPage (url: string): Promise<boolean> {
  return sendMessage('pri(phishing.pass)', { url });
}

// Manta pay
export async function enableMantaPay (params: MantaPayEnableParams) {
  return sendMessage('pri(mantaPay.enable)', params);
}

export async function disableMantaPay (address: string) {
  return sendMessage('pri(mantaPay.disable)', address);
}

export async function getMantaZkBalance () {
  return sendMessage('pri(mantaPay.getZkBalance)', null);
}

export async function subscribeMantaPayConfig (callback: (data: MantaPayConfig[]) => void): Promise<MantaPayConfig[]> {
  return sendMessage('pri(mantaPay.subscribeConfig)', null, callback);
}

export async function subscribeMantaPaySyncingState (callback: (progress: MantaPaySyncState) => void): Promise<MantaPaySyncState> {
  return sendMessage('pri(mantaPay.subscribeSyncingState)', null, callback);
}

export async function initSyncMantaPay (address: string) {
  return sendMessage('pri(mantaPay.initSyncMantaPay)', address);
}

export async function resolveDomainToAddress (request: ResolveDomainRequest) {
  return sendMessage('pri(accounts.resolveDomainToAddress)', request);
}

export async function resolveAddressToDomain (request: ResolveAddressToDomainRequest) {
  return sendMessage('pri(accounts.resolveAddressToDomain)', request);
}

export async function subscribeYieldPoolInfo (callback: (data: YieldPoolInfo[]) => void): Promise<YieldPoolInfo[]> {
  return sendMessage('pri(yield.subscribePoolInfo)', null, callback);
}

export async function getOptimalYieldPath (data: OptimalYieldPathRequest) {
  return sendMessage('pri(yield.getOptimalPath)', data);
}

export async function submitJoinYieldPool (data: RequestYieldStepSubmit): Promise<SWTransactionResponse> {
  return sendMessage('pri(yield.handleStep)', data);
}

export async function getYieldNativeStakingValidators (poolInfo: YieldPoolInfo): Promise<ValidatorInfo[]> {
  return sendMessage('pri(yield.getNativeStakingValidators)', poolInfo);
}

export async function getYieldNominationPools (poolInfo: YieldPoolInfo): Promise<NominationPoolInfo[]> {
  return sendMessage('pri(yield.getStakingNominationPools)', poolInfo);
}

export * from './accounts';
export * from './base';
export * from './metadata';
export * from './settings';
export * from './WalletConnect';
