// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import ChainLogoMap, { IconMap } from "@subwallet-webapp/assets/logo";
import { Layout, PageWrapper } from "@subwallet-webapp/components";
import CloseIcon from "@subwallet-webapp/components/Icon/CloseIcon";
import DualLogo from "@subwallet-webapp/components/Logo/DualLogo";
import QrScannerErrorNotice from "@subwallet-webapp/components/Qr/Scanner/ErrorNotice";
import { IMPORT_ACCOUNT_MODAL } from "@subwallet-webapp/constants/modal";
import useCompleteCreateAccount from "@subwallet-webapp/hooks/account/useCompleteCreateAccount";
import useGetDefaultAccountName from "@subwallet-webapp/hooks/account/useGetDefaultAccountName";
import useGoBackFromCreateAccount from "@subwallet-webapp/hooks/account/useGoBackFromCreateAccount";
import useScanAccountQr from "@subwallet-webapp/hooks/qr/useScanAccountQr";
import useAutoNavigateToCreatePassword from "@subwallet-webapp/hooks/router/useAutoNavigateToCreatePassword";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import {
  checkPublicAndPrivateKey,
  createAccountWithSecret,
} from "@subwallet-webapp/messaging";
import { ThemeProps } from "@subwallet-webapp/types";
import { QrAccount } from "@subwallet-webapp/types/scanner";
import { ValidateState } from "@subwallet-webapp/types/validator";
import { importQrScan } from "@subwallet-webapp/util/scanner/attach";
import {
  Form,
  Icon,
  Image,
  ModalContext,
  SwQrScanner,
} from "@subwallet/react-ui";
import CN from "classnames";
import { QrCode, Scan } from "phosphor-react";
import React, { useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type Props = ThemeProps;

const FooterIcon = <Icon phosphorIcon={QrCode} weight="fill" />;

const checkAccount = (qrAccount: QrAccount): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    checkPublicAndPrivateKey(qrAccount.genesisHash, qrAccount.content)
      .then(({ isEthereum, isValid }) => {
        if (isValid) {
          resolve(isEthereum);
        } else {
          reject(new Error("Invalid qr"));
        }
      })
      .catch((e: Error) => {
        reject(e);
      });
  });
};

const modalId = "import-qr-code-scanner-modal";

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();

  const { className } = props;
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const accountName = useGetDefaultAccountName();
  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);

  const { inactiveModal } = useContext(ModalContext);

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    (_account: QrAccount) => {
      setLoading(true);
      inactiveModal(modalId);
      setValidateState({
        message: "",
        status: "success",
      });

      setTimeout(() => {
        checkAccount(_account)
          .then((isEthereum) => {
            createAccountWithSecret({
              name: accountName,
              isAllow: true,
              secretKey: _account.content,
              publicKey: _account.genesisHash,
              isEthereum: isEthereum,
            })
              .then(({ errors, success }) => {
                if (success) {
                  setValidateState({});
                  onComplete();
                } else {
                  setValidateState({
                    message: errors[0].message,
                    status: "error",
                  });
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
          })
          .catch((error: Error) => {
            setValidateState({
              message: error.message,
              status: "error",
            });
            setLoading(false);
          });
      }, 300);
    },
    [accountName, onComplete, inactiveModal]
  );

  const { onClose, onError, onSuccess, openCamera } = useScanAccountQr(
    modalId,
    importQrScan,
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
        title={t("Import your wallet by QR")}
      >
        <div className={CN("container")}>
          <div className="sub-title">
            {t(
              "Please make sure that you have granted SubWallet the access to your device's camera."
            )}
          </div>
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
              linkIcon={<Icon phosphorIcon={Scan} size="md" />}
              rightLogo={
                <Image
                  height={56}
                  shape="squircle"
                  src={IconMap.__qr_code__}
                  width={56}
                />
              }
            />
          </div>
          <div className="instruction">
            <div className="instruction">
              <span>
                {t('Click the "Scan the QR code" button, or read ')}&nbsp;
              </span>
              <a className="link" href="#">
                {t("this instructions")}
              </a>
              <span>,&nbsp;</span>
              <span>{t("for more details.")}</span>
            </div>
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

const ImportQrCode = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
      color: token.colorLink,
      textDecoration: "underline",
    },
  };
});

export default ImportQrCode;
