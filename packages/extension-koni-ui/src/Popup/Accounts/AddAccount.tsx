// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { BackgroundIcon, Button, SelectModal } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { GlobalToken } from '@subwallet/react-ui/es/theme/interface';
import { Info,Leaf, ShareNetwork } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { SettingItemSelection } from '@subwallet/extension-koni-ui/components/Setting/SettingItemSelection';

interface Item {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface Props {
  className?: string;
}

const getAddAccountItems = (newSeedPhraseTitle: string, existingSeedPhrase: string, token: Partial<GlobalToken>): Item[] => {
  return [
    {
      icon: <BackgroundIcon
        backgroundColor={token['green-7']}
        iconColor='#FFF'
        phosphorIcon={Leaf}
        size='sm'
        weight='fill'
      />,
      label: newSeedPhraseTitle,
      value: '1'
    },
    {
      icon: <BackgroundIcon
        backgroundColor={token['magenta-7']}
        iconColor='#FFF'
        phosphorIcon={ShareNetwork}
        size='sm'
        weight='fill'
      />,
      label: existingSeedPhrase,
      value: '2'
    }
  ];
};

function _AddAccount ({ className }: Props): React.ReactElement<Props> {
  const [selected, setSelected] = useState<string>('');
  const { token } = useTheme() as Theme;
  const { t } = useTranslation();
  const _onSelect = useCallback((value: string) => {
    setSelected(value);
  }, []);

  const renderItem = (item: Item, _selected: boolean) => {
    return (
      <SettingItemSelection
        className={'add-account-item-wrapper'}
        leftItemIcon={item.icon}
        label={item.label}
        isSelected={_selected}
      />
    );
  };

  return (
    <>
      {/* @ts-ignore */}
      <SelectModal
        className={className}
        id='add-account-modal'
        itemKey='value'
        items={getAddAccountItems(t('Create with new Seed Phrase'), t('Create with existing Seed Phrase'), token)}
        onSelect={_onSelect}
        renderItem={renderItem}
        selected={selected}
        title={
          <div>
            <div>{t('Create new account')}</div>
            <Button className={'add-account-modal-right-icon'} size='xs' type='ghost' shape='circle' icon={<Icon phosphorIcon={Info} size='sm' />} />
          </div>
        }
      />
    </>
  );
}

export const AddAccount = styled(_AddAccount)<Props>(() => {
  return ({
    '&.ant-sw-modal': {
      '.add-account-modal-right-icon': {
        position: 'absolute',
        insetInlineEnd: 8,
        top: 10
      },
    }
  });
});
