// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldAssetExpectedEarning } from '@subwallet/extension-base/types';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Logo, Number } from '@subwallet/react-ui';
import React from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  tokenSlug: string,
  asset: YieldAssetExpectedEarning,
}

const Component: React.FC<Props> = ({ asset, className, tokenSlug }: Props) => {
  const { token } = useTheme() as Theme;
  const symbol = tokenSlug.split('-')[2];

  return (
    <div className={className}>
      <Logo
        shape={'circle'}
        size={16}
        token={tokenSlug.toLowerCase()}
      />
      <Number
        className={'earning-info-item-text'}
        decimal={0}
        decimalColor={token.colorTextLight4}
        intColor={token.colorTextLight4}
        size={14}
        suffix={symbol}
        unitColor={token.colorTextLight4}
        value={asset.rewardInToken || 0}
      />
    </div>
  );
};

const EarningInfoItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    backgroundColor: token.colorBgSecondary,
    borderRadius: '15px',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    height: '30px',

    '.ant-image-img': {
      marginBottom: '2px'
    },

    '.earning-info-item-text': {
      paddingLeft: token.paddingXXS
    }
  });
});

export default EarningInfoItem;
