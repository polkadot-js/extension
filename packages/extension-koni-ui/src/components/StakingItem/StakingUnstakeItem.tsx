// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { UnstakingStatus } from '@subwallet/extension-base/types';
import { Avatar } from '@subwallet/extension-koni-ui/components';
import { useGetNativeTokenBasicInfo } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/utils';
import { Icon, Number, Web3Block } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, Spinner } from 'phosphor-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  unstakingInfo: UnstakingInfo;
  isSelected?: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, isSelected, unstakingInfo } = props;
  const { chain, claimable, status, validatorAddress } = unstakingInfo;

  const { token } = useTheme() as Theme;
  const { t } = useTranslation();

  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const leftItem = useMemo((): React.ReactNode => {
    if (!validatorAddress) {
      return undefined;
    } else {
      return <Avatar value={validatorAddress} />;
    }
  }, [validatorAddress]);

  const middleItem = useMemo((): React.ReactNode => {
    return (
      <>
        {
          validatorAddress && (
            <div className={'middle-item__name-wrapper'}>
              <div className={'middle-item__name'}>{toShort(validatorAddress)}</div>
            </div>
          )
        }

        <div className={CN('middle-item__info', `status-${status}`)}>
          <Icon
            iconColor='var(--icon-color)'
            phosphorIcon={status === UnstakingStatus.CLAIMABLE ? CheckCircle : Spinner}
            size='sm'
            weight='fill'
          />
          <span>{status === UnstakingStatus.CLAIMABLE ? t('Withdrawal ready') : t('Waiting')}</span>
        </div>
      </>
    );
  }, [status, t, validatorAddress]);

  const rightItem = useMemo((): React.ReactNode => {
    return (
      <>
        <Number
          className={'__selected-item-value'}
          decimal={decimals}
          decimalOpacity={0.45}
          size={token.fontSizeHeading6}
          suffix={symbol}
          value={claimable}
        />
        <Icon
          className={'right-item__select-icon'}
          iconColor={isSelected ? token.colorSuccess : token.colorTransparent}
          phosphorIcon={CheckCircle}
          size='sm'
          weight='fill'
        />
      </>
    );
  }, [claimable, decimals, isSelected, symbol, token.colorSuccess, token.colorTransparent, token.fontSizeHeading6]);

  return (
    <div
      className={CN(className)}
    >
      <Web3Block
        className={'unstake-item-content'}
        leftItem={leftItem}
        middleItem={middleItem}
        rightItem={rightItem}
      />
    </div>
  );
};

const StakingUnstakeItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    borderRadius: token.borderRadiusLG,
    background: token.colorBgSecondary,

    '.unstake-item-content': {
      borderRadius: token.borderRadiusLG
    },

    '.ant-web3-block-middle-item': {
      paddingRight: token.padding
    },

    '.middle-item__name-wrapper': {
      display: 'flex',
      alignItems: 'center'
    },

    '.middle-item__name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      paddingRight: token.paddingXXS,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    '.middle-item__info': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.sizeXXS,

      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: 'var(--color)',
      '--icon-color': 'var(--color)'
    },

    [`.status-${UnstakingStatus.CLAIMABLE}`]: {
      '--color': token.colorSuccess
    },

    [`.status-${UnstakingStatus.UNLOCKING}`]: {
      '--color': token['gold-6']
    },

    '.middle-item__active-stake': {
      color: token.colorTextLight4,
      paddingRight: token.paddingXXS
    },

    '.right-item__select-icon': {
      paddingLeft: token.paddingSM - 2,
      paddingRight: token.paddingSM - 2
    }
  };
});

export default StakingUnstakeItem;
