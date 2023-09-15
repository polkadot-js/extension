// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Logo, Number, Tag, Typography, Web3Block } from '@subwallet/react-ui';
import { CheckCircle, Database, HandsClapping, Leaf, MinusCircle, PlusCircle, PlusMinus, Question, StopCircle, Wallet } from 'phosphor-react';
import React from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  yieldPoolInfo: YieldPoolInfo;
  yieldPositionInfo: YieldPositionInfo;
  onClickCalculatorBtn: () => void;
  onClickStakeBtn: () => void;
}

export const TagTypes = () => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

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
      color: token.colorSecondary
    },
    NOMINATION_POOL: {
      label: t('Nomination pool'),
      icon: <Icon
        phosphorIcon={HandsClapping}
        weight='fill'
      />,
      color: 'success'
    },
    PARACHAIN_STAKING: {
      label: t('Parachain staking'),
      icon: <Icon
        phosphorIcon={HandsClapping}
        weight='fill'
      />,
      color: token.colorSecondary
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

const Component: React.FC<Props> = ({ className, onClickCalculatorBtn, onClickStakeBtn, yieldPoolInfo, yieldPositionInfo }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { chain, description, name, type } = yieldPoolInfo;

  return (
    <Web3Block
      className={className}

      leftItem={(
        <Logo
          network={chain}
          size={64}
        />
      )}
      middleItem={(
        <>
          <>
            <div className={'earning-item-name-wrapper'}>
              <div className={'earning-item-name'}>{name}</div>
              <Tag
                bgType={'default'}
                color={TagTypes()[type].color}
                icon={TagTypes()[type].icon}
              >{TagTypes()[type].label}</Tag>
            </div>

            <div className={'earning-item-description'}>{description}</div>
          </>

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
            <Button
              icon={<Icon
                className={'earning-item-stake-btn'}
                phosphorIcon={Wallet}
                size={'sm'}
                weight={'fill'}
              />}
              onClick={onClickStakeBtn}
              shape={'circle'}
              size={'xs'}
            >
              {t('Claim rewards')}
            </Button>
            <Button
              icon={<Icon
                className={'earning-item-stake-btn'}
                phosphorIcon={StopCircle}
                size={'sm'}
                weight={'fill'}
              />}
              onClick={onClickStakeBtn}
              shape={'circle'}
              size={'xs'}
            >
              {t('Withdraw')}
            </Button>
            <Button
              icon={<Icon
                className={'earning-item-stake-btn'}
                phosphorIcon={MinusCircle}
                size={'sm'}
                weight={'fill'}
              />}
              onClick={onClickStakeBtn}
              shape={'circle'}
              size={'xs'}
            >
              {t('Unstake')}
            </Button>
          </div>
        </>
      )}
      rightItem={(
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: token.paddingXXS }}>
            <Icon
              iconColor={token.colorSuccess}
              phosphorIcon={CheckCircle}
              size={'sm'}
              weight={'fill'}
            />
            <Typography.Text style={{ color: token.colorSuccess, fontWeight: '600' }}>{'Earning reward'}</Typography.Text>
          </div>
          <Number
            decimal={10}
            decimalOpacity={0.4}
            size={30}
            suffix={'DOT'}
            unitOpacity={0.4}
            value={100000}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: token.paddingXXS }}>
            <Typography.Text style={{ color: token.colorTextLight4 }}>{t('Total rewards:')}</Typography.Text>
            <Number
              decimal={10}
              decimalColor={token.colorSuccess}
              intColor={token.colorSuccess}
              suffix={'DOT'}
              unitColor={token.colorSuccess}
              value={yieldPositionInfo.balance[0].totalBalance} // TODO: improve this
            />
          </div>
        </div>
      )}
    />
  );
};

const HorizontalEarningItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    padding: `${token.paddingXL}px ${token.paddingLG}px ${token.padding}px`,

    '.earning-item-name-wrapper': {
      display: 'flex',
      alignItems: 'center',
      gap: token.paddingSM,
      paddingBottom: token.paddingXS
    },

    '.earning-item-name': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: 600,
      color: token.colorTextLight1
    },

    '.earning-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: 500,
      color: token.colorTextLight4
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
      paddingBottom: 6
    },

    '.earning-item-icon-btn': {
      border: `2px solid ${token.colorBgBorder}`,
      borderRadius: '50%'
    },

    '.earning-item-footer': {
      display: 'flex',
      gap: token.padding,
      paddingTop: token.paddingLG,
      paddingBottom: token.paddingXS
    },

    '.earning-item-stake-btn': {
      width: token.sizeMD,
      height: token.sizeMD
    },

    '.ant-web3-block-left-item': {
      alignItems: 'flex-start'
    }
  });
});

export default HorizontalEarningItem;
