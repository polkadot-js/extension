// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrlInfo } from "@subwallet/extension-base/background/handlers/State";
import { FilterModal, PageWrapper } from "@subwallet-webapp/components";
import EmptyList from "@subwallet-webapp/components/EmptyList";
import {
  ActionItemType,
  ActionModal,
} from "@subwallet-webapp/components/Modal/ActionModal";
import { WebsiteAccessItem } from "@subwallet-webapp/components/Setting/WebsiteAccessItem";
import { useFilterModal } from "@subwallet-webapp/hooks/modal/useFilterModal";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import {
  changeAuthorizationAll,
  forgetAllSite,
} from "@subwallet-webapp/messaging";
import { RootState } from "@subwallet-webapp/stores";
import { updateAuthUrls } from "@subwallet-webapp/stores/utils";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { ManageWebsiteAccessDetailParam } from "@subwallet-webapp/types/navigation";
import { Icon, ModalContext, SwList, SwSubHeader } from "@subwallet/react-ui";
import {
  FadersHorizontal,
  GearSix,
  GlobeHemisphereWest,
  Plugs,
  PlugsConnected,
  X,
} from "phosphor-react";
import React, { useCallback, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";

type Props = ThemeProps;

function getWebsiteItems(
  authUrlMap: Record<string, AuthUrlInfo>
): AuthUrlInfo[] {
  return Object.values(authUrlMap);
}

function getAccountCount(item: AuthUrlInfo): number {
  return Object.values(item.isAllowedMap).filter((i) => i).length;
}

const ACTION_MODAL_ID = "actionModalId";
const FILTER_MODAL_ID = "manage-website-access-filter-id";

enum FilterValue {
  SUBSTRATE = "substrate",
  ETHEREUM = "ethereum",
  BLOCKED = "blocked",
  Connected = "connected",
}

function Component({ className = "" }: Props): React.ReactElement<Props> {
  const authUrlMap = useSelector((state: RootState) => state.settings.authUrls);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useDefaultNavigate().goBack;
  const { token } = useTheme() as Theme;
  const {
    filterSelectionMap,
    onApplyFilter,
    onChangeFilterOption,
    onCloseFilterModal,
    selectedFilters,
  } = useFilterModal(FILTER_MODAL_ID);
  const filterFunction = useMemo<(item: AuthUrlInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.SUBSTRATE) {
          if (
            item.accountAuthType === "substrate" ||
            item.accountAuthType === "both"
          ) {
            return true;
          }
        } else if (filter === FilterValue.ETHEREUM) {
          if (
            item.accountAuthType === "evm" ||
            item.accountAuthType === "both"
          ) {
            return true;
          }
        } else if (filter === FilterValue.BLOCKED) {
          if (!item.isAllowed) {
            return true;
          }
        } else if (filter === FilterValue.Connected) {
          if (item.isAllowed) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const filterOptions = useMemo(() => {
    return [
      { label: "Substrate DApp", value: FilterValue.SUBSTRATE },
      { label: "Ethereum DApp", value: FilterValue.ETHEREUM },
      { label: "Blocked DApp", value: FilterValue.BLOCKED },
      { label: "Connected DApp", value: FilterValue.Connected },
    ];
  }, []);

  const websiteAccessItems = useMemo<AuthUrlInfo[]>(() => {
    return getWebsiteItems(authUrlMap);
  }, [authUrlMap]);

  const onOpenActionModal = useCallback(() => {
    activeModal(ACTION_MODAL_ID);
  }, [activeModal]);

  const onCloseActionModal = useCallback(() => {
    inactiveModal(ACTION_MODAL_ID);
  }, [inactiveModal]);

  const actions: ActionItemType[] = useMemo(() => {
    return [
      {
        key: "forget-all",
        icon: X,
        iconBackgroundColor: token.colorWarning,
        title: t("Forget all"),
        onClick: () => {
          forgetAllSite(updateAuthUrls).catch(console.error);
          onCloseActionModal();
        },
      },
      {
        key: "disconnect-all",
        icon: Plugs,
        iconBackgroundColor: token["gray-3"],
        title: t("Disconnect all"),
        onClick: () => {
          changeAuthorizationAll(false, updateAuthUrls).catch(console.error);
          onCloseActionModal();
        },
      },
      {
        key: "connect-all",
        icon: PlugsConnected,
        iconBackgroundColor: token["green-6"],
        title: t("Connect all"),
        onClick: () => {
          changeAuthorizationAll(true, updateAuthUrls).catch(console.error);
          onCloseActionModal();
        },
      },
    ];
  }, [onCloseActionModal, t, token]);

  const onClickItem = useCallback(
    (item: AuthUrlInfo) => {
      return () => {
        navigate("/settings/dapp-access-edit", {
          state: {
            siteName: item.origin,
            origin: item.id,
            accountAuthType: item.accountAuthType || "",
          } as ManageWebsiteAccessDetailParam,
        });
      };
    },
    [navigate]
  );

  const renderItem = useCallback(
    (item: AuthUrlInfo) => {
      return (
        <WebsiteAccessItem
          accountCount={getAccountCount(item)}
          className={"__item"}
          domain={item.id}
          key={item.id}
          onClick={onClickItem(item)}
          siteName={item.origin || item.id}
        />
      );
    },
    [onClickItem]
  );

  const renderEmptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t("Your list of approved dApps will appear here.")}
        emptyTitle={t("No dApps found")}
        phosphorIcon={GlobeHemisphereWest}
      />
    );
  }, [t]);

  const searchFunc = useCallback((item: AuthUrlInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.origin.toLowerCase().includes(searchTextLowerCase) ||
      item.id.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  return (
    <PageWrapper className={`manage-website-access ${className}`}>
      <SwSubHeader
        background={"transparent"}
        center
        onBack={goBack}
        paddingVertical
        rightButtons={[
          {
            icon: (
              <Icon
                customSize={"24px"}
                phosphorIcon={GearSix}
                type="phosphor"
                weight={"bold"}
              />
            ),
            onClick: onOpenActionModal,
          },
        ]}
        showBackButton
        title={t("Manage website access")}
      />

      <SwList.Section
        actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
        enableSearchInput
        filterBy={filterFunction}
        list={websiteAccessItems}
        onClickActionBtn={onClickActionBtn}
        renderItem={renderItem}
        renderWhenEmpty={renderEmptyList}
        searchFunction={searchFunc}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>("Search website")}
        showActionBtn
      />

      <ActionModal
        actions={actions}
        id={ACTION_MODAL_ID}
        onCancel={onCloseActionModal}
        title={t("Website access config")}
      />

      <FilterModal
        id={FILTER_MODAL_ID}
        onApplyFilter={onApplyFilter}
        onCancel={onCloseFilterModal}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
      />
    </PageWrapper>
  );
}

const ManageWebsiteAccess = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      height: "100%",
      backgroundColor: token.colorBgDefault,
      display: "flex",
      flexDirection: "column",

      ".ant-sw-list-section": {
        flex: 1,
        marginBottom: token.margin,
      },

      ".ant-sw-list-section .ant-sw-list": {
        paddingBottom: 0,
      },

      ".__item + .__item": {
        marginTop: token.marginXS,
      },
    };
  }
);

export default ManageWebsiteAccess;
