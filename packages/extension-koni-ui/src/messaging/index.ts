// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataRequest, SigningRequest, WindowOpenParams } from '@subwallet/extension-base/background/types';

import { _ChainAsset } from '@subwallet/chain-list/types';
import { AllLogoMap, BalanceJson, ConfirmationsQueue, CronReloadRequest, CrowdloanJson, Notification, PriceJson, RequestGetTransaction, RequestParseEvmContractInput, RequestSubscribeBalance, RequestSubscribeCrowdloan, RequestSubscribePrice, ResponseParseEvmContractInput, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import { sendMessage } from '@subwallet/extension-koni-ui/messaging/base';

export async function subscribeMetadataRequests (cb: (accounts: MetadataRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(metadata.requests)', null, cb);
}

export async function subscribeSigningRequests (cb: (accounts: SigningRequest[]) => void): Promise<boolean> {
  return sendMessage('pri(signing.requests)', null, cb);
}

export async function windowOpen (params: WindowOpenParams): Promise<boolean> {
  return sendMessage('pri(window.open)', params);
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

export async function cancelSubscription (request: string): Promise<boolean> {
  return sendMessage('pri(subscription.cancel)', request);
}

export async function recoverDotSamaApi (request: string): Promise<boolean> {
  return sendMessage('pri(chainService.recoverSubstrateApi)', request);
}

export async function subscribeConfirmations (callback: (data: ConfirmationsQueue) => void): Promise<ConfirmationsQueue> {
  return sendMessage('pri(confirmations.subscribe)', null, callback);
}

export async function parseEVMTransactionInput (request: RequestParseEvmContractInput): Promise<ResponseParseEvmContractInput> {
  return sendMessage('pri(evm.transaction.parse.input)', request);
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

export async function validateYieldProcess (data: ValidateYieldProcessParams): Promise<TransactionError[]> {
  return sendMessage('pri(yield.validateProcess)', data);
}

export async function yieldSubmitUnstaking (data: RequestUnbondingSubmit) {
  return sendMessage('pri(yield.staking.submitUnstaking)', data);
}

export async function yieldSubmitStakingWithdrawal (data: RequestStakeWithdrawal) {
  return sendMessage('pri(yield.staking.submitWithdraw)', data);
}

export async function yieldSubmitStakingCancelWithdrawal (data: RequestStakeCancelWithdrawal) {
  return sendMessage('pri(yield.staking.submitCancelWithdrawal)', data);
}

export async function yieldSubmitStakingClaimReward (data: RequestStakeClaimReward) {
  return sendMessage('pri(yield.staking.submitClaimReward)', data);
}

export async function yieldSubmitNominationPoolUnstaking (data: RequestStakePoolingUnbonding) {
  return sendMessage('pri(yield.nominationPool.submitUnstaking)', data);
}

export * from './accounts';
export * from './base';
export * from './confirmation';
export * from './keyring';
export * from './manta-pay';
export * from './metadata';
export * from './qr-signer';
export * from './settings';
export * from './transaction';
export * from './WalletConnect';
