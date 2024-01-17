// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { GeneralEmptyList, StakingUnstakeItem } from '@subwallet/extension-koni-ui/components';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/Base';
import { useGetNativeTokenBasicInfo } from '@subwallet/extension-koni-ui/hooks';
import { useSelectModalInputHelper } from '@subwallet/extension-koni-ui/hooks/form/useSelectModalInputHelper';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, InputRef, Number, SelectModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, Spinner } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';
import {UnstakingStatus} from "@subwallet/extension-base/types";

interface Props extends ThemeProps, BasicInputWrapper {
  chain: string;
  nominators: UnstakingInfo[];
}

interface UnstakeItem extends UnstakingInfo {
  key: string;
}

const renderEmpty = () => <GeneralEmptyList />;

const renderItem = (item: UnstakingInfo, isSelected: boolean) => (
  <StakingUnstakeItem
    isSelected={isSelected}
    unstakingInfo={item}
  />
);

// todo: update filter for this component, after updating filter for SelectModal
const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { chain, className = '', defaultValue, disabled, id = 'cancel-unstake', label, nominators, placeholder, statusHelp, value } = props;

  const { token } = useTheme() as Theme;
  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const items = useMemo((): UnstakeItem[] => {
    return nominators.map((item, index) => ({ ...item, key: String(index) }));
  }, [nominators]);

  const { onSelect } = useSelectModalInputHelper(props, ref);

  const { t } = useTranslation();

  const renderSelected = useCallback(
    (item: UnstakingInfo) => {
      return (
        <div className={CN('__selected-item', 'common-text', `status-${item.status}`)}>
          <Icon
            iconColor='var(--icon-color)'
            phosphorIcon={item.status === UnstakingStatus.CLAIMABLE ? CheckCircle : Spinner}
            size='sm'
            weight='fill'
          />
          <Number
            className={'__selected-item-value'}
            decimal={decimals}
            decimalOpacity={0.45}
            size={token.fontSizeHeading6}
            suffix={symbol}
            value={item.claimable}
          />
        </div>
      );
    },
    [decimals, symbol, token.fontSizeHeading6]
  );

  useEffect(() => {
    if (!value) {
      if (defaultValue || items[0]?.key) {
        onSelect(defaultValue || items[0].key);
      }
    } else {
      const existed = items.find((item) => item.key === value);

      if (!existed) {
        onSelect(items[0]?.key || '');
      }
    }
  }, [value, items, onSelect, defaultValue]);

  return (
    <>
      <SelectModal
        className={className}
        disabled={disabled}
        id={id}
        inputClassName={CN(className, 'cancel-unstake-input')}
        itemKey={'key'}
        items={items}
        label={label}
        onSelect={onSelect}
        placeholder={placeholder || label}
        renderItem={renderItem}
        renderSelected={renderSelected}
        renderWhenEmpty={renderEmpty}
        selected={value || ''}
        statusHelp={statusHelp}
        title={t('Select request')}
      />
    </>
  );
};

const CancelUnstakeSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '&.cancel-unstake-input': {
      [`.status-${UnstakingStatus.CLAIMABLE}`]: {
        '--icon-color': token.colorSuccess
      },

      [`.status-${UnstakingStatus.UNLOCKING}`]: {
        '--icon-color': token['gold-6']
      },

      '.__selected-item': {
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        gap: token.sizeXS
      },
      '.__selected-item-value': {
        fontWeight: token.bodyFontWeight,
        lineHeight: token.lineHeightHeading6
      }
    },

    '.ant-select-modal-input-wrapper': {
      height: 44
    }
  };
});

export default CancelUnstakeSelector;
