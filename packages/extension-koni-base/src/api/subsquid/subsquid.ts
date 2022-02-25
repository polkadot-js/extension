// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApolloClient, createHttpLink, gql, InMemoryCache } from '@apollo/client';
import axios from 'axios';
import fetch from 'cross-fetch';

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: createHttpLink({
    uri: 'https://app.gc.subsquid.io/beta/subwallet-polkadot/v4/graphql',
    fetch: fetch
  })
});

export const SUBSQUID_STAKING_QUERY = gql`
  query MyQuery {
    rewards(limit: 10, orderBy: date_DESC, where: {account_eq: "17bR6rzVsVrzVJS1hM4dSJU43z2MUmz7ZDpPLh8y2fqVg7m"}) {
      amount
      account
      blockNumber
      date
    }
  }
`;

export const getSubsquidStakingReward = async (account: string): Promise<Record<string, any>> => {
  const resp = await axios({
    url: 'https://app.gc.subsquid.io/beta/subwallet-polkadot/v4/graphql',
    method: 'post',
    data: {
      query: `
        query MyQuery {
          rewards(limit: 10, where: {account_eq: "${account}"}, orderBy: blockNumber_DESC) {
            blockNumber
            amount
            account
            id
            date
          }
        }
      `
    }
  });

  if (resp.status === 200) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return resp.data.data as Record<string, any>;
  }

  return {};
};
