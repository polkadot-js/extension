// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SwScreenLayoutProps } from '@subwallet/react-ui';

import { LanguageType } from '@subwallet/extension-base/background/KoniTypes';
import SelectAccount from '@subwallet/extension-koni-ui/components/Layout/parts/SelectAccount';
import { CONFIRM_MISSIONS_POOL_ACTIVE, MISSIONS_POOL_SELECTED } from '@subwallet/extension-koni-ui/constants';
import { useDefaultNavigate, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { computeStatus } from '@subwallet/extension-koni-ui/utils';
import { Icon, SwScreenLayout } from '@subwallet/react-ui';
import { SwTabBarItem } from '@subwallet/react-ui/es/sw-tab-bar';
import CN from 'classnames';
import { Aperture, Clock, Parachute, Vault, Wallet } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const specialLanguages: Array<LanguageType> = ['ja', 'ru'];

const Component = ({ children, className, headerIcons, isDisableHeader, onBack, showFooter, ...props }: LayoutBaseProps) => {
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { language } = useSelector((state) => state.settings);
  const { missions } = useSelector((state: RootState) => state.missionPool);

  const liveMissionsCount = useMemo(() => {
    return missions?.filter ? missions.filter((item) => computeStatus(item) === 'live').length : undefined;
  }, [missions]);

  const [missionPoolIds, setMissionPoolIds] = useLocalStorage(CONFIRM_MISSIONS_POOL_ACTIVE, '');
  const [isMissionPoolSelected, setIsMissionPoolSelected] = useLocalStorage(MISSIONS_POOL_SELECTED, false);
  const [hasLiveMissionsChanged, setHasLiveMissionsChanged] = useState(false);

  const liveMissionFilter = useMemo(() => {
    return missions.filter((item) => computeStatus(item) === 'live');
  }, [missions]);

  const liveMissionIds = useMemo(() => {
    return liveMissionFilter.map((mission) => mission.id);
  }, [liveMissionFilter]);

  const selectedTab = useMemo((): string => {
    const isHomePath = pathname.includes('/home');

    if (isHomePath) {
      const pathExcludeHome = pathname.split('/home')[1];
      const currentTab = pathExcludeHome.split('/')[1];

      return currentTab || '';
    }

    return '';
  }, [pathname]);

  useEffect(() => {
    if (selectedTab === 'mission-pools') {
      setIsMissionPoolSelected(true);
    }

    let storedLiveMissionIds: number[] = [];

    if (isMissionPoolSelected) {
      if (missionPoolIds) {
        try {
          const parsedData: unknown = JSON.parse(missionPoolIds);

          if (Array.isArray(parsedData) && parsedData.every((item) => typeof item === 'number')) {
            storedLiveMissionIds = parsedData as number[];
          } else {
            console.error('Parsed data is not an array of numbers:', parsedData);
            storedLiveMissionIds = [];
          }

          const hasChanged = storedLiveMissionIds.length !== liveMissionIds.length ||
            !storedLiveMissionIds.every((id) => liveMissionIds.includes(id));

          if (hasChanged) {
            setMissionPoolIds(JSON.stringify(liveMissionIds));
            setHasLiveMissionsChanged(true);

            if (selectedTab !== 'mission-pools') {
              setIsMissionPoolSelected(false);
            }
          } else {
            setHasLiveMissionsChanged(false);
          }
        } catch (error) {
          console.error('Error parsing missionPoolIds:', error);
        }
      } else {
        setMissionPoolIds(JSON.stringify(liveMissionIds));
      }
    }
  }, [missionPoolIds, liveMissionIds, selectedTab, setMissionPoolIds, setIsMissionPoolSelected, isMissionPoolSelected]);

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
              size='sm'
              type='phosphor'
              weight='fill'
            />
            {(hasLiveMissionsChanged || (!isMissionPoolSelected)) && <div className={CN('__active-count')}>{liveMissionsCount}</div>}
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
  ]), [hasLiveMissionsChanged, isMissionPoolSelected, liveMissionsCount, t]);

  const onSelectTab = useCallback(
    (url: string) => () => {
      navigate(url);
    },
    [navigate]
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
    position: 'relative',

    '.ant-sw-tab-bar-item-label': {
      textAlign: 'center'
    }
  },
  '.__active-count': {
    borderRadius: '50%',
    color: token.colorWhite,
    fontSize: token.fontSizeXS,
    fontWeight: token.bodyFontWeight,
    lineHeight: token.lineHeightXS,
    paddingTop: 0,
    paddingRight: token.paddingXXS,
    paddingLeft: token.paddingXXS,
    paddingBottom: 0,
    backgroundColor: token.colorError,
    position: 'absolute',
    right: 100,
    top: 6
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
