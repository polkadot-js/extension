// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Divider, Number, Typography } from '@subwallet/react-ui';
import { CalendarCheck } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import { EarningInfoItem } from './index';
import { TransformAssetEarning } from '../Modal';

interface Props extends ThemeProps {
  label: string,
  earningAssets: TransformAssetEarning
}

const Component: React.FC<Props> = ({ className, earningAssets, label }: Props) => {
  const { token } = useTheme() as Theme;
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const chainAsset = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const totalEarningAsset = useMemo(() => {
    let result = 0;

    Object.keys(earningAssets).forEach((key) => {
      const asset = chainAsset[key];
      const tokenPrice = asset.priceId ? priceMap[asset.priceId] : 0;
      const tokenReward = (earningAssets[key].rewardInToken || 0) * tokenPrice;

      result += tokenReward;
    });

    return result;
  }, [chainAsset, earningAssets, priceMap]);

  return (
    <div className={className}>
      <div className={'earning-calculator-info-wrapper'}>
        <BackgroundIcon
          backgroundColor={'rgba(217, 197, 0, 0.1)'}
          iconColor={token['gold-6']}
          phosphorIcon={CalendarCheck}
          shape={'circle'}
          size={'lg'}
          weight={'fill'}
        />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography.Text className={'earning-calculator-info-text'}>{label}:</Typography.Text>
          <Number
            className={'earning-calculator-info-number'}
            decimal={0}
            decimalColor={token.colorTextLight4}
            intColor={token.colorTextLight4}
            prefix={'$'}
            size={14}
            unitColor={token.colorTextLight4}
            value={totalEarningAsset}
          />
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {Object.keys(earningAssets).map((key) => <EarningInfoItem
          asset={earningAssets[key]}
          key={key}
          tokenSlug={key}
        />)}
      </div>

      <Divider className={'earning-calculator-info-divider'} />
    </div>
  );
};

const EarningCalculatorInfo = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    flexDirection: 'column',

    '.earning-calculator-info-wrapper': {
      display: 'flex',
      alignItems: 'center',
      paddingBottom: token.paddingSM
    },

    '.earning-calculator-info-text': {
      color: token.colorTextLight4,
      paddingLeft: token.paddingSM
    },

    '.earning-calculator-info-number': {
      paddingLeft: token.paddingXXS
    },

    '.earning-calculator-info-divider': {
      backgroundColor: token.colorBgDivider,
      marginTop: token.marginSM,
      marginBottom: token.marginSM
    }
  });
});

export default EarningCalculatorInfo;
