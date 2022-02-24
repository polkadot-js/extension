// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApolloClient, createHttpLink, gql, InMemoryCache } from '@apollo/client';
import fetch from 'cross-fetch';

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: createHttpLink({
    uri: 'https://api.subquery.network/sq/subvis-io/polkadot-auctions-and-crowdloans',
    fetch: fetch
  })
});

export const FETCH_FUNDS_QUERY = gql`
    query FundInfos($first: Int = 100, $offset: Int = null) {
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
