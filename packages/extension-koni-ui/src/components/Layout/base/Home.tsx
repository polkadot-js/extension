// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { CUSTOMIZE_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { ButtonProps, Icon, ModalContext } from '@subwallet/react-ui';
import { FadersHorizontal, MagnifyingGlass } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
  const { t } = useTranslation();
  const { activeModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

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
        tooltip: isWebUI ? t('Customize your asset display') : undefined,
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
        tooltip: isWebUI ? t('Search a token') : undefined,
        tooltipPlacement: 'bottomRight'
      });
    }

    return icons;
  }, [isWebUI, onClickFilterIcon, onClickSearchIcon, onOpenCustomizeModal, showFilterIcon, showSearchIcon, t]);

  const onClickListIcon = useCallback(() => {
    navigate('/settings/list');
  }, [navigate]);

  return (
    <Layout.Base
      headerCenter={false}
      headerIcons={headerIcons}
      headerLeft={'default'}
      headerOnClickLeft={onClickListIcon}
      headerPaddingVertical={true}
      isSetTitleContext={false}
      showHeader={true}
      showLeftButton={true}
      showTabBar={showTabBar ?? true}
    >
      {children}
    </Layout.Base>
  );
};

export { Home };
