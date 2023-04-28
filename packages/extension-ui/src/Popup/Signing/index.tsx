// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import border from '../../assets/border.svg';
import { Loading, PopupBorderContainer, SigningReqContext, Svg } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Z_INDEX } from '../../zindex';
import Request from './Request';
import TransactionIndex from './TransactionIndex';

interface Props extends ThemeProps {
  className?: string;
}

function Signing({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const requests = useContext(SigningReqContext);
  const [requestIndex, setRequestIndex] = useState(0);

  const _onNextClick = useCallback(() => setRequestIndex((requestIndex) => requestIndex + 1), []);

  const _onPreviousClick = useCallback(() => setRequestIndex((requestIndex) => requestIndex - 1), []);

  useEffect(() => {
    setRequestIndex((requestIndex) => (requestIndex < requests.length ? requestIndex : requests.length - 1));
    setRequestIndex((requestIndex) => (requestIndex < requests.length ? requestIndex : requests.length - 1));
  }, [requests]);

  // protect against removal overflows/underflows
  const request =
    requests.length !== 0
      ? requestIndex >= 0
        ? requestIndex < requests.length
          ? requests[requestIndex]
          : requests[requests.length - 1]
        : requests[0]
      : null;
  const isTransaction = !!(request?.request?.payload as SignerPayloadJSON)?.blockNumber;

  return request ? (
    <>
      <div className={className}>
        <Svg
          className='border'
          src={border}
        />
        <div className='content'>
          {requests.length > 1 && (
            <div className='centered'>
              <TransactionIndex
                index={requestIndex}
                onNextClick={_onNextClick}
                onPreviousClick={_onPreviousClick}
                totalItems={requests.length}
              />
            </div>
          )}
          {isTransaction && <span className='heading'>{t<string>('Authorization')}</span>}
          <Request
            account={request.account}
            buttonText={isTransaction ? t('Sign') : t('Sign the message')}
            isFirst={requestIndex === 0}
            isLast={requests.length === 1}
            request={request.request}
            signId={request.id}
            url={request.url}
          />
        </div>
      </div>
    </>
  ) : (
    <Loading />
  );
}

export default React.memo(
  styled(Signing)(
    ({ theme }: Props) => `
    .content {
      border-radius: 32px;
      height: 584px;
      overflow-y: hidden;
      overflow-x: hidden;
    }

    .border {
      z-index: ${Z_INDEX.BORDER};
      position: absolute;
      top: 0;
      right: 0;
      pointer-events: none;
      background: ${theme.newTransactionBackground};
      height: 600px;
      width: 360px;
    }

    .centered {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .heading {
      font-family: ${theme.secondaryFontFamily};
      font-style: normal;
      font-weight: 700;
      font-size: 24px;
      line-height: 118%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.03em;
      color: ${theme.textColor};
      margin: 8px 0px 4px 0px;
    }
  `
  )
);
