// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';
import styled from 'styled-components';

import { AuthorizeReqContext, ErrorBoundary } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import Request from './Request';

export default function Authorize (): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(AuthorizeReqContext);

  return (
    <Scroll isLastRequest={requests.length === 1}>
      <Header text={t<string>('Authorize')} />
      <ErrorBoundary trigger='authorize'>
        {requests.map(({ id, request, url }, index): React.ReactNode => (
          <Request
            authId={id}
            isFirst={index === 0}
            key={id}
            request={request}
            url={url}
          />
        ))}
      </ErrorBoundary>
    </Scroll>
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
