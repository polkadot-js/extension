// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from "@subwallet/extension-base/background/types";
import { canDerive } from "@subwallet/extension-base/utils";
import AccountItemWithName from "@subwallet-webapp/components/Account/Item/AccountItemWithName";
import BackIcon from "@subwallet-webapp/components/Icon/BackIcon";
import { EVM_ACCOUNT_TYPE } from "@subwallet-webapp/constants/account";
import {
  CREATE_ACCOUNT_MODAL,
  DERIVE_ACCOUNT_MODAL,
} from "@subwallet-webapp/constants/modal";
import useNotification from "@subwallet-webapp/hooks/common/useNotification";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useClickOutSide from "@subwallet-webapp/hooks/dom/useClickOutSide";
import useSwitchModal from "@subwallet-webapp/hooks/modal/useSwitchModal";
import { deriveAccountV3 } from "@subwallet-webapp/messaging";
import { RootState } from "@subwallet-webapp/stores";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { searchAccountFunction } from "@subwallet-webapp/util/account/account";
import { renderModalSelector } from "@subwallet-webapp/util/common/dom";
import { Icon, ModalContext, SwList, SwModal } from "@subwallet/react-ui";
import { SwListSectionRef } from "@subwallet/react-ui/es/sw-list";
import CN from "classnames";
import { SpinnerGap } from "phosphor-react";
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";

import GeneralEmptyList from "../../GeneralEmptyList";

type Props = ThemeProps;

const modalId = DERIVE_ACCOUNT_MODAL;

const renderEmpty = () => <GeneralEmptyList />;

const renderLoaderIcon = (x: React.ReactNode): React.ReactNode => {
  return (
    <>
      {x}
      <Icon className="loader-icon" phosphorIcon={SpinnerGap} size="sm" />
    </>
  );
};

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const notify = useNotification();
  const sectionRef = useRef<SwListSectionRef>(null);

  const { checkActive, inactiveModal } = useContext(ModalContext);

  const { accounts } = useSelector((state: RootState) => state.accountState);

  const isActive = checkActive(modalId);

  const [selected, setSelected] = useState("");

  const filtered = useMemo(
    () =>
      accounts
        .filter(({ isExternal }) => !isExternal)
        .filter(
          ({ isMasterAccount, type }) =>
            canDerive(type) &&
            (type !== EVM_ACCOUNT_TYPE ||
              (isMasterAccount && type === EVM_ACCOUNT_TYPE))
        ),
    [accounts]
  );

  const clearSearch = useCallback(() => {
    sectionRef.current?.setSearchValue("");
  }, []);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
    clearSearch();
  }, [clearSearch, inactiveModal]);

  useClickOutSide(
    isActive || !!selected,
    renderModalSelector(className),
    onCancel
  );

  const onSelectAccount = useCallback(
    (account: AccountJson): (() => void) => {
      return () => {
        setSelected(account.address);

        setTimeout(() => {
          deriveAccountV3({
            address: account.address,
          })
            .then(() => {
              inactiveModal(modalId);
              clearSearch();
            })
            .catch((e: Error) => {
              notify({
                message: e.message,
                type: "error",
              });
            })
            .finally(() => {
              setSelected("");
            });
        }, 500);
      };
    },
    [clearSearch, inactiveModal, notify]
  );

  const renderItem = useCallback(
    (account: AccountJson): React.ReactNode => {
      const disabled = !!selected;
      const isSelected = account.address === selected;

      return (
        <React.Fragment key={account.address}>
          <AccountItemWithName
            accountName={account.name}
            address={account.address}
            avatarSize={token.sizeLG}
            className={CN({ disabled: disabled && !isSelected })}
            onClick={disabled ? undefined : onSelectAccount(account)}
            renderRightItem={isSelected ? renderLoaderIcon : undefined}
          />
        </React.Fragment>
      );
    },
    [onSelectAccount, selected, token.sizeLG]
  );

  const onBack = useSwitchModal(modalId, CREATE_ACCOUNT_MODAL, clearSearch);

  return (
    <SwModal
      className={className}
      closeIcon={<BackIcon />}
      id={modalId}
      maskClosable={false}
      onCancel={selected ? undefined : onBack}
      title={t("Select Account")}
    >
      <SwList.Section
        displayRow={true}
        enableSearchInput={true}
        list={filtered}
        ref={sectionRef}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        rowGap="var(--row-gap)"
        searchFunction={searchAccountFunction}
        searchPlaceholder={t<string>("Account name")}
      />
    </SwModal>
  );
};

const DeriveAccountModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      "--row-gap": token.sizeXS,

      ".ant-sw-modal-body": {
        padding: `${token.padding}px 0`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      },

      ".ant-web3-block": {
        display: "flex !important",

        ".ant-web3-block-right-item": {
          marginRight: 0,

          ".loader-icon": {
            animation: "spinner-loading 1s infinite linear",
          },
        },
      },

      ".disabled": {
        opacity: 0.4,

        ".ant-web3-block": {
          cursor: "not-allowed",

          "&:hover": {
            backgroundColor: token["gray-1"],
          },
        },
      },
    };
  }
);

export default DeriveAccountModal;
