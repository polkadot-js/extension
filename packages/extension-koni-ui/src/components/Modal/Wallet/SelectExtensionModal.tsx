// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_WALLETS, SELECT_EXTENSION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { InjectContext } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAndroid, isFirefox, isIOS, isMobile, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { checkHasInjected } from '@subwallet/extension-koni-ui/utils/wallet';
import { Icon, Image, ModalContext, SettingItem, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, DownloadSimple, MagnifyingGlass } from 'phosphor-react';
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

type ExtensionItemProps = ExtensionOptions

const ExtensionItem: React.FC<ExtensionItemProps> = (props: ExtensionOptions) => {
  const { icon, injected, isSelected, title, url, value } = props;
  const { inactiveModal } = useContext(ModalContext);
  const { enableInject } = useContext(InjectContext);

  const { token } = useTheme() as Theme;

  const leftItemIcon = useMemo(() => {
    return (
      <Image
        height={28}
        src={icon}
        width={28}
      />
    );
  }, [icon]);

  const onDownload = useCallback(() => {
    openInNewTab(url)();
  }, [url]);

  const _onClick = useCallback(() => {
    if (injected) {
      enableInject(value);
      inactiveModal(modalId);
    } else {
      onDownload();
    }
  }, [enableInject, inactiveModal, injected, onDownload, value]);

  return (
    <SettingItem
      className={'wallet-item'}
      leftItemIcon={leftItemIcon}
      name={title}
      onPressItem={_onClick}
      rightItem={(
        !injected
          ? <Icon
            className={'__download-icon'}
            phosphorIcon={DownloadSimple}
            size='sm'
            weight='fill'
          />
          : (isSelected &&
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

  const { selectedWallet } = useContext(InjectContext);

  const options = useMemo((): ExtensionOptions[] =>
    Object.values(PREDEFINED_WALLETS).filter((w) => ((isMobile && w.supportMobile) || (!isMobile && w.supportWeb))).map((item) => {
      const { appStoreUrl, firefoxUrl, googlePlayUrl, icon, key, name, url } = item;
      const isSelected = selectedWallet === key;
      let installUrl = url;

      //  Detect the platform and set the install url
      if (isAndroid && googlePlayUrl) {
        installUrl = googlePlayUrl;
      } else if (isIOS && appStoreUrl) {
        installUrl = appStoreUrl;
      } else if (isFirefox && firefoxUrl) {
        installUrl = firefoxUrl;
      }

      return ({
        url: installUrl,
        injected: checkHasInjected(key),
        value: key,
        icon: icon,
        title: name,
        isSelected
      });
    }), [selectedWallet]);

  const onClose = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onRenderItem = useCallback((item: ExtensionOptions) => {
    return (
      <ExtensionItem
        key={item.value}
        {...item}
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
    '.wallet-item': {
      paddingRight: 8,

      '.ant-web3-block': {
        paddingTop: 12,
        paddingBottom: 12
      }
    }
  };
});

export default SelectExtensionModal;
