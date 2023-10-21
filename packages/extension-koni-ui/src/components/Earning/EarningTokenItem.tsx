// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  symbol: string;
  token: string;
  children: React.ReactNode | React.ReactNode[];
}

const Component: React.FC<Props> = (props: Props) => {
  const { children, className, token } = props;

  return (
    <div className={CN(className)}>
      <Logo
        className={'earning-btn-icon'}
        size={16}
        token={token.toLowerCase()}
      />
      {children}
    </div>
  );
};

const EarningTokenItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    background: token.colorBgSecondary,
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: token.sizeXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeHeading6,
    lineHeight: token.lineHeightHeading6,
    fontWeight: token.fontWeightStrong,

    '.ant-image-img': {
      marginBottom: 2.5
    }
  };
});

export default EarningTokenItem;
