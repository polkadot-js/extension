// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApolloClient, createHttpLink, gql, InMemoryCache } from '@apollo/client';
import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainType, ExtrinsicStatus, ExtrinsicType, TransactionDirection, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import fetch from 'cross-fetch';

const MULTI_CHAIN_URL = 'https://squid.subsquid.io/multi-chain-tx/v/v1/graphql';

const MultiChainTxClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: createHttpLink({
    uri: MULTI_CHAIN_URL,
    fetch: fetch
  })
});

interface QueryInput {
  addresses: string[];
  limit: number
}

export interface MultiHistoryData {
  _data: string;
  args: string;
  chainId: string;
  id: string;
  signer: string;
  name: string;
  timestamp: number;
  blockNumber: number;
  blockHash: string;
  explorerUrl: string;
  relatedAddresses: string[];
}

interface HistoryArgs {
  from: string;
  to: string;
  amount: string;
}

interface BalanceTransferData {
  call: { name: string },
  extrinsic: {
    error: any,
    fee: string,
    tip: string,
    hash: string,
    id: string,
    indexInBlock: number,
    signature: string,
    signatureType: string,
    signer: string,
    success: boolean,
    version: number
  }
}

interface TransactionByAddress {
  transactionsByAddress: MultiHistoryData[]
}
const query = gql`query transactionQuery($addresses: [String!], $limit: Float = 500) {
  transactionsByAddress(addresses: $addresses, limit: $limit) {
    _data
    args
    chainId
    id
    name
    signer
    blockNumber
    blockHash
    timestamp
    relatedAddresses
  }
}`;

export async function fetchMultiChainHistories (addresses: string[], chainMap: Record<string, _ChainInfo>, limit = 500) {
  const response = await MultiChainTxClient.query<TransactionByAddress, QueryInput>({ query, variables: { addresses, limit } });
  const responseData = response.data.transactionsByAddress;
  const histories = [] as TransactionHistoryItem[];

  responseData.forEach(({ _data, args, blockHash, blockNumber, chainId, name, relatedAddresses, signer, timestamp }) => {
    if (name === 'Balances.Transfer') {
      const { extrinsic: { fee, hash, signature, success, tip } } = JSON.parse(_data) as BalanceTransferData;
      const { amount } = JSON.parse(args) as HistoryArgs;
      const usedAddresses = relatedAddresses.filter((a) => addresses.includes(a));
      const chainInfo = chainMap[chainId];

      if (!chainInfo) {
        console.warn(`Chain ${chainId} is not supported yet`);

        return;
      }

      const chainType = chainInfo.substrateInfo ? ChainType.SUBSTRATE : ChainType.EVM;
      const nativeDecimals = chainInfo.substrateInfo?.decimals || chainInfo.evmInfo?.decimals || 18;
      const nativeSymbol = chainInfo.substrateInfo?.symbol || chainInfo.evmInfo?.symbol || '';

      usedAddresses.forEach((address) => {
        const direction = address === signer ? TransactionDirection.SEND : TransactionDirection.RECEIVED;
        const toAddress = address === signer ? relatedAddresses.filter((a) => a !== signer)[0] || '' : address;

        histories.push({
          address,
          type: ExtrinsicType.TRANSFER_BALANCE,
          origin: MULTI_CHAIN_URL,
          time: timestamp,
          signature,
          chainType,
          from: signer,
          to: toAddress,
          direction,
          blockNumber,
          blockHash,
          chain: chainId,
          data: _data,
          amount: {
            value: amount,
            decimals: nativeDecimals,
            symbol: nativeSymbol
          },
          fee: {
            value: fee,
            decimals: nativeDecimals,
            symbol: nativeSymbol
          },
          tip: {
            value: tip,
            decimals: nativeDecimals,
            symbol: nativeSymbol
          },
          status: success ? ExtrinsicStatus.SUCCESS : ExtrinsicStatus.FAIL,
          extrinsicHash: hash
        });
      });
    } else {
      console.warn(`Not support extrinsic type ${name}`);
    }
  });

  return histories;
}
