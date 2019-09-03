// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';

import { Header, SigningContext } from '../../components';
import Request from './Request';

export default function Signing (): React.ReactElement<{}> {
  const requests = useContext(SigningContext);

  return (
    <div>
      <Header label='transactions' />
      {requests.map(([id, request, url], index): React.ReactNode => (
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
