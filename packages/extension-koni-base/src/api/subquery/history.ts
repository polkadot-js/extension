// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { gql } from '@apollo/client';
import { NetworkJson, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
// eslint-disable-next-line import-newlines/enforce
import { DotSamaHistory,
// eslint-disable-next-line camelcase
  DotSamaHistory_historyElements_nodes,
  DotSamaHistoryVariables } from '@subwallet/extension-koni-base/api/subquery/__generated__/DotSamaHistory';
import { newApolloClient } from '@subwallet/extension-koni-base/api/subquery/subquery';
import { isAccountAll, reformatAddress } from '@subwallet/extension-koni-base/utils/utils';

export const HistoryApiMap: Record<string, string> = {
  polkadot: 'https://api.subquery.network/sq/nova-wallet/nova-westend',
  kusama: 'https://api.subquery.network/sq/nova-wallet/nova-kusama',
  westend: 'https://api.subquery.network/sq/nova-wallet/nova-westend',
  picasso: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-picasso',
  calamari: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-calamari',
  khala: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-khala',
  parallel: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-parallel',
  bifrost: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-bifrost',
  clover: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-clover',
  basilisk: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-basilisk',
  acala: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-acala',
  astar: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-astar',
  karura: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-karura',
  altair: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-altair',
  kilt: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-kilt',
  robonomics: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-robonomics',
  statemint: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-statemint',
  quartz: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-quartz',
  zeigeist: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-zeitgeist',
  shiden: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-shiden',
  statemine: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-statemine',
  moonbeam: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-moonbeam',
  moonriver: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-moonriver',
  pioneer: 'https://api.subquery.network/sq/nova-wallet/nova-wallet-bit-country'
};

function getApolloClient (networkKey: string) {
  return newApolloClient(HistoryApiMap[networkKey]);
}

export const DOTSAMA_HISTORY_QUERY = gql`
    query DotSamaHistory($first: Int = 100, $address: String = null) {
        historyElements (first: $first, filter: {address: {equalTo: $address}}) {
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

// eslint-disable-next-line camelcase
function getHistoryAction (address: string, node: DotSamaHistory_historyElements_nodes): 'send' | 'received' {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return address === node?.transfer.from ? 'send' : 'received';
}

export const fetchDotSamaHistory = (address: string, networkMap: Record<string, NetworkJson>, callBack: (network: string, items: TransactionHistoryItemType[]) => void) => {
  if (isAccountAll(address)) {
    return;
  }

  Object.entries(networkMap).forEach(([networkKey, networkInfo]) => {
    if (networkInfo.active && HistoryApiMap[networkKey]) {
      const formattedAddress = reformatAddress(address, networkInfo.ss58Format, networkInfo.isEthereum);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      // @ts-ignore
      getApolloClient(networkKey).query<DotSamaHistory, DotSamaHistoryVariables>({
        query: DOTSAMA_HISTORY_QUERY,
        variables: {
          first: 0,
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            action: getHistoryAction(formattedAddress, n),
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
            origin: 'network'
          });
        });

        callBack(networkKey, items);
      }).catch((e: any) => {
        console.log(`History API of ${networkKey} is error`, e);
      });
    }
  });
};
