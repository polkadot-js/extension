// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { CUSTOMIZE_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ButtonProps, Icon, ModalContext } from '@subwallet/react-ui';
import { FadersHorizontal, MagnifyingGlass } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CompoundedHeader } from '@subwallet/extension-koni-ui/components/Layout/parts/Header'
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';

type Props = {
  children?: React.ReactNode;
  showFilterIcon?: boolean;
  showSearchIcon?: boolean;
  onClickFilterIcon?: () => void;
  onClickSearchIcon?: () => void;
  showTabBar?: boolean
};

const Home = ({ children, onClickFilterIcon, onClickSearchIcon, showFilterIcon, showSearchIcon, showTabBar }: Props) => {
  const navigate = useNavigate();
  const { activeModal } = useContext(ModalContext);
  const { pathname } = useLocation();

  const onOpenCustomizeModal = useCallback(() => {
    activeModal(CUSTOMIZE_MODAL);
  }, [activeModal]);

  const headerIcons = useMemo<ButtonProps[]>(() => {
    const icons: ButtonProps[] = [];

    if (showFilterIcon) {
      icons.push({
        icon: (
          <Icon
            phosphorIcon={FadersHorizontal}
            size='md'
          />
        ),
        onClick: onClickFilterIcon || onOpenCustomizeModal
      });
    }

    if (showSearchIcon) {
      icons.push({
        icon: (
          <Icon
            phosphorIcon={MagnifyingGlass}
            size='md'
          />
        ),
        onClick: onClickSearchIcon
      });
    }

    return icons;
  }, [onClickFilterIcon, onClickSearchIcon, onOpenCustomizeModal, showFilterIcon, showSearchIcon]);

  const SCREEN_HEADERS: Record<keyof CompoundedHeader, string[]> = {
    'Controller': [
      'porfolio',
      'crowdloans',
      'history',
      'dapps',
      'staking'
    ],
    'Balance': [
      'porfolio'
    ],
    'Simple': []
  }

  const onClickListIcon = useCallback(() => {
    navigate('/settings/list');
  }, [navigate]);

  const currentRoute = useMemo(() => {
    const pathEls = pathname.split('/').filter((i: string) => !!i);
    return pathEls[pathEls.length - 1];
  }, [pathname])

  const pageHeaders: (keyof CompoundedHeader)[] = useMemo(() => {
    const headerKeys = Object.keys(SCREEN_HEADERS).map((i: string) => i as keyof CompoundedHeader);

    return headerKeys.filter((v: string) => {
      const key = v as keyof CompoundedHeader;
      return SCREEN_HEADERS[key].includes(currentRoute)
    });
  }, [currentRoute])

  return (
    <Layout.Base
      headerCenter={false}
      headerIcons={headerIcons}
      headerLeft={'default'}
      headerOnClickLeft={onClickListIcon}
      headerPaddingVertical={true}
      showHeader={true}
      showLeftButton={true}
      showTabBar={showTabBar ?? true}
      withSideMenu
      headerList={pageHeaders}
      title={currentRoute[0].toUpperCase() + currentRoute.slice(1)}
    >
      {children}
    </Layout.Base>
  );
};

export { Home };
