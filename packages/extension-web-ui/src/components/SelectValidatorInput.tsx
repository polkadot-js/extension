// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import AvatarGroup, { BaseAccountInfo } from '@subwallet/extension-web-ui/components/Account/Info/AvatarGroup';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { toShort } from '@subwallet/extension-web-ui/utils';
import { ActivityIndicator, Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { Book } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps & {
  label: string;
  placeholder?: string;
  value: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  chain: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { chain, className, disabled, label, loading, onClick, placeholder, value } = props;
  const { t } = useTranslation();

  const addressList = useMemo(() => {
    if (value) {
      const addressList: BaseAccountInfo[] = value.split(',').map((item) => {
        const itemInfo = item.split('___');

        return {
          address: itemInfo[0],
          name: itemInfo[1],
          type: isEthereumAddress(itemInfo[0]) ? 'ethereum' : 'sr25519'
        };
      });

      return addressList;
    } else {
      return [];
    }
  }, [value]);

  const validatorLabel = useMemo(() => `${getValidatorLabel(chain).charAt(0).toLowerCase() + getValidatorLabel(chain).substr(1)}${addressList.length > 1 ? 's' : ''}`, [addressList, chain]);

  const renderContent = () => {
    if (!value) {
      return placeholder || (t('Select') + ' ' + t(validatorLabel));
    }

    const valueList = value.split(',');

    if (valueList.length > 1) {
      return t('Select') + ` ${valueList.length} ` + t(validatorLabel);
    }

    return valueList[0].split('___')[1] || toShort(valueList[0].split('___')[0]);
  };

  const _onClick = useCallback(() => {
    (!disabled && !loading) && onClick();
  }, [disabled, onClick, loading]);

  return (
    <div
      className={CN(className, {
        '-disabled': disabled,
        '-loading': loading
      })}
      onClick={_onClick}
    >
      <div className={'select-validator-input__label'}>{label}</div>
      <div className={'select-validator-input__content-wrapper'}>
        {!!addressList.length && <AvatarGroup
          accounts={addressList}
          className={'select-validator-input__avatar-gr'}
        />}
        <div className={'select-validator-input__content'}>{renderContent()}</div>
        <div className={'select-validator-input__button-wrapper'}>
          {
            loading
              ? (
                <ActivityIndicator
                  loading={true}
                  size={16}
                />
              )
              : (
                <>
                  <Button
                    disabled={disabled}
                    icon={<Icon
                      phosphorIcon={Book}
                      size={'sm'}
                    />}
                    size={'xs'}
                    type={'ghost'}
                  />
                </>
              )
          }
        </div>
      </div>
    </div>
  );
};

const SelectValidatorInput = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    background: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    padding: `${token.paddingXS}px ${token.paddingSM}px ${token.paddingXXS}px`,
    cursor: 'pointer',

    '&:before': {
      content: '""',
      border: '2px solid transparent',
      borderRadius: token.borderRadiusLG,
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      transition: `border-color ${token.motionDurationSlow}`
    },

    '&:hover': {
      '&:before': {
        borderColor: token.colorPrimaryBorderHover
      }
    },

    '&.-disabled': {
      cursor: 'not-allowed',
      border: 'none'
    },

    '&.-loading': {
      cursor: 'not-allowed',
      border: 'none',

      '.select-validator-input__button-wrapper': {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: token.controlHeightLG,
        marginRight: 0
      }
    },

    '.select-validator-input__label': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4,
      position: 'relative',
      zIndex: 0
    },

    '.select-validator-input__content-wrapper': {
      display: 'flex',
      alignItems: 'center'
    },

    '.select-validator-input__avatar-gr': {
      marginRight: token.paddingXS
    },

    '.select-validator-input__content': {
      flex: 1,
      paddingRight: token.paddingXS,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      zIndex: 0
    },

    '.select-validator-input__button-wrapper': {
      marginRight: `-${token.paddingSM - 2}px`
    }
  };
});

export default SelectValidatorInput;
