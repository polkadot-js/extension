// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from "@subwallet-webapp/components";
import { CUSTOMIZE_MODAL } from "@subwallet-webapp/constants/modal";
import { ButtonProps, Icon, ModalContext } from "@subwallet/react-ui";
import { FadersHorizontal, MagnifyingGlass } from "phosphor-react";
import React, { useCallback, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  children?: React.ReactNode;
  showFilterIcon?: boolean;
  showSearchIcon?: boolean;
  onClickFilterIcon?: () => void;
  onClickSearchIcon?: () => void;
  showTabBar?: boolean;
};

const Home = ({
  children,
  onClickFilterIcon,
  onClickSearchIcon,
  showFilterIcon,
  showSearchIcon,
  showTabBar,
}: Props) => {
  const navigate = useNavigate();
  const { activeModal } = useContext(ModalContext);

  const onOpenCustomizeModal = useCallback(() => {
    activeModal(CUSTOMIZE_MODAL);
  }, [activeModal]);

  const headerIcons = useMemo<ButtonProps[]>(() => {
    const icons: ButtonProps[] = [];

    if (showFilterIcon) {
      icons.push({
        icon: <Icon phosphorIcon={FadersHorizontal} size="md" />,
        onClick: onClickFilterIcon || onOpenCustomizeModal,
      });
    }

    if (showSearchIcon) {
      icons.push({
        icon: <Icon phosphorIcon={MagnifyingGlass} size="md" />,
        onClick: onClickSearchIcon,
      });
    }

    return icons;
  }, [
    onClickFilterIcon,
    onClickSearchIcon,
    onOpenCustomizeModal,
    showFilterIcon,
    showSearchIcon,
  ]);

  const onClickListIcon = useCallback(() => {
    navigate("/settings/list");
  }, [navigate]);

  return (
    <Layout.Base
      headerCenter={false}
      headerIcons={headerIcons}
      headerLeft={"default"}
      headerOnClickLeft={onClickListIcon}
      headerPaddingVertical={true}
      showHeader={true}
      showLeftButton={true}
      showTabBar={showTabBar ?? true}
    >
      {children}
    </Layout.Base>
  );
};

export { Home };
