// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { gql } from '@apollo/client';
import { NetworkJson, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
// eslint-disable-next-line camelcase
import { DotSamaHistory, DotSamaHistory_transfers, DotSamaHistoryVariables } from '@subwallet/extension-koni-base/api/subquery/__generated__/DotSamaHistory';
import { newApolloClient } from '@subwallet/extension-koni-base/api/subquery/subquery';
import { isAccountAll, reformatAddress } from '@subwallet/extension-koni-base/utils';

export const HistoryApiMapSubsquid: Record<string, string> = {
  // polkadot: 'https://squid.subsquid.io/polkadot-explorer/graphql',
  // kusama: 'https://squid.subsquid.io/kusama-explorer/graphql'
  // moonriver: 'https://squid.subsquid.io/moonriver-explorer/graphql',
  // moonbeam: 'https://squid.subsquid.io/moonbeam-explorer/graphql',
};
export const HistoryApiMap: Record<string, string> = {
  // polkadot: 'https://api.subquery.network/sq/nova-wallet/nova-westend',
  // kusama: 'https://api.subquery.network/sq/nova-wallet/nova-kusama',
  // westend: 'https://api.subquery.network/sq/nova-wallet/nova-westend',
  // picasso: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-picasso',
  // calamari: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-calamari',
  // khala: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-khala',
  // parallel: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-parallel',
  // bifrost: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-bifrost',
  // clover: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-clover',
  // basilisk: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-basilisk',
  // acala: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-acala',
  // astar: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-astar',
  // karura: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-karura',
  // altair: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-altair',
  // kilt: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-kilt',
  // robonomics: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-robonomics',
  // statemint: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-statemint',
  // quartz: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-quartz',
  // zeigeist: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-zeitgeist',
  // shiden: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-shiden',
  // statemine: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-statemine',
  // moonbeam: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-moonbeam',
  // moonriver: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-moonriver',
  // pioneer: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-bit-country'
};

function getApolloClient (networkKey: string, isSubquid = false) {
  const url = isSubquid ? HistoryApiMapSubsquid[networkKey] : HistoryApiMap[networkKey];

  return newApolloClient(url);
}

export const DOTSAMA_HISTORY_QUERY = gql`
    query DotSamaHistory($last: Int = 100, $address: String = null) {
        historyElements (last: $last, filter: {address: {equalTo: $address}}) {
            nodes {
                id
                blockNumber
                extrinsicIdx
                extrinsicHash
                timestamp
                address
                reward
                extrinsic
                transfer
            }
        }
    }
`;

export const DOTSAMA_SUBSQUID_HISTORY_QUERY = gql`
    query DotsamaSubquidQuery($address: String = null, $last: Int = 100) {
        transfers(limit: $last, where: {id_eq: $address, OR: {to: {id_eq: $address}}}, orderBy: blockNumber_DESC) {
        id
        asset {
          ... on TransferAssetToken {
            symbol
            amount
          }
        }
        blockNumber
        extrinsicHash
        from {
          ... on TransferLocationAccount {
            id
          }
        }
        success
        timestamp
        to {
          ... on TransferLocationAccount {
            id
          }
        }
        type
      }
    }
`;

// eslint-disable-next-line camelcase
function getHistoryAction (address: string, addressFrom: string): 'send' | 'received' {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return address === addressFrom ? 'send' : 'received';
}

export const fetchDotSamaHistory = (address: string, networkMap: Record<string, NetworkJson>, callBack: (network: string, items: TransactionHistoryItemType[]) => void) => {
  if (isAccountAll(address)) {
    return;
  }

  Object.entries(networkMap).forEach(([networkKey, networkInfo]) => {
    if (networkInfo.active && HistoryApiMap[networkKey]) {
      const formattedAddress = reformatAddress(address, networkInfo.ss58Format, networkInfo.isEthereum);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      getApolloClient(networkKey).query<DotSamaHistory, DotSamaHistoryVariables>({
        // @ts-ignore
        query: DOTSAMA_HISTORY_QUERY,
        variables: {
          last: 100,
          address: formattedAddress
        }
      }).then((rs) => {
        if (!rs?.data?.historyElements?.nodes) {
          return;
        }

        const items: TransactionHistoryItemType[] = [];

        rs?.data?.historyElements?.nodes.filter((n) => !!n).forEach((n) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!n?.transfer || !n.extrinsicHash) {
            return;
          }

          items.push({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
            action: getHistoryAction(formattedAddress, n?.transfer.from),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            change: n.transfer.success ? n.transfer.amount : '0',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            extrinsicHash: n.extrinsicHash,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            fee: n.transfer.fee,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            isSuccess: n.transfer.success,
            networkKey,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            time: (+n.timestamp) * 1000,
            origin: 'network',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            eventIdx: n.transfer.eventIdx
          });
        });

        callBack(networkKey, items);
      }).catch((e: any) => {
        console.log(`History API of ${networkKey} is error`, e);
      });
    }

    if (networkInfo.active && HistoryApiMapSubsquid[networkKey]) {
      const formattedAddress = reformatAddress(address, networkInfo.ss58Format, networkInfo.isEthereum);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,camelcase
      getApolloClient(networkKey, true).query<DotSamaHistory_transfers, DotSamaHistoryVariables>({
        // @ts-ignore
        query: DOTSAMA_SUBSQUID_HISTORY_QUERY,
        variables: {
          last: 100,
          address: formattedAddress
        }
      }).then((rs) => {
        if (!rs?.data?.transfers) {
          return;
        }

        const items: TransactionHistoryItemType[] = [];

        rs?.data?.transfers?.filter((n) => !!n).forEach((n) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!n?.extrinsicHash) {
            return;
          }

          items.push({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            action: getHistoryAction(formattedAddress, n.from.id),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            change: n.success ? n.asset.amount : '0',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            extrinsicHash: n.extrinsicHash,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            fee: n.fee || '',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            isSuccess: n.success,
            networkKey,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            time: n.timestamp,
            origin: 'network',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            eventIdx: 1
          });
        });

        callBack(networkKey, items);
      }).catch((e: any) => {
        console.log(`History API subquid of ${networkKey} is error`, e);
      });
    }
  });
};
