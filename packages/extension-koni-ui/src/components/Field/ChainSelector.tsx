// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, Logo, NetworkItem, SelectModal } from '@subwallet/react-ui';
import { SelectModalProps } from '@subwallet/react-ui/es/select-modal/SelectModal';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

export type ChainItemType = {
  name: string,
  slug: string,
};

interface Props extends ThemeProps {
  id: string,
  items: ChainItemType[],
  label?: string,
  onSelectItem: SelectModalProps<ChainItemType>['onSelect'],
  selectedItem: string,
}

function Component ({ className = '', id, items, label, onSelectItem, selectedItem }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const renderChainSelected = useCallback((item: ChainItemType) => {
    return (
      <div className={'__selected-item'}>{item.name}</div>
    );
  }, []);

  const searchFunction = useCallback((item: ChainItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const chainLogo = useMemo(() => {
    return (
      <Logo
        network={selectedItem}
        size={token.controlHeightSM}
      />
    );
  }, [selectedItem, token.controlHeightSM]);

  const renderItem = useCallback((item: ChainItemType, selected: boolean) => {
    return (
      <NetworkItem
        name={item.name}
        networkKey={item.slug}
        networkMainLogoShape={'circle'}
        networkMainLogoSize={28}
        rightItem={selected && <Icon
          customSize={'20px'}
          iconColor={token.colorSuccess}
          phosphorIcon={CheckCircle}
          type='phosphor'
          weight={'fill'}
        />}
      />
    );
  }, [token]);

  return (
    <SelectModal
      className={`${className} chain-selector-modal`}
      id={id}
      inputClassName={`${className} chain-selector-input`}
      itemKey={'slug'}
      items={items}
      label={label}
      onSelect={onSelectItem}
      placeholder={t('Select chain')}
      prefix={selectedItem !== '' && chainLogo}
      renderItem={renderItem}
      renderSelected={renderChainSelected}
      searchFunction={searchFunction}
      searchPlaceholder={t('Search chain')}
      searchableMinCharactersCount={2}
      selected={selectedItem}
    />
  );
}

export const ChainSelector = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.chain-selector-input .__selected-item': {
      color: token.colorText
    }
  });
});
