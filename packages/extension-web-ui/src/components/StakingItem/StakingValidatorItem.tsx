// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps, ValidatorDataType } from '@subwallet/extension-web-ui/types';
import { formatBalance, toShort } from '@subwallet/extension-web-ui/utils';
import { getValidatorKey } from '@subwallet/extension-web-ui/utils/transaction/stake';
import { BackgroundIcon, Button, Icon, Web3Block } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import { CheckCircle, DotsThree, Medal } from 'phosphor-react';
import React, { SyntheticEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps & {
  validatorInfo: ValidatorDataType;
  onClick?: (value: string) => void;
  onClickMoreBtn: (e: SyntheticEvent) => void;
  apy: string;
  isSelected?: boolean;
  showUnSelectedIcon?: boolean;
  isNominated?: boolean;
  disabled?: boolean;
  prefixAddress?: number
}

const Component: React.FC<Props> = (props: Props) => {
  const { apy, className, disabled, isNominated, isSelected, onClick, onClickMoreBtn, prefixAddress, showUnSelectedIcon = true, validatorInfo } = props;
  const { token } = useTheme() as Theme;

  const { t } = useTranslation();

  const _onSelect = useCallback(() => {
    onClick && onClick(getValidatorKey(validatorInfo.address, validatorInfo.identity));
  },
  [onClick, validatorInfo.address, validatorInfo.identity]
  );

  return (
    <div
      className={CN(className, { disabled: disabled })}
      onClick={disabled ? undefined : _onSelect}
    >
      <Web3Block
        className={'validator-item-content'}
        leftItem={
          <SwAvatar
            identPrefix={prefixAddress}
            isShowSubIcon={validatorInfo.isVerified}
            size={40}
            subIcon={<BackgroundIcon
              backgroundColor={token.colorSuccess}
              phosphorIcon={CheckCircle}
              size={'xs'}
              weight={'fill'}
            />}
            theme={isEthereumAddress(validatorInfo.address) ? 'ethereum' : 'polkadot'}
            value={validatorInfo.address}
          />
        }
        middleItem={
          <>
            <div className={'middle-item__name-wrapper'}>
              <div className={'middle-item__name'}>{validatorInfo.identity || toShort(validatorInfo.address)}</div>
              {isNominated && <Icon
                iconColor={token.colorSuccess}
                phosphorIcon={Medal}
                size={'xs'}
                weight={'fill'}
              />}
            </div>

            <div className={'middle-item__info'}>
              <span className={'middle-item__commission'}>
                {t('Commission')}: {validatorInfo.commission}%
              </span>
              {
                apy !== '0' && (
                  <>
                    <span>-</span>
                    <span className={'middle-item__apy'}>
                      {t('APY')}: {formatBalance(apy, 0)}%
                    </span>
                  </>
                )
              }
            </div>
          </>
        }

        rightItem={
          <>
            {(showUnSelectedIcon || isSelected) && <Icon
              className={'right-item__select-icon'}
              iconColor={isSelected ? token.colorSuccess : token.colorTextLight4}
              phosphorIcon={CheckCircle}
              size={'sm'}
              weight={'fill'}
            />}
            <Button
              icon={
                <Icon phosphorIcon={DotsThree} />
              }
              onClick={onClickMoreBtn}
              size='xs'
              type='ghost'
            />
          </>
        }
      />
    </div>
  );
};

const StakingValidatorItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    // padding: token.paddingSM,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgSecondary,

    '&.disabled': {
      // opacity: token.opacityDisable,

      '.ant-web3-block:hover': {
        cursor: 'not-allowed',
        background: token.colorBgSecondary
      }
    },

    '.validator-item-content': {
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
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: token.sizeXXS
    },

    '.middle-item__commission': {
      color: token.colorTextLight4
    },

    '.middle-item__apy': {
      color: token.colorSuccess
    },

    '.right-item__select-icon': {
      paddingLeft: token.paddingSM - 2,
      paddingRight: token.paddingSM - 2
    }
  };
});

export default StakingValidatorItem;
