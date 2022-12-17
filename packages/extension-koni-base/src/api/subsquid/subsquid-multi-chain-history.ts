// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApolloClient, createHttpLink, gql, InMemoryCache } from '@apollo/client';
import { TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import fetch from 'cross-fetch';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: createHttpLink({
    uri: 'https://squid.subsquid.io/multi-chain-tx/v/v1/graphql',
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
  relatedAddresses: string[];
}

interface HistoryArgs {
  from: string;
  to: string;
  amount: string;
}

interface HistoryData {
  call: { name: string },
  extrinsic: {
    error: any,
    fee: string,
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
    timestamp
    relatedAddresses
  }
}`;

export async function fetchMultiChainHistories (addresses: string[], limit = 500) {
  const response = await client.query<TransactionByAddress, QueryInput>({ query, variables: { addresses, limit } });
  const responseData = response.data.transactionsByAddress;
  const histories = {} as Record<string, TransactionHistoryItemType[]>;

  addresses.forEach((address) => {
    const addressData: TransactionHistoryItemType[] = [];

    responseData.forEach(({ _data, args, blockNumber, chainId, name, relatedAddresses, signer, timestamp }) => {
      if ((address === signer || relatedAddresses.indexOf(address) > -1) && name === 'Balances.Transfer') {
        const { extrinsic: { fee, hash, success } } = JSON.parse(_data) as HistoryData;
        const { amount } = JSON.parse(args) as HistoryArgs;

        addressData.push({
          time: timestamp,
          networkKey: chainId,
          change: amount,
          fee,
          isSuccess: success,
          action: address === signer ? 'send' : 'received',
          extrinsicHash: hash,
          origin: 'network',
          eventIdx: 0
        });
      }
    });
    histories[address] = addressData;
  }, {} as Record<string, TransactionHistoryItemType[]>);

  return histories;
}
