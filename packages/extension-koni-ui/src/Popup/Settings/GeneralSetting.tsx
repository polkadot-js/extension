// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserConfirmationType, LanguageType, ThemeNames } from '@subwallet/extension-base/background/KoniTypes';
import { ENABLE_LANGUAGES, languageOptions } from '@subwallet/extension-base/constants/i18n';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { saveBrowserConfirmationType, saveLanguage, saveTheme } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { noop } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, Icon, SelectModal, SettingItem, SwIconProps } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowSquareUpRight, BellSimpleRinging, CaretRight, CheckCircle, CornersOut, GlobeHemisphereEast, Image, Layout as LayoutIcon, MoonStars, Sun } from 'phosphor-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

type SelectionItemType = {
  key: string,
  leftIcon: SwIconProps['phosphorIcon'],
  leftIconBgColor: string,
  title: string,
  disabled?: boolean,
};

function renderSelectionItem (item: SelectionItemType, _selected: boolean) {
  return (
    <SettingItem
      className={CN('__selection-item', { 'item-disabled': item.disabled })}
      key={item.key}
      leftItemIcon={
        <BackgroundIcon
          backgroundColor={item.leftIconBgColor}
          phosphorIcon={item.leftIcon}
          size='sm'
          type='phosphor'
          weight='fill'
        />
      }
      name={item.title}
      rightItem={
        _selected
          ? <Icon
            className='__right-icon'
            customSize={'20px'}
            phosphorIcon={CheckCircle}
            type='phosphor'
            weight='fill'
          />
          : null
      }
    />
  );
}

function renderModalTrigger (item: SelectionItemType) {
  return (
    <SettingItem
      className={'__trigger-item'}
      key={item.key}
      leftItemIcon={
        <BackgroundIcon
          backgroundColor={item.leftIconBgColor}
          phosphorIcon={item.leftIcon}
          size='sm'
          type='phosphor'
          weight='fill'
        />
      }
      name={item.title}
      rightItem={
        <Icon
          className='__right-icon'
          customSize={'20px'}
          phosphorIcon={CaretRight}
          type='phosphor'
        />
      }
    />
  );
}

type LoadingMap = {
  language: boolean;
  browserConfirmationType: boolean;
};

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const theme = useSelector((state: RootState) => state.settings.theme);
  const _language = useSelector((state: RootState) => state.settings.language);
  const _browserConfirmationType = useSelector((state: RootState) => state.settings.browserConfirmationType);
  const [loadingMap, setLoadingMap] = useState<LoadingMap>({
    browserConfirmationType: false,
    language: false
  });

  const goBack = useDefaultNavigate().goBack;
  const { token } = useTheme() as Theme;

  const themeItems = useMemo<SelectionItemType[]>(() => {
    return [
      {
        key: ThemeNames.DARK,
        leftIcon: MoonStars,
        leftIconBgColor: token.colorPrimary,
        title: t('Dark theme')
      },
      {
        key: ThemeNames.LIGHT,
        leftIcon: Sun,
        leftIconBgColor: token.colorPrimary,
        title: t('Light theme'),
        disabled: true
      }
    ];
  }, [t, token]);

  const languageItems = useMemo<SelectionItemType[]>(() => {
    return languageOptions.map((item) => ({
      key: item.value,
      leftIcon: GlobeHemisphereEast,
      leftIconBgColor: token['green-6'],
      title: item.text,
      disabled: !ENABLE_LANGUAGES.includes(item.value)
    }));
  }, [token]);

  const browserConfirmationItems = useMemo<SelectionItemType[]>(() => {
    return [
      {
        key: 'extension',
        leftIcon: LayoutIcon,
        leftIconBgColor: token['volcano-6'],
        title: t('Extension')
      },
      {
        key: 'popup',
        leftIcon: ArrowSquareUpRight,
        leftIconBgColor: token['volcano-6'],
        title: t('Popup')
      },
      {
        key: 'window',
        leftIcon: CornersOut,
        leftIconBgColor: token['volcano-6'],
        title: t('Window')
      }
    ];
  }, [t, token]);

  const onSelectLanguage = useCallback((value: string) => {
    setLoadingMap((prev) => ({
      ...prev,
      language: true
    }));
    saveLanguage(value as LanguageType)
      .finally(() => {
        setLoadingMap((prev) => ({
          ...prev,
          language: false
        }));
      });
  }, []);

  const onSelectBrowserConfirmationType = useCallback((value: string) => {
    setLoadingMap((prev) => ({
      ...prev,
      browserConfirmationType: true
    }));
    saveBrowserConfirmationType(value as BrowserConfirmationType)
      .catch((e) => {
        console.log('saveBrowserConfirmationType error', e);
      })
      .finally(() => {
        setLoadingMap((prev) => ({
          ...prev,
          browserConfirmationType: false
        }));
      });
  }, []);

  const onSelectTheme = useCallback((value: string) => {
    saveTheme(value as ThemeNames).finally(noop);
  }, []);

  return (
    <PageWrapper className={`general-setting ${className}`}>
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        title={t('General settings')}
      >
        <div className={'__scroll-container'}>
          <SelectModal
            background={'default'}
            className={`__modal ${className}`}
            customInput={renderModalTrigger({
              key: 'wallet-theme-trigger',
              leftIcon: Image,
              leftIconBgColor: token.colorPrimary,
              title: t('Wallet theme')
            })}
            id='wallet-theme-select-modal'
            inputWidth={'100%'}
            itemKey='key'
            items={themeItems}
            onSelect={onSelectTheme}
            renderItem={renderSelectionItem}
            selected={theme}
            shape='round'
            title={t('Wallet theme')}
          />

          <SelectModal
            background={'default'}
            className={`__modal ${className}`}
            customInput={renderModalTrigger({
              key: 'languages-trigger',
              leftIcon: GlobeHemisphereEast,
              leftIconBgColor: token['green-6'],
              title: t('Language')
            })}
            disabled={loadingMap.language}
            id='languages-select-modal'
            inputWidth={'100%'}
            itemKey='key'
            items={languageItems}
            onSelect={onSelectLanguage}
            renderItem={renderSelectionItem}
            selected={_language}
            shape='round'
            size='small'
            title={t('Language')}
          />

          <SelectModal
            background={'default'}
            className={`__modal ${className}`}
            customInput={renderModalTrigger({
              key: 'browser-confirmation-type-trigger',
              leftIcon: BellSimpleRinging,
              leftIconBgColor: token['volcano-6'],
              title: t('Browser notification type')
            })}
            disabled={loadingMap.browserConfirmationType}
            id='browser-confirmation-type-select-modal'
            inputWidth={'100%'}
            itemKey='key'
            items={browserConfirmationItems}
            onSelect={onSelectBrowserConfirmationType}
            renderItem={renderSelectionItem}
            selected={_browserConfirmationType}
            shape='round'
            size='small'
            title={t('Browser notification type')}
          />
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
}

export const GeneralSetting = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-web3-block-right-item': {
      minWidth: 40,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: -token.marginXS
    },

    '.item-disabled': {
      '.ant-setting-item-content': {
        cursor: 'not-allowed',
        backgroundColor: `${token.colorBgSecondary} !important`
      }
    },

    '&.general-setting': {
      height: '100%',
      backgroundColor: token.colorBgDefault,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',

      '.ant-sw-header-bg-default': {
        // backgroundColor: 'transparent'
      },

      '.ant-select-modal-input-custom + .ant-select-modal-input-custom': {
        marginTop: token.marginXS
      },

      '.ant-select-modal-input-custom': {
        width: 'unset'
      },

      '.__trigger-item .ant-web3-block-right-item': {
        color: token.colorTextLight4
      },

      '.__trigger-item:hover .ant-web3-block-right-item': {
        color: token.colorTextLight2
      },

      '.__scroll-container': {
        overflow: 'auto',
        paddingTop: token.padding,
        paddingRight: token.padding,
        paddingLeft: token.padding,
        paddingBottom: token.paddingLG
      }
    },

    '&.__modal': {
      '.__selection-item .ant-web3-block-right-item': {
        color: token.colorSuccess
      }
    }
  });
});

export default GeneralSetting;
