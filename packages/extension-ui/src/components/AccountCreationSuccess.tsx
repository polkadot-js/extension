// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, {useEffect} from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styled from 'styled-components';

import useTranslation from "@polkadot/extension-ui/hooks/useTranslation";
import {ThemeProps} from "@polkadot/extension-ui/types";

import animSuccess from '../assets/anim_signed.svg';
import clearClipboard from '../util/clearClipboard';
import { AnimatedSvg, Button, ButtonArea, VerticalSpace, WarningBox } from './index';


const AccountCreationSuccess = () => {
  const { t } = useTranslation();

  useEffect(() => {
    // clear clipboard when user closes current window
    window.addEventListener('beforeunload', clearClipboard);

    return () => window.removeEventListener('beforeunload', clearClipboard);
  }, []);

  return (
    <Container>
      <Icon src={animSuccess} />
      <Header>
        {t('Account created successfully!')}
      </Header>
      <VerticalSpace />
      <WarningBox
        description={t<string>('Your clipboard will be cleared on closing of this screen.')}
        title={t<string>('Your secret phrase is safe!')}
      />
      <ButtonArea>
        <CopyToClipboard
          onCopy={window.close}
          text=' '
        >
          <Button secondary>
            <div>{t<string>('Got it!')}</div>
          </Button>
        </CopyToClipboard>
      </ButtonArea>
    </Container>
  );
};

export default AccountCreationSuccess;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 160px;
  flex-grow: 1;
`;

const Header = styled.span`
  font-family: ${({ theme }: ThemeProps) => theme.secondaryFontFamily};
  font-style: normal;
  font-weight: 700;
  font-size: 24px;
  line-height: 118%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.03em;
  color: ${({ theme }: ThemeProps) => theme.textColor};
  text-align: center;
`;

const Icon = styled(AnimatedSvg)`
  width: 96px;
  height: 96px;
  align-self: center;
`;
