// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import fetch from 'cross-fetch';

export function newApolloClient (uri: string) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({
      uri: uri,
      fetch: fetch
    })
  });
}
