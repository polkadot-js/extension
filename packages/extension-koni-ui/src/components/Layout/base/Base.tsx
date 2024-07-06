// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SwScreenLayoutProps } from '@subwallet/react-ui';

import { LanguageType } from '@subwallet/extension-base/background/KoniTypes';
import SelectAccount from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount';
import { MISSIONS_POOL_LIVE_ID } from '@subwallet/extension-koni-ui/constants';
import { useDefaultNavigate, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { computeStatus } from '@subwallet/extension-koni-ui/utils';
import { Icon, SwScreenLayout } from '@subwallet/react-ui';
import { SwTabBarItem } from '@subwallet/react-ui/es/sw-tab-bar';
import CN from 'classnames';
import { Aperture, Clock, Parachute, Vault, Wallet } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import Footer from '../parts/Footer';

export interface LayoutBaseProps extends Omit<
SwScreenLayoutProps,
'tabBarItems' | 'footer' | 'headerContent' | 'selectedTabBarItem'
>, ThemeProps {
  children: React.ReactNode | React.ReactNode[];
  showFooter?: boolean;
  isDisableHeader?: boolean;
}
type TabBarItem = Omit<SwTabBarItem, 'onClick'> & { url: string };
const specialLanguages: Array<LanguageType> = ['ja', 'ru'];

const Component = ({ children, className, headerIcons, isDisableHeader, onBack, showFooter, ...props }: LayoutBaseProps) => {
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { language } = useSelector((state) => state.settings);
  const { missions } = useSelector((state: RootState) => state.missionPool);

  const [storedLiveMissionIds, setStoredLiveMissionIds] = useLocalStorage<number[]>(MISSIONS_POOL_LIVE_ID, []);

  const liveMissionIds = useMemo(() => {
    return missions
      .filter((item) => computeStatus(item) === 'live')
      .map((mission) => mission.id);
  }, [missions]);

  const latestLiveMissionIds = useMemo(() => {
    return liveMissionIds.filter((id) => !storedLiveMissionIds.includes(id));
  }, [liveMissionIds, storedLiveMissionIds]);

  const selectedTab = useMemo((): string => {
    const isHomePath = pathname.includes('/home');

    if (isHomePath) {
      const pathExcludeHome = pathname.split('/home')[1];
      const currentTab = pathExcludeHome.split('/')[1];

      return currentTab || '';
    }

    return '';
  }, [pathname]);

  const tabBarItems = useMemo((): Array<TabBarItem> => ([
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
        phosphorIcon: Vault,
        weight: 'fill'
      },
      label: t('Earning'),
      key: 'earning',
      url: '/home/earning'
    },
    {
      icon: {
        type: 'customIcon',
        customIcon: (
          <>
            <Icon
              phosphorIcon={Parachute}
              type='phosphor'
              weight='fill'
            />
            {(latestLiveMissionIds.length > 0) && <div className={CN('__active-count')}>{latestLiveMissionIds.length}</div>}
          </>
        )
      },
      label: t('Missions'),
      key: 'mission-pools',
      url: '/home/mission-pools'
    },
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
  ]), [t, latestLiveMissionIds]);

  const onSelectTab = useCallback(
    (item: TabBarItem) => () => {
      if (item.key === 'mission-pools' && latestLiveMissionIds.length > 0) {
        setStoredLiveMissionIds(liveMissionIds);
      }

      navigate(item.url);
    },
    [latestLiveMissionIds.length, navigate, setStoredLiveMissionIds, liveMissionIds]
  );

  const defaultOnBack = useCallback(() => {
    goHome();
  }, [goHome]);

  return (
    <SwScreenLayout
      {...props}
      className={CN(className, { 'special-language': specialLanguages.includes(language), 'disable-header': isDisableHeader })}
      footer={showFooter && <Footer />}
      headerContent={props.showHeader && <SelectAccount />}
      headerIcons={headerIcons}
      onBack={onBack || defaultOnBack}
      selectedTabBarItem={selectedTab}
      tabBarItems={tabBarItems.map((item) => ({
        ...item,
        onClick: onSelectTab(item)
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
    position: 'relative',

    '.ant-sw-tab-bar-item-label': {
      textAlign: 'center'
    }
  },
  '.__active-count': {
    borderRadius: '50%',
    color: token.colorWhite,
    fontSize: token.sizeXS,
    fontWeight: token.bodyFontWeight,
    lineHeight: token.lineHeightLG,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: token.colorError,
    position: 'absolute',
    right: 108,
    top: 10,
    minWidth: '12px'
  },

  '&.disable-header > .ant-sw-screen-layout-header': {
    opacity: '0.4',
    pointerEvents: 'none'

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
