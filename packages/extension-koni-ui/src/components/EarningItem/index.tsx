// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldCompoundingPeriod, YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Logo, Number, Tag, Web3Block } from '@subwallet/react-ui';
import { Database, HandsClapping, Leaf, PlusCircle, PlusMinus, Question } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  item: YieldPoolInfo,
  onClickCalculatorBtn: () => void;
  onClickStakeBtn: () => void;
}

export const TagTypes = () => {
  const { t } = useTranslation();

  return {
    LIQUID_STAKING: {
      label: t('Liquid staking'),
      icon: <Icon
        phosphorIcon={Leaf}
        weight='fill'
      />,
      color: 'magenta'
    },
    LENDING: {
      label: t('Lending'),
      icon: <Icon
        phosphorIcon={HandsClapping}
        weight='fill'
      />,
      color: 'success'
    },
    SINGLE_FARMING: {
      label: t('Single farming'),
      icon: <Icon
        phosphorIcon={HandsClapping}
        weight='fill'
      />,
      color: 'success'
    },
    NOMINATION_POOL: {
      label: t('Nomination pool'),
      icon: <Icon
        phosphorIcon={HandsClapping}
        weight='fill'
      />,
      color: 'secondary'
    },
    PARACHAIN_STAKING: {
      label: t('Parachain staking'),
      icon: <Icon
        phosphorIcon={HandsClapping}
        weight='fill'
      />,
      color: 'yellow'
    },
    NATIVE_STAKING: {
      label: t('Native staking'),
      icon: <Icon
        phosphorIcon={Database}
        weight='fill'
      />,
      color: 'gold'
    }
  };
};

const Component: React.FC<Props> = ({ className, item, onClickCalculatorBtn, onClickStakeBtn }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { chain, description, name, stats, type } = item;

  const totalApy = useMemo(() => {
    const apy = calculateReward(stats?.totalApr || 0, 100, YieldCompoundingPeriod.YEARLY).apy;

    return apy ? (apy * 100) : 0;
  }, [stats?.totalApr]);

  return (
    <Web3Block
      className={className}
      middleItem={(
        <div className={'earning-item-content-wrapper'}>
          <Logo
            network={chain}
            size={64}
          />

          <div className={'earning-item-message-wrapper'}>
            <div className={'earning-item-name'}>{name}</div>
            <div className={'earning-item-description'}>{description}</div>
          </div>

          <Tag
            bgType={'default'}
            color={TagTypes()[type].color}
            icon={TagTypes()[type].icon}
          >{TagTypes()[type].label}</Tag>

          <div className={'earning-item-reward'}>
            <Number
              decimal={0}
              size={30}
              suffix={'%'}
              value={totalApy}
            />

            <div className={'earning-item-reward-sub-text'}>{t('rewards')}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: token.paddingXXS }}>
            <div className='earning-item-total-value-staked'>{t('Total value staked:')}</div>
            <Number
              decimal={0}
              decimalColor={token.colorSuccess}
              intColor={token.colorSuccess}
              prefix={'$'}
              size={14}
              unitColor={token.colorSuccess}
              value={stats?.tvl || 0}
            />
          </div>

          <div className='earning-item-footer'>
            <Button
              className='earning-item-icon-btn'
              icon={
                <Icon
                  phosphorIcon={PlusMinus}
                  size={'sm'}
                />}
              onClick={onClickCalculatorBtn}
              shape={'circle'}
              size={'xs'}
              type={'ghost'}
            />
            <Button
              className='earning-item-icon-btn'
              icon={<Icon
                phosphorIcon={Question}
                size={'sm'}
                weight={'fill'}
              />}
              shape={'circle'}
              size={'xs'}
              type={'ghost'}
            />
            <Button
              icon={<Icon
                className={'earning-item-stake-btn'}
                phosphorIcon={PlusCircle}
                size={'sm'}
                weight={'fill'}
              />}
              onClick={onClickStakeBtn}
              shape={'circle'}
              size={'xs'}
            >
              {t('Stake now')}
            </Button>
          </div>
        </div>
      )}
    />
  );
};

const EarningItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    padding: `${token.paddingXL}px ${token.paddingLG}px ${token.padding}px`,

    '.earning-item-name': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: 600,
      color: token.colorTextLight1,
      textAlign: 'center'
    },

    '.earning-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: 500,
      color: token.colorTextLight4,
      textAlign: 'center'
    },

    '.earning-item-reward': {
      display: 'flex',
      alignItems: 'flex-end',
      gap: token.paddingSM
    },

    '.earning-item-total-value-staked': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight4
    },

    '.earning-item-reward-sub-text': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight4,
      // backgroundColor: 'green',
      paddingBottom: 6
    },

    '.earning-item-content-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.padding,
      alignItems: 'center'
    },

    '.earning-item-message-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.paddingXXS
    },

    '.earning-item-icon-btn': {
      border: `2px solid ${token.colorBgBorder}`,
      borderRadius: '50%'
    },

    '.earning-item-footer': {
      display: 'flex',
      gap: token.padding,
      justifyContent: 'center',
      paddingTop: token.paddingLG,
      paddingBottom: token.padding
    },

    '.earning-item-stake-btn': {
      width: token.sizeMD,
      height: token.sizeMD
    }
  });
});

export default EarningItem;
