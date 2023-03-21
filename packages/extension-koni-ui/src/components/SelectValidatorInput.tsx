// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import AvatarGroup, { BaseAccountInfo } from '@subwallet/extension-koni-ui/components/Account/Info/AvatarGroup';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { Book, DotsThree } from 'phosphor-react';
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
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, disabled, label, onClick, placeholder, value } = props;
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

  const renderContent = () => {
    if (!value) {
      return placeholder || t('Selected validator');
    }

    const valueList = value.split(',');

    if (valueList.length > 1) {
      return t(`Selected ${valueList.length} validator`);
    }

    return valueList[0].split('___')[1];
  };

  const _onClick = useCallback(() => {
    !disabled && onClick();
  }, [disabled, onClick]);

  return (
    <div
      className={CN(className, {
        '-disabled': disabled
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
          <Button
            disabled={disabled}
            icon={<Icon
              phosphorIcon={Book}
              size={'sm'}
            />}
            size={'xs'}
            type={'ghost'}
          />
          <Button
            disabled={disabled}
            icon={<Icon
              phosphorIcon={DotsThree}
              size={'sm'}
            />}
            size={'xs'}
            type={'ghost'}
          />
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
    border: '2px solid transparent',
    transition: 'border-color 0.3s',

    '&.-disabled': {
      cursor: 'not-allowed',
      border: 'none'
    },

    '&:hover': {
      borderColor: token.colorPrimaryBorderHover
    },

    '.select-validator-input__label': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4
    },

    '.select-validator-input__content-wrapper': {
      display: 'flex',
      alignItems: 'center'
    },

    '.select-validator-input__avatar-gr': {
      paddingRight: token.paddingXS
    },

    '.select-validator-input__content': {
      flex: 1,
      paddingRight: token.paddingXS,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    '.select-validator-input__button-wrapper': {
      marginRight: `-${token.paddingSM - 2}px`
    }
  };
});

export default SelectValidatorInput;
