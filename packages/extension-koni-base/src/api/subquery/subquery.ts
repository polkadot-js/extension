// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApolloClient, createHttpLink, gql, InMemoryCache } from '@apollo/client';
import fetch from 'cross-fetch';

import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
// eslint-disable-next-line camelcase
import { DotSamaCrowdloan, DotSamaCrowdloan_crowdloans_nodes, DotSamaCrowdloanVariables } from '@polkadot/extension-koni-base/api/subquery/__generated__/DotSamaCrowdloan';

function newApolloClient (uri: string) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({
      uri: uri,
      fetch: fetch
    })
  });
}

export const SubQueryClientMap = {
  polkadotCrowdloan: newApolloClient('https://api.subquery.network/sq/subvis-io/polkadot-auctions-and-crowdloans'),
  kusamaCrowdloan: newApolloClient('https://api.subquery.network/sq/subvis-io/kusama-crowdloans-and-auctions-v2')
};

export const DOTSAMA_CROWDLOAN_QUERY = gql`
    query DotSamaCrowdloan($first: Int = 100, $offset: Int = 0) {
        crowdloans (first: $first, offset: $offset) {
            nodes {
                id
                parachainId
                depositor
                verifier
                cap
                raised
                lockExpiredBlock
                blockNum
                firstSlot
                lastSlot
                status
                leaseExpiredBlock
                dissolvedBlock
                updatedAt
                createdAt
                isFinished
                wonAuctionId
            }
        }
    }
`;

export const fetchDotSamaCrowdloan = async () => {
  const paraMap: Record<string, string> = {};

  Object.entries(NETWORKS).forEach(([networkKey, network]) => {
    let prefix = '';

    if (network.groups.indexOf('POLKADOT_PARACHAIN') > -1) {
      prefix = 'polkadot-';
    }

    if (network.groups.indexOf('KUSAMA_PARACHAIN') > -1) {
      prefix = 'kusama-';
    }

    if (network.paraId) {
      paraMap[prefix + String(network.paraId)] = networkKey;
    }
  });

  // eslint-disable-next-line camelcase
  const crowdloanMap: Record<string, DotSamaCrowdloan_crowdloans_nodes> = {};

  const [polkadotCrowdloan, kusamaCrowdloan] = await Promise.all([
    SubQueryClientMap.polkadotCrowdloan.query<DotSamaCrowdloan, DotSamaCrowdloanVariables>({
      query: DOTSAMA_CROWDLOAN_QUERY
    }),
    SubQueryClientMap.kusamaCrowdloan.query<DotSamaCrowdloan, DotSamaCrowdloanVariables>({
      query: DOTSAMA_CROWDLOAN_QUERY
    })
  ]);

  const paraList: string[] = [];

  polkadotCrowdloan?.data?.crowdloans?.nodes.forEach((node) => {
    let parachainId = node?.parachainId.substring(0, 4);

    parachainId = parachainId ? `polkadot-${parachainId}` : '';
    paraList.push(parachainId);

    if (parachainId && paraMap[parachainId]) {
      // @ts-ignore
      crowdloanMap[paraMap[parachainId]] = node;
    } else {
      console.warn('Not found parachainID', parachainId);
    }
  });
  kusamaCrowdloan?.data?.crowdloans?.nodes.forEach((node) => {
    let parachainId = node?.parachainId.substring(0, 4);

    parachainId = parachainId ? `kusama-${parachainId}` : '';
    paraList.push(parachainId);

    if (parachainId && paraMap[parachainId]) {
      // @ts-ignore
      crowdloanMap[paraMap[parachainId]] = node;
    } else {
      console.warn('Not found parachainID', parachainId);
    }
  });

  return crowdloanMap;
};
