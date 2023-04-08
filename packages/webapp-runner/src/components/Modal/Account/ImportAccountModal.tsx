// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IMPORT_ACCOUNT_MODAL } from "@subwallet-webapp/constants";
import {
  useClickOutSide,
  useGoBackSelectAccount,
  useIsPopup,
  useTranslation,
} from "@subwallet-webapp/hooks";
import { windowOpen } from "@subwallet-webapp/messaging";
import { Theme } from "@subwallet-webapp/themes";
import { PhosphorIcon, ThemeProps } from "@subwallet-webapp/types";
import { renderModalSelector } from "@subwallet-webapp/util";
import { BackgroundIcon, ModalContext, SwModal } from "@subwallet/react-ui";
import CN from "classnames";
import { FileJs, Leaf, QrCode, Wallet } from "phosphor-react";
import React, { useCallback, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";

import { BackIcon, CloseIcon } from "../../Icon";
import { SettingItemSelection } from "../../Setting";

type Props = ThemeProps;

interface ImportAccountItem {
  label: string;
  key: string;
  icon: PhosphorIcon;
  backgroundColor: string;
  onClick: () => void;
}

const modalId = IMPORT_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const { checkActive, inactiveModal } = useContext(ModalContext);
  const isActive = checkActive(modalId);

  const isPopup = useIsPopup();
  const onBack = useGoBackSelectAccount(modalId);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  const onClickItem = useCallback(
    (path: string) => {
      return () => {
        inactiveModal(modalId);
        navigate(path);
      };
    },
    [navigate, inactiveModal]
  );

  const onClickJson = useCallback(() => {
    if (isPopup) {
      windowOpen("/accounts/restore-json").catch(console.error);
    } else {
      inactiveModal(modalId);
      navigate("/accounts/restore-json");
    }
  }, [inactiveModal, isPopup, navigate]);

  const items = useMemo(
    (): ImportAccountItem[] => [
      {
        backgroundColor: token["green-7"],
        icon: Leaf,
        key: "import-seed-phrase",
        label: "Import from Seed Phrase",
        onClick: onClickItem("/accounts/import-seed-phrase"),
      },
      {
        backgroundColor: token["orange-7"],
        icon: FileJs,
        key: "restore-json",
        label: "Restore from Polkadot {js}",
        onClick: onClickJson,
      },
      {
        backgroundColor: token["gray-3"],
        icon: Wallet,
        key: "import-private-key",
        label: "Import from MetaMask",
        onClick: onClickItem("/accounts/import-private-key"),
      },
      {
        backgroundColor: token["blue-7"],
        icon: QrCode,
        key: "import-by-qr",
        label: "Import by QR Code",
        onClick: onClickItem("/accounts/import-by-qr"),
      },
    ],
    [onClickItem, token, onClickJson]
  );

  const renderIcon = useCallback(
    (item: ImportAccountItem) => {
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
      title={t<string>("Import account")}
    >
      <div className="items-container">
        {items.map((item) => {
          return (
            <div key={item.key} onClick={item.onClick}>
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

const ImportAccountModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".items-container": {
        display: "flex",
        flexDirection: "column",
        gap: token.sizeXS,
      },
    };
  }
);

export default ImportAccountModal;
