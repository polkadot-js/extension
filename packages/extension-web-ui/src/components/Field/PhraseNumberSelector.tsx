// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseSelectModal } from '@subwallet/extension-web-ui/components';
import { BasicInputWrapper } from '@subwallet/extension-web-ui/components/Field/Base';
import { useSelectModalInputHelper, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, InputRef, SettingItem } from '@subwallet/react-ui';
import { CheckCircle } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, useCallback } from 'react';
import styled, { useTheme } from 'styled-components';

import { GeneralEmptyList } from '../EmptyList';

interface Item {
  value: string;
  label: string;
}

interface Props extends ThemeProps, BasicInputWrapper {
  items: Item[];
}

const renderEmpty = () => <GeneralEmptyList />;

function Component (props: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { className = '', disabled, id = 'address-input', items, label, placeholder, statusHelp, title, tooltip, value } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { onSelect } = useSelectModalInputHelper(props, ref);

  const renderSelected = useCallback((item: Item) => {
    return (
      <div className={'__selected-item'}>{item.label}</div>
    );
  }, []);

  const renderItem = useCallback((item: Item, selected: boolean) => {
    return (
      <SettingItem
        name={item.label}
        rightItem={(
          selected && (<div className={'__check-icon'}>
            <Icon
              customSize={'20px'}
              iconColor={token.colorSuccess}
              phosphorIcon={CheckCircle}
              type='phosphor'
              weight='fill'
            />
          </div>)
        )}
      />
    );
  }, [token]);

  return (
    <BaseSelectModal
      className={`${className} phrase-number-selector-modal`}
      disabled={disabled}
      id={id}
      inputClassName={`${className} phrase-number-selector-input`}
      itemKey={'value'}
      items={items}
      label={label}
      onSelect={onSelect}
      placeholder={placeholder || t('Phrase number')}
      renderItem={renderItem}
      renderSelected={renderSelected}
      renderWhenEmpty={renderEmpty}
      selected={value || ''}
      statusHelp={statusHelp}
      title={title || label || placeholder || t('Select type')}
      tooltip={tooltip}
    />
  );
}

const PhraseNumberSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.ant-select-modal-input-container .ant-select-modal-input-wrapper': {
      paddingLeft: 12,
      paddingRight: 12
    },

    '&.phrase-number-selector-input .__selected-item': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: token.colorText
    },

    '.ant-setting-item .__check-icon': {
      display: 'flex',
      width: 40,
      justifyContent: 'center'
    }
  });
});

export default PhraseNumberSelector;
