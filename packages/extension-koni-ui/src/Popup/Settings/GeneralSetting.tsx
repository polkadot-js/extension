// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeNames } from '@subwallet/extension-base/background/KoniTypes';
import { languageOptions } from '@subwallet/extension-base/constants/i18n';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateBrowserConfirmationType, updateLanguage, updateTheme } from '@subwallet/extension-koni-ui/stores/utils';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Icon, SelectModal, SettingItem, SwIconProps, SwSubHeader } from '@subwallet/react-ui';
import { ArrowSquareUpRight, BellSimpleRinging, CaretRight, CheckCircle, CornersOut, GlobeHemisphereEast, Image, Layout, MoonStars, Sun } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

type SelectionItemType = {
  key: string,
  leftIcon: SwIconProps['phosphorIcon'],
  leftIconBgColor: string,
  title: string,
};

function renderSelectionItem (item: SelectionItemType, _selected: boolean) {
  return (
    <SettingItem
      className={'__selection-item'}
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

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const theme = useSelector((state: RootState) => state.settings.theme);
  const language = useSelector((state: RootState) => state.settings.language);
  const browserConfirmationType = useSelector((state: RootState) => state.settings.browserConfirmationType);

  const navigate = useNavigate();
  const { token } = useTheme() as Theme;

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const themeItems = useMemo<SelectionItemType[]>(() => {
    return [
      {
        key: ThemeNames.DARK,
        leftIcon: MoonStars,
        leftIconBgColor: token.colorPrimary,
        title: 'Dark theme' // todo: i18n this
      },
      {
        key: ThemeNames.LIGHT,
        leftIcon: Sun,
        leftIconBgColor: token.colorPrimary,
        title: 'Light theme (coming soon)' // todo: i18n this
      }
    ];
  }, [token]);

  const languageItems = useMemo<SelectionItemType[]>(() => {
    return languageOptions.map((item) => ({
      key: item.value,
      leftIcon: GlobeHemisphereEast,
      leftIconBgColor: token['green-6'],
      title: item.text
    }));
  }, [token]);

  const browserConfirmationItems = useMemo<SelectionItemType[]>(() => {
    return [
      {
        key: 'extension',
        leftIcon: Layout,
        leftIconBgColor: token['volcano-6'],
        title: 'Extension' // todo: i18n this
      },
      {
        key: 'popup',
        leftIcon: ArrowSquareUpRight,
        leftIconBgColor: token['volcano-6'],
        title: 'Popup' // todo: i18n this
      },
      {
        key: 'window',
        leftIcon: CornersOut,
        leftIconBgColor: token['volcano-6'],
        title: 'Window' // todo: i18n this
      }
    ];
  }, [token]);

  return (
    <PageWrapper className={`general-setting ${className}`}>
      <SwSubHeader
        center
        onBack={onBack}
        paddingVertical
        showBackButton
        title={'General settings' } // todo: i18n this
      />

      <div className={'__scroll-container'}>
        <SelectModal
          background={'default'}
          className={`__modal ${className}`}
          customInput={renderModalTrigger({
            key: 'wallet-theme-trigger',
            leftIcon: Image,
            leftIconBgColor: token.colorPrimary,
            title: 'Wallet theme' // todo: i18n this
          })}
          id='wallet-theme-select-modal'
          inputWidth={'100%'}
          itemKey='key'
          items={themeItems}
          onSelect={updateTheme as unknown as (value: string) => void}
          renderItem={renderSelectionItem}
          selected={theme}
          shape='round'
          size='small'
          title={'Wallet theme'} // todo: i18n this
        />

        <SelectModal
          background={'default'}
          className={`__modal ${className}`}
          customInput={renderModalTrigger({
            key: 'languages-trigger',
            leftIcon: GlobeHemisphereEast,
            leftIconBgColor: token['green-6'],
            title: 'Languages' // todo: i18n this
          })}
          id='languages-select-modal'
          inputWidth={'100%'}
          itemKey='key'
          items={languageItems}
          onSelect={updateLanguage as unknown as (value: string) => void}
          renderItem={renderSelectionItem}
          selected={language}
          shape='round'
          size='small'
          title={'Languages'} // todo: i18n this
        />

        <SelectModal
          background={'default'}
          className={`__modal ${className}`}
          customInput={renderModalTrigger({
            key: 'browser-confirmation-type-trigger',
            leftIcon: BellSimpleRinging,
            leftIconBgColor: token['volcano-6'],
            title: 'Browser confirmation type' // todo: i18n this
          })}
          id='browser-confirmation-type-select-modal'
          inputWidth={'100%'}
          itemKey='key'
          items={browserConfirmationItems}
          onSelect={updateBrowserConfirmationType as unknown as (value: string) => void}
          renderItem={renderSelectionItem}
          selected={browserConfirmationType}
          shape='round'
          size='small'
          title={'Browser confirmation type'} // todo: i18n this
        />
      </div>
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
