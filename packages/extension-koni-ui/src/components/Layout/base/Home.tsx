// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { CompoundedHeader } from '@subwallet/extension-koni-ui/components/Layout/parts/Header';
import { CUSTOMIZE_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ButtonProps, Icon, ModalContext } from '@subwallet/react-ui';
import { FadersHorizontal, MagnifyingGlass } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

type Props = {
  children?: React.ReactNode;
  showFilterIcon?: boolean;
  showSearchIcon?: boolean;
  onClickFilterIcon?: () => void;
  onClickSearchIcon?: () => void;
  showTabBar?: boolean
  withBackground?: boolean
};

const Home = ({ children, onClickFilterIcon, onClickSearchIcon, showFilterIcon, showSearchIcon, showTabBar, withBackground }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        onClick: onClickFilterIcon || onOpenCustomizeModal,
        tooltip: t('Customize your asset display'),
        tooltipPlacement: 'bottomRight'
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
        onClick: onClickSearchIcon,
        tooltip: t('Search a token'),
        tooltipPlacement: 'bottomRight'
      });
    }

    return icons;
  }, [onClickFilterIcon, onClickSearchIcon, onOpenCustomizeModal, showFilterIcon, showSearchIcon, t]);

  const SCREEN_HEADERS: Record<keyof CompoundedHeader, string[]> = {
    Controller: [
      'porfolio',
      'crowdloans',
      'history',
      'dapps',
      'staking'
    ],
    Balance: [
      'porfolio'
    ],
    Simple: []
  };

  const onClickListIcon = useCallback(() => {
    navigate('/settings/list');
  }, [navigate]);

  const currentRoute = useMemo(() => {
    const pathEls = pathname.split('/').filter((i: string) => !!i);

    return pathEls[pathEls.length - 1];
  }, [pathname]);

  const pageHeaders: (keyof CompoundedHeader)[] = useMemo(() => {
    const headerKeys = Object.keys(SCREEN_HEADERS).map((i: string) => i as keyof CompoundedHeader);

    return headerKeys.filter((v: string) => {
      const key = v as keyof CompoundedHeader;

      return SCREEN_HEADERS[key].includes(currentRoute);
    });
  }, [currentRoute]);

  return (
    <Layout.Base
      headerCenter={false}
      headerIcons={headerIcons}
      headerLeft={'default'}
      headerList={pageHeaders}
      headerOnClickLeft={onClickListIcon}
      headerPaddingVertical={true}
      showHeader={true}
      showLeftButton={true}
      showTabBar={showTabBar ?? true}
      title={currentRoute[0].toUpperCase() + currentRoute.slice(1)}
      withBackground={withBackground}
      withSideMenu
    >
      {children}
    </Layout.Base>
  );
};

export { Home };
