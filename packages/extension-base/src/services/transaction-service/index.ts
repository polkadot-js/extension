// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmProviderError } from '@subwallet/extension-base/background/errors/EvmProviderError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { AmountData, BasicTxErrorType, ChainType, EvmProviderErrorType, EvmSendTransactionRequest, ExtrinsicStatus, ExtrinsicType, NotificationType, TransactionAdditionalInfo, TransactionDirection, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { checkBalanceWithTransactionFee, checkSigningAccountForTransaction, checkSupportForTransaction, estimateFeeForTransaction } from '@subwallet/extension-base/core/logic-validation/transfer';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _getAssetDecimals, _getAssetSymbol, _getChainNativeTokenBasicInfo, _getEvmChainId, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { EventService } from '@subwallet/extension-base/services/event-service';
import { HistoryService } from '@subwallet/extension-base/services/history-service';
import { EXTENSION_REQUEST_URL } from '@subwallet/extension-base/services/request-service/constants';
import { TRANSACTION_TIMEOUT } from '@subwallet/extension-base/services/transaction-service/constants';
import { parseLiquidStakingEvents, parseLiquidStakingFastUnstakeEvents, parseTransferEventLogs, parseXcmEventLogs } from '@subwallet/extension-base/services/transaction-service/event-parser';
import { getBaseTransactionInfo, getTransactionId, isSubstrateTransaction } from '@subwallet/extension-base/services/transaction-service/helpers';
import { SWTransaction, SWTransactionInput, SWTransactionResponse, TransactionEmitter, TransactionEventMap, TransactionEventResponse, ValidateTransactionResponseInput } from '@subwallet/extension-base/services/transaction-service/types';
import { getExplorerLink, parseTransactionData } from '@subwallet/extension-base/services/transaction-service/utils';
import { isWalletConnectRequest } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import { Web3Transaction } from '@subwallet/extension-base/signers/types';
import { LeavePoolAdditionalData, RequestStakePoolingBonding, RequestYieldStepSubmit, SpecialYieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { _isRuntimeUpdated, anyNumberToBN, reformatAddress } from '@subwallet/extension-base/utils';
import { mergeTransactionAndSignature } from '@subwallet/extension-base/utils/eth/mergeTransactionAndSignature';
import { isContractAddress, parseContractInput } from '@subwallet/extension-base/utils/eth/parseTransaction';
import { BN_ZERO } from '@subwallet/extension-base/utils/number';
import keyring from '@subwallet/ui-keyring';
import { addHexPrefix } from 'ethereumjs-util';
import { ethers, TransactionLike } from 'ethers';
import EventEmitter from 'eventemitter3';
import { t } from 'i18next';
import { BehaviorSubject, interval as rxjsInterval, Subscription } from 'rxjs';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { Signer, SignerOptions, SignerResult } from '@polkadot/api/types';
import { EventRecord } from '@polkadot/types/interfaces';
import { SignerPayloadJSON } from '@polkadot/types/types/extrinsic';
import { isHex } from '@polkadot/util';
import { HexString } from '@polkadot/util/types';

import NotificationService from '../notification-service/NotificationService';

export default class TransactionService {
  private readonly state: KoniState;
  private readonly transactionSubject: BehaviorSubject<Record<string, SWTransaction>> = new BehaviorSubject<Record<string, SWTransaction>>({});
  private readonly eventService: EventService;
  private readonly historyService: HistoryService;
  private readonly notificationService: NotificationService;
  private readonly chainService: ChainService;

  private readonly watchTransactionSubscribes: Record<string, Promise<void>> = {};

  private get transactions (): Record<string, SWTransaction> {
    return this.transactionSubject.getValue();
  }

  constructor (state: KoniState) {
    this.state = state;
    this.eventService = state.eventService;
    this.historyService = state.historyService;
    this.notificationService = state.notificationService;
    this.chainService = state.chainService;
  }

  private get allTransactions (): SWTransaction[] {
    return Object.values(this.transactions);
  }

  private get processingTransactions (): SWTransaction[] {
    return this.allTransactions.filter((t) => t.status === ExtrinsicStatus.QUEUED || t.status === ExtrinsicStatus.SUBMITTING);
  }

  public getTransaction (id: string) {
    return this.transactions[id];
  }

  private checkDuplicate (transaction: ValidateTransactionResponseInput): TransactionError[] {
    // Check duplicated transaction
    const existed = this.processingTransactions
      .filter((item) => item.address === transaction.address && item.chain === transaction.chain);

    if (existed.length > 0) {
      return [new TransactionError(BasicTxErrorType.DUPLICATE_TRANSACTION)];
    }

    return [];
  }

  public async validateTransaction (transactionInput: SWTransactionInput): Promise<SWTransactionResponse> {
    const validationResponse: SWTransactionResponse = {
      ...transactionInput,
      status: undefined,
      errors: transactionInput.errors || [],
      warnings: transactionInput.warnings || []
    };

    const { additionalValidator, address, chain, extrinsicType } = validationResponse;

    const transaction = transactionInput.transaction;

    // Check duplicated transaction
    validationResponse.errors.push(...this.checkDuplicate(transactionInput));

    // Check support for transaction
    checkSupportForTransaction(validationResponse, transaction);

    const chainInfo = this.state.chainService.getChainInfoByKey(chain);

    if (!chainInfo) {
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, t('Cannot find network')));
    }

    const evmApi = this.state.chainService.getEvmApi(chainInfo.slug);
    const isNeedEvmApi = transaction && !isSubstrateTransaction(transaction) && !evmApi;

    if (isNeedEvmApi) {
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.CHAIN_DISCONNECTED, undefined));
    }

    // Estimate fee for transaction
    validationResponse.estimateFee = await estimateFeeForTransaction(validationResponse, transaction, chainInfo, evmApi);

    // Check account signing transaction
    checkSigningAccountForTransaction(validationResponse);

    const nativeTokenInfo = this.state.chainService.getNativeTokenInfo(chain);
    const nativeTokenAvailable = await this.state.balanceService.getTransferableBalance(address, chain, nativeTokenInfo.slug, extrinsicType);

    // Check available balance against transaction fee
    checkBalanceWithTransactionFee(validationResponse, transactionInput, nativeTokenInfo, nativeTokenAvailable);

    // Check additional validations
    additionalValidator && await additionalValidator(validationResponse);

    return validationResponse;
  }

  public getTransactionSubject () {
    return this.transactionSubject;
  }

  private fillTransactionDefaultInfo (transaction: SWTransactionInput): SWTransaction {
    const isInternal = !transaction.url;
    const transactionId = getTransactionId(transaction.chainType, transaction.chain, isInternal, isWalletConnectRequest(transaction.id));

    return {
      ...transaction,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      errors: transaction.errors || [],
      warnings: transaction.warnings || [],
      url: transaction.url || EXTENSION_REQUEST_URL,
      status: ExtrinsicStatus.QUEUED,
      isInternal,
      id: transactionId,
      extrinsicHash: transactionId
    } as SWTransaction;
  }

  public async addTransaction (inputTransaction: SWTransactionInput): Promise<TransactionEmitter> {
    const transactions = this.transactions;
    // Fill transaction default info
    const transaction = this.fillTransactionDefaultInfo(inputTransaction);

    // Add Transaction
    transactions[transaction.id] = transaction;
    this.transactionSubject.next({ ...transactions });

    return await this.sendTransaction(transaction);
  }

  public generateBeforeHandleResponseErrors (errors: TransactionError[]): SWTransactionResponse {
    return {
      errors,
      additionalValidator: undefined,
      address: '',
      chain: '',
      chainType: ChainType.SUBSTRATE,
      data: undefined,
      extrinsicType: ExtrinsicType.UNKNOWN,
      transferNativeAmount: undefined,
      url: undefined,
      warnings: []
    };
  }

  public async handleTransaction (transaction: SWTransactionInput): Promise<SWTransactionResponse> {
    const validatedTransaction = await this.validateTransaction(transaction);
    const stopByErrors = validatedTransaction.errors.length > 0;
    const stopByWarnings = validatedTransaction.warnings.length > 0 && !validatedTransaction.ignoreWarnings;

    if (stopByErrors || stopByWarnings) {
      // @ts-ignore
      'transaction' in validatedTransaction && delete validatedTransaction.transaction;
      'additionalValidator' in validatedTransaction && delete validatedTransaction.additionalValidator;
      'eventsHandler' in validatedTransaction && delete validatedTransaction.eventsHandler;

      return validatedTransaction;
    }

    validatedTransaction.warnings = [];

    const emitter = await this.addTransaction(validatedTransaction);

    await new Promise<void>((resolve, reject) => {
      // TODO
      if (transaction.resolveOnDone) {
        emitter.on('success', (data: TransactionEventResponse) => {
          validatedTransaction.id = data.id;
          validatedTransaction.extrinsicHash = data.extrinsicHash;
          resolve();
        });
      } else {
        emitter.on('signed', (data: TransactionEventResponse) => {
          validatedTransaction.id = data.id;
          validatedTransaction.extrinsicHash = data.extrinsicHash;
          resolve();
        });
      }

      emitter.on('error', (data: TransactionEventResponse) => {
        if (data.errors.length > 0) {
          validatedTransaction.errors.push(...data.errors);
          resolve();
        }
      });
    });

    // @ts-ignore
    'transaction' in validatedTransaction && delete validatedTransaction.transaction;
    'additionalValidator' in validatedTransaction && delete validatedTransaction.additionalValidator;
    'eventsHandler' in validatedTransaction && delete validatedTransaction.eventsHandler;

    return validatedTransaction;
  }

  private async sendTransaction (transaction: SWTransaction): Promise<TransactionEmitter> {
    // Send Transaction
    const emitter = await (transaction.chainType === 'substrate' ? this.signAndSendSubstrateTransaction(transaction) : this.signAndSendEvmTransaction(transaction));

    const { eventsHandler } = transaction;

    emitter.on('signed', (data: TransactionEventResponse) => {
      this.onSigned(data);
    });

    emitter.on('send', (data: TransactionEventResponse) => {
      this.onSend(data);
    });

    emitter.on('extrinsicHash', (data: TransactionEventResponse) => {
      this.onHasTransactionHash(data);
    });

    emitter.on('success', (data: TransactionEventResponse) => {
      this.handlePostProcessing(data.id);
      this.onSuccess(data);
    });

    emitter.on('error', (data: TransactionEventResponse) => {
      // this.handlePostProcessing(data.id); // might enable this later
      this.onFailed({ ...data, errors: [...data.errors, new TransactionError(BasicTxErrorType.INTERNAL_ERROR)] });
    });

    emitter.on('timeout', (data: TransactionEventResponse) => {
      this.onTimeOut({ ...data, errors: [...data.errors, new TransactionError(BasicTxErrorType.TIMEOUT)] });
    });

    // Todo: handle any event with transaction.eventsHandler

    eventsHandler?.(emitter);

    return emitter;
  }

  private removeTransaction (id: string): void {
    if (this.transactions[id]) {
      delete this.transactions[id];
      this.transactionSubject.next({ ...this.transactions });
    }
  }

  private updateTransaction (id: string, data: Partial<Omit<SWTransaction, 'id'>>): void {
    const transaction = this.transactions[id];

    if (transaction) {
      this.transactions[id] = {
        ...transaction,
        ...data
      };
    }
  }

  private getTransactionLink (id: string): string | undefined {
    const transaction = this.getTransaction(id);
    const chainInfo = this.state.chainService.getChainInfoByKey(transaction.chain);

    return getExplorerLink(chainInfo, transaction.extrinsicHash, 'tx');
  }

  private transactionToHistories (id: string, startBlock?: number, nonce?: number, eventLogs?: EventRecord[]): TransactionHistoryItem[] {
    const transaction = this.getTransaction(id);
    const extrinsicType = transaction.extrinsicType;

    const chainInfo = this.state.chainService.getChainInfoByKey(transaction.chain);
    const formattedTransactionAddress = reformatAddress(transaction.address);

    const historyItem: TransactionHistoryItem = {
      origin: 'app',
      chain: transaction.chain,
      direction: TransactionDirection.SEND,
      type: transaction.extrinsicType,
      from: transaction.address,
      to: '',
      chainType: transaction.chainType,
      address: formattedTransactionAddress,
      status: transaction.status,
      transactionId: transaction.id,
      extrinsicHash: transaction.extrinsicHash,
      time: transaction.createdAt,
      fee: transaction.estimateFee,
      blockNumber: 0, // Will be added in next step
      blockHash: '', // Will be added in next step
      nonce: nonce ?? 0,
      startBlock: startBlock || 0
    };

    const nativeAsset = _getChainNativeTokenBasicInfo(chainInfo);
    const baseNativeAmount = { value: '0', decimals: nativeAsset.decimals, symbol: nativeAsset.symbol };

    // Fill data by extrinsicType
    switch (extrinsicType) {
      case ExtrinsicType.TRANSFER_BALANCE: {
        const inputData = parseTransactionData<ExtrinsicType.TRANSFER_TOKEN>(transaction.data);

        historyItem.to = inputData.to;
        const sendingTokenInfo = this.state.chainService.getAssetBySlug(inputData.tokenSlug);

        historyItem.amount = { value: inputData.value || '0', decimals: sendingTokenInfo.decimals || 0, symbol: sendingTokenInfo.symbol };
        eventLogs && parseTransferEventLogs(historyItem, eventLogs, transaction.chain, sendingTokenInfo, chainInfo);
      }

        break;
      case ExtrinsicType.TRANSFER_TOKEN: {
        const inputData = parseTransactionData<ExtrinsicType.TRANSFER_TOKEN>(transaction.data);

        historyItem.to = inputData.to;
        const sendingTokenInfo = this.state.chainService.getAssetBySlug(inputData.tokenSlug);

        historyItem.amount = { value: inputData.value || '0', decimals: sendingTokenInfo.decimals || 0, symbol: sendingTokenInfo.symbol };
        eventLogs && parseTransferEventLogs(historyItem, eventLogs, transaction.chain, sendingTokenInfo, chainInfo);
      }

        break;
      case ExtrinsicType.TRANSFER_XCM: {
        const inputData = parseTransactionData<ExtrinsicType.TRANSFER_XCM>(transaction.data);

        historyItem.to = inputData.to;
        const sendingTokenInfo = this.state.chainService.getAssetBySlug(inputData.tokenSlug);

        historyItem.amount = { value: inputData.value || '0', decimals: sendingTokenInfo.decimals || 0, symbol: sendingTokenInfo.symbol };

        // @ts-ignore
        historyItem.additionalInfo = { destinationChain: inputData?.destinationNetworkKey || '', originalChain: inputData.originNetworkKey || '', fee: transaction.estimateFee };
        eventLogs && parseXcmEventLogs(historyItem, eventLogs, transaction.chain, sendingTokenInfo, chainInfo);
      }

        break;
      case ExtrinsicType.SEND_NFT: {
        const inputData = parseTransactionData<ExtrinsicType.SEND_NFT>(transaction.data);

        historyItem.to = inputData.recipientAddress;
        historyItem.amount = {
          decimals: 0,
          symbol: 'NFT',
          value: '1'
        };
      }

        break;
      case ExtrinsicType.STAKING_BOND: {
        const data = parseTransactionData<ExtrinsicType.STAKING_BOND>(transaction.data);

        historyItem.amount = { ...baseNativeAmount, value: data.amount || '0' };
      }

        break;
      case ExtrinsicType.STAKING_JOIN_POOL: {
        const data = parseTransactionData<ExtrinsicType.STAKING_JOIN_POOL>(transaction.data);

        historyItem.amount = { ...baseNativeAmount, value: data.amount || '0' };
        historyItem.to = data.selectedPool.name || data.selectedPool.id.toString();
      }

        break;
      case ExtrinsicType.STAKING_UNBOND:
        {
          const data = parseTransactionData<ExtrinsicType.STAKING_UNBOND>(transaction.data);

          if (data.isLiquidStaking && data.derivativeTokenInfo && data.exchangeRate && data.inputTokenInfo) {
            historyItem.amount = {
              decimals: _getAssetDecimals(data.derivativeTokenInfo),
              symbol: _getAssetSymbol(data.derivativeTokenInfo),
              value: data.amount
            };

            historyItem.additionalInfo = {
              inputTokenSlug: data.inputTokenInfo.slug,
              exchangeRate: data.exchangeRate
            } as TransactionAdditionalInfo[ExtrinsicType.STAKING_UNBOND];
          } else {
            historyItem.to = data.validatorAddress || '';
            historyItem.amount = { ...baseNativeAmount, value: data.amount || '0' };
          }
        }

        break;
      case ExtrinsicType.STAKING_LEAVE_POOL:
        {
          const data = parseTransactionData<ExtrinsicType.STAKING_LEAVE_POOL>(transaction.data);

          historyItem.to = data.address || '';
          historyItem.amount = { ...baseNativeAmount, value: data.amount || '0' };
        }

        break;
      case ExtrinsicType.STAKING_CLAIM_REWARD: {
        const data = parseTransactionData<ExtrinsicType.STAKING_CLAIM_REWARD>(transaction.data);

        historyItem.amount = { ...baseNativeAmount, value: data.unclaimedReward || '0' };
      }

        break;

      case ExtrinsicType.STAKING_WITHDRAW: {
        const data = parseTransactionData<ExtrinsicType.STAKING_WITHDRAW>(transaction.data);

        const slug = data.slug;
        const poolHandler = this.state.earningService.getPoolHandler(slug);

        const amount: AmountData = {
          ...baseNativeAmount,
          value: data.unstakingInfo.claimable || '0'
        };

        if (poolHandler) {
          const asset = this.state.getAssetBySlug(poolHandler.metadataInfo.inputAsset);

          if (asset) {
            amount.decimals = asset.decimals || 0;
            amount.symbol = asset.symbol;
          }
        }

        historyItem.to = data.unstakingInfo.validatorAddress || '';
        historyItem.amount = amount;
        break;
      }

      case ExtrinsicType.STAKING_CANCEL_UNSTAKE: {
        const data = parseTransactionData<ExtrinsicType.STAKING_CANCEL_UNSTAKE>(transaction.data);

        historyItem.amount = { ...baseNativeAmount, value: data.selectedUnstaking.claimable || '0' };
        break;
      }

      case ExtrinsicType.EVM_EXECUTE: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = parseTransactionData<ExtrinsicType.EVM_EXECUTE>(transaction.data);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        historyItem.to = data?.to || '';
        break;
      }

      case ExtrinsicType.MINT_STDOT:
      case ExtrinsicType.MINT_QDOT:
      case ExtrinsicType.MINT_LDOT:
      case ExtrinsicType.MINT_SDOT:
      case ExtrinsicType.MINT_VMANTA:

      // eslint-disable-next-line no-fallthrough
      case ExtrinsicType.MINT_VDOT: {
        const params = parseTransactionData<ExtrinsicType.MINT_VDOT>(transaction.data);

        const inputTokenInfo = this.state.chainService.getAssetBySlug(params.inputTokenSlug);
        const isFeePaidWithInputAsset = params.feeTokenSlug === params.inputTokenSlug;

        historyItem.amount = { value: params.amount, symbol: _getAssetSymbol(inputTokenInfo), decimals: _getAssetDecimals(inputTokenInfo) };

        const additionalInfo: TransactionAdditionalInfo[ExtrinsicType.MINT_VDOT] = {
          slug: params.slug,
          derivativeTokenSlug: params.derivativeTokenSlug,
          exchangeRate: params.exchangeRate
        };

        historyItem.additionalInfo = additionalInfo;
        eventLogs && !_isChainEvmCompatible(chainInfo) && parseLiquidStakingEvents(historyItem, eventLogs, inputTokenInfo, chainInfo, isFeePaidWithInputAsset, extrinsicType);

        break;
      }

      case ExtrinsicType.UNSTAKE_QDOT:

      // eslint-disable-next-line no-fallthrough
      case ExtrinsicType.REDEEM_QDOT: {
        const data = parseTransactionData<ExtrinsicType.REDEEM_QDOT>(transaction.data);
        const yieldPoolInfo = data.poolInfo as SpecialYieldPoolInfo;

        if (yieldPoolInfo.metadata.derivativeAssets) {
          const inputTokenSlug = yieldPoolInfo.metadata.inputAsset;
          const inputTokenInfo = this.state.chainService.getAssetBySlug(inputTokenSlug);

          historyItem.amount = { value: data.amount, symbol: _getAssetSymbol(inputTokenInfo), decimals: _getAssetDecimals(inputTokenInfo) };
          eventLogs && parseLiquidStakingFastUnstakeEvents(historyItem, eventLogs, chainInfo, extrinsicType);

          const additionalInfo: LeavePoolAdditionalData = {
            minAmountPercent: 1,
            symbol: inputTokenInfo.symbol,
            decimals: inputTokenInfo.decimals || 0,
            exchangeRate: 1,
            slug: yieldPoolInfo.slug,
            type: yieldPoolInfo.type,
            chain: yieldPoolInfo.chain,
            group: yieldPoolInfo.group,
            isFast: data.fastLeave
          };

          historyItem.additionalInfo = additionalInfo;
        }

        break;
      }

      case ExtrinsicType.UNSTAKE_VDOT:
      case ExtrinsicType.UNSTAKE_VMANTA:
      case ExtrinsicType.UNSTAKE_LDOT:
      case ExtrinsicType.UNSTAKE_SDOT:
      case ExtrinsicType.UNSTAKE_STDOT:
      case ExtrinsicType.REDEEM_STDOT:
      case ExtrinsicType.REDEEM_LDOT:
      case ExtrinsicType.REDEEM_SDOT:
      case ExtrinsicType.REDEEM_VMANTA:

      // eslint-disable-next-line no-fallthrough
      case ExtrinsicType.REDEEM_VDOT: {
        const data = parseTransactionData<ExtrinsicType.REDEEM_VDOT>(transaction.data);
        const yieldPoolInfo = data.poolInfo as SpecialYieldPoolInfo;
        const minAmountPercents = this.state.earningService.getMinAmountPercent();

        if (yieldPoolInfo.metadata.derivativeAssets) {
          const derivativeTokenSlug = yieldPoolInfo.metadata.derivativeAssets[0];
          const derivativeTokenInfo = this.state.chainService.getAssetBySlug(derivativeTokenSlug);
          const chainInfo = this.state.chainService.getChainInfoByKey(data.poolInfo.chain);

          historyItem.amount = { value: data.amount, symbol: _getAssetSymbol(derivativeTokenInfo), decimals: _getAssetDecimals(derivativeTokenInfo) };
          eventLogs && !_isChainEvmCompatible(chainInfo) && parseLiquidStakingFastUnstakeEvents(historyItem, eventLogs, chainInfo, extrinsicType);

          const minAmountPercent = minAmountPercents[yieldPoolInfo.slug] || 1;
          const inputTokenSlug = yieldPoolInfo.metadata.inputAsset;
          const inputTokenInfo = this.state.chainService.getAssetBySlug(inputTokenSlug);
          const additionalInfo: LeavePoolAdditionalData = {
            minAmountPercent,
            symbol: inputTokenInfo.symbol,
            decimals: inputTokenInfo.decimals || 0,
            exchangeRate: yieldPoolInfo.statistic?.assetEarning[0].exchangeRate || 1,
            slug: yieldPoolInfo.slug,
            type: yieldPoolInfo.type,
            chain: yieldPoolInfo.chain,
            group: yieldPoolInfo.group,
            isFast: data.fastLeave
          };

          historyItem.additionalInfo = additionalInfo;
        }

        break;
      }

      case ExtrinsicType.TOKEN_SPENDING_APPROVAL: {
        const data = parseTransactionData<ExtrinsicType.TOKEN_SPENDING_APPROVAL>(transaction.data);
        const inputAsset = this.state.chainService.getAssetBySlug(data.contractAddress);

        historyItem.amount = { value: '0', symbol: _getAssetSymbol(inputAsset), decimals: _getAssetDecimals(inputAsset) };

        break;
      }

      case ExtrinsicType.SWAP: {
        const data = parseTransactionData<ExtrinsicType.SWAP>(transaction.data); // TODO: switch by provider
        const inputAsset = this.state.chainService.getAssetBySlug(data.quote.pair.from);

        historyItem.amount = { value: data.quote.fromAmount, symbol: _getAssetSymbol(inputAsset), decimals: _getAssetDecimals(inputAsset) };
        historyItem.additionalInfo = data;

        break;
      }

      case ExtrinsicType.UNKNOWN:
        break;
    }

    try {
      // Return one more history record if transaction send to account in the wallets
      const toAccount = historyItem?.to && keyring.getPair(historyItem.to);

      if (toAccount) {
        const receiverHistory: TransactionHistoryItem = {
          ...historyItem,
          address: toAccount.address,
          direction: TransactionDirection.RECEIVED
        };

        switch (extrinsicType) {
          case ExtrinsicType.TRANSFER_XCM: {
            const inputData = parseTransactionData<ExtrinsicType.TRANSFER_XCM>(transaction.data);

            receiverHistory.chain = inputData.destinationNetworkKey;
            break;
          }

          default:
            break;
        }

        return [historyItem, receiverHistory];
      }
    } catch (e) {
      console.warn(e);
    }

    return [historyItem];
  }

  private onSigned ({ id }: TransactionEventResponse) {
    console.debug(`Transaction "${id}" is signed`);
  }

  private onSend ({ id, nonce, startBlock }: TransactionEventResponse) {
    // Update transaction status
    this.updateTransaction(id, { status: ExtrinsicStatus.SUBMITTING });

    // Create Input History Transaction History
    this.state.historyService.insertHistories(this.transactionToHistories(id, startBlock, nonce)).catch(console.error);

    console.debug(`Transaction "${id}" is sent`);
  }

  private onHasTransactionHash ({ blockHash, extrinsicHash, id }: TransactionEventResponse) {
    // Write processing transaction history
    const updateData = { extrinsicHash, status: ExtrinsicStatus.PROCESSING, blockHash: blockHash || '' };

    this.updateTransaction(id, updateData);

    // In this case transaction id is the same as extrinsic hash and will change after below update
    this.state.historyService.updateHistoryByExtrinsicHash(id, updateData).catch(console.error);

    console.debug(`Transaction "${id}" is submitted with hash ${extrinsicHash || ''}`);

    const transaction = this.getTransaction(id);

    if ([
      ExtrinsicType.STAKING_JOIN_POOL,
      ExtrinsicType.STAKING_BOND,
      ExtrinsicType.JOIN_YIELD_POOL,
      ExtrinsicType.MINT_LDOT,
      ExtrinsicType.MINT_QDOT,
      ExtrinsicType.MINT_SDOT,
      ExtrinsicType.MINT_STDOT,
      ExtrinsicType.MINT_VDOT,
      ExtrinsicType.MINT_VMANTA
    ].includes(transaction.extrinsicType)) {
      this.handlePostEarningTransaction(id);
    }
  }

  private handlePostProcessing (id: string) { // must be done after success/failure to make sure the transaction is finalized
    const transaction = this.getTransaction(id);

    if (transaction.extrinsicType === ExtrinsicType.SEND_NFT) {
      const inputData = parseTransactionData<ExtrinsicType.SEND_NFT>(transaction.data);

      try {
        const sender = keyring.getPair(inputData.senderAddress);

        sender && this.state.dbService.handleNftTransfer(transaction.chain, [sender.address, ALL_ACCOUNT_KEY], inputData.nftItem)
          .then(() => {
            this.state.eventService.emit('transaction.transferNft', undefined);
          })
          .catch(console.error);
      } catch (e) {
        console.error(e);
      }

      try {
        const recipient = keyring.getPair(inputData.recipientAddress);

        recipient && this.state.dbService.addNft(recipient.address, { ...inputData.nftItem, owner: recipient.address })
          .catch(console.error);
      } catch (e) {
        console.error(e);
      }
    } else if ([ExtrinsicType.STAKING_BOND, ExtrinsicType.STAKING_UNBOND, ExtrinsicType.STAKING_WITHDRAW, ExtrinsicType.STAKING_CANCEL_UNSTAKE, ExtrinsicType.STAKING_CLAIM_REWARD, ExtrinsicType.STAKING_JOIN_POOL, ExtrinsicType.STAKING_POOL_WITHDRAW, ExtrinsicType.STAKING_LEAVE_POOL].includes(transaction.extrinsicType)) {
      this.state.eventService.emit('transaction.submitStaking', transaction.chain);
    } else if (transaction.extrinsicType === ExtrinsicType.SWAP) {
      const inputData = parseTransactionData<ExtrinsicType.SWAP>(transaction.data);
      const toAssetSlug = inputData.quote.pair.to;

      // todo: consider async
      this.state.chainService.updateAssetSetting(toAssetSlug, { visible: true }, true).catch(console.error);
    }
  }

  private onSuccess ({ blockHash, blockNumber, extrinsicHash, id }: TransactionEventResponse) {
    const transaction = this.getTransaction(id);

    this.updateTransaction(id, { status: ExtrinsicStatus.SUCCESS, extrinsicHash });

    // Write success transaction history
    this.state.historyService.updateHistoryByExtrinsicHash(transaction.extrinsicHash, {
      extrinsicHash,
      status: ExtrinsicStatus.SUCCESS,
      blockNumber: blockNumber || 0,
      blockHash: blockHash || ''
    }).catch(console.error);

    const info = isHex(extrinsicHash) ? extrinsicHash : getBaseTransactionInfo(transaction, this.state.chainService.getChainInfoMap());

    this.state.notificationService.notify({
      type: NotificationType.SUCCESS,
      title: t('Transaction completed'),
      message: t('Transaction {{info}} completed', { replace: { info } }),
      action: { url: this.getTransactionLink(id) },
      notifyViaBrowser: true
    });

    this.state.eventService.emit('transaction.done', transaction);
  }

  private onFailed ({ blockHash, blockNumber, errors, extrinsicHash, id }: TransactionEventResponse) {
    const transaction = this.getTransaction(id);
    const nextStatus = ExtrinsicStatus.FAIL;

    if (transaction) {
      this.updateTransaction(id, { status: nextStatus, errors, extrinsicHash });

      // Write failed transaction history
      this.state.historyService.updateHistoryByExtrinsicHash(transaction.extrinsicHash, {
        extrinsicHash: extrinsicHash || transaction.extrinsicHash,
        status: nextStatus,
        blockNumber: blockNumber || 0,
        blockHash: blockHash || ''
      }).catch(console.error);

      const info = isHex(transaction?.extrinsicHash) ? transaction?.extrinsicHash : getBaseTransactionInfo(transaction, this.state.chainService.getChainInfoMap());

      this.state.notificationService.notify({
        type: NotificationType.ERROR,
        title: t('Transaction failed'),
        message: t('Transaction {{info}} failed', { replace: { info } }),
        action: { url: this.getTransactionLink(id) },
        notifyViaBrowser: true
      });
    }

    this.state.eventService.emit('transaction.failed', transaction);
  }

  private onTimeOut ({ blockHash, blockNumber, errors, extrinsicHash, id }: TransactionEventResponse) {
    const transaction = this.getTransaction(id);
    const nextStatus = ExtrinsicStatus.TIMEOUT;

    if (transaction) {
      this.updateTransaction(id, { status: nextStatus, errors, extrinsicHash });

      this.historyService.updateHistoryByExtrinsicHash(transaction.extrinsicHash, {
        extrinsicHash: extrinsicHash || transaction.extrinsicHash,
        status: nextStatus,
        blockNumber: blockNumber || 0,
        blockHash: blockHash || ''
      }).catch(console.error);

      const info = isHex(transaction?.extrinsicHash) ? transaction?.extrinsicHash : getBaseTransactionInfo(transaction, this.chainService.getChainInfoMap());

      this.notificationService.notify({
        type: NotificationType.ERROR,
        title: t('Transaction timed out'),
        message: t('Transaction {{info}} timed out', { replace: { info } }),
        action: { url: this.getTransactionLink(id) },
        notifyViaBrowser: true
      });
    }

    this.eventService.emit('transaction.timeout', transaction);
  }

  public generateHashPayload (chain: string, transaction: TransactionConfig): HexString {
    const chainInfo = this.state.chainService.getChainInfoByKey(chain);

    let txObject: TransactionLike;

    const max = anyNumberToBN(transaction.maxFeePerGas);

    if (max.gt(BN_ZERO)) {
      txObject = {
        nonce: transaction.nonce ?? 0,
        maxFeePerGas: addHexPrefix(anyNumberToBN(transaction.maxFeePerGas).toString(16)),
        maxPriorityFeePerGas: addHexPrefix(anyNumberToBN(transaction.maxPriorityFeePerGas).toString(16)),
        gasLimit: addHexPrefix(anyNumberToBN(transaction.gas).toString(16)),
        to: transaction.to,
        value: addHexPrefix(anyNumberToBN(transaction.value).toString(16)),
        data: transaction.data,
        chainId: _getEvmChainId(chainInfo),
        type: 2
      };
    } else {
      txObject = {
        nonce: transaction.nonce ?? 0,
        gasPrice: addHexPrefix(anyNumberToBN(transaction.gasPrice).toString(16)),
        gasLimit: addHexPrefix(anyNumberToBN(transaction.gas).toString(16)),
        to: transaction.to,
        value: addHexPrefix(anyNumberToBN(transaction.value).toString(16)),
        data: transaction.data,
        chainId: _getEvmChainId(chainInfo),
        type: 0
      };
    }

    return ethers.Transaction.from(txObject).unsignedSerialized as HexString;
  }

  private async signAndSendEvmTransaction ({ address,
    chain,
    id,
    transaction,
    url }: SWTransaction): Promise<TransactionEmitter> {
    const payload = (transaction as EvmSendTransactionRequest);
    const evmApi = this.state.chainService.getEvmApi(chain);
    const chainInfo = this.state.chainService.getChainInfoByKey(chain);
    const hasError = !!(payload.errors && payload.errors.length > 0);
    const accountPair = keyring.getPair(address);
    const account: AccountJson = { address, ...accountPair.meta };

    if (!payload.account) {
      payload.account = account;
    }

    // Allow sign transaction
    payload.canSign = true;

    // Fill contract info
    if (!payload.parseData) {
      try {
        const isToContract = await isContractAddress(payload.to || '', evmApi);

        payload.isToContract = isToContract;

        payload.parseData = isToContract
          ? payload.data
            ? (await parseContractInput(payload.data || '', payload.to || '', chainInfo)).result
            : ''
          : payload.data || '';
      } catch (e) {
        console.warn('Unable to parse contract input data');
        payload.parseData = payload.data as string;
      }
    }

    if ('data' in payload && payload.data === undefined) {
      delete payload.data;
    }

    // Set unique nonce to avoid transaction errors
    if (!payload.nonce) {
      const evmApi = this.state.chainService.getEvmApi(chain);

      if (evmApi.isApiConnected) {
        payload.nonce = await evmApi?.api.eth.getTransactionCount(address);
      }
    }

    if (!payload.chainId) {
      payload.chainId = chainInfo?.evmInfo?.evmChainId ?? 1;
    }

    // Autofill from
    if (!payload.from) {
      payload.from = address;
    }

    const isExternal = !!account.isExternal;
    const isInjected = !!account.isInjected;

    if (!hasError) {
      // generate hashPayload for EVM transaction
      payload.hashPayload = this.generateHashPayload(chain, payload);
    }

    const emitter = new EventEmitter<TransactionEventMap>();

    const txObject: Web3Transaction = {
      nonce: payload.nonce ?? 0,
      from: payload.from as string,
      gasPrice: anyNumberToBN(payload.gasPrice).toNumber(),
      maxFeePerGas: anyNumberToBN(payload.maxFeePerGas).toNumber(),
      maxPriorityFeePerGas: anyNumberToBN(payload.maxPriorityFeePerGas).toNumber(),
      gasLimit: anyNumberToBN(payload.gas).toNumber(),
      to: payload.to,
      value: anyNumberToBN(payload.value).toNumber(),
      data: payload.data,
      chainId: payload.chainId
    };

    const eventData: TransactionEventResponse = {
      id,
      errors: [],
      warnings: [],
      extrinsicHash: id
    };

    if (isInjected) {
      this.state.requestService.addConfirmation(id, url || EXTENSION_REQUEST_URL, 'evmWatchTransactionRequest', payload, {})
        .then(async ({ isApproved, payload }) => {
          if (isApproved) {
            if (!payload) {
              throw new EvmProviderError(EvmProviderErrorType.UNAUTHORIZED, 'Bad signature');
            }

            const web3Api = this.state.chainService.getEvmApi(chain).api;

            // Emit signed event
            emitter.emit('signed', eventData);

            eventData.nonce = txObject.nonce;
            eventData.startBlock = await web3Api.eth.getBlockNumber() - 3;
            // Add start info
            emitter.emit('send', eventData); // This event is needed after sending transaction with queue

            const txHash = payload;

            eventData.extrinsicHash = txHash;
            emitter.emit('extrinsicHash', eventData);

            this.watchTransactionSubscribes[id] = new Promise<void>((resolve, reject) => {
              // eslint-disable-next-line prefer-const
              let subscribe: Subscription;

              const onComplete = () => {
                subscribe?.unsubscribe?.();
                delete this.watchTransactionSubscribes[id];
              };

              const onSuccess = (rs: TransactionReceipt) => {
                if (rs) {
                  eventData.extrinsicHash = rs.transactionHash;
                  eventData.blockHash = rs.blockHash;
                  eventData.blockNumber = rs.blockNumber;
                  emitter.emit('success', eventData);
                  onComplete();
                  resolve();
                }
              };

              const onError = (error: Error) => {
                if (error) {
                  // TODO: Change type and message
                  eventData.errors.push(new TransactionError(BasicTxErrorType.UNABLE_TO_SEND, error.message));
                  emitter.emit('error', eventData);
                  onComplete();
                  reject(error);
                }
              };

              const onCheck = () => {
                web3Api.eth.getTransactionReceipt(txHash).then(onSuccess).catch(onError);
              };

              subscribe = rxjsInterval(3000).subscribe(onCheck);
            });
          } else {
            this.removeTransaction(id);
            eventData.errors.push(new TransactionError(BasicTxErrorType.USER_REJECT_REQUEST));
            emitter.emit('error', eventData);
          }
        })
        .catch((e: Error) => {
          this.removeTransaction(id);
          // TODO: Change type
          eventData.errors.push(new TransactionError(BasicTxErrorType.UNABLE_TO_SIGN, e.message));

          emitter.emit('error', eventData);
        });
    } else {
      this.state.requestService.addConfirmation(id, url || EXTENSION_REQUEST_URL, 'evmSendTransactionRequest', payload, {})
        .then(async ({ isApproved, payload }) => {
          if (isApproved) {
            let signedTransaction: string | undefined;

            if (!payload) {
              throw new EvmProviderError(EvmProviderErrorType.UNAUTHORIZED, t('Failed to sign'));
            }

            const web3Api = this.state.chainService.getEvmApi(chain).api;

            if (!isExternal) {
              signedTransaction = payload;
            } else {
              const signed = mergeTransactionAndSignature(txObject, payload as `0x${string}`);

              const recover = web3Api.eth.accounts.recoverTransaction(signed);

              if (recover.toLowerCase() !== account.address.toLowerCase()) {
                throw new EvmProviderError(EvmProviderErrorType.UNAUTHORIZED, t('Wrong signature. Please sign with the account you use in dApp'));
              }

              signedTransaction = signed;
            }

            // Emit signed event
            emitter.emit('signed', eventData);

            // Send transaction
            this.handleTransactionTimeout(emitter, eventData);

            // Add start info
            eventData.nonce = txObject.nonce;
            eventData.startBlock = await web3Api.eth.getBlockNumber();
            emitter.emit('send', eventData); // This event is needed after sending transaction with queue
            signedTransaction && web3Api.eth.sendSignedTransaction(signedTransaction)
              .once('transactionHash', (hash) => {
                eventData.extrinsicHash = hash;
                emitter.emit('extrinsicHash', eventData);
              })
              .once('receipt', (rs) => {
                eventData.extrinsicHash = rs.transactionHash;
                eventData.blockHash = rs.blockHash;
                eventData.blockNumber = rs.blockNumber;
                emitter.emit('success', eventData);
              })
              .once('error', (e) => {
                eventData.errors.push(new TransactionError(BasicTxErrorType.SEND_TRANSACTION_FAILED, t(e.message)));
                emitter.emit('error', eventData);
              })
              .catch((e: Error) => {
                eventData.errors.push(new TransactionError(BasicTxErrorType.UNABLE_TO_SEND, t(e.message)));
                emitter.emit('error', eventData);
              });
          } else {
            this.removeTransaction(id);
            eventData.errors.push(new TransactionError(BasicTxErrorType.USER_REJECT_REQUEST));
            emitter.emit('error', eventData);
          }
        })
        .catch((e: Error) => {
          this.removeTransaction(id);
          eventData.errors.push(new TransactionError(BasicTxErrorType.UNABLE_TO_SIGN, t(e.message)));

          emitter.emit('error', eventData);
        });
    }

    return emitter;
  }

  private async signAndSendSubstrateTransaction ({ address, chain, id, transaction, url }: SWTransaction): Promise<TransactionEmitter> {
    const emitter = new EventEmitter<TransactionEventMap>();
    const eventData: TransactionEventResponse = {
      id,
      errors: [],
      warnings: [],
      extrinsicHash: id
    };

    const extrinsic = transaction as SubmittableExtrinsic;
    const registry = extrinsic.registry;
    const signedExtensions = registry.signedExtensions;

    const signerOption: Partial<SignerOptions> = {
      signer: {
        signPayload: async (payload: SignerPayloadJSON) => {
          const { signature, signedTransaction } = await this.state.requestService.signInternalTransaction(id, address, url || EXTENSION_REQUEST_URL, payload);

          return {
            id: (new Date()).getTime(),
            signature,
            signedTransaction
          } as SignerResult;
        }
      } as Signer,
      withSignedTransaction: true
    };

    if (_isRuntimeUpdated(signedExtensions)) {
      const metadataHash = await this.state.chainService.calculateMetadataHash(chain);

      if (metadataHash) {
        signerOption.mode = 1;
        signerOption.metadataHash = metadataHash;
      }
    }

    extrinsic.signAsync(address, signerOption).then(async (rs) => {
      // Emit signed event
      emitter.emit('signed', eventData);

      // Send transaction
      const api = this.state.chainService.getSubstrateApi(chain);

      eventData.nonce = rs.nonce.toNumber();
      eventData.startBlock = (await api.api.query.system.number()).toPrimitive() as number;
      this.handleTransactionTimeout(emitter, eventData);
      emitter.emit('send', eventData); // This event is needed after sending transaction with queue

      rs.send((txState) => {
        // handle events, logs, history
        if (!txState || !txState.status) {
          return;
        }

        if (txState.status.isInBlock) {
          eventData.eventLogs = txState.events;

          if (!eventData.extrinsicHash || eventData.extrinsicHash === '' || !isHex(eventData.extrinsicHash)) {
            eventData.extrinsicHash = txState.txHash.toHex();
            eventData.blockHash = txState.status.asInBlock.toHex();
            emitter.emit('extrinsicHash', eventData);
          }
        }

        if (txState.status.isFinalized) {
          eventData.extrinsicHash = txState.txHash.toHex();
          eventData.eventLogs = txState.events;
          // TODO: push block hash and block number into eventData
          txState.events
            .filter(({ event: { section } }) => section === 'system')
            .forEach(({ event: { data: [error], method } }): void => {
              if (method === 'ExtrinsicFailed') {
                eventData.errors.push(new TransactionError(BasicTxErrorType.SEND_TRANSACTION_FAILED, error.toString()));
                emitter.emit('error', eventData);
              } else if (method === 'ExtrinsicSuccess') {
                emitter.emit('success', eventData);
              }
            });
        }
      }).catch((e: Error) => {
        eventData.errors.push(new TransactionError(BasicTxErrorType.SEND_TRANSACTION_FAILED, e.message));
        emitter.emit('error', eventData);
      });
    }).catch((e: Error) => {
      this.removeTransaction(id);
      eventData.errors.push(new TransactionError(BasicTxErrorType.UNABLE_TO_SIGN, e.message));
      emitter.emit('error', eventData);
    });

    return emitter;
  }

  private handleTransactionTimeout (emitter: EventEmitter<TransactionEventMap>, eventData: TransactionEventResponse): void {
    const timeout = setTimeout(() => {
      const transaction = this.getTransaction(eventData.id);

      if (transaction.status !== ExtrinsicStatus.SUCCESS && transaction.status !== ExtrinsicStatus.FAIL) {
        eventData.errors.push(new TransactionError(BasicTxErrorType.TIMEOUT, t('Transaction timeout')));
        emitter.emit('timeout', eventData);
        clearTimeout(timeout);
      }
    }, TRANSACTION_TIMEOUT);

    emitter.once('success', () => {
      clearTimeout(timeout);
    });

    emitter.once('error', () => {
      clearTimeout(timeout);
    });
  }

  private handlePostEarningTransaction (id: string) {
    const transaction = this.getTransaction(id);

    let slug: string;

    // TODO
    if ('data' in transaction.data) {
      slug = (transaction.data as RequestYieldStepSubmit).data.slug;
    } else {
      slug = (transaction.data as RequestStakePoolingBonding).slug;
    }

    const poolHandler = this.state.earningService.getPoolHandler(slug);

    if (poolHandler) {
      const type = poolHandler.type;

      if (type === YieldPoolType.NATIVE_STAKING) {
        return;
      }
    } else {
      return;
    }

    this.state.mintCampaignService.unlockDotCampaign.mintNft({
      transactionId: id,
      address: transaction.address,
      slug: slug,
      network: transaction.chain,
      extrinsicHash: transaction.extrinsicHash
    })
      .catch(console.error);
  }

  public resetWallet (): void {
    this.transactionSubject.next({});
  }
}
