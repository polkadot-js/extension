// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';

import { AuthorizeContext, Header, VerticalSpace } from '../../components';
import Request from './Request';

export default function Authorize (): React.ReactElement<{}> {
  const requests = useContext(AuthorizeContext);

  return (
    <div>
      <Header />
      {requests.map(({ id, request, url }, index): React.ReactNode => (
        <Request
          authId={id}
          isFirst={index === 0}
          key={id}
          request={request}
          url={url}
        />
      ))}
      <VerticalSpace />
    </div>
  );
}
