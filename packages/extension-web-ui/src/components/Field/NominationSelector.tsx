// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominationInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { StakingNominationItem } from '@subwallet/extension-web-ui/components';
import { Avatar } from '@subwallet/extension-web-ui/components/Avatar';
import { BasicInputWrapper } from '@subwallet/extension-web-ui/components/Field/Base';
import { BaseSelectModal } from '@subwallet/extension-web-ui/components/Modal/BaseSelectModal';
import { useSelectModalInputHelper } from '@subwallet/extension-web-ui/hooks/form/useSelectModalInputHelper';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { toShort } from '@subwallet/extension-web-ui/utils';
import { InputRef } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { GeneralEmptyList } from '../EmptyList';

interface Props extends ThemeProps, BasicInputWrapper {
  nominators: NominationInfo[];
  chain: string
}

const renderEmpty = () => <GeneralEmptyList />;

const renderItem = (item: NominationInfo, isSelected: boolean) => (
  <StakingNominationItem
    isSelected={isSelected}
    nominationInfo={item}
  />
);

// todo: update filter for this component, after updating filter for SelectModal
const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { chain = '', className, defaultValue, disabled, id = 'nomination-selector', label, nominators, placeholder, statusHelp, value } = props;

  const filteredItems = useMemo(() => {
    return nominators.filter((item) => new BigN(item.activeStake).gt(0));
  }, [nominators]);
  const { onSelect } = useSelectModalInputHelper(props, ref);

  const { t } = useTranslation();

  const searchFunction = useCallback((item: NominationInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.validatorAddress.toLowerCase().includes(searchTextLowerCase) ||
      (item.validatorIdentity
        ? item.validatorIdentity.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  const handleValidatorLabel = useMemo(() => {
    const label = getValidatorLabel(chain);

    return label !== 'dApp' ? label.toLowerCase() : label;
  }, [chain]);

  const renderSelected = useCallback(
    (item: NominationInfo) => {
      return (
        <div className={'__selected-item'}>
          <div className={'__selected-item-name common-text'}>
            {item.validatorIdentity || toShort(item.validatorAddress)}
          </div>
        </div>
      );
    },
    []
  );

  useEffect(() => {
    if (!value) {
      if (defaultValue || filteredItems[0]?.validatorAddress) {
        onSelect(defaultValue || filteredItems[0].validatorAddress);
      }
    } else {
      const existed = filteredItems.find((item) => item.validatorAddress === value);

      if (!existed) {
        onSelect(filteredItems[0]?.validatorAddress || '');
      }
    }
  }, [value, filteredItems, onSelect, defaultValue]);

  return (
    <>
      <BaseSelectModal
        className={className}
        disabled={disabled}
        id={id}
        inputClassName={CN(className, 'nomination-selector-input')}
        itemKey={'validatorAddress'}
        items={filteredItems}
        label={label}
        onSelect={onSelect}
        placeholder={placeholder || label}
        prefix={
          <Avatar
            size={20}
            value={value}
          />
        }
        renderItem={renderItem}
        renderSelected={renderSelected}
        renderWhenEmpty={renderEmpty}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>(`Search ${handleValidatorLabel}`)}
        selected={value || ''}
        statusHelp={statusHelp}
        title={label || placeholder || t('Select validator')}
      />
    </>
  );
};

const NominationSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '&.nomination-selector-input': {
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
      height: 44
    }
  };
});

export default NominationSelector;
