// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions } from "@subwallet/extension-base/background/KoniTypes";
import {
  AccountJson,
  AuthorizeRequest,
  MetadataRequest,
  SigningRequest,
} from "@subwallet/extension-base/background/types";
import { NEED_SIGN_CONFIRMATION } from "@subwallet-webapp/constants/signing";
import { useConfirmationsInfo } from "@subwallet-webapp/hooks";
import { ConfirmationType } from "@subwallet-webapp/stores/base/RequestState";
import { ThemeProps } from "@subwallet-webapp/types";
import { isRawPayload } from "@subwallet-webapp/util";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { ConfirmationHeader } from "./parts";
import {
  AddNetworkConfirmation,
  AddTokenConfirmation,
  AuthorizeConfirmation,
  EvmSignatureConfirmation,
  EvmTransactionConfirmation,
  MetadataConfirmation,
  NotSupportConfirmation,
  SignConfirmation,
  TransactionConfirmation,
} from "./variants";

type Props = ThemeProps;

const titleMap: Record<ConfirmationType, string> = {
  addNetworkRequest: "Add Network Request",
  addTokenRequest: "Add Token Request",
  authorizeRequest: "Connect to SubWallet",
  evmSendTransactionRequest: "Transaction Request",
  evmSignatureRequest: "Signature request",
  metadataRequest: "Update Metadata",
  signingRequest: "Signature request",
  switchNetworkRequest: "Add Network Request",
} as Record<ConfirmationType, string>;

const Component = function ({ className }: Props) {
  const { confirmationQueue, numberOfConfirmations } = useConfirmationsInfo();
  const [index, setIndex] = useState(0);
  const confirmation = confirmationQueue[index] || null;
  const { t } = useTranslation();

  const nextConfirmation = useCallback(() => {
    setIndex((val) => Math.min(val + 1, numberOfConfirmations - 1));
  }, [numberOfConfirmations]);

  const prevConfirmation = useCallback(() => {
    setIndex((val) => Math.max(0, val - 1));
  }, []);

  const content = useMemo((): React.ReactNode => {
    if (!confirmation) {
      return null;
    }

    if (confirmation.item.isInternal) {
      return <TransactionConfirmation confirmation={confirmation} />;
    }

    if (NEED_SIGN_CONFIRMATION.includes(confirmation.type)) {
      let account: AccountJson | undefined;
      let canSign = true;
      let isMessage = false;

      if (confirmation.type === "signingRequest") {
        const request = confirmation.item as SigningRequest;
        const _isMessage = isRawPayload(request.request.payload);

        account = request.account;
        canSign = !_isMessage || !account.isHardware;
        isMessage = _isMessage;
      } else if (
        confirmation.type === "evmSignatureRequest" ||
        confirmation.type === "evmSendTransactionRequest"
      ) {
        const request = confirmation.item as ConfirmationDefinitions[
          | "evmSignatureRequest"
          | "evmSendTransactionRequest"][0];

        account = request.payload.account;
        canSign = request.payload.canSign;
        isMessage = confirmation.type === "evmSignatureRequest";
      }

      if (account?.isReadOnly || !canSign) {
        return (
          <NotSupportConfirmation
            account={account}
            isMessage={isMessage}
            request={confirmation.item}
            type={confirmation.type}
          />
        );
      }
    }

    switch (confirmation.type) {
      case "addNetworkRequest":
        return (
          <AddNetworkConfirmation
            request={
              confirmation.item as ConfirmationDefinitions["addNetworkRequest"][0]
            }
          />
        );
      case "addTokenRequest":
        return (
          <AddTokenConfirmation
            request={
              confirmation.item as ConfirmationDefinitions["addTokenRequest"][0]
            }
          />
        );
      case "evmSignatureRequest":
        return (
          <EvmSignatureConfirmation
            request={
              confirmation.item as ConfirmationDefinitions["evmSignatureRequest"][0]
            }
            type={confirmation.type}
          />
        );
      case "evmSendTransactionRequest":
        return (
          <EvmTransactionConfirmation
            request={
              confirmation.item as ConfirmationDefinitions["evmSendTransactionRequest"][0]
            }
            type={confirmation.type}
          />
        );
      case "authorizeRequest":
        return (
          <AuthorizeConfirmation
            request={confirmation.item as AuthorizeRequest}
          />
        );
      case "metadataRequest":
        return (
          <MetadataConfirmation
            request={confirmation.item as MetadataRequest}
          />
        );
      case "signingRequest":
        return (
          <SignConfirmation request={confirmation.item as SigningRequest} />
        );
    }

    return null;
  }, [confirmation]);

  useEffect(() => {
    if (numberOfConfirmations) {
      if (index >= numberOfConfirmations) {
        setIndex(numberOfConfirmations - 1);
      }
    }
  }, [index, numberOfConfirmations]);

  return (
    <div className={className}>
      <ConfirmationHeader
        index={index}
        numberOfConfirmations={numberOfConfirmations}
        onClickNext={nextConfirmation}
        onClickPrev={prevConfirmation}
        title={t(titleMap[confirmation?.type] || "")}
      />
      {content}
    </div>
  );
};

const Confirmations = styled(Component)<Props>(
  ({ theme: { token } }: ThemeProps) => ({
    display: "flex",
    flexDirection: "column",
    height: "100%",

    ".confirmation-header": {
      paddingTop: token.sizeXS,
      paddingBottom: token.sizeXS,
      backgroundColor: "transparent",
      marginBottom: token.marginMD,

      h4: {
        marginBottom: 0,
      },
    },

    "--content-gap": token.sizeMD,

    ".confirmation-content": {
      flex: "1 1 auto",
      overflow: "auto",
      padding: `0 ${token.padding}px`,
      display: "flex",
      flexDirection: "column",
      gap: "var(--content-gap)",
      textAlign: "center",
    },

    ".__domain": {
      marginBottom: 0,
    },

    ".confirmation-footer": {
      display: "flex",
      flexWrap: "wrap",
      padding: token.padding,
      gap: token.sizeSM,
      marginBottom: token.margin,

      ".ant-btn": {
        flex: 1,

        "&.icon-btn": {
          flex: "0 0 52px",
        },
      },
    },

    ".title": {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      color: token.colorTextBase,
      fontWeight: token.fontWeightStrong,
    },

    ".description": {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
    },
  })
);

export default Confirmations;
