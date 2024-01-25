// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-web-ui/hooks/screen/home/useAccountBalance';
import { Theme } from '@subwallet/extension-web-ui/themes';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-web-ui/types';
import { StakingDataType } from '@subwallet/extension-web-ui/types/staking';
import { stopClickPropagation } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, Number as NumberItem, Popover, StakingItem, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import CN from 'classnames';
import { DotsThree, User, Users } from 'phosphor-react';
import React, { Context, SyntheticEvent, useCallback, useContext, useMemo } from 'react';
import { TFunction } from 'react-i18next';
import styled, { ThemeContext } from 'styled-components';

import { TokenItem } from '../TokenItem';

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
  const { isWebUI } = useContext(ScreenContext);
  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;

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

  const { staking: { chain, name, nativeToken } } = stakingData;

  const rightIcon = useMemo(() => {
    if (!isWebUI) {
      return <Button
        icon={(
          <Icon
            className={'right-icon'}
            phosphorIcon={DotsThree}
            size='xs'
            type='phosphor'
          />
        )}
        onClick={_onClickRightIcon}
        size='sm'
        type='ghost'
      />;
    }

    return (
      <Popover
        content={
          'TODO: add ActionList'
          // <MoreActionModal
          //   chainStakingMetadata={stakingData.chainStakingMetadata}
          //   nominatorMetadata={stakingData.nominatorMetadata}
          //   reward={stakingData.reward}
          // />
        }
        overlayInnerStyle={{
          padding: '0',
          background: '#1A1A1A'
        }}
        placement='bottomRight'
        showArrow={false}
        trigger='click'
      >
        <Button
          icon={(
            <Icon
              className={'right-icon'}
              phosphorIcon={DotsThree}
              size='xs'
              type='phosphor'
            />
          )}
          onClick={stopClickPropagation}
          size='sm'
          type='ghost'
        />
      </Popover>
    );
  }, [_onClickRightIcon, isWebUI]);

  // TODO: update priceChangeStatus
  const priceChangeStatus = 'increase';
  const marginColor = priceChangeStatus === 'increase' ? token.colorSuccess : token.colorError;

  if (!isWebUI) {
    return (
      <StakingItem
        className={className}
        convertedStakingValue={convertedBalanceValue}
        decimal={0}
        networkKey={staking.chain}
        onClickRightIcon={_onClickRightIcon}
        onPressItem={_onPressItem}
        stakingNetwork={staking.nativeToken}
        stakingType={getStakingTypeTag(staking.type, t)}
        stakingValue={balanceValue}
      />
    );
  }

  return (
    <div
      className={CN(className, '__web-ui')}
      onClick={_onPressItem}
    >
      <TokenItem
        logoKey={nativeToken}
        networkKey={chain}
        subTitle={name || ''}
        symbol={nativeToken}
      />

      <div className='type-wrapper'>
        {getStakingTypeTag(staking.type, t)}
      </div>

      <div className={CN('price-wrapper', className)}>
        <NumberItem
          decimal={0}
          decimalOpacity={0.45}
          prefix={'$'}
          value={10}
        />
        <NumberItem
          className='margin-percentage'
          decimal={0}
          decimalColor={marginColor}
          intColor={marginColor}
          prefix={'+'}
          size={12}
          suffix='%'
          unitColor={marginColor}
          value={10}
        />
      </div>

      <div className='funds-wrapper'>
        <div className='funds'>
          <NumberItem
            className={'__value'}
            decimal={0}
            decimalOpacity={0.45}
            hide={isShowBalance}
            suffix={staking.unit}
            value={11}
          />
          <NumberItem
            className={'__converted-value'}
            decimal={0}
            decimalOpacity={0.45}
            hide={isShowBalance}
            intOpacity={0.45}
            prefix='$'
            size={12}
            unitOpacity={0.45}
            value={11122}
          />
        </div>
        {rightIcon}
      </div>
    </div>
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
        alignSelf: 'start'
      },

      '.funds-wrapper': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      },

      '.price-wrapper, .funds': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'end'
      }
    }
  };
});

export default SwStakingItem;
