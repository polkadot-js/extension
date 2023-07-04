// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';
import styled from 'styled-components';

import { AuthorizeReqContext } from '../../components';
import Request from './Request';

function Authorize(): React.ReactElement {
  const requests = useContext(AuthorizeReqContext);

  return (
    <Container>
      {requests.map(
        ({ id, request, url }, index): React.ReactNode => (
          <Request
            authId={id}
            isFirst={index === 0}
            key={id}
            request={request}
            url={url}
          />
        )
      )}
    </Container>
  );
}

const Container = styled.div`
  height: 100%;
  overflow-y: scroll;

  ::-webkit-scrollbar-thumb {
    background:${({ theme }) => theme.boxBorderColor};
    border-radius: 50px;
    width: 2px;
    border-right: 2px solid #111B24;
  }

  ::-webkit-scrollbar {
    width: 4px;
  }
`;

export default Authorize;
