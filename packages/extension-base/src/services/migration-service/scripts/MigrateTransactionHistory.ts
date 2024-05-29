// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainType, ExtrinsicStatus, ExtrinsicType, TransactionDirection, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';
import Dexie from 'dexie';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface OldTransactionItem {
  chainHash: string;
  chain: string;
  address: string;
  eventIdx: number;
  time: number;
  networkKey: string;
  change: string;
  changeSymbol: string;
  fee: string;
  feeSymbol: string;
  isSuccess: boolean;
  extrinsicHash: string;
  action: 'send' | 'receive';
  origin: string;
}

export default class MigrateTransactionHistory extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const state = this.state;
    const chainInfoMap = state.getChainInfoMap();
    const assetList = Object.values(state.getAssetRegistry());

    try {
      const db = new Dexie('SubWalletDB_v2');
      const dexieDB = await db.open();
      const transactionTable = dexieDB.table('transactions');
      const oldTransactionData = (await transactionTable.toArray()) as OldTransactionItem[];
      const newTransactionItems: TransactionHistoryItem[] = [];

      oldTransactionData.forEach((item) => {
        const chainInfo = chainInfoMap[item.networkKey];

        if (!chainInfo) {
          return;
        }

        const direction = item.action === 'send' ? TransactionDirection.SEND : TransactionDirection.RECEIVED;
        const extrinsicType = item.changeSymbol === item.feeSymbol ? ExtrinsicType.TRANSFER_BALANCE : ExtrinsicType.TRANSFER_TOKEN;
        const nativeAsset = _getChainNativeTokenBasicInfo(chainInfo);
        const transferAsset = assetList.find((a) => (a.originChain === item.networkKey && a.symbol === item.changeSymbol)) || nativeAsset;

        const newItem: TransactionHistoryItem = {
          chain: item.networkKey,
          origin: 'migration',
          type: extrinsicType,
          address: item.address,
          extrinsicHash: item.extrinsicHash,
          time: item.time,
          status: item.isSuccess ? ExtrinsicStatus.SUCCESS : ExtrinsicStatus.FAIL,
          from: direction === TransactionDirection.SEND ? item.address : '',
          to: direction === TransactionDirection.RECEIVED ? item.address : '',
          amount: {
            value: item.change,
            decimals: transferAsset.decimals || 18,
            symbol: transferAsset.symbol
          },
          fee: {
            value: item.fee,
            decimals: nativeAsset.decimals,
            symbol: nativeAsset.symbol
          },
          direction: direction,
          chainType: isEthereumAddress(item.address) ? ChainType.EVM : ChainType.SUBSTRATE,
          chainName: chainInfo.name,
          blockNumber: 0,
          blockHash: '',
          data: '',
          signature: ''
        };

        newTransactionItems.push(newItem);
      });

      await state.historyService.addHistoryItems(newTransactionItems);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
