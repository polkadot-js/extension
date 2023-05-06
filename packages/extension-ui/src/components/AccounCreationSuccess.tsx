// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect } from 'react';
import styled from 'styled-components';

import useTranslation from "@polkadot/extension-ui/hooks/useTranslation";
import { clearClipboard } from "@polkadot/extension-ui/messaging";
import {ThemeProps} from "@polkadot/extension-ui/types";

import animSuccess from '../assets/anim_signed.svg';
import { AnimatedSvg } from './index';

const CLIPBOARD_CLEANUP_TIMEOUT = 5000;

/**
 * This component is meant to be used in an external popup, as a last step of a wizard,
 * as it closes automatically.
 * @constructor
 */
const AccountCreationSuccess = () => {
  const { t } = useTranslation();

  useEffect(() => {
    // Clearing the clipboard from the background thread to have it done even after the popup is closed
    clearClipboard(CLIPBOARD_CLEANUP_TIMEOUT);

    const timeout = setTimeout(() => {
        window.close();
    }, CLIPBOARD_CLEANUP_TIMEOUT);

    return () => clearTimeout(timeout);
  }, []);

  return (
      <Container>
        <Icon src={animSuccess} />
        <Header>
          {t('Account created successfully!')}
        </Header>
        <Info>
          {t(
            'For safety reasons, your clipboard is going to be cleared ' +
            'in {{seconds}} seconds.',
            { seconds: Math.ceil(CLIPBOARD_CLEANUP_TIMEOUT / 1000) }
          )}
        </Info>
      </Container>
  );
};

export default AccountCreationSuccess;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  margin-top: 160px;
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

const Info = styled.span`
  font-family: ${({ theme }: ThemeProps) => theme.secondaryFontFamily};
  font-style: normal;
  font-size: 12px;
  color: ${({ theme }: ThemeProps) => theme.textColor};
  text-align: center;
  margin: 0 20px;
`;

const Icon = styled(AnimatedSvg)`
  width: 96px;
  height: 96px;
`;
