// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignRequestsFromCtx } from '../../components/types';

import React from 'react';

import { Header, withSignRequests } from '../../components';
import Request from './Request';

interface Props {
  requests: SignRequestsFromCtx;
}

function Signing ({ requests }: Props): React.ReactElement<Props> {
  return (
    <div>
      <Header label='transactions' />
      {requests.map(({ id, isExternal, request, url }, index): React.ReactNode => (
        <Request
          isExternal={isExternal}
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

export default withSignRequests(Signing);
