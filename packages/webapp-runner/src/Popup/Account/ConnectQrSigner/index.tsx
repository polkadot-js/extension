// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from "@subwallet-webapp/components";
import CloseIcon from "@subwallet-webapp/components/Icon/CloseIcon";
import DualLogo from "@subwallet-webapp/components/Logo/DualLogo";
import QrScannerErrorNotice from "@subwallet-webapp/components/Qr/Scanner/ErrorNotice";
import { ATTACH_ACCOUNT_MODAL } from "@subwallet-webapp/constants/modal";
import useCompleteCreateAccount from "@subwallet-webapp/hooks/account/useCompleteCreateAccount";
import useGetDefaultAccountName from "@subwallet-webapp/hooks/account/useGetDefaultAccountName";
import useGoBackFromCreateAccount from "@subwallet-webapp/hooks/account/useGoBackFromCreateAccount";
import useScanAccountQr from "@subwallet-webapp/hooks/qr/useScanAccountQr";
import useAutoNavigateToCreatePassword from "@subwallet-webapp/hooks/router/useAutoNavigateToCreatePassword";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import { createAccountExternalV2 } from "@subwallet-webapp/messaging";
import { ThemeProps } from "@subwallet-webapp/types";
import { QrAccount } from "@subwallet-webapp/types/scanner";
import { ValidateState } from "@subwallet-webapp/types/validator";
import { qrSignerScan } from "@subwallet-webapp/util/scanner/attach";
import {
  Form,
  Icon,
  Image,
  ModalContext,
  SwQrScanner,
} from "@subwallet/react-ui";
import CN from "classnames";
import { QrCode } from "phosphor-react";
import React, { useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import ChainLogoMap from "../../../assets/logo";

const FooterIcon = <Icon phosphorIcon={QrCode} weight="fill" />;

interface Props extends ThemeProps {
  title: string;
  subTitle: string;
  description: string;
  instructionUrl: string;
  logoUrl: string;
}

const modalId = "attach-qr-signer-scanner-modal";

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();

  const { className, description, instructionUrl, logoUrl, subTitle, title } =
    props;
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(ATTACH_ACCOUNT_MODAL);

  const accountName = useGetDefaultAccountName();
  const { inactiveModal } = useContext(ModalContext);

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    (account: QrAccount) => {
      setLoading(true);
      inactiveModal(modalId);
      setValidateState({
        message: "",
        status: "validating",
      });

      setTimeout(() => {
        createAccountExternalV2({
          name: accountName,
          address: account.content,
          genesisHash: "",
          isEthereum: account.isEthereum,
          isAllowed: true,
          isReadOnly: false,
        })
          .then((errors) => {
            if (errors.length) {
              setValidateState({
                message: errors[0].message,
                status: "error",
              });
            } else {
              setValidateState({});
              onComplete();
            }
          })
          .catch((error: Error) => {
            setValidateState({
              message: error.message,
              status: "error",
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }, 300);
    },
    [accountName, onComplete, inactiveModal]
  );

  const { onClose, onError, onSuccess, openCamera } = useScanAccountQr(
    modalId,
    qrSignerScan,
    setValidateState,
    onSubmit
  );

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: loading ? t("Creating") : t("Scan the QR code"),
          icon: FooterIcon,
          onClick: openCamera,
          loading: loading,
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome,
          },
        ]}
        title={title}
      >
        <div className={CN("container")}>
          <div className="sub-title">{subTitle}</div>
          <div className="logo">
            <DualLogo
              leftLogo={
                <Image
                  height={56}
                  shape="squircle"
                  src={ChainLogoMap.subwallet}
                  width={56}
                />
              }
              rightLogo={
                <Image height={56} shape="squircle" src={logoUrl} width={56} />
              }
            />
          </div>
          <div className="instruction">
            <span>{t("Follow")}&nbsp;</span>
            <a className="link" href={instructionUrl}>
              {t("this instructions")}
            </a>
            <span>,&nbsp;</span>
            <span>{description}</span>
          </div>
          <Form.Item
            help={validateState.message}
            validateStatus={validateState.status}
          />
          <SwQrScanner
            className={className}
            id={modalId}
            isError={!!validateState.status}
            onClose={onClose}
            onError={onError}
            onSuccess={onSuccess}
            overlay={
              validateState.message && (
                <QrScannerErrorNotice message={validateState.message} />
              )
            }
          />
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ConnectQrSigner = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".container": {
        padding: token.padding,
      },

      ".sub-title": {
        padding: `0 ${token.padding}px`,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6,
        color: token.colorTextDescription,
        textAlign: "center",
      },

      ".logo": {
        margin: `${token.controlHeightLG}px 0`,
        "--logo-size": token.controlHeightLG + token.controlHeightXS,
      },

      ".instruction": {
        padding: `0 ${token.padding}px`,
        marginBottom: token.margin,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6,
        color: token.colorTextDescription,
        textAlign: "center",
      },

      ".link": {
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6,
        color: token.colorLink,
        textDecoration: "underline",
      },
    };
  }
);

export default ConnectQrSigner;
