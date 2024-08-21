// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowsLeftRight } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

import Logo2D from './Logo2D';
import LogoWithSquircleBorder from './LogoWithSquircleBorder';

interface Props extends ThemeProps {
  leftLogo?: React.ReactNode;
  rightLogo?: React.ReactNode;
  sizeSquircleBorder?: number;
  innerSize?: number;
  sizeLinkIcon?: number;
  linkIcon?: React.ReactNode;
  linkIconBg?: string;
}

const defaultLinkIcon = (
  <Icon
    phosphorIcon={ArrowsLeftRight}
    size='md'
  />
);

const defaultLogo = <Logo2D />;

const Component = ({ className, leftLogo = defaultLogo, linkIcon = defaultLinkIcon, rightLogo = defaultLogo, sizeSquircleBorder, innerSize }: Props) => {
  return (
    <div className={CN(className, 'dual-logo-container')}>
      <LogoWithSquircleBorder size={sizeSquircleBorder} innerSize={innerSize}>
        {leftLogo}
      </LogoWithSquircleBorder>
      <div className='link-icon'>
        {linkIcon}
      </div>
      <LogoWithSquircleBorder size={sizeSquircleBorder} innerSize={innerSize}>
        {rightLogo}
      </LogoWithSquircleBorder>
    </div>
  );
};

const DualLogo = styled(Component)<Props>(({ linkIconBg, sizeLinkIcon, theme }: Props) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  width: 'max-content',
  margin: '0 auto',
  padding: theme.token.paddingXS,
  marginBottom: theme.token.marginXS,

  '.link-icon': {
    backgroundColor: linkIconBg || theme.token['gray-1'],
    zIndex: 10,
    textAlign: 'center',
    width: sizeLinkIcon || 40,
    height: sizeLinkIcon || 40,
    borderRadius: 20,
    padding: ((sizeLinkIcon || 40) - 24) / 2,
    margin: '0 -12px'
  }
}));

export default DualLogo;
