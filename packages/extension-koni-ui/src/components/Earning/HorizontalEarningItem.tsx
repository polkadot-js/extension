// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingStatus, YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getStakingAvailableActionsByChain, getStakingAvailableActionsByNominator, StakingAction } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { StakingStatusUi } from '@subwallet/extension-koni-ui/constants';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { createEarningTagTypes, noop } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Logo, Number, Tag, Typography, Web3Block } from '@subwallet/react-ui';
import { MinusCircle, PlusCircle, PlusMinus, Question, StopCircle, Wallet } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import MetaInfo from '../MetaInfo/MetaInfo';

interface Props extends ThemeProps {
  onClickCalculatorBtn: () => void;
  onClickCancelUnStakeBtn: () => void;
  onClickItem?: () => void;
  onClickStakeBtn: () => void;
  onClickUnStakeBtn: () => void;
  onClickWithdrawBtn: () => void;
  yieldPoolInfo: YieldPoolInfo;
  yieldPositionInfo: YieldPositionInfo;
}

interface ButtonOptionProps {
  icon: PhosphorIcon;
  label?: string;
  key: string;
  onClick?: React.MouseEventHandler;
  disable: boolean;
  hidden: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className,
    onClickCalculatorBtn,
    onClickCancelUnStakeBtn,
    onClickItem,
    onClickStakeBtn,
    onClickUnStakeBtn,
    onClickWithdrawBtn,
    yieldPoolInfo,
    yieldPositionInfo } = props;

  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { chain, description, name, type } = yieldPoolInfo;
  const { metadata: nominatorMetadata } = yieldPositionInfo;
  const yieldPositionInfoBalance = yieldPositionInfo.balance[0];
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const tokenInfo = useMemo(() => assetRegistry[yieldPositionInfoBalance.slug], [assetRegistry, yieldPositionInfoBalance]);

  const getStakingStatus = useMemo(() => {
    const status = yieldPositionInfo.metadata.status;

    if (status === StakingStatus.EARNING_REWARD) {
      return StakingStatusUi.active;
    }

    if (status === StakingStatus.PARTIALLY_EARNING) {
      return StakingStatusUi.partialEarning;
    }

    if (status === StakingStatus.WAITING) {
      return StakingStatusUi.waiting;
    }

    return StakingStatusUi.inactive;
  }, [yieldPositionInfo.metadata.status]);

  const onClickButton = useCallback((callback: VoidFunction): React.MouseEventHandler => {
    return (event) => {
      event.stopPropagation();
      callback();
    };
  }, []);

  const availableActions = useMemo(() => {
    if (!nominatorMetadata) {
      return [];
    }

    return getStakingAvailableActionsByNominator(nominatorMetadata);
  }, [nominatorMetadata]);

  const buttons = useMemo((): ButtonOptionProps[] => {
    const result: ButtonOptionProps[] = [];

    // Calculator
    result.push({
      disable: false,
      icon: PlusMinus,
      onClick: onClickButton(onClickCalculatorBtn),
      key: 'calculator',
      hidden: false
    });

    // Info
    result.push({
      disable: false,
      icon: Question,
      onClick: onClickItem && onClickButton(onClickItem),
      key: 'info',
      hidden: false
    });

    if (yieldPoolInfo.metadata) {
      const actionListByChain = getStakingAvailableActionsByChain(chain, yieldPoolInfo.metadata.type);

      actionListByChain.forEach((item) => {
        const temp: ButtonOptionProps = {
          disable: !availableActions.includes(item),
          key: item,
          hidden: false
        } as ButtonOptionProps;

        switch (item) {
          case StakingAction.STAKE:
            temp.icon = PlusCircle;
            temp.label = t('Stake now');
            temp.onClick = onClickButton(onClickStakeBtn);
            break;
          case StakingAction.CLAIM_REWARD:
            temp.icon = Wallet;
            temp.onClick = onClickButton(noop);
            temp.label = t('Claim rewards');
            break;
          case StakingAction.WITHDRAW:
            temp.icon = StopCircle;
            temp.onClick = onClickButton(onClickWithdrawBtn);
            temp.label = t('Withdraw');
            break;
          case StakingAction.UNSTAKE:
            temp.icon = MinusCircle;
            temp.onClick = onClickButton(onClickUnStakeBtn);
            temp.label = t('Unstake');
            break;
          case StakingAction.CANCEL_UNSTAKE:
            temp.icon = MinusCircle;
            temp.onClick = onClickButton(onClickCancelUnStakeBtn);
            temp.label = t('Cancel Unstake');
            break;
        }

        result.push(temp);
      });
    }

    return result;
  }, [availableActions, chain, onClickButton, onClickCalculatorBtn, onClickCancelUnStakeBtn, onClickItem, onClickStakeBtn, onClickUnStakeBtn, onClickWithdrawBtn, t, yieldPoolInfo.metadata]);

  const tagType = useMemo(() => createEarningTagTypes(t, token)[type], [t, token, type]);

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
                color={tagType.color}
                icon={(
                  <Icon
                    phosphorIcon={tagType.icon}
                    weight='fill'
                  />
                )}
              >{tagType.label}</Tag>
            </div>

            <div className={'earning-item-description'}>{description}</div>
          </>

          <div className='earning-item-footer'>
            {buttons.map((item) => {
              return (
                <Button
                  disabled={item.disable}
                  icon={(
                    <Icon
                      className={'earning-item-stake-btn'}
                      phosphorIcon={item.icon}
                      size='sm'
                      weight='fill'
                    />
                  )}
                  key={item.key}
                  onClick={item.onClick}
                  shape='circle'
                  size='xs'
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        </>
      )}
      onClick={onClickItem}
      rightItem={(
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <MetaInfo>
            <MetaInfo.Status
              className={'earning-status-item'}
              statusIcon={getStakingStatus.icon}
              statusName={t(getStakingStatus.name)}
              valueColorSchema={getStakingStatus.schema}
            />
          </MetaInfo>
          <Number
            decimal={tokenInfo ? tokenInfo.decimals || 0 : 0}
            decimalOpacity={0.4}
            size={30}
            suffix={tokenInfo ? tokenInfo.symbol : ''}
            unitOpacity={0.4}
            value={yieldPositionInfoBalance.totalBalance} // TODO
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: token.paddingXXS }}>
            <Typography.Text style={{ color: token.colorTextLight4 }}>{t('Total rewards:')}</Typography.Text>
            <Number
              decimal={tokenInfo.decimals || 0}
              decimalColor={token.colorSuccess}
              intColor={token.colorSuccess}
              suffix={tokenInfo.symbol}
              unitColor={token.colorSuccess}
              value={'0'} // TODO: improve this
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
    },

    '.earning-status-item': {
      display: 'block'
    }
  });
});

export default HorizontalEarningItem;
