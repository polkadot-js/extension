// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { Icon, StakingItem, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import { User, Users } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useMemo } from 'react';
import { TFunction } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  stakingData: StakingDataType,
  priceMap: Record<string, number>,
  decimals: number,
  onClickRightIcon: (item: StakingDataType) => void,
  onClickItem: (item: StakingDataType) => void,
}

const getStakingTypeTag = (stakingType: StakingType, t: TFunction) => {
  const tagColor = stakingType === StakingType.POOLED ? 'success' : 'warning';
  const tagIcon: PhosphorIcon = stakingType === StakingType.POOLED ? Users : User;

  return (
    <Tag
      className='staking-tag'
      color={tagColor}
      icon={<Icon phosphorIcon={tagIcon} />}
    >
      {t(capitalize(stakingType))}
    </Tag>
  );
};

const Component: React.FC<Props> = ({ className, decimals, onClickItem, onClickRightIcon, priceMap, stakingData }: Props) => {
  const { staking } = stakingData;

  const { t } = useTranslation();

  const { isShowBalance } = useSelector((state) => state.settings);

  const balanceValue = getBalanceValue(staking.balance || '0', decimals);

  const convertedBalanceValue = useMemo(() => {
    return getConvertedBalanceValue(balanceValue, Number(`${priceMap[staking.chain] || 0}`));
  }, [balanceValue, priceMap, staking.chain]);

  const _onClickRightIcon = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    onClickRightIcon(stakingData);
  }, [onClickRightIcon, stakingData]);

  const _onPressItem = useCallback(() => onClickItem(stakingData), [onClickItem, stakingData]);

  return (
    <StakingItem
      className={className}
      convertedStakingValue={convertedBalanceValue}
      decimal={0}
      hideBalance={!isShowBalance}
      networkKey={staking.chain}
      onClickRightIcon={_onClickRightIcon}
      onPressItem={_onPressItem}
      stakingNetwork={staking.nativeToken}
      stakingType={getStakingTypeTag(staking.type, t)}
      stakingValue={balanceValue}
    />
  );
};

const SwStakingItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-staking-item-name': {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      maxWidth: '120px'
    },

    '.ant-staking-item-balance-info-wrapper .ant-number:last-child': {
      span: {
        lineHeight: token.lineHeightSM
      }

    },

    '.ant-staking-item-balance-info-wrapper .ant-number:first-child': {
      span: {
        lineHeight: 1.5
      }
    },

    '.ant-staking-item-right-icon': {
      display: 'none'
    },

    '.staking-tag': {
      width: 'fit-content',
      background: 'transparent',

      '&::before': {
        borderRadius: token.borderRadiusLG
      }
    }
  };
});

export default SwStakingItem;
