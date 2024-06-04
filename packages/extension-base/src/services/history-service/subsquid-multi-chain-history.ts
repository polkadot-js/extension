// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApolloClient, createHttpLink, gql, InMemoryCache } from '@apollo/client';
import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainType, ExtrinsicStatus, ExtrinsicType, TransactionDirection, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { MAX_FETCH_PAGE_PER_SESSION, MIN__NUM_HISTORY_PER_ACCOUNT } from '@subwallet/extension-base/services/history-service/constants';

import { isArray } from '@polkadot/util';
import { decodeAddress, encodeAddress, isEthereumAddress } from '@polkadot/util-crypto';

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
  olderThanId?: string,
}

export interface MultiHistoryData {
  _data: string;
  args: string;
  chainId: string;
  id: string;
  signer: string;
  name: string;
  timestamp: number | string;
  blockNumber: number;
  blockHash: string;
  explorerUrl: string;
  relatedAddresses: string[];
}

interface TransferArgs {
  from: string;
  to: string;
  amount: string;
}

interface EthereumArgs {
  from: string;
  to: string;
  transactionHash: string;
}

interface TransferTransactionData {
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

interface EthereumTransactionData {
  call: {
    data: {
      args: {
        transaction: {
          value: {
            gasLimit: string,
            gasPrice: string,
            value: string,
            signature: {
              r: string,
              s: string,
              v: string
            }
          }
        }
      }
    }
  },
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

interface StakingBondedTransactionData {
  call: {
    data: {
      args: {
        value: string,
      }
    }
  },
  extrinsic: {
    fee: string,
    tip: string,
    hash: string,
    signature: string,
    success: boolean,
  }
}

interface TransactionByAddress {
  transactionsByAddress: MultiHistoryData[]
}

const query = gql`query transactionQuery($addresses: [String!], $olderThanId: String) {
  transactionsByAddress(addresses: $addresses, olderThanId: $olderThanId) {
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

export enum SubsquidTransactionType {
  BalanceTransfer = 'Balances.Transfer',
  EthereumExecuted = 'Ethereum.Executed',
  StakingBonded = 'Staking.Bonded',
  CrowdloanContributed = 'Crowdloan.Contributed'
}

export interface ParseInputType {
  type: SubsquidTransactionType,
  data: MultiHistoryData,
  chainInfo: _ChainInfo
}

const HISTORY_SUPPORT_TYPES = [
  SubsquidTransactionType.BalanceTransfer,
  SubsquidTransactionType.EthereumExecuted,
  SubsquidTransactionType.StakingBonded
  // SubsquidTransactionType.CrowdloanContributed // Not support because data indexer not enough data
];

export type TransactionBasicData = Pick<TransactionHistoryItem, 'address' | 'origin' | 'time' | 'chainType' | 'from' | 'direction' | 'blockNumber' | 'blockHash' | 'chain' | 'data'>
export type TransactionSpecifyType = Pick<TransactionHistoryItem, 'to' | 'type' | 'status' | 'fee' | 'amount' | 'tip' | 'signature' | 'extrinsicHash'>

function parseData (anyData: string): any {
  try {
    return JSON.parse(anyData);
  } catch (e) {
    return undefined;
  }
}

function autoFormatAddress (address: string): string {
  try {
    if (isEthereumAddress(address)) {
      return address;
    } else {
      const decoded = decodeAddress(address);

      return encodeAddress(decoded, 42);
    }
  } catch (e) {
    return '';
  }
}

function generateSignature (input: { r: string, s: string, v: string }): string {
  if (!input) {
    return '';
  }

  const { r, s, v } = input;
  const rHex = r.startsWith('0x') ? r.slice(2) : r;
  const sHex = s.startsWith('0x') ? s.slice(2) : s;
  const vHex = (parseInt(v)).toString(16);

  return `0x${rHex}${sHex}${vHex}`;
}

const parseArgs = (args: unknown): TransferArgs => {
  if (isArray(args)) {
    return {
      from: args[0] as string,
      to: args[1] as string,
      amount: args[2] as string
    };
  } else {
    return args as TransferArgs;
  }
};

export function parseSubsquidTransactionData (address: string, type: SubsquidTransactionType, historyItem: MultiHistoryData, chainInfo: _ChainInfo, args: any, data: any): TransactionHistoryItem {
  const chainType = chainInfo.substrateInfo ? ChainType.SUBSTRATE : ChainType.EVM;
  const nativeDecimals = chainInfo.substrateInfo?.decimals || chainInfo.evmInfo?.decimals || 18;
  const nativeSymbol = chainInfo.substrateInfo?.symbol || chainInfo.evmInfo?.symbol || '';
  let from = historyItem.signer;
  let to = address === historyItem.signer ? historyItem.relatedAddresses.find((a) => a !== historyItem.signer) || '' : address;
  let amount = '0';
  let fee = '0';
  let tip = '0';
  let transactionType = ExtrinsicType.UNKNOWN;
  let extrinsicHash = '';
  let signature = '';
  let success = false;

  switch (type) {
    // Parsed Transfer
    case SubsquidTransactionType.BalanceTransfer: {
      transactionType = ExtrinsicType.TRANSFER_BALANCE;
      const extrinsic = (data as TransferTransactionData).extrinsic;
      const parsedArgs = parseArgs(args);

      to = autoFormatAddress(parsedArgs.to);
      from = autoFormatAddress(parsedArgs.from);
      amount = parsedArgs.amount;
      fee = extrinsic.fee;
      tip = extrinsic.tip;
      extrinsicHash = extrinsic.hash;
      signature = extrinsic.signature;
      success = extrinsic.success;

      break;
    }

    case SubsquidTransactionType.EthereumExecuted: {
      // Parsed EVM Transaction
      transactionType = ExtrinsicType.EVM_EXECUTE;
      const extrinsic = (data as EthereumTransactionData).extrinsic;
      const parsedArgs = args as EthereumArgs;
      const transaction = (data as EthereumTransactionData).call.data.args.transaction.value;

      to = autoFormatAddress(parsedArgs.to);
      from = autoFormatAddress(parsedArgs.from || address);
      extrinsicHash = parsedArgs.transactionHash || extrinsic.hash;
      amount = transaction.value || '0';
      fee = (parseInt(transaction.gasPrice) * parseInt(transaction.gasLimit)).toString();
      signature = generateSignature(transaction.signature);
      success = extrinsic.success;

      // Special fix for moonbeam
      if ((historyItem.chainId === 'moonbeam' || historyItem.chainId === 'moonriver') && typeof amount === 'object') {
        amount = amount[0];
      }

      break;
    }

    // Parsed Stake
    case SubsquidTransactionType.CrowdloanContributed: {
      transactionType = ExtrinsicType.CROWDLOAN;
      const callData = (data as StakingBondedTransactionData).call.data.args;
      const extrinsic = (data as StakingBondedTransactionData).extrinsic;

      to = autoFormatAddress('');
      extrinsicHash = extrinsic.hash;
      amount = callData.value;
      fee = extrinsic.fee;
      signature = extrinsic.signature;
      success = extrinsic.success;

      break;
    }

    case SubsquidTransactionType.StakingBonded: {
      transactionType = ExtrinsicType.STAKING_BOND;
      const callData = (data as StakingBondedTransactionData).call.data.args;
      const extrinsic = (data as StakingBondedTransactionData).extrinsic;

      to = autoFormatAddress('');
      extrinsicHash = extrinsic.hash;
      amount = callData.value;
      fee = extrinsic.fee;
      signature = extrinsic.signature;
      success = extrinsic.success;

      break;
    }
  }

  function toTimestamp (input: string | number): number {
    try {
      if (typeof input === 'string') {
        return new Date(input).getTime();
      } else {
        return input;
      }
    } catch (e) {
      return 0;
    }
  }

  return {
    address,
    origin: 'subsquid',
    time: toTimestamp(historyItem.timestamp),
    chainType,
    from,
    direction: address === from ? TransactionDirection.SEND : TransactionDirection.RECEIVED,
    blockNumber: historyItem.blockNumber,
    blockHash: historyItem.blockHash,
    chain: historyItem.chainId,
    data: historyItem._data,
    type: transactionType,
    to,
    signature,
    extrinsicHash,
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
    status: success ? ExtrinsicStatus.SUCCESS : ExtrinsicStatus.FAIL
  };
}

export async function fetchMultiChainHistories (addresses: string[], chainMap: Record<string, _ChainInfo>, maxPage = MAX_FETCH_PAGE_PER_SESSION, countMap: Record<string, number> = {}, _lastId?: string) {
  const responseData: MultiHistoryData[] = [];

  let currentPage = 0;
  let lastId: string | undefined = _lastId;

  while (true) {
    try {
      if (maxPage) {
        if (currentPage >= maxPage) {
          break;
        }

        currentPage++;
      }

      const response = await MultiChainTxClient.query<TransactionByAddress, QueryInput>({
        query,
        variables: { addresses, olderThanId: lastId }
      });
      const needProcessedData = response.data.transactionsByAddress || [];

      if (needProcessedData.length > 0) {
        lastId = response.data.transactionsByAddress[needProcessedData.length - 1].id;
        responseData.push(...needProcessedData);
      } else {
        break;
      }
    } catch (e) {
      break;
    }
  }

  const histories = [] as TransactionHistoryItem[];
  const lowerAddresses = addresses.map((a) => a.toLowerCase());

  for (const lowerAddress of lowerAddresses) {
    countMap[lowerAddress] = countMap[lowerAddress] || 0;
  }

  responseData.forEach((historyItem) => {
    const { _data, args, chainId, name, relatedAddresses } = historyItem;

    // Ignore not support type
    if (!HISTORY_SUPPORT_TYPES.includes(name as SubsquidTransactionType)) {
      return;
    }

    const usedAddresses = relatedAddresses.filter((a) => lowerAddresses.includes(a.toLowerCase()));

    const chainInfo = chainMap[chainId];

    if (chainInfo === undefined) {
      console.debug(`Not found chain info for chain id: ${chainId}`); // TODO: resolve conflicting chainId

      return;
    }

    usedAddresses.forEach((address) => {
      const adr = address.toLowerCase();

      countMap[adr] = (countMap[adr] || 0) + 1;
    });

    usedAddresses.forEach((address) => {
      try {
        const transactionData = parseSubsquidTransactionData(address, name as SubsquidTransactionType, historyItem, chainInfo, parseData(args), parseData(_data));

        histories.push(transactionData);
      } catch (e) {
        console.debug('Parse transaction data failed', address, e);
      }
    });
  });

  if (currentPage > 1) {
    const retryAddresses: string[] = [];

    for (const [address, number] of Object.entries(countMap)) {
      if (number < MIN__NUM_HISTORY_PER_ACCOUNT) {
        retryAddresses.push(address);
      }
    }

    const _addresses = addresses.filter((add) => retryAddresses.includes(add.toLowerCase()));

    if (_addresses.length > 0) {
      const retryHistories = await fetchMultiChainHistories(_addresses, chainMap, maxPage, countMap, lastId);

      histories.push(...retryHistories);
    }
  }

  return histories;
}
