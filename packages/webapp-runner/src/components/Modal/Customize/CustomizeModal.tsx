// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CUSTOMIZE_MODAL } from "@subwallet-webapp/constants/modal";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { RootState } from "@subwallet-webapp/stores";
import { updateShowZeroBalanceState } from "@subwallet-webapp/stores/utils";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import {
  BackgroundIcon,
  ModalContext,
  SettingItem,
  Switch,
  SwModal,
} from "@subwallet/react-ui";
import { Wallet } from "phosphor-react";
import React, { useCallback, useContext } from "react";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";

import CustomizeModalContent from "./CustomizeModalContent";

type Props = ThemeProps;

function Component({ className = "" }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;
  const isShowZeroBalance = useSelector(
    (state: RootState) => state.settings.isShowZeroBalance
  );

  const onChangeZeroBalance = useCallback((checked: boolean) => {
    updateShowZeroBalanceState(checked);
  }, []);

  const onCancel = useCallback(() => {
    inactiveModal(CUSTOMIZE_MODAL);
  }, [inactiveModal]);

  return (
    <SwModal
      className={className}
      destroyOnClose={true}
      id={CUSTOMIZE_MODAL}
      onCancel={onCancel}
      title={t("Customization")}
    >
      <div className={"__group-label"}>{t("Balance")}</div>
      <div className={"__group-content"}>
        <SettingItem
          className={"__setting-item"}
          leftItemIcon={
            <BackgroundIcon
              backgroundColor={token["green-6"]}
              iconColor={token.colorTextLight1}
              phosphorIcon={Wallet}
              size="sm"
              type="phosphor"
              weight="fill"
            />
          }
          name={t("Show zero balance")}
          rightItem={
            <Switch
              checked={isShowZeroBalance}
              onClick={onChangeZeroBalance}
              style={{ marginRight: 8 }}
            />
          }
        />
      </div>

      <div className={"__group-label"}>{t("Chains")}</div>

      <CustomizeModalContent />
    </SwModal>
  );
}

export const CustomizeModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".ant-sw-modal-content": {
        maxHeight: 586,
        height: 586,
        overflow: "hidden",
      },

      ".ant-sw-modal-body": {
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
        display: "flex",
        flexDirection: "column",
      },

      ".__group-label": {
        paddingLeft: token.padding,
        paddingRight: token.padding,
        color: token.colorTextLight3,
        textTransform: "uppercase",
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        marginBottom: token.marginXS,
      },

      ".__group-content": {
        paddingLeft: token.padding,
        paddingRight: token.padding,
        marginBottom: token.marginXS,
      },

      ".__setting-item .ant-setting-item-content": {
        paddingTop: 0,
        paddingBottom: 0,
        height: 52,
        alignItems: "center",
      },

      ".ant-sw-list-section": {
        flex: 1,
      },

      ".network_item__container .ant-web3-block-right-item": {
        marginRight: 0,
      },
    };
  }
);
