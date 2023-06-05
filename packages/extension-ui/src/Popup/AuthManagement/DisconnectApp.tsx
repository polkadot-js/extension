// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { Button, ButtonArea, FaviconBox, Hero } from '../../components';
import { ActionContext } from '../../components/contexts';
import { useGoTo } from '../../hooks/useGoTo';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { removeAuthorization } from '../../messaging';
import Header from '../../partials/Header';

interface URLState {
  url: string;
}

const CustomFaviconBox = styled(FaviconBox)`
    margin-inline: auto;
    margin-bottom: auto;

    :hover {
      background: ${({ theme }: ThemeProps) => theme.inputBorderColor};
    }
`;

function DisconnectApp(): React.ReactElement {
  const { t } = useTranslation();
  const { url } = useParams<URLState>();
  const decodedUrl = decodeURIComponent(url);
  const onAction = useContext(ActionContext);
  const { show } = useToast();

  const { goTo } = useGoTo();

  const handleDisconnect = useCallback(() => {
    show(t<string>('App disconnected'), 'success');
    removeAuthorization(decodedUrl)
      .then(() => onAction('/auth-list'))
      .catch(console.error);
  }, [decodedUrl, onAction, show, t]);

  return (
    <>
      <Header
        text={t<string>('Disconnect app')}
        withBackArrow
        withHelp
      />
      <StyledHero
        headerText={t<string>('Disconnecting app')}
        iconType='disconnect'
      >
        {t<string>(
          "You're about to disconnect an app from the Signer. This will result in disconnecting all connected accounts from this app."
        )}
      </StyledHero>
      <CustomFaviconBox url={decodedUrl} />
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

const StyledHero = styled(Hero)`
  margin-top: 50px;
  margin-bottom: 32px;
`;

export default React.memo(DisconnectApp);
