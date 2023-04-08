// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  AccountJson,
  CurrentAccountInfo,
} from "@subwallet/extension-base/background/types";
import AccountCardSelection from "@subwallet-webapp/components/Account/Card/AccountCardSelection";
import AccountBriefInfo from "@subwallet-webapp/components/Account/Info/AccountBriefInfo";
import AccountItemWithName from "@subwallet-webapp/components/Account/Item/AccountItemWithName";
import { SELECT_ACCOUNT_MODAL } from "@subwallet-webapp/constants/modal";
import { useGetCurrentAuth } from "@subwallet-webapp/hooks/auth/useGetCurrentAuth";
import { useGetCurrentTab } from "@subwallet-webapp/hooks/auth/useGetCurrentTab";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useIsPopup from "@subwallet-webapp/hooks/dom/useIsPopup";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import {
  saveCurrentAccountAddress,
  triggerAccountsSubscription,
} from "@subwallet-webapp/messaging";
import { RootState } from "@subwallet-webapp/stores";
import { Theme } from "@subwallet-webapp/themes";
import { ThemeProps } from "@subwallet-webapp/types";
import { findAccountByAddress, isAccountAll } from "@subwallet-webapp/util";
import { searchAccountFunction } from "@subwallet-webapp/util/account/account";
import {
  BackgroundIcon,
  Logo,
  ModalContext,
  SelectModal,
  Tooltip,
} from "@subwallet/react-ui";
import CN from "classnames";
import { Plug, Plugs, PlugsConnected } from "phosphor-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

import GeneralEmptyList from "../../../GeneralEmptyList";
import { ConnectWebsiteModal } from "../ConnectWebsiteModal";
import SelectAccountFooter from "../SelectAccount/Footer";

type Props = ThemeProps;

enum ConnectionStatement {
  NOT_CONNECTED = "not-connected",
  CONNECTED = "connected",
  PARTIAL_CONNECTED = "partial-connected",
  DISCONNECTED = "disconnected",
  BLOCKED = "blocked",
}

const iconMap = {
  [ConnectionStatement.NOT_CONNECTED]: Plug,
  [ConnectionStatement.CONNECTED]: PlugsConnected,
  [ConnectionStatement.PARTIAL_CONNECTED]: PlugsConnected,
  [ConnectionStatement.DISCONNECTED]: Plugs,
  [ConnectionStatement.BLOCKED]: Plugs,
};

const ConnectWebsiteId = "connectWebsiteId";

const renderEmpty = () => <GeneralEmptyList />;

const modalId = SELECT_ACCOUNT_MODAL;

function Component({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { goHome } = useDefaultNavigate();

  const { accounts, currentAccount, isAllAccount } = useSelector(
    (state: RootState) => state.accountState
  );

  const [connected, setConnected] = useState(0);
  const [canConnect, setCanConnect] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionStatement>(
    ConnectionStatement.NOT_CONNECTED
  );
  const currentTab = useGetCurrentTab();
  const isCurrentTabFetched = !!currentTab;
  const currentAuth = useGetCurrentAuth();
  const isPopup = useIsPopup();

  const noAllAccounts = useMemo(() => {
    return accounts.filter(({ address }) => !isAccountAll(address));
  }, [accounts]);

  const noReadOnlyAccounts = useMemo(() => {
    return noAllAccounts.filter(({ isReadOnly }) => !isReadOnly);
  }, [noAllAccounts]);

  const _onSelect = useCallback(
    (address: string) => {
      if (address) {
        const accountByAddress = findAccountByAddress(accounts, address);

        if (accountByAddress) {
          const accountInfo = {
            address: address,
          } as CurrentAccountInfo;

          saveCurrentAccountAddress(accountInfo, () => {
            triggerAccountsSubscription().catch((e) => {
              console.error(
                "There is a problem when trigger Accounts Subscription",
                e
              );
            });
            const pathName = location.pathname;
            const locationPaths = location.pathname.split("/");

            if (locationPaths) {
              if (locationPaths[1] === "home") {
                if (locationPaths.length >= 3) {
                  if (pathName.startsWith("/home/nfts")) {
                    navigate("/home/nfts/collections");
                  } else if (pathName.startsWith("/home/tokens/detail")) {
                    navigate("/home/tokens");
                  } else {
                    navigate(`/home/${locationPaths[2]}`);
                  }
                }
              } else {
                goHome();
              }
            }
          }).catch((e) => {
            console.error("There is a problem when set Current Account", e);
          });
        } else {
          console.error("There is a problem when change account");
        }
      }
    },
    [accounts, location.pathname, navigate, goHome]
  );

  const onClickDetailAccount = useCallback(
    (address: string) => {
      return () => {
        inactiveModal(modalId);
        setTimeout(() => {
          navigate(`/accounts/detail/${address}`);
        }, 100);
      };
    },
    [navigate, inactiveModal]
  );

  const renderItem = useCallback(
    (item: AccountJson, _selected: boolean) => {
      const currentAccountIsAll = isAccountAll(item.address);

      if (currentAccountIsAll) {
        return (
          <AccountItemWithName
            address={item.address}
            className="all-account-selection"
            isSelected={_selected}
          />
        );
      }

      return (
        <AccountCardSelection
          accountName={item.name || ""}
          address={item.address}
          className={className}
          genesisHash={item.genesisHash}
          isSelected={_selected}
          isShowSubIcon
          onPressMoreBtn={onClickDetailAccount(item.address)}
          subIcon={
            <Logo
              network={
                isEthereumAddress(item.address) ? "ethereum" : "polkadot"
              }
              shape={"circle"}
              size={16}
            />
          }
        />
      );
    },
    [className, onClickDetailAccount]
  );

  const renderSelectedItem = useCallback(
    (item: AccountJson): React.ReactNode => {
      return (
        <div className="selected-account">
          <AccountBriefInfo account={item} />
        </div>
      );
    },
    []
  );

  useEffect(() => {
    if (currentAuth) {
      if (!currentAuth.isAllowed) {
        setCanConnect(0);
        setConnected(0);
        setConnectionState(ConnectionStatement.BLOCKED);
      } else {
        const type = currentAuth.accountAuthType;
        const allowedMap = currentAuth.isAllowedMap;

        const filterType = (address: string) => {
          if (type === "both") {
            return true;
          }

          const _type = type || "substrate";

          return _type === "substrate"
            ? !isEthereumAddress(address)
            : isEthereumAddress(address);
        };

        if (!isAllAccount) {
          const _allowedMap: Record<string, boolean> = {};

          Object.entries(allowedMap)
            .filter(([address]) => filterType(address))
            .forEach(([address, value]) => {
              _allowedMap[address] = value;
            });

          const isAllowed = _allowedMap[currentAccount?.address || ""];

          setCanConnect(0);
          setConnected(0);

          if (isAllowed === undefined) {
            setConnectionState(ConnectionStatement.NOT_CONNECTED);
          } else {
            setConnectionState(
              isAllowed
                ? ConnectionStatement.CONNECTED
                : ConnectionStatement.DISCONNECTED
            );
          }
        } else {
          const numberAccounts = noReadOnlyAccounts.filter(({ address }) =>
            filterType(address)
          ).length;
          const numberAllowedAccounts = Object.entries(allowedMap)
            .filter(([address]) => filterType(address))
            .filter(([, value]) => value).length;

          setConnected(numberAllowedAccounts);
          setCanConnect(numberAccounts);

          if (numberAllowedAccounts === 0) {
            setConnectionState(ConnectionStatement.DISCONNECTED);
          } else {
            if (
              numberAllowedAccounts > 0 &&
              numberAllowedAccounts < numberAccounts
            ) {
              setConnectionState(ConnectionStatement.PARTIAL_CONNECTED);
            } else {
              setConnectionState(ConnectionStatement.CONNECTED);
            }
          }
        }
      }
    } else {
      setCanConnect(0);
      setConnected(0);
      setConnectionState(ConnectionStatement.NOT_CONNECTED);
    }
  }, [currentAccount?.address, currentAuth, isAllAccount, noReadOnlyAccounts]);

  const visibleText = useMemo((): string => {
    switch (connectionState) {
      case ConnectionStatement.CONNECTED:
        if (isAllAccount) {
          return `Connected ${connected}/${canConnect}`;
        } else {
          return "Connected";
        }

      case ConnectionStatement.PARTIAL_CONNECTED:
        if (isAllAccount) {
          return `Connected ${connected}/${canConnect}`;
        } else {
          return "Connected";
        }

      case ConnectionStatement.DISCONNECTED:
        return "Disconnected";

      case ConnectionStatement.BLOCKED:
        return "Blocked";

      case ConnectionStatement.NOT_CONNECTED:
      default:
        return "Not connected";
    }
  }, [canConnect, connected, connectionState, isAllAccount]);

  const onOpenConnectWebsiteModal = useCallback(() => {
    if (isCurrentTabFetched) {
      activeModal(ConnectWebsiteId);
    }
  }, [activeModal, isCurrentTabFetched]);

  const onCloseConnectWebsiteModal = useCallback(() => {
    inactiveModal(ConnectWebsiteId);
  }, [inactiveModal]);

  return (
    <div className={CN(className, "container")}>
      {isPopup && (
        <Tooltip placement={"bottomLeft"} title={visibleText}>
          <div
            className={CN("connect-icon", `-${connectionState}`)}
            onClick={onOpenConnectWebsiteModal}
          >
            <BackgroundIcon
              backgroundColor="var(--bg-color)"
              phosphorIcon={iconMap[connectionState]}
              shape="circle"
              size="sm"
              type="phosphor"
              weight={"fill"}
            />
          </div>
        </Tooltip>
      )}

      <SelectModal
        background={"default"}
        className={className}
        footer={<SelectAccountFooter />}
        id={modalId}
        ignoreScrollbarMethod="padding"
        inputWidth={"100%"}
        itemKey="address"
        items={noAllAccounts.length <= 1 ? noAllAccounts : accounts}
        onSelect={_onSelect}
        renderItem={renderItem}
        renderSelected={renderSelectedItem}
        renderWhenEmpty={renderEmpty}
        searchFunction={searchAccountFunction}
        searchPlaceholder={t<string>("Account name")}
        searchableMinCharactersCount={2}
        selected={currentAccount?.address || ""}
        shape="round"
        size="small"
        title={t("Select account")}
      />

      <ConnectWebsiteModal
        authInfo={currentAuth}
        id={ConnectWebsiteId}
        isBlocked={connectionState === ConnectionStatement.BLOCKED}
        isNotConnected={connectionState === ConnectionStatement.NOT_CONNECTED}
        onCancel={onCloseConnectWebsiteModal}
        url={currentTab?.url || ""}
      />
    </div>
  );
}

const SelectAccount = styled(Component)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return {
    "&.container": {
      paddingLeft: token.sizeSM,
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",

      ".ant-select-modal-input-container.ant-select-modal-input-border-round::before":
        {
          display: "none",
        },

      ".ant-select-modal-input-container.ant-select-modal-input-size-small .ant-select-modal-input-wrapper":
        {
          paddingLeft: 0,
        },

      ".ant-select-modal-input-container:hover .account-name": {
        color: token.colorTextLight3,
      },
    },

    "&.ant-sw-modal": {
      ".ant-sw-modal-body": {
        height: 370,
        marginBottom: 0,
      },

      ".ant-sw-list-search-input": {
        paddingBottom: token.paddingXS,
      },

      ".ant-sw-modal-footer": {
        marginTop: 0,
      },

      ".ant-account-card": {
        padding: token.paddingSM,
      },

      ".ant-web3-block .ant-web3-block-middle-item": {
        textAlign: "initial",
      },

      ".all-account-selection": {
        ".account-item-name": {
          fontSize: token.fontSizeHeading5,
          lineHeight: token.lineHeightHeading5,
        },
      },

      ".ant-account-card-name": {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        maxWidth: 120,
      },

      ".ant-input-container .ant-input": {
        color: token.colorTextLight1,
      },
    },

    ".all-account-item": {
      display: "flex",
      padding: `${token.paddingSM + 2}px ${token.paddingSM}px`,
      cursor: "pointer",
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG,
      alignItems: "center",
      justifyContent: "space-between",
      gap: token.sizeXS,

      "&:hover": {
        backgroundColor: token.colorBgInput,
      },

      ".selected": {
        color: token["cyan-6"],
      },
    },

    ".ant-select-modal-input-container": {
      overflow: "hidden",
    },

    ".selected-account": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    ".connect-icon": {
      color: token.colorTextBase,
      width: 40,
      height: 40,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",

      [`&.-${ConnectionStatement.DISCONNECTED}`]: {
        "--bg-color": token["gray-3"],
      },

      [`&.-${ConnectionStatement.BLOCKED}`]: {
        "--bg-color": token.colorError,
      },

      [`&.-${ConnectionStatement.NOT_CONNECTED}`]: {
        "--bg-color": token["gray-3"],
      },

      [`&.-${ConnectionStatement.CONNECTED}`]: {
        "--bg-color": token["green-6"],
      },

      [`&.-${ConnectionStatement.PARTIAL_CONNECTED}`]: {
        "--bg-color": token.colorWarning,
      },
    },
  };
});

export default SelectAccount;
