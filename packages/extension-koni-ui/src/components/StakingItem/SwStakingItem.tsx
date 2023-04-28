// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { Button, Icon, Popover, StakingItem, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import { DotsThree, User, Users } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo } from 'react';
import styled, { ThemeContext } from 'styled-components';
import CN from 'classnames';
import { TokenItem } from '../TokenItem';
import {Number as NumberItem} from '@subwallet/react-ui';

interface Props extends ThemeProps {
  stakingData: StakingDataType,
  priceMap: Record<string, number>,
  decimals: number,
  onClickRightIcon: (item: StakingDataType) => void,
  onClickItem: (item: StakingDataType) => void,
}

const getStakingTypeTag = (stakingType: StakingType) => {
  const tagColor = stakingType === StakingType.POOLED ? 'success' : 'warning';
  const tagIcon: PhosphorIcon = stakingType === StakingType.POOLED ? Users : User;

  return (
    <Tag
      className='staking-tag'
      color={tagColor}
      icon={<Icon phosphorIcon={tagIcon} />}
    >
      {capitalize(stakingType)}
    </Tag>
  );
};

const Component: React.FC<Props> = ({ className, decimals, onClickItem, onClickRightIcon, priceMap, stakingData }: Props) => {
  const { staking } = stakingData;
  const { isWebUI } = useContext(ScreenContext);

  const balanceValue = getBalanceValue(staking.balance || '0', decimals);

  const convertedBalanceValue = useMemo(() => {
    return getConvertedBalanceValue(balanceValue, Number(`${priceMap[staking.chain] || 0}`));
  }, [balanceValue, priceMap, staking.chain]);

  const _onClickRightIcon = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    onClickRightIcon(stakingData);
  }, [onClickRightIcon, stakingData]);

  const _onPressItem = useCallback(() => onClickItem(stakingData), [onClickItem, stakingData]);

  if (!isWebUI)
    return (
      <StakingItem
        className={className}
        convertedStakingValue={convertedBalanceValue}
        decimal={0}
        networkKey={staking.chain}
        onClickRightIcon={_onClickRightIcon}
        onPressItem={_onPressItem}
        stakingNetwork={staking.nativeToken}
        stakingType={getStakingTypeTag(staking.type)}
        stakingValue={balanceValue}
      />
    );



  const {
    staking: {
      name,
      chain,
      nativeToken
    }
  } = stakingData;
  console.log('%c Rainbowww!', 'font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38) , 6px 6px 0 rgb(226,91,14) , 9px 9px 0 rgb(245,221,8) , 12px 12px 0 rgb(5,148,68) , 15px 15px 0 rgb(2,135,206) , 18px 18px 0 rgb(4,77,145) , 21px 21px 0 rgb(42,21,113); margin-bottom: 12px; padding: 5%;');
  console.log('stakingData', stakingData)

  const { token } = useContext(ThemeContext)

  // TODO: update priceChangeStatus
  let priceChangeStatus = 'increase'
  const marginColor = priceChangeStatus === 'increase' ? token.colorSuccess : token.colorError

  return (
    <div className={CN(className, '__web-ui')} onClick={_onPressItem}>
      <TokenItem
        networkKey={chain}
        logoKey={nativeToken}
        symbol={nativeToken}
        chainDisplayName={name || ''}
      />

      <div className='type-wrapper'>
        {getStakingTypeTag(staking.type)}
      </div>

      <div className={CN('price-wrapper', className)}>
        <NumberItem
          value={10}
          prefix={'$'}
          decimal={0}
          decimalOpacity={0.45}
        />
        <NumberItem
          value={10}
          suffix='%'
          prefix={'decrease' === 'decrease' ? '-' : '+'}
          className='margin-percentage'
          decimal={0}
          size={12}
          unitColor={marginColor}
          intColor={marginColor}
          decimalColor={marginColor}
        />
      </div>

      <div className='funds-wrapper'>
        <div className='funds'>
          <NumberItem
            className={'__value'}
            decimal={0}
            decimalOpacity={0.45}
            value={11}
            suffix={staking.unit}
          />
          <NumberItem
            className={'__converted-value'}
            decimal={0}
            decimalOpacity={0.45}
            intOpacity={0.45}
            prefix='$'
            size={12}
            unitOpacity={0.45}
            value={11122}
          />
        </div>
        <Button
          type='ghost'
          icon={<Icon
            className={'right-icon'}
            type="phosphor"
            phosphorIcon={DotsThree}
            size="xs"
          />}
          onClick={_onClickRightIcon}
          size='sm'
        />
      </div>
    </div>
  )
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
    },

    '&.__web-ui': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#1A1A1A',
      borderRadius: 8,
      padding: '15px 13px',
      cursor: 'pointer',

      '.type-wrapper': {
        alignSelf: 'start',
      },

      '.funds-wrapper': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },

      '.price-wrapper, .funds': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'end',
      },
    }
  };
});

export default SwStakingItem;
