// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  AttachAccountModal,
  CreateAccountModal,
  DeriveAccountModal,
  ImportAccountModal,
  NewAccountModal,
  RequestCameraAccessModal,
  RequestCreatePasswordModal,
} from "@subwallet-webapp/components";
import { CustomizeModal } from "@subwallet-webapp/components/Modal/Customize/CustomizeModal";
import Confirmations from "@subwallet-webapp/Popup/Confirmations";
import { RootState } from "@subwallet-webapp/stores";
import { ModalContext, SwModal, useExcludeModal } from "@subwallet/react-ui";
import CN from "classnames";
import React, { useCallback, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

export const PREDEFINED_MODAL_NAMES = [
  "debugger",
  "transaction",
  "confirmations",
];
type PredefinedModalName = (typeof PREDEFINED_MODAL_NAMES)[number];

export const usePredefinedModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openPModal = useCallback(
    (name: PredefinedModalName | null) => {
      setSearchParams((prev) => {
        if (name) {
          prev.set("popup", name);
        } else {
          prev.delete("popup");
        }

        return prev;
      });
    },
    [setSearchParams]
  );

  const isOpenPModal = useCallback(
    (popupName?: string) => {
      const currentPopup = searchParams.get("popup");

      if (popupName) {
        return currentPopup === popupName;
      } else {
        return !!currentPopup;
      }
    },
    [searchParams]
  );

  return { openPModal, isOpenPModal };
};

export const WalletModalContext = ({ children }: Props) => {
  const { activeModal, hasActiveModal, inactiveModals } =
    useContext(ModalContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasConfirmations } = useSelector(
    (state: RootState) => state.requestState
  );

  useExcludeModal("confirmations");

  useEffect(() => {
    const confirmID = searchParams.get("popup");

    // Auto open confirm modal with method modalContext.activeModal else auto close all modal
    if (confirmID) {
      PREDEFINED_MODAL_NAMES.includes(confirmID) && activeModal(confirmID);
    } else {
      inactiveModals(PREDEFINED_MODAL_NAMES);
    }
  }, [activeModal, inactiveModals, searchParams]);

  const onCloseModal = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete("popup");

      return prev;
    });
  }, [setSearchParams]);

  return (
    <>
      <div
        id="popup-container"
        style={{ zIndex: hasActiveModal ? undefined : -1 }}
      />
      {children}
      <SwModal
        className={"modal-full"}
        closable={false}
        id={"confirmations"}
        onCancel={onCloseModal}
        transitionName={"fade"}
        wrapClassName={CN({ "d-none": !hasConfirmations })}
      >
        <Confirmations />
      </SwModal>
      <CreateAccountModal />
      <ImportAccountModal />
      <AttachAccountModal />
      <NewAccountModal />
      <DeriveAccountModal />
      <RequestCreatePasswordModal />
      <RequestCameraAccessModal />
      <CustomizeModal />
    </>
  );
};
