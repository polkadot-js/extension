// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect } from 'react';
import styled from 'styled-components';

import useTranslation from "@polkadot/extension-ui/hooks/useTranslation";
import {ThemeProps} from "@polkadot/extension-ui/types";

import animSuccess from '../assets/anim_signed.svg';
import { AnimatedSvg } from './index';

/**
 * This component is meant to be used in an external popup, as a last step of a wizard,
 * as it closes automatically.
 * @constructor
 */
const AccountCreationSuccess = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const timeout = setTimeout(() => {
        window.close();
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
      <Container>
        <Icon src={animSuccess} />
        <Header>
          {t('Account created successfully!')}
        </Header>
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

const Icon = styled(AnimatedSvg)`
  width: 96px;
  height: 96px;
`;
