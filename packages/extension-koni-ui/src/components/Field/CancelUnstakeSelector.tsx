// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { GeneralEmptyList, StakingUnstakeItem } from '@subwallet/extension-koni-ui/components';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/Base';
import { useGetNativeTokenBasicInfo } from '@subwallet/extension-koni-ui/hooks';
import { useSelectModalInputHelper } from '@subwallet/extension-koni-ui/hooks/form/useSelectModalInputHelper';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { formatBalance } from '@subwallet/extension-koni-ui/util';
import { InputRef, SelectModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

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
  const { chain, className = '', disabled, id = 'cancel-unstake', label, nominators, placeholder, value } = props;

  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const items = useMemo((): UnstakeItem[] => {
    return nominators.map((item, index) => ({ ...item, key: String(index) }));
  }, [nominators]);

  const { onSelect } = useSelectModalInputHelper(props, ref);

  const { t } = useTranslation();

  const renderSelected = useCallback(
    (item: UnstakingInfo) => {
      return (
        <div className={'__selected-item'}>
          <div className={'__selected-item-name common-text'}>
            {(formatBalance(item.claimable, decimals))}&nbsp;{symbol}
          </div>
        </div>
      );
    },
    [decimals, symbol]
  );

  useEffect(() => {
    if (!value) {
      onSelect(items[0]?.key || '');
    } else {
      const existed = items.find((item) => item.key === value);

      if (!existed) {
        onSelect(items[0]?.key || '');
      }
    }
  }, [value, items, onSelect]);

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
        title={label || placeholder || t('Select unstake')}
      />
    </>
  );
};

const CancelUnstakeSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '&.cancel-unstake-input': {
      '.__selected-item': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: token.colorTextLight1,
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      },
      '.__selected-item-name': {
        textOverflow: 'ellipsis',
        fontWeight: token.headingFontWeight,
        overflow: 'hidden'
      },
      '.__selected-item-right-part': {
        color: token.colorTextLight4,
        paddingLeft: token.sizeXXS
      }
    },

    '.ant-select-modal-input-wrapper': {
      height: 44,
      ' > span': {
        display: 'none'
      }
    }
  };
});

export default CancelUnstakeSelector;
