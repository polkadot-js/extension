// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ConfirmationDefinitions,
  ConfirmationResult,
} from "@subwallet/extension-base/background/KoniTypes";
import { ConfirmationGeneralInfo } from "@subwallet-webapp/components";
import { completeConfirmation } from "@subwallet-webapp/messaging";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { Button, Col, Field, Icon, Row, Tooltip } from "@subwallet/react-ui";
import CN from "classnames";
import { CheckCircle, Globe, ShareNetwork, XCircle } from "phosphor-react";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";

interface Props extends ThemeProps {
  request: ConfirmationDefinitions["addNetworkRequest"][0];
}

const handleConfirm = async ({
  id,
}: ConfirmationDefinitions["addNetworkRequest"][0]) => {
  return await completeConfirmation("addNetworkRequest", {
    id,
    isApproved: true,
  } as ConfirmationResult<null>);
};

const handleCancel = async ({
  id,
}: ConfirmationDefinitions["addNetworkRequest"][0]) => {
  return await completeConfirmation("addNetworkRequest", {
    id,
    isApproved: false,
  } as ConfirmationResult<null>);
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, request } = props;
  const {
    payload: { chainEditInfo, chainSpec },
  } = request;

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

  return (
    <>
      <div className={CN(className, "confirmation-content")}>
        <ConfirmationGeneralInfo request={request} />
        <Tooltip placement="topLeft" title={t<string>("Provider URL")}>
          <div>
            <Field
              content={chainEditInfo.providers[chainEditInfo.currentProvider]}
              placeholder={t<string>("Provider URL")}
              prefix={
                <Icon
                  customSize={"24px"}
                  iconColor={token["gray-4"]}
                  phosphorIcon={ShareNetwork}
                  type={"phosphor"}
                  weight={"bold"}
                />
              }
            />
          </div>
        </Tooltip>
        <Row gutter={token.paddingSM}>
          <Col span={16}>
            <Tooltip placement="topLeft" title={t<string>("Chain name")}>
              <div>
                <Field
                  content={chainEditInfo.name || ""}
                  placeholder={t("Chain name")}
                  prefix={
                    <Icon
                      customSize={"24px"}
                      iconColor={token["gray-4"]}
                      phosphorIcon={Globe}
                      type={"phosphor"}
                      weight={"bold"}
                    />
                  }
                />
              </div>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip placement="topLeft" title={t<string>("Symbol")}>
              <div>
                <Field
                  content={chainEditInfo.symbol || ""}
                  placeholder={t("Symbol")}
                />
              </div>
            </Tooltip>
          </Col>
        </Row>
        <Row gutter={token.paddingSM}>
          <Col span={12}>
            <Tooltip placement="topLeft" title={t<string>("Decimals")}>
              <div>
                <Field
                  content={chainSpec?.decimals || 0}
                  placeholder={t("Decimals")}
                />
              </div>
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip placement="topLeft" title={t<string>("Chain ID")}>
              <div>
                <Field
                  content={chainSpec?.evmChainId || 0}
                  placeholder={t("Chain ID")}
                />
              </div>
            </Tooltip>
          </Col>
        </Row>
        <Tooltip placement="topLeft" title={t<string>("Chain type")}>
          <div>
            <Field
              content={chainEditInfo.chainType}
              placeholder={t("Chain type")}
            />
          </div>
        </Tooltip>
        <Tooltip placement="topLeft" title={t<string>("Block explorer")}>
          <div>
            <Field
              content={chainEditInfo.blockExplorer}
              placeholder={t("Block explorer")}
            />
          </div>
        </Tooltip>
        <Tooltip placement="topLeft" title={t<string>("Crowdloan URL")}>
          <div>
            <Field
              content={chainEditInfo.crowdloanUrl}
              placeholder={t("Crowdloan URL")}
            />
          </div>
        </Tooltip>
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

const AddNetworkConfirmation = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      "--content-gap": token.size,

      ".ant-field-container": {
        textAlign: "left",
        overflow: "unset",
      },
    };
  }
);

export default AddNetworkConfirmation;
