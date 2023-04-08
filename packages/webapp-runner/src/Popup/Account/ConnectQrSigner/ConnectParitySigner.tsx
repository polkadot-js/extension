// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LogosMap } from "@subwallet-webapp/assets";
import ConnectQrSigner from "@subwallet-webapp/Popup/Account/ConnectQrSigner/index";
import { ThemeProps } from "@subwallet-webapp/types";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type Props = ThemeProps;

const Component: React.FC<ThemeProps> = () => {
  const { t } = useTranslation();

  return (
    <ConnectQrSigner
      description={t("Parity Signer will provide you QR code to scan")}
      instructionUrl={t("Connect your QR wallet")}
      logoUrl={LogosMap.parity}
      subTitle={t(
        "Open Parity Signer application on your smartphone to connect wallet"
      )}
      title={t("Connect your QR wallet")}
    />
  );
};

const ConnectParitySigner = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {};
  }
);

export default ConnectParitySigner;
