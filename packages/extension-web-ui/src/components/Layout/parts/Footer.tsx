// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

const _Footer: React.FC<Props> = ({ className }: Props) => {
  return (
    <div className={className}>
      <div>By continuing, you agree to our</div>
      <div>
        <span className={CN('footer-link')}>Terms & Conditions</span>&nbsp;and&nbsp;
        <span className={CN('footer-link')}>Privacy Policy</span>
      </div>
    </div>
  );
};

const Footer = styled(_Footer)<Props>(({ theme }: Props) => {
  const { token } = theme;

  return {
    color: token.colorTextDescription,
    textAlign: 'center',
    fontSize: token.fontSizeHeading6,
    lineHeight: token.lineHeightHeading6,
    padding: `${token.padding - 2}px 0`,

    '.footer-link': {
      color: token.colorText
    }
  };
});

export default Footer;
