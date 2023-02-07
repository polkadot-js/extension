// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import helpIcon from '../assets/help.svg';
import { ActionContext, Address, Button, ButtonArea, VerticalSpace } from '../components';
import useTranslation from '../hooks/useTranslation';
import { forgetAccount } from '../messaging';
import { Header } from '../partials';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function Forget({
  className,
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);

  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const _onClick = useCallback((): void => {
    setIsBusy(true);
    forgetAccount(address)
      .then(() => {
        setIsBusy(false);
        onAction('/');
      })
      .catch((error: Error) => {
        setIsBusy(false);
        console.error(error);
      });
  }, [address, onAction]);

  const Helper = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 12px;
  padding-top: 0px;
  margin-bottom: 16px;

  &:before {
  position: absolute;
  content: '';
  width: calc(100% - 32px);
  border-top: 1px solid ${({ theme }: ThemeProps) => theme.boxBorderColor};
  top: -16px;
 }

  img.icon {
    margin-top: -4px;
    align-self: flex-start; 
  }

  span {
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    letter-spacing: 0.06em;
    color: ${({ theme }: ThemeProps) => theme.subTextColor};
    align-self: flex-start;

    .link {
      color: ${({ theme }: ThemeProps) => theme.primaryColor};
      cursor: pointer;

      :hover {
        text-decoration: underline;
      }
    }
  }
`;

  return (
    <>
      <Header
        showBackArrow
        showHelp
        text={t<string>('Forget account')}
      />
      <div className={className}>
        <div className='text-container'>
          <span className='heading'>{t<string>('Forget account')}</span>
          <span className='subtitle'>
            {t<string>(
              'Even though you can remove account from this wallet, you can restore it here or in another wallet with the secret phrase.'
            )}
          </span>
        </div>
        <Address
          address={address}
          forgetIcon
        />
      </div>
      <VerticalSpace />
      <Helper>
        <img
          className='icon'
          src={helpIcon}
        />
        <span>
          {t<string>('How to restore your account? ')}
          <span
            className='link'
            onClick={_goTo('/help-restore')}
          >
            {` ${t<string>('Learn more')}`}
          </span>
        </span>
      </Helper>
      <ButtonArea>
        <Button
          isDisabled={isBusy}
          onClick={_goTo(`/account/edit-menu/${address}`)}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          isDanger
          onClick={_onClick}
        >
          {t<string>('Forget')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default withRouter(
  styled(Forget)(
    ({ theme }: Props) => `
  .actionArea {
    padding: 10px 24px;
  }

  .text-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 90px;
    margin-bottom: 40px;
    gap: 16px;
    
    .heading {
      font-weight: 700;
      font-size: 24px;
      line-height: 118%;
      letter-spacing: 0.03em;
      font-family: ${theme.secondaryFontFamily};
      color: ${theme.textColorDanger};
    }

    .subtitle {
      font-weight: 300;
      font-size: 14px;
      line-height: 145%;
      text-align: center;
      letter-spacing: 0.07em; 
      color: ${theme.subTextColor};
    }
  }

  .center {
    margin: auto;
  }

  .movedWarning {
    margin-top: 8px;
  }

  .withMarginTop {
    margin-top: 4px;
  }
`
  )
);
