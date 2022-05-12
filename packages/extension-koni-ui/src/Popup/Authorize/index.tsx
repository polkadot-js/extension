// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AuthorizeReqContext, LoadingContainer } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import AuthorizeIndex from './AuthorizeIndex';
import Request from './Request';

interface Props extends ThemeProps {
  className?: string;
}

function Authorize ({ className = '' }: Props): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(AuthorizeReqContext);
  const [requestIndex, setRequestIndex] = useState(0);

  useEffect(() => {
    setRequestIndex(
      (requestIndex) => requestIndex < requests.length
        ? requestIndex
        : requests.length - 1
    );
  }, [requests]);

  const request = requests.length !== 0
    ? requestIndex >= 0
      ? requestIndex < requests.length
        ? requests[requestIndex]
        : requests[requests.length - 1]
      : requests[0]
    : null;

  const _onNextClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex + 1),
    []
  );

  const _onPreviousClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex - 1),
    []
  );

  return request
    ? (
      <div className={`${className} ${requests.length === 1 ? 'lastRequest' : ''}`}>
        <Header>
          <AuthorizeIndex
            index={requestIndex}
            name={t<string>('Connect the SubWallet')}
            onNextClick={_onNextClick}
            onPreviousClick={_onPreviousClick}
            totalItems={requests.length}
          />
        </Header>
        <Request
          authId={request.id}
          className='request'
          isFirst={requestIndex === 0}
          key={request.id}
          request={request.request}
          url={request.url}
        />
      </div>
    )
    : <LoadingContainer />;
}

export default styled(Authorize)`
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;

  // &.lastRequest {
  //   overflow: hidden;
  // }

  && {
    padding: 0;
  }
`;
