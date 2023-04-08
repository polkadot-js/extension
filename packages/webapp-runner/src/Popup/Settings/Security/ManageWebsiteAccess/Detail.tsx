// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrlInfo } from "@subwallet/extension-base/background/handlers/State";
import { AccountJson } from "@subwallet/extension-base/background/types";
import { Layout, PageWrapper } from "@subwallet-webapp/components";
import AccountItemWithName from "@subwallet-webapp/components/Account/Item/AccountItemWithName";
import EmptyList from "@subwallet-webapp/components/EmptyList";
import {
  ActionItemType,
  ActionModal,
} from "@subwallet-webapp/components/Modal/ActionModal";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import {
  changeAuthorization,
  changeAuthorizationPerAccount,
  forgetSite,
  toggleAuthorization,
} from "@subwallet-webapp/messaging";
import { RootState } from "@subwallet-webapp/stores";
import { updateAuthUrls } from "@subwallet-webapp/stores/utils";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { ManageWebsiteAccessDetailParam } from "@subwallet-webapp/types/navigation";
import { filterNotReadOnlyAccount } from "@subwallet-webapp/util/account/account";
import { Icon, ModalContext, Switch, SwList } from "@subwallet/react-ui";
import {
  GearSix,
  MagnifyingGlass,
  Plugs,
  PlugsConnected,
  ShieldCheck,
  ShieldSlash,
  X,
} from "phosphor-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import styled, { useTheme } from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

type Props = ThemeProps &
  ManageWebsiteAccessDetailParam & {
    authInfo: AuthUrlInfo;
    goBack: () => void;
  };

type WrapperProps = ThemeProps;

const ActionModalId = "actionModalId";
// const FilterModalId = 'filterModalId';

function Component({
  accountAuthType,
  authInfo,
  className = "",
  goBack,
  origin,
  siteName,
}: Props): React.ReactElement<Props> {
  const accounts = useSelector(
    (state: RootState) => state.accountState.accounts
  );
  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({});
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const accountItems = useMemo(() => {
    const accountListWithoutAll = filterNotReadOnlyAccount(
      accounts.filter((opt) => opt.address !== "ALL")
    );

    if (accountAuthType === "substrate") {
      return accountListWithoutAll.filter(
        (acc) => !isEthereumAddress(acc.address)
      );
    } else if (accountAuthType === "evm") {
      return accountListWithoutAll.filter((acc) =>
        isEthereumAddress(acc.address)
      );
    } else {
      return accountListWithoutAll;
    }
  }, [accountAuthType, accounts]);

  const onOpenActionModal = useCallback(() => {
    activeModal(ActionModalId);
  }, [activeModal]);

  const onCloseActionModal = useCallback(() => {
    inactiveModal(ActionModalId);
  }, [inactiveModal]);

  const actions: ActionItemType[] = useMemo(() => {
    const isAllowed = authInfo.isAllowed;

    const result: ActionItemType[] = [
      {
        key: isAllowed ? "block" : "unblock",
        icon: isAllowed ? ShieldSlash : ShieldCheck,
        iconBackgroundColor: isAllowed ? token.colorError : token.colorSuccess,
        title: isAllowed ? t("Block this site") : t("Unblock this site"),
        onClick: () => {
          toggleAuthorization(origin)
            .then(({ list }) => {
              updateAuthUrls(list);
            })
            .catch(console.error);
          onCloseActionModal();
        },
      },
      {
        key: "forget-site",
        icon: X,
        iconBackgroundColor: token.colorWarning,
        title: t("Forget site"),
        onClick: () => {
          forgetSite(origin, updateAuthUrls).catch(console.error);
          onCloseActionModal();
        },
      },
    ];

    if (isAllowed) {
      result.push(
        {
          key: "disconnect-all",
          icon: Plugs,
          iconBackgroundColor: token["gray-3"],
          title: t("Disconnect all"),
          onClick: () => {
            changeAuthorization(false, origin, updateAuthUrls).catch(
              console.error
            );
            onCloseActionModal();
          },
        },
        {
          key: "connect-all",
          icon: PlugsConnected,
          iconBackgroundColor: token["green-6"],
          title: t("Connect all"),
          onClick: () => {
            changeAuthorization(true, origin, updateAuthUrls).catch(
              console.error
            );
            onCloseActionModal();
          },
        }
      );
    }

    return result;
  }, [authInfo.isAllowed, onCloseActionModal, origin, t, token]);

  const renderItem = useCallback(
    (item: AccountJson) => {
      const isEnabled: boolean = authInfo.isAllowedMap[item.address];

      const onClick = () => {
        setPendingMap((prevMap) => {
          return {
            ...prevMap,
            [item.address]: !isEnabled,
          };
        });
        changeAuthorizationPerAccount(
          item.address,
          !isEnabled,
          origin,
          updateAuthUrls
        )
          .catch(console.log)
          .finally(() => {
            setPendingMap((prevMap) => {
              const newMap = { ...prevMap };

              delete newMap[item.address];

              return newMap;
            });
          });
      };

      return (
        <AccountItemWithName
          accountName={item.name}
          address={item.address}
          avatarSize={token.sizeLG}
          key={item.address}
          rightItem={
            <Switch
              checked={
                pendingMap[item.address] === undefined
                  ? isEnabled
                  : pendingMap[item.address]
              }
              disabled={
                !authInfo.isAllowed || pendingMap[item.address] !== undefined
              }
              {...{ onClick }}
              style={{ marginRight: 8 }}
            />
          }
        />
      );
    },
    [
      authInfo.isAllowed,
      authInfo.isAllowedMap,
      origin,
      pendingMap,
      token.sizeLG,
    ]
  );

  const searchFunc = useCallback((item: AccountJson, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.address.toLowerCase().includes(searchTextLowerCase) ||
      (item.name
        ? item.name.toLowerCase().includes(searchTextLowerCase)
        : false)
    );
  }, []);

  useEffect(() => {
    setPendingMap((prevMap) => {
      if (!Object.keys(prevMap).length) {
        return prevMap;
      }

      return {};
    });
  }, [authInfo]);

  const renderEmptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t("Your accounts will appear here.")}
        emptyTitle={t("No account found")}
        phosphorIcon={MagnifyingGlass}
      />
    );
  }, [t]);

  return (
    <PageWrapper className={`manage-website-access-detail ${className}`}>
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        subHeaderIcons={[
          {
            icon: (
              <Icon
                phosphorIcon={GearSix}
                size="md"
                type="phosphor"
                weight="bold"
              />
            ),
            onClick: onOpenActionModal,
          },
        ]}
        title={siteName}
      >
        <SwList.Section
          displayRow
          enableSearchInput
          list={accountItems}
          renderItem={renderItem}
          renderWhenEmpty={renderEmptyList}
          rowGap={"8px"}
          searchFunction={searchFunc}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>("Search account")}
        />

        <ActionModal
          actions={actions}
          className={`${className} action-modal`}
          id={ActionModalId}
          onCancel={onCloseActionModal}
          title={t("Website access config")}
        />
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
}

function WrapperComponent(props: WrapperProps) {
  const location = useLocation();
  const { accountAuthType, origin, siteName } =
    location.state as ManageWebsiteAccessDetailParam;
  const authInfo: undefined | AuthUrlInfo = useSelector(
    (state: RootState) => state.settings.authUrls[origin]
  );
  const goBack = useDefaultNavigate().goBack;

  useEffect(() => {
    if (!authInfo) {
      goBack();
    }
  }, [goBack, authInfo]);

  return (
    <>
      {!!authInfo && (
        <Component
          {...props}
          accountAuthType={accountAuthType}
          authInfo={authInfo}
          goBack={goBack}
          origin={origin}
          siteName={siteName}
        />
      )}
    </>
  );
}

const ManageWebsiteAccessDetail = styled(WrapperComponent)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      paddingBottom: token.paddingMD,

      "&.manage-website-access-detail": {
        height: "100%",
        backgroundColor: token.colorBgDefault,
        display: "flex",
        flexDirection: "column",

        ".ant-sw-list-section": {
          flex: 1,
        },
      },

      ".ant-sw-screen-layout-body": {
        paddingTop: token.paddingSM,
      },

      "&.action-modal": {
        ".__action-item.block .ant-setting-item-name": {
          color: token.colorError,
        },
      },
    };
  }
);

export default ManageWebsiteAccessDetail;
