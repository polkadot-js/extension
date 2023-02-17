// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Logo2D from '@subwallet/extension-koni-ui/components/Logo/Logo2D';
import LogoWithSquircleBorder from '@subwallet/extension-koni-ui/components/Logo/LogoWithSquircleBorder';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowsLeftRight } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  leftLogo?: React.ReactNode;
  rightLogo?: React.ReactNode;

  linkIcon?: React.ReactNode;
}

const defaultLinkIcon = <Icon
  customSize='24px'
  phosphorIcon={ArrowsLeftRight}
/>;
const defaultLogo = <Logo2D />;

const Component = ({ className, leftLogo = defaultLogo, rightLogo = defaultLogo, linkIcon = defaultLinkIcon }: Props) => {
  return (
    <div className={CN(className)}>
      <LogoWithSquircleBorder>
        {leftLogo}
      </LogoWithSquircleBorder>
      <div className='link-icon'>
        {linkIcon}
      </div>
      <LogoWithSquircleBorder>
        {rightLogo}
      </LogoWithSquircleBorder>
    </div>
  );
};

const DualLogo = styled(Component)<Props>(({ theme }: ThemeProps) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  width: 'max-content',
  margin: '0 auto',

  '.link-icon': {
    backgroundColor: theme.token['gray-1'],
    zIndex: 10,
    textAlign: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: (40 - 24) / 2,
    margin: '0 -12px'
  }
}));

export default DualLogo;
