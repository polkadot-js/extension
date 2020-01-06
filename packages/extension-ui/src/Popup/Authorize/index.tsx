// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';

import { AuthorizeContext, Header } from '../../components';
import Request from './Request';
import styled from 'styled-components';

export default function Authorize (): React.ReactElement<{}> {
  const requests = useContext(AuthorizeContext);

  return (
    <>
      <Scroll isLastRequest={requests.length === 1}>
        <Header text='Authorize'/>
        {requests.map(({ id, request, url }, index): React.ReactNode => (
          <Request
            authId={id}
            isFirst={index === 0}
            key={id}
            request={request}
            url={url}
          />
        ))}
      </Scroll>
    </>
  );
}

const Scroll = styled.div<{isLastRequest: boolean}>`
  overflow-y: ${({ isLastRequest }): string => isLastRequest ? 'hidden' : 'auto'};

  && {
    padding: 0;
  }

  ${Request} {
    padding: 0 24px;
  }
`;
