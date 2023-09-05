import React from 'react';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Logo, Number } from '@subwallet/react-ui';
import styled, { useTheme } from 'styled-components';
import { YieldAssetExpectedEarning } from '@subwallet/extension-base/background/KoniTypes';

interface Props extends ThemeProps {
  tokenSlug: string,
  asset: YieldAssetExpectedEarning,
}

const Component: React.FC<Props> = ({ asset, className, tokenSlug }: Props) => {
  const { token } = useTheme() as Theme;
  const symbol = tokenSlug.split('-')[2];

  return (
    <div className={className}>
      <Logo size={16} token={symbol.toLowerCase()} shape={'circle'} />
      <Number
        className={'earning-info-item-text'}
        value={asset.rewardInToken || 0}
        decimal={0}
        suffix={symbol}
        unitColor={token.colorTextLight4}
        decimalColor={token.colorTextLight4}
        intColor={token.colorTextLight4}
        size={14}
      />
    </div>
  );
}

const EarningInfoItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    backgroundColor: token.colorBgSecondary,
    borderRadius: '15px',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    height: '30px',

    '.ant-image': {
      display: 'flex',
      alignItems: 'center',
    },

    '.earning-info-item-text': {
      paddingLeft: token.paddingXXS
    }
  });
});

export default EarningInfoItem;
