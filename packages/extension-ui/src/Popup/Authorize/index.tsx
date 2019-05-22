// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AuthRequestsFromCtx } from '../../components/types';

import React from 'react';

import { Header, withAuthRequests } from '../../components';
import Request from './Request';

type Props = {
  requests: AuthRequestsFromCtx
};

function Authorize ({ requests }: Props) {
  return (
    <div>
      <Header label='signing requests' />
      {requests.map(([id, request, url]) => (
        <Request
          authId={id}
          key={id}
          request={request}
          url={url}
        />
      ))}
    </div>
  );
}

export default withAuthRequests(Authorize);
