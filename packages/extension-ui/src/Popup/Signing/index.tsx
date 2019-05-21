// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { RequestsFromCtx } from '../../components/types';

import React from 'react';

import { Header, withRequests } from '../../components';
import Request from './Request';

type Props = {
  requests: RequestsFromCtx
};

function Signing ({ requests }: Props) {
  return (
    <div>
      <Header label='requests' />
      {requests.map(([id, request, url], index) => (
        <Request
          isFirst={index === 0}
          key={id}
          request={request}
          signId={id}
          url={url}
        />
      ))}
    </div>
  );
}

export default withRequests(Signing);
