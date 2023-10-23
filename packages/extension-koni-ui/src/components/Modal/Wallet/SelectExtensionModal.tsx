// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_WALLETS, SELECT_EXTENSION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { checkHasInjected } from '@subwallet/extension-koni-ui/utils/wallet';
import { Icon, Image, ModalContext, SettingItem, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, MagnifyingGlass } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import { EmptyList } from '../../EmptyList';
import { BaseModal } from '../BaseModal';

type Props = ThemeProps;

const modalId = SELECT_EXTENSION_MODAL;

interface ExtensionOptions {
  icon: string;
  value: string;
  title: string;
  isSelected: boolean;
  url: string;
  injected: boolean;
}

interface ExtensionItemProps extends ExtensionOptions {
  onClick: VoidFunction;
}

const ExtensionItem: React.FC<ExtensionItemProps> = (props: ExtensionItemProps) => {
  const { icon, injected, isSelected, onClick, title, url, value } = props;

  const { token } = useTheme() as Theme;

  const leftItemIcon = useMemo(() => {
    return (
      <Image
        height={28}
        src={icon}
        width={28}
      />
    );
  }, []);

  const onDownload = useCallback(() => {
    openInNewTab(url)();
  }, [url]);

  const _onClick = useCallback(() => {
    if (injected) {
      onClick();
    } else {
      onDownload();
    }
  }, [injected, onClick, onDownload]);

  return (
    <SettingItem
      leftItemIcon={leftItemIcon}
      name={title}
      onPressItem={_onClick}
      rightItem={(
        isSelected &&
        (
          <Icon
            className={'__selected-icon'}
            iconColor={token.colorSecondary}
            phosphorIcon={CheckCircle}
            size='sm'
            weight='fill'
          />
        )
      )}
    />
  );
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const options = useMemo((): ExtensionOptions[] =>
    Object.values(PREDEFINED_WALLETS).map((item) => {
      return ({
        url: item.url,
        injected: checkHasInjected(item.key),
        value: item.key,
        icon: item.icon,
        title: item.name,
        isSelected: false
      });
    }), []);

  const onClose = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onRenderItem = useCallback((item: ExtensionOptions) => {
    return (
      <ExtensionItem
        key={item.value}
        {...item}
        onClick={() => {}}
      />
    );
  }, []);

  const renderEmptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Change your search criteria and try again')}
        emptyTitle={t('No extensions found')}
        phosphorIcon={MagnifyingGlass}
      />
    );
  }, [t]);

  return (
    <BaseModal
      className={CN(className)}
      id={modalId}
      onCancel={onClose}
      title={t('Connect extension')}
    >
      <SwList
        displayRow
        list={options}
        renderItem={onRenderItem}
        renderWhenEmpty={renderEmptyList}
        rowGap='8px'
      />
    </BaseModal>
  );
};

const SelectExtensionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default SelectExtensionModal;
