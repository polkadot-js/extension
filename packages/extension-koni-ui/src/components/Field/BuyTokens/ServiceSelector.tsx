// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/Base';
import { BaseSelectModal } from '@subwallet/extension-koni-ui/components/Modal/BaseSelectModal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { useSelectModalInputHelper } from '@subwallet/extension-koni-ui/hooks/form/useSelectModalInputHelper';
import { SupportService, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, InputRef, Logo, SelectModalItem, Web3Block } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, useCallback } from 'react';
import styled from 'styled-components';

export interface ServiceItem extends SelectModalItem {
  key: SupportService,
  name: string
}

interface Props extends ThemeProps, BasicInputWrapper {
  items: ServiceItem[];
}

export const baseServiceItems: ServiceItem[] = [
  {
    key: 'transak',
    name: 'Transak',
    disabled: false
  },
  {
    key: 'banxa',
    name: 'Banxa',
    disabled: false
  },
  {
    key: 'coinbase',
    name: 'Coinbase Pay',
    disabled: false
  },
  {
    key: 'moonpay',
    name: 'MoonPay (Coming soon)',
    disabled: true
  },
  {
    key: 'onramper',
    name: 'Onramper (Coming soon)',
    disabled: true
  }
];

const Component = (props: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> => {
  const { className = '', disabled, id = 'service-selector', items, label, placeholder, statusHelp, value } = props;
  const { t } = useTranslation();
  const { onSelect } = useSelectModalInputHelper(props, ref);

  const renderSelected = useCallback((item: ServiceItem) => {
    return (
      <div className={'__selected-item'}>
        <Logo
          className={'__selected-item-logo'}
          network={item.key}
          size={24}
        />

        <div className={'__selected-item-name common-text'}>
          {item.name}
        </div>
      </div>
    );
  }, []);

  const renderItem = useCallback((item: ServiceItem, selected: boolean) => {
    return (
      <Web3Block
        className={CN('__option-item', { disabled: item.disabled })}
        leftItem={(
          <Logo
            className={'__option-logo'}
            network={item.key}
            shape='squircle'
            size={24}
          />
        )}
        middleItem={<div className={'__option-item-name'}>{item.name}</div>}
        rightItem={selected && (
          <Icon
            className='__option-item-right-icon'
            phosphorIcon={CheckCircle}
            size={'sm'}
            type='phosphor'
            weight='fill'
          />
        )}
      />
    );
  }, []);

  return (
    <>
      <BaseSelectModal
        className={`${className} service-selector-modal`}
        disabled={disabled}
        id={id}
        inputClassName={`${className} service-selector-input`}
        itemKey={'key'}
        items={items}
        label={label}
        onSelect={onSelect}
        placeholder={placeholder || t('Select service')}
        renderItem={renderItem}
        renderSelected={renderSelected}
        selected={value || ''}
        statusHelp={statusHelp}
        title={label || placeholder || t('Select service')}
      />
    </>
  );
};

export const ServiceSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.service-selector-modal': {
      '.__option-item': {
        padding: 0,
        paddingLeft: token.sizeSM,
        paddingRight: token.sizeXXS,
        minHeight: 52,
        borderRadius: token.borderRadiusLG,

        '&:not(:hover)': {
          backgroundColor: token.colorBgSecondary
        }
      },

      '.disabled': {
        cursor: 'not-allowed',
        opacity: token.opacityDisable,

        '&:hover': {
          background: token.colorBgSecondary
        }
      },

      '.ant-web3-block-right-item': {
        margin: 0
      },

      '.__option-item-right-icon': {
        width: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: token.colorSuccess
      }
    },

    '&.service-selector-input': {
      '.ant-select-modal-input-wrapper': {
        paddingLeft: token.paddingSM
      },

      '.__selected-item': {
        display: 'flex',
        color: token.colorTextLight1,
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      },
      '.__selected-item-name': {
        textOverflow: 'ellipsis',
        fontWeight: token.headingFontWeight,
        overflow: 'hidden',
        paddingLeft: token.paddingXS,
        paddingRight: token.paddingXS
      }
    }
  });
});
