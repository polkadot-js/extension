// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SwScreenLayoutProps } from '@subwallet/react-ui';

import { LanguageType } from '@subwallet/extension-base/background/KoniTypes';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { HeaderType, WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useDefaultNavigate, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwScreenLayout } from '@subwallet/react-ui';
import { SwTabBarItem } from '@subwallet/react-ui/es/sw-tab-bar';
import CN from 'classnames';
import { Aperture, Clock, Rocket, Wallet } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import Footer from '../parts/Footer';
import SelectAccount from '../parts/SelectAccount';

export interface LayoutBaseProps extends Omit<
SwScreenLayoutProps,
'tabBarItems' | 'footer' | 'headerContent' | 'selectedTabBarItem'
>, ThemeProps {
  children: React.ReactNode | React.ReactNode[];
  showFooter?: boolean;
  isSetTitleContext?: boolean;
}

const specialLanguages: Array<LanguageType> = ['ja', 'ru'];

const Component = ({ children, className, headerIcons, isSetTitleContext = true, onBack, showFooter, ...props }: LayoutBaseProps) => {
  const { isWebUI } = useContext(ScreenContext);
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { setTitle } = useContext(WebUIContext);
  const { headerType, isSettingPage, setShowBackButtonOnHeader } = useContext(WebUIContext);
  const [customClassName, setCustomClassName] = useState('');
  const { language } = useSelector((state) => state.settings);

  const tabBarItems = useMemo((): Array<Omit<SwTabBarItem, 'onClick'> & { url: string }> => ([
    {
      icon: {
        type: 'phosphor',
        phosphorIcon: Wallet,
        weight: 'fill'
      },
      label: t('Tokens'),
      key: 'tokens',
      url: '/home/tokens'
    },
    {
      icon: {
        type: 'phosphor',
        phosphorIcon: Aperture,
        weight: 'fill'
      },
      label: t('NFTs'),
      key: 'nfts',
      url: '/home/nfts/collections'
    },
    {
      icon: {
        type: 'phosphor',
        phosphorIcon: Rocket,
        weight: 'fill'
      },
      label: t('Crowdloans'),
      key: 'crowdloans',
      url: '/home/crowdloans'
    },
    // {
    //   icon: {
    //     type: 'phosphor',
    //     phosphorIcon: Database,
    //     weight: 'fill'
    //   },
    //   label: t('Staking'),
    //   key: 'staking',
    //   url: '/home/staking'
    // },
    // {
    //   icon: {
    //     type: 'phosphor',
    //     phosphorIcon: Vault,
    //     weight: 'fill'
    //   },
    //   label: t('Earning'),
    //   key: 'earning',
    //   url: '/home/earning/'
    // },
    {
      icon: {
        type: 'phosphor',
        phosphorIcon: Clock,
        weight: 'fill'
      },
      label: t('History'),
      key: 'history',
      url: '/home/history'
    }
  ]), [t]);

  const selectedTab = useMemo((): string => {
    const isHomePath = pathname.includes('/home');

    if (isHomePath) {
      const pathExcludeHome = pathname.split('/home')[1];
      const currentTab = pathExcludeHome.split('/')[1];

      return currentTab || '';
    }

    return '';
  }, [pathname]);

  const onSelectTab = useCallback(
    (url: string) => () => {
      navigate(url);
    },
    [navigate]
  );

  const defaultOnBack = useCallback(() => {
    goHome();
  }, [goHome]);

  useEffect(() => {
    setCustomClassName('common-pages');

    if (isSetTitleContext) {
      setTitle(props.title);
    }
  }, [isSetTitleContext, isSettingPage, pathname, props.title, setTitle, t]);

  useEffect(() => {
    setShowBackButtonOnHeader(props.showBackButton);
  }, [props.showBackButton, setShowBackButtonOnHeader]);

  return (
    <SwScreenLayout
      {...props}
      className={CN(className, customClassName, { 'special-language': specialLanguages.includes(language) })}
      footer={showFooter && <Footer />}
      headerContent={props.showHeader && <SelectAccount />}
      headerIcons={headerIcons}
      onBack={onBack || defaultOnBack}
      selectedTabBarItem={selectedTab}
      showHeader={(!isWebUI || headerType === HeaderType.NONE) && props.showHeader}
      showSubHeader={(!isWebUI || headerType === HeaderType.NONE || (isSettingPage && headerType !== HeaderType.SIMPLE)) && props.showSubHeader}
      showTabBar={!isWebUI && props.showTabBar}
      tabBarItems={tabBarItems.map((item) => ({
        ...item,
        onClick: onSelectTab(item.url)
      }))}
    >
      {children}
    </SwScreenLayout>
  );
};

const Base = styled(Component)<LayoutBaseProps>(({ theme: { token } }: LayoutBaseProps) => ({
  '.ant-sw-tab-bar-container': {
    padding: `${token.paddingXS}px ${token.paddingSM}px ${token.paddingSM}px`,
    alignItems: 'flex-start',

    '.ant-sw-tab-bar-item-label': {
      textAlign: 'center'
    }
  },

  '&.special-language': {
    '.ant-sw-tab-bar-container': {
      paddingBottom: token.paddingXS,

      '.ant-sw-tab-bar-item': {
        gap: token.sizeXXS,

        '.ant-sw-tab-bar-item-label': {
          fontSize: token.fontSizeXS,
          lineHeight: 1,
          maxWidth: token.sizeXXL,
          overflowWrap: 'break-word'
        }
      }
    }
  }
}));

export default Base;
