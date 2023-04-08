// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { canDerive } from "@subwallet/extension-base/utils";
import BackIcon from "@subwallet-webapp/components/Icon/BackIcon";
import CloseIcon from "@subwallet-webapp/components/Icon/CloseIcon";
import { SettingItemSelection } from "@subwallet-webapp/components/Setting/SettingItemSelection";
import { EVM_ACCOUNT_TYPE } from "@subwallet-webapp/constants/account";
import {
  CREATE_ACCOUNT_MODAL,
  DERIVE_ACCOUNT_MODAL,
  NEW_ACCOUNT_MODAL,
} from "@subwallet-webapp/constants/modal";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useClickOutSide from "@subwallet-webapp/hooks/dom/useClickOutSide";
import useGoBackSelectAccount from "@subwallet-webapp/hooks/modal/useGoBackSelectAccount";
import { RootState } from "@subwallet-webapp/stores";
import { Theme } from "@subwallet-webapp/themes";
import { PhosphorIcon, ThemeProps } from "@subwallet-webapp/types";
import { renderModalSelector } from "@subwallet-webapp/util/common/dom";
import { BackgroundIcon, ModalContext, SwModal } from "@subwallet/react-ui";
import CN from "classnames";
import { Leaf, ShareNetwork } from "phosphor-react";
import React, { useCallback, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";

type Props = ThemeProps;

interface CreateAccountItem {
  label: string;
  key: string;
  icon: PhosphorIcon;
  backgroundColor: string;
  onClick: () => void;
  disabled: boolean;
}

const modalId = CREATE_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);

  const { token } = useTheme() as Theme;
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const isActive = checkActive(modalId);

  const onBack = useGoBackSelectAccount(modalId);

  const disableDerive = useMemo(
    () =>
      !accounts
        .filter(({ isExternal }) => !isExternal)
        .filter(
          ({ isMasterAccount, type }) =>
            canDerive(type) &&
            (type !== EVM_ACCOUNT_TYPE ||
              (isMasterAccount && type === EVM_ACCOUNT_TYPE))
        ).length,
    [accounts]
  );

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  const renderIcon = useCallback(
    (item: CreateAccountItem) => {
      return (
        <BackgroundIcon
          backgroundColor={item.backgroundColor}
          iconColor={token.colorText}
          phosphorIcon={item.icon}
          size="sm"
          weight="fill"
        />
      );
    },
    [token.colorText]
  );

  const items = useMemo(
    (): CreateAccountItem[] => [
      {
        backgroundColor: token["green-7"],
        disabled: false,
        icon: Leaf,
        key: "new-seed-phrase",
        label: "Create with new Seed Phrase",
        onClick: () => {
          inactiveModal(modalId);
          activeModal(NEW_ACCOUNT_MODAL);
        },
      },
      {
        backgroundColor: token["magenta-7"],
        disabled: disableDerive,
        icon: ShareNetwork,
        key: "derive-account",
        label: "Create with existing Seed Phrase",
        onClick: () => {
          inactiveModal(modalId);
          activeModal(DERIVE_ACCOUNT_MODAL);
        },
      },
    ],
    [activeModal, inactiveModal, disableDerive, token]
  );

  return (
    <SwModal
      className={CN(className)}
      closeIcon={<BackIcon />}
      id={modalId}
      maskClosable={false}
      onCancel={onBack}
      rightIconProps={{
        icon: <CloseIcon />,
        onClick: onCancel,
      }}
      title={t<string>("Create new account")}
    >
      <div className="items-container">
        {items.map((item) => {
          return (
            <div
              className={CN({ disabled: item.disabled })}
              key={item.key}
              onClick={item.disabled ? undefined : item.onClick}
            >
              <SettingItemSelection
                label={t<string>(item.label)}
                leftItemIcon={renderIcon(item)}
              />
            </div>
          );
        })}
      </div>
    </SwModal>
  );
};

const CreateAccountModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".items-container": {
        display: "flex",
        flexDirection: "column",
        gap: token.sizeXS,
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

export default CreateAccountModal;
