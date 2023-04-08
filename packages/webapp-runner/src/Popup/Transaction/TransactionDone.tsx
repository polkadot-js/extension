// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import TransactionContent from "@subwallet-webapp/Popup/Transaction/parts/TransactionContent";
import TransactionFooter from "@subwallet-webapp/Popup/Transaction/parts/TransactionFooter";
import { ThemeProps } from "@subwallet-webapp/types";
import { Button, PageIcon } from "@subwallet/react-ui";
import { CheckCircle } from "phosphor-react";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

type Props = ThemeProps;

// Todo: move this to utils and reuse in extension-base/src/services/transaction-service/index.ts
// function getTransactionLink (chainInfo: _ChainInfo | undefined, extrinsicHash: string, chainType: 'ethereum' | 'substrate'): string | undefined {
//   if (!chainInfo) {
//     return undefined;
//   }
//
//   if (chainType === 'ethereum') {
//     const explorerLink = chainInfo?.evmInfo?.blockExplorer;
//
//     if (explorerLink) {
//       return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}tx/${extrinsicHash}`);
//     }
//   } else {
//     const explorerLink = chainInfo?.substrateInfo?.blockExplorer;
//
//     if (explorerLink) {
//       return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}extrinsic/${extrinsicHash}`);
//     }
//   }
//
//   return undefined;
// }

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chain, extrinsicHash } = useParams<{
    chain: string;
    extrinsicHash: string;
  }>();

  const viewInExplorer = useCallback(() => {
    if (chain && extrinsicHash) {
      navigate(`/home/history/${chain}/${extrinsicHash}`);
    } else {
      navigate("/home/history");
    }
  }, [chain, extrinsicHash, navigate]);

  const goHome = useCallback(() => {
    navigate("/home/tokens");
  }, [navigate]);

  return (
    <>
      <TransactionContent>
        <div className={className}>
          <div className="page-icon">
            <PageIcon
              color="var(--page-icon-color)"
              iconProps={{
                weight: "fill",
                phosphorIcon: CheckCircle,
              }}
            />
          </div>
          <div className="title">{t("You’re all done!")}</div>
          <div className="description">
            {t(
              "Your request has been sent. You can track its progress on the Transaction History page."
            )}
          </div>
        </div>
      </TransactionContent>
      <TransactionFooter errors={[]} warnings={[]}>
        <Button
          block={true}
          className={"full-width"}
          onClick={viewInExplorer}
          schema="secondary"
        >
          {t("View transaction")}
        </Button>
        <Button block={true} className={"full-width"} onClick={goHome}>
          {t("Back to home")}
        </Button>
      </TransactionFooter>
    </>
  );
};

const TransactionDone = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      padding: `0 ${token.padding}px`,
      textAlign: "center",

      ".page-icon": {
        display: "flex",
        justifyContent: "center",
        marginTop: token.margin,
        marginBottom: token.margin,
        "--page-icon-color": token.colorSecondary,
      },

      ".title": {
        marginTop: token.margin,
        marginBottom: token.margin,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase,
      },

      ".description": {
        padding: `0 ${token.controlHeightLG - token.padding}px`,
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextDescription,
        textAlign: "center",
      },

      ".and-more": {
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextDescription,

        ".highlight": {
          color: token.colorTextBase,
        },
      },
    };
  }
);

export default TransactionDone;
