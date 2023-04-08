// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ConfirmationDefinitions,
  ConfirmationResult,
} from "@subwallet/extension-base/background/KoniTypes";
import ChainLogoMap from "@subwallet-webapp/assets/logo";
import { ConfirmationGeneralInfo } from "@subwallet-webapp/components";
import { useCopy } from "@subwallet-webapp/hooks";
import { completeConfirmation } from "@subwallet-webapp/messaging";
import { RootState } from "@subwallet-webapp/stores";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { detectThemeAvatar, toShort } from "@subwallet-webapp/util";
import {
  Button,
  Col,
  Field,
  Icon,
  Image,
  Row,
  Tooltip,
} from "@subwallet/react-ui";
import SwAvatar from "@subwallet/react-ui/es/sw-avatar";
import CN from "classnames";
import { CheckCircle, CopySimple, XCircle } from "phosphor-react";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";

interface Props extends ThemeProps {
  request: ConfirmationDefinitions["addTokenRequest"][0];
}

const handleConfirm = async ({
  id,
}: ConfirmationDefinitions["addTokenRequest"][0]) => {
  return await completeConfirmation("addTokenRequest", {
    id,
    isApproved: true,
  } as ConfirmationResult<boolean>);
};

const handleCancel = async ({
  id,
}: ConfirmationDefinitions["addTokenRequest"][0]) => {
  return await completeConfirmation("addTokenRequest", {
    id,
    isApproved: false,
  } as ConfirmationResult<boolean>);
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, request } = props;
  const {
    payload: { contractAddress, decimals, originChain, symbol, type },
  } = request;

  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const { t } = useTranslation();

  const { token } = useTheme() as Theme;

  const [loading, setLoading] = useState(false);

  const onCancel = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      handleCancel(request).finally(() => {
        setLoading(false);
      });
    }, 300);
  }, [request]);

  const onApprove = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      handleConfirm(request).finally(() => {
        setLoading(false);
      });
    }, 300);
  }, [request]);

  const onCopy = useCopy(contractAddress);

  return (
    <>
      <div className={CN(className, "confirmation-content")}>
        <ConfirmationGeneralInfo request={request} />
        <Field
          content={chainInfoMap[originChain].name}
          label={t<string>("Chain")}
          prefix={
            <Image
              height={token.fontSizeXL}
              shape={"circle"}
              src={ChainLogoMap[originChain]}
              width={token.fontSizeXL}
            />
          }
        />
        <Field content={type} label={t<string>("Token type")} />
        <Field
          content={toShort(contractAddress)}
          label={t<string>("Contract address")}
          prefix={
            <SwAvatar
              identPrefix={42}
              size={token.fontSizeXL}
              theme={detectThemeAvatar(contractAddress)}
              value={contractAddress}
            />
          }
          suffix={
            <Button
              className="copy-btn"
              icon={<Icon phosphorIcon={CopySimple} type="phosphor" />}
              onClick={onCopy}
              size="xs"
              type="ghost"
            />
          }
        />
        <Row gutter={token.margin}>
          <Col span={12}>
            <Tooltip placement="topLeft" title={t<string>("Symbol")}>
              <div>
                <Field
                  content={symbol}
                  placeholder={t<string>("Symbol")}
                  prefix={
                    <SwAvatar
                      identPrefix={42}
                      size={token.fontSizeXL}
                      theme={detectThemeAvatar(contractAddress)}
                      value={contractAddress}
                    />
                  }
                />
              </div>
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip placement="topLeft" title={t<string>("Decimals")}>
              <div>
                <Field
                  content={decimals === -1 ? "" : decimals}
                  placeholder={t<string>("Decimals")}
                />
              </div>
            </Tooltip>
          </Col>
        </Row>
      </div>
      <div className="confirmation-footer">
        <Button
          disabled={loading}
          icon={<Icon phosphorIcon={XCircle} weight="fill" />}
          onClick={onCancel}
          schema={"secondary"}
        >
          {t("Cancel")}
        </Button>
        <Button
          icon={<Icon phosphorIcon={CheckCircle} weight="fill" />}
          loading={loading}
          onClick={onApprove}
        >
          {t("Approve")}
        </Button>
      </div>
    </>
  );
};

const AddTokenConfirmation = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      "--content-gap": token.size,

      ".ant-field-container": {
        textAlign: "left",
        overflow: "unset",
      },

      ".copy-btn": {
        height: "auto",
      },
    };
  }
);

export default AddTokenConfirmation;
