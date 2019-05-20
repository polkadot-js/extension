// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';

import { Header } from '../../components';
import { SigningContext } from '../../components/contexts';
import Request from './Request';

type Props = {};

export default function Signing (props: Props) {
  return (
    <SigningContext.Consumer>
      {(requests) => (
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
      )}
    </SigningContext.Consumer>
  );
}
