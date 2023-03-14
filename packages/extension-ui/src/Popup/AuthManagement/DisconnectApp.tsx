// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import animatedRemove from '../../assets/anim_unlink.svg';
import { Button, ButtonArea, FaviconBox, Svg, VerticalSpace } from '../../components';
import { ActionContext } from '../../components/contexts';
import { useGoTo } from '../../hooks/useGoTo';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { removeAuthorization } from '../../messaging';
import Header from '../../partials/Header';

interface Props extends ThemeProps {
  className?: string;
}
interface URLState {
  url: string;
}

const CustomFaviconBox = styled(FaviconBox)`
    box-sizing: border-box;
    margin: 0 auto;
    margin-top: 16px;
`;

function DisconnectApp({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { url } = useParams<URLState>();
  const decodedUrl = decodeURIComponent(url);
  const onAction = useContext(ActionContext);
  const { show } = useToast();

  const { goTo } = useGoTo();

  const handleDisconnect = useCallback(() => {
    show(t<string>('App disconnected'), 'success', () => {
      removeAuthorization(decodedUrl)
        .then(() => onAction('/auth-list'))
        .catch(console.error);
    });
  }, [decodedUrl, onAction, show, t]);

  return (
    <>
      <Header
        text={t<string>('Disconnect app')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        <div className='content'>
          <Svg
            className='animated-remove-icon'
            src={animatedRemove}
          />
          <span className='heading'>{t<string>('Disconnecting app')}</span>
          <span className='subtitle'>
            {t<string>(
              "You're about to disconnect an app from the Signer. This will result in disconnecting all connected accounts from this app."
            )}
          </span>
          <CustomFaviconBox url={decodedUrl} />
        </div>
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button
          onClick={goTo(`/url/manage?url=${url}`)}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          isDanger
          onClick={handleDisconnect}
        >
          {t<string>('Disconnect')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default React.memo(
  styled(DisconnectApp)(
    ({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;
  height: calc(100vh - 2px);
  overflow-y: scroll;
  scrollbar-width: none;

  .content {
    margin-top: 56px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16px;
  }

  .heading {
    font-family: ${theme.secondaryFontFamily};
    font-style: normal;
    font-weight: 700;
    font-size: 20px;
    line-height: 120%;
    text-align: center;
    letter-spacing: 0.035em;
    color: ${theme.textColorDanger};
    
  }

  .subtitle {
    font-style: normal;
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    text-align: center;
    letter-spacing: 0.07em;
    color: ${theme.subTextColor};
  }

  .animated-remove-icon {
    display: flex;
    justify-content: center;
    width: 96px;
    height: 96px;
    background: ${theme.dangerBackground};
    margin: 0 auto;
  }
      
  &::-webkit-scrollbar {
    display: none;
  }
  `
  )
);
