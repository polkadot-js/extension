// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, EvmSendTransactionRequest, ExtrinsicStatus, TransactionResponse } from '@subwallet/extension-base/background/KoniTypes';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import NotificationService from '@subwallet/extension-base/services/notification-service/NotificationService';
import RequestService from '@subwallet/extension-base/services/request-service';
import { EXTENSION_REQUEST_URL } from '@subwallet/extension-base/services/request-service/constants';
import { getTransactionId } from '@subwallet/extension-base/services/transaction-service/helpers';
import { SendTransactionEvents, SWTransaction, SWTransactionInput, TransactionEmitter, TransactionEventResponse } from '@subwallet/extension-base/services/transaction-service/types';
import EventEmitter from 'eventemitter3';
import { BehaviorSubject } from 'rxjs';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { Signer, SignerResult } from '@polkadot/api/types';
import { SignerPayloadJSON } from '@polkadot/types/types/extrinsic';

export default class TransactionService {
  private readonly chainService: ChainService;
  private readonly requestService: RequestService;
  public readonly transactionSubject: BehaviorSubject<Record<string, SWTransaction>> = new BehaviorSubject<Record<string, SWTransaction>>({});

  private get transactions (): Record<string, SWTransaction> {
    return this.transactionSubject.getValue();
  }

  constructor (chainService: ChainService, requestService: RequestService) {
    this.chainService = chainService;
    this.requestService = requestService;
  }

  private get allTransactions (): SWTransaction[] {
    return Object.values(this.transactions);
  }

  private get processingTransactions (): SWTransaction[] {
    return this.allTransactions.filter((t) => t.status === ExtrinsicStatus.PENDING || t.status === ExtrinsicStatus.PROCESSING);
  }

  private getTransaction (id: string) {
    return this.transactions[id];
  }

  private validateTransaction (transaction: SWTransaction) {
    // Check duplicated transaction
    const existed = this.processingTransactions
      .filter((item) => item.address === transaction.address && item.chain === transaction.chain);

    if (existed.length > 0) {
      throw new TransactionError(BasicTxErrorType.DUPLICATE_TRANSACTION);
    }
  }

  private fillTransactionDefaultInfo (transaction: SWTransactionInput): SWTransaction {
    const isInternal = !transaction.url;

    return {
      ...transaction,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: transaction.url || EXTENSION_REQUEST_URL,
      status: ExtrinsicStatus.PENDING,
      isInternal,
      id: getTransactionId(transaction.chainType, transaction.chain, isInternal),
      extrinsicHash: ''
    } as SWTransaction;
  }

  public async addTransaction (inputTransaction: SWTransactionInput): Promise<TransactionEmitter> {
    // Fill transaction default info
    const transaction = this.fillTransactionDefaultInfo(inputTransaction);

    // Validate Transaction
    this.validateTransaction(transaction);

    // Add Transaction
    this.transactions[transaction.id] = transaction;
    this.transactionSubject.next({ ...this.transactions });

    // Send transaction
    return await this.sendTransaction(transaction);
  }

  public async handleTransaction (transaction: SWTransactionInput, existedState: TransactionResponse = {}): Promise<TransactionResponse> {
    const txState: TransactionResponse = existedState;

    try {
      const emitter = await this.addTransaction(transaction);

      await new Promise((resolve) => {
        emitter.on('extrinsicHash', (data: TransactionEventResponse) => {
          txState.extrinsicHash = data.extrinsicHash;
        });

        emitter.on('error', (data: TransactionEventResponse) => {
          if (data.error) {
            resolve(txState);
          }
        });
      });

      return txState;
    } catch (e) {
      txState.txError = true;
      txState.errors = [e] as TransactionError[];

      return txState;
    }
  }

  private async sendTransaction (transaction: SWTransaction): Promise<TransactionEmitter> {
    // Send Transaction
    const emitter = transaction.chainType === 'substrate' ? this.signAndSendSubstrateTransaction(transaction) : (await this.signAndSendEvmTransaction(transaction));

    emitter.on('extrinsicHash', (data: TransactionEventResponse) => {
      this.onHasTransactionHash(data);
    });

    emitter.on('success', (data: TransactionEventResponse) => {
      this.onSuccess(data);
    });

    emitter.on('error', (data: TransactionEventResponse) => {
      this.onFailed({ ...data, error: data.error || new TransactionError(BasicTxErrorType.INTERNAL_ERROR) });
    });

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
    const chainInfo = this.chainService.getChainInfoByKey(transaction.chain);

    if (transaction.chainType === ChainType.EVM) {
      const explorerLink = chainInfo?.evmInfo?.blockExplorer;

      if (explorerLink) {
        return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}tx/${transaction.extrinsicHash}`);
      }
    } else {
      const explorerLink = chainInfo?.substrateInfo?.blockExplorer;

      if (explorerLink) {
        return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}extrinsic/${transaction.extrinsicHash}`);
      }
    }

    return undefined;
  }

  private onHasTransactionHash ({ extrinsicHash, id }: TransactionEventResponse) {
    // Todo: Write pending transaction history
    this.updateTransaction(id, { extrinsicHash, status: ExtrinsicStatus.PROCESSING });
    console.log(`Transaction "${id}" is submitted with hash ${extrinsicHash || ''}`);
  }

  private onSuccess ({ id }: TransactionEventResponse) {
    // Todo: Write success transaction history
    const transaction = this.getTransaction(id);

    this.updateTransaction(id, { status: ExtrinsicStatus.SUCCESS });
    console.log('Transaction completed', id, transaction.extrinsicHash);
    NotificationService.createNotification('Transaction completed', `Transaction ${transaction?.extrinsicHash} completed`, this.getTransactionLink(id));
  }

  private onFailed ({ error, id }: TransactionEventResponse) {
    // Todo: Write failed transaction history
    const transaction = this.getTransaction(id);

    if (transaction) {
      this.updateTransaction(id, { status: ExtrinsicStatus.FAIL, errors: [error?.message || 'Unknown error'] });
      console.log('Transaction failed', id, transaction.extrinsicHash);
      NotificationService.createNotification('Transaction failed', `Transaction ${transaction?.extrinsicHash} failed`, this.getTransactionLink(id));
    }

    console.error(error);
  }

  private async signAndSendEvmTransaction ({ address, chain, id, transaction, url }: SWTransaction): Promise<TransactionEmitter> {
    const payload = (transaction as EvmSendTransactionRequest);

    // Set unique nonce to avoid transaction errors
    if (!payload.nonce) {
      const evmApi = this.chainService.getEvmApi(chain);

      payload.nonce = await evmApi.api.eth.getTransactionCount(address);
    }

    if (!payload.chainId) {
      const chainInfo = this.chainService.getChainInfoByKey(chain);

      payload.chainId = chainInfo.evmInfo?.evmChainId ?? 1;
    }

    // Auto fill from
    if (!payload.from) {
      payload.from = address;
    }

    const emitter = new EventEmitter<SendTransactionEvents, TransactionEventResponse>();

    this.requestService.addConfirmation(id, url || EXTENSION_REQUEST_URL, 'evmSendTransactionRequest', payload, {})
      .then(({ isApproved, payload }) => {
        if (isApproved) {
          payload && this.chainService.getEvmApi(chain).api.eth.sendSignedTransaction(payload)
            .once('transactionHash', (hash) => {
              emitter.emit('extrinsicHash', { id, extrinsicHash: hash });
            })
            .once('receipt', (rs) => {
              emitter.emit('success', { id, transactionHash: rs.transactionHash });
            })
            .once('error', (e) => {
              emitter.emit('error', { id, error: new TransactionError(BasicTxErrorType.SEND_TRANSACTION_FAILED, e.message) });
            })
            .catch((e: Error) => {
              emitter.emit('error', { id, error: new TransactionError(BasicTxErrorType.UNABLE_TO_SEND, e.message) });
            });
        } else {
          this.removeTransaction(id);
          emitter.emit('error', new TransactionError(BasicTxErrorType.USER_REJECT_REQUEST, 'User Rejected'));
        }
      })
      .catch((e: Error) => {
        this.removeTransaction(id);
        const error = new TransactionError(BasicTxErrorType.UNABLE_TO_SIGN, e.message);

        emitter.emit('error', { id, error: error });
      });

    return emitter;
  }

  private signAndSendSubstrateTransaction ({ address, id, transaction, url }: SWTransaction): TransactionEmitter {
    const emitter = new EventEmitter<SendTransactionEvents, TransactionEventResponse>();

    (transaction as SubmittableExtrinsic).signAsync(address, {
      signer: {
        signPayload: async (payload: SignerPayloadJSON) => {
          const signing = await this.requestService.signInternalTransaction(id, url || EXTENSION_REQUEST_URL, address, payload);

          return {
            id: (new Date()).getTime(),
            signature: signing.signature
          } as SignerResult;
        }
      } as Signer
    }).then((rs) => {
      // Todo: Handle and emit event from runningTransaction
      rs.send().then((result) => {
        emitter.emit('extrinsicHash', { id, extrinsicHash: result.toHex() });
      }).then(() => {
        emitter.emit('success', { id });
      }).catch((e: Error) => {
        emitter.emit('error', { id, error: e });
      });
    }).catch((e: Error) => {
      this.removeTransaction(id);
      emitter.emit('error', { id, error: e });
    });

    return emitter;
  }
}
