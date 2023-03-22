// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useContext, useEffect } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import animDeclined from '../../assets/anim_declined.svg';
import animSigned from '../../assets/anim_signed.svg';
import { AnimatedSvg, PopupBorderContainer } from '../../components';
import { ActionContext } from '../../components/contexts';
import useTranslation from '../../hooks/useTranslation';

interface Props extends RouteComponentProps<{ status: string }>, ThemeProps {
  className?: string;
}

function TransactionStatus({
  className,
  match: {
    params: { status }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const isSigned = status === 'signed';

  useEffect(() => {
    // we're using setTimeout here because TransactionStatus is only a temporary element signaling the status(signed/declined) of the transaction
    setTimeout(() => {
      onAction('..');
    }, 2000);
  }, [onAction]);

  return (
    <PopupBorderContainer>
      <div className={className}>
        <div className='content'>
          <div className='content-inner'>
            <AnimatedSvg
              className='icon'
              src={isSigned ? animSigned : animDeclined}
            />
            <span className='heading'>
              {isSigned ? t<string>('Transaction Signed') : t<string>('Transaction Declined')}
            </span>
          </div>
        </div>
      </div>
    </PopupBorderContainer>
  );
}

export default React.memo(
  withRouter(
    styled(TransactionStatus)(
      ({ match, theme }: Props) => `
  .content {
    outline: ${match.params.status === 'signed' ? theme.successBackground : theme.dangerBackground} solid 37px;
    border-radius: 32px;
    height: 584px;
    margin-top: 8px;
    overflow-y: hidden;
    overflow-x: hidden;
  }

  .content-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    margin-top: 160px;
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
    margin: 16px 0px 8px 0px;
  }

  .icon {
    width: 96px;
    height: 96px;
  }
`
    )
  )
);
