import React, { useMemo } from 'react';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Typography, Divider, Number } from '@subwallet/react-ui';
import styled, { useTheme } from 'styled-components';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { CalendarCheck } from 'phosphor-react';
import EarningInfoItem from '@subwallet/extension-koni-ui/components/EarningInfoItem';
import { TransformAssetEarning } from '@subwallet/extension-koni-ui/Popup/Home/Earning/StakingCalculatorModal';
import { RootState } from '@subwallet/extension-koni-ui/stores';

interface Props extends ThemeProps {
  label: string,
  earningAssets: TransformAssetEarning
}

const Component: React.FC<Props> = ({ className, earningAssets, label }: Props) => {
  const { token } = useTheme() as Theme;
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const totalEarningAsset = useMemo(() => {
    let result = 0;
    Object.keys(earningAssets).forEach(key => {
      const symbol = key.split('-')[0];
      const tokenPrice = priceMap[symbol.toLowerCase()] || 0;
      const tokenReward = (earningAssets[key].rewardInToken || 0) * tokenPrice;
      result += tokenReward;
    });

    return result;
  }, [earningAssets, priceMap]);

  return (
    <div className={className}>
      <div className={'earning-calculator-info-wrapper'}>
        <BackgroundIcon
          phosphorIcon={CalendarCheck}
          shape={'circle'}
          weight={'fill'}
          iconColor={token['gold-6']}
          backgroundColor={'rgba(217, 197, 0, 0.1)'}
          size={'lg'}
        />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography.Text className={'earning-calculator-info-text'}>{label}:</Typography.Text>
          <Number
            className={'earning-calculator-info-number'}
            value={totalEarningAsset}
            decimal={0}
            size={14}
            intColor={token.colorTextLight4}
            decimalColor={token.colorTextLight4}
            unitColor={token.colorTextLight4}
            prefix={'$'}
          />
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {Object.keys(earningAssets).map(key => <EarningInfoItem tokenSlug={key} asset={earningAssets[key]} />)}
      </div>

      <Divider className={'earning-calculator-info-divider'} />
    </div>
  );
}

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
      paddingLeft: token.paddingSM,
    },

    '.earning-calculator-info-number': {
      paddingLeft: token.paddingXXS,
    },

    '.earning-calculator-info-divider': {
      backgroundColor: token.colorBgDivider,
      marginTop: token.marginSM,
      marginBottom: token.marginSM
    },
  });
});

export default EarningCalculatorInfo;
