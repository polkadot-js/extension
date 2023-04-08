// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import SelectAccountType from "@subwallet-webapp/components/Account/SelectAccountType";
import BackIcon from "@subwallet-webapp/components/Icon/BackIcon";
import CloseIcon from "@subwallet-webapp/components/Icon/CloseIcon";
import {
  EVM_ACCOUNT_TYPE,
  SUBSTRATE_ACCOUNT_TYPE,
} from "@subwallet-webapp/constants/account";
import {
  CREATE_ACCOUNT_MODAL,
  NEW_ACCOUNT_MODAL,
} from "@subwallet-webapp/constants/modal";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useClickOutSide from "@subwallet-webapp/hooks/dom/useClickOutSide";
import useSwitchModal from "@subwallet-webapp/hooks/modal/useSwitchModal";
import { ThemeProps } from "@subwallet-webapp/types";
import { renderModalSelector } from "@subwallet-webapp/util/common/dom";
import { Button, Icon, ModalContext, SwModal } from "@subwallet/react-ui";
import CN from "classnames";
import { CheckCircle } from "phosphor-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { KeypairType } from "@polkadot/util-crypto/types";

type Props = ThemeProps;

const modalId = NEW_ACCOUNT_MODAL;

const defaultSelectedTypes = [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE];

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { checkActive, inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const isActive = checkActive(modalId);

  const [selectedItems, setSelectedItems] =
    useState<KeypairType[]>(defaultSelectedTypes);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onSubmit = useCallback(() => {
    navigate("/accounts/new-seed-phrase", {
      state: { accountTypes: selectedItems },
    });
    inactiveModal(modalId);
  }, [navigate, selectedItems, inactiveModal]);

  const onBack = useSwitchModal(modalId, CREATE_ACCOUNT_MODAL);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  useEffect(() => {
    if (!isActive) {
      setSelectedItems(defaultSelectedTypes);
    }
  }, [isActive]);

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
      title={t<string>("Select account type")}
    >
      <div className="items-container">
        <SelectAccountType
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
        />
        <Button
          block={true}
          disabled={!selectedItems.length}
          icon={
            <Icon
              className={"icon-submit"}
              phosphorIcon={CheckCircle}
              weight="fill"
            />
          }
          onClick={onSubmit}
        >
          {t("Confirm")}
        </Button>
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
    };
  }
);

export default CreateAccountModal;
