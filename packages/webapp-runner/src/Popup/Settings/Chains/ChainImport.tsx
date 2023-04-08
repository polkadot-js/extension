// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _CHAIN_VALIDATION_ERROR } from "@subwallet/extension-base/services/chain-service/handler/types"
import { _NetworkUpsertParams } from "@subwallet/extension-base/services/chain-service/types"
import { _generateCustomProviderKey } from "@subwallet/extension-base/services/chain-service/utils"
import { isUrl } from "@subwallet/extension-base/utils"
import { Layout, PageWrapper } from "@subwallet-webapp/components"
import InfoIcon from "@subwallet-webapp/components/Icon/InfoIcon"
import useNotification from "@subwallet-webapp/hooks/common/useNotification"
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation"
import useFocusFormItem from "@subwallet-webapp/hooks/form/useFocusFormItem"
import { upsertChain, validateCustomChain } from "@subwallet-webapp/messaging"
import { Theme, ThemeProps } from "@subwallet-webapp/types"
import { ValidateStatus } from "@subwallet-webapp/types/validator"
import {
  ActivityIndicator,
  Col,
  Form,
  Icon,
  Input,
  Row,
  Tooltip,
} from "@subwallet/react-ui"
import {
  FloppyDiskBack,
  Globe,
  ShareNetwork,
  WifiHigh,
  WifiSlash,
} from "phosphor-react"
import { RuleObject } from "rc-field-form/lib/interface"
import React, { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import styled, { useTheme } from "styled-components"

type Props = ThemeProps

interface ChainImportForm {
  provider: string
  name: string
  symbol: string
  decimals: number
  type: string
  addressPrefix: number
  paraId: number
  evmChainId: number
  blockExplorer: string
  crowdloanUrl: string
  priceId: string
}

interface ValidationInfo {
  status: ValidateStatus
  message?: string
}

function Component({ className = "" }: Props): React.ReactElement<Props> {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = useTheme() as Theme
  const showNotification = useNotification()
  const [form] = Form.useForm<ChainImportForm>()

  const [loading, setLoading] = useState(false)
  const [isPureEvmChain, setIsPureEvmChain] = useState(false)
  const [isShowConnectionStatus, setIsShowConnectionStatus] = useState(false)
  const [providerValidation, setProviderValidation] = useState<ValidationInfo>({
    status: "",
  })
  const [isValidating, setIsValidating] = useState(false)

  const [genesisHash, setGenesisHash] = useState("")
  const [existentialDeposit, setExistentialDeposit] = useState("0")

  const handleClickSubheaderButton = useCallback(() => {
    console.log("click subheader")
  }, [])

  const onBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const isSubmitDisabled = useCallback(() => {
    return providerValidation.status !== "success"
  }, [providerValidation.status])

  const onSubmit = useCallback(() => {
    setLoading(true)

    const blockExplorer = form.getFieldValue("blockExplorer") as string
    const crowdloanUrl = form.getFieldValue("crowdloanUrl") as string
    const provider = form.getFieldValue("provider") as string

    const decimals = form.getFieldValue("decimals") as number
    const symbol = form.getFieldValue("symbol") as string
    const addressPrefix = form.getFieldValue("addressPrefix") as number
    const paraId = form.getFieldValue("paraId") as number
    const evmChainId = form.getFieldValue("evmChainId") as number
    const name = form.getFieldValue("name") as string
    const priceId = form.getFieldValue("priceId") as string

    const newProviderKey = _generateCustomProviderKey(0)

    const params: _NetworkUpsertParams = {
      mode: "insert",
      chainEditInfo: {
        slug: "",
        currentProvider: newProviderKey,
        providers: { [newProviderKey]: provider },
        blockExplorer,
        crowdloanUrl,
        symbol,
        chainType: isPureEvmChain ? "EVM" : "Substrate",
        name,
        priceId,
      },
      chainSpec: {
        genesisHash,
        decimals,
        addressPrefix,
        paraId,
        evmChainId,
        existentialDeposit,
      },
    }

    upsertChain(params)
      .then((result) => {
        setLoading(false)

        if (result) {
          showNotification({
            message: t("Imported chain successfully"),
          })
          navigate(-1)
        } else {
          showNotification({
            message: t("An error occurred, please try again"),
          })
        }
      })
      .catch(() => {
        setLoading(false)
        showNotification({
          message: t("An error occurred, please try again"),
        })
      })
  }, [
    existentialDeposit,
    form,
    genesisHash,
    isPureEvmChain,
    navigate,
    showNotification,
    t,
  ])

  const blockExplorerValidator = useCallback(
    (rule: RuleObject, value: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (value.length === 0 || isUrl(value)) {
          resolve()
        } else {
          reject(new Error(t("Block explorer must be a valid URL")))
        }
      })
    },
    [t]
  )

  const crowdloanUrlValidator = useCallback(
    (rule: RuleObject, value: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (value.length === 0 || isUrl(value)) {
          resolve()
        } else {
          reject(new Error(t("Crowdloan URL must be a valid URL")))
        }
      })
    },
    [t]
  )

  const handleErrorMessage = useCallback(
    (errorCode: _CHAIN_VALIDATION_ERROR) => {
      switch (errorCode) {
        case _CHAIN_VALIDATION_ERROR.CONNECTION_FAILURE:
          return t("Cannot connect to this provider")
        case _CHAIN_VALIDATION_ERROR.EXISTED_PROVIDER:
          return t("This chain has already been added")
        case _CHAIN_VALIDATION_ERROR.EXISTED_CHAIN:
          return t("This chain has already been added")
        default:
          return t("Error validating this provider")
      }
    },
    [t]
  )

  const providerValidator = useCallback(
    (rule: RuleObject, provider: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (isUrl(provider)) {
          setIsShowConnectionStatus(true)
          setIsValidating(true)
          const parsedProvider = provider.replace(/ /g, "")

          validateCustomChain(parsedProvider)
            .then((result) => {
              setIsValidating(false)

              if (result.success) {
                setProviderValidation({ status: "success" })

                if (result.evmChainId) {
                  setIsPureEvmChain(true)
                  form.setFieldValue("evmChainId", result.evmChainId)
                  form.setFieldValue("type", "EVM")
                } else {
                  setIsPureEvmChain(false)
                  form.setFieldValue("addressPrefix", result.addressPrefix)
                  form.setFieldValue("paraId", result.paraId)
                  form.setFieldValue("type", "Substrate")
                  setGenesisHash(result.genesisHash)
                  setExistentialDeposit(result.existentialDeposit)
                }

                form.setFieldValue("decimals", result.decimals)
                form.setFieldValue("name", result.name)
                form.setFieldValue("symbol", result.symbol)

                resolve()
              }

              if (result.error) {
                if (result.evmChainId) {
                  setIsPureEvmChain(true)
                  form.setFieldValue("evmChainId", result.evmChainId)
                  form.setFieldValue("type", "EVM")
                } else {
                  setIsPureEvmChain(false)
                  form.setFieldValue("addressPrefix", result.addressPrefix)
                  form.setFieldValue("paraId", result.paraId)
                  form.setFieldValue("type", "Substrate")
                }

                form.setFieldValue("decimals", result.decimals)
                form.setFieldValue("name", result.name)
                form.setFieldValue("symbol", result.symbol)

                setProviderValidation({
                  status: "error",
                  message: handleErrorMessage(result.error),
                })

                reject(new Error(handleErrorMessage(result.error)))
              }
            })
            .catch(() => {
              setIsValidating(false)
              reject(new Error(t("Error validating this provider")))
              setProviderValidation({
                status: "error",
                message: t("Error validating this provider"),
              })
            })
        } else {
          reject(new Error(t("Provider URL is not valid")))
          setProviderValidation({ status: "" })
          setIsShowConnectionStatus(false)
        }
      })
    },
    [form, handleErrorMessage, t]
  )

  const providerSuffix = useCallback(() => {
    if (!isShowConnectionStatus) {
      return <></>
    }

    if (providerValidation.status === "success") {
      return (
        <Icon
          customSize={"20px"}
          iconColor={token.colorSuccess}
          phosphorIcon={WifiHigh}
          type={"phosphor"}
          weight={"bold"}
        />
      )
    }

    if (isValidating) {
      return <ActivityIndicator size={"20px"} />
    }

    if (providerValidation.status === "error") {
      return (
        <Icon
          customSize={"20px"}
          iconColor={token["gray-4"]}
          phosphorIcon={WifiSlash}
          type={"phosphor"}
          weight={"bold"}
        />
      )
    }

    return <></>
  }, [isShowConnectionStatus, isValidating, providerValidation.status, token])

  useFocusFormItem(form, "provider")

  return (
    <PageWrapper className={`chain_import ${className}`}>
      <Layout.WithSubHeaderOnly
        leftFooterButton={{
          onClick: onBack,
          children: "Cancel",
        }}
        onBack={onBack}
        rightFooterButton={{
          block: true,
          disabled: isSubmitDisabled(),
          icon: (
            <Icon
              phosphorIcon={FloppyDiskBack}
              type="phosphor"
              weight={"fill"}
            />
          ),
          loading: loading,
          onClick: onSubmit,
          children: "Save",
        }}
        subHeaderIcons={[
          {
            icon: <InfoIcon />,
            onClick: handleClickSubheaderButton,
          },
        ]}
        title={t<string>("Import chain")}
      >
        <div className={"chain_import__container"}>
          <div className={"chain_import__header_info"}>
            {t(
              "Currently support WSS provider for Substrate networks and HTTP provider for EVM network"
            )}
          </div>
          <Form disabled={loading} form={form}>
            <div className={"chain_import__attributes_container"}>
              <Tooltip placement={"topLeft"} title={t("Provider URL")}>
                <div>
                  <Form.Item
                    name={"provider"}
                    rules={[{ validator: providerValidator }]}
                    statusHelpAsTooltip={true}
                    validateTrigger={["onBlur"]}
                  >
                    <Input
                      disabled={isValidating}
                      placeholder={t("Provider URL")}
                      prefix={
                        <Icon
                          customSize={"24px"}
                          iconColor={token["gray-4"]}
                          phosphorIcon={ShareNetwork}
                          type={"phosphor"}
                          weight={"bold"}
                        />
                      }
                      suffix={providerSuffix()}
                    />
                  </Form.Item>
                </div>
              </Tooltip>

              <Row gutter={token.paddingSM}>
                <Col span={16}>
                  <Tooltip placement={"topLeft"} title={t("Chain name")}>
                    <div>
                      <Form.Item name={"name"}>
                        <Input
                          disabled={true}
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
                      </Form.Item>
                    </div>
                  </Tooltip>
                </Col>
                <Col span={8}>
                  <Tooltip placement={"topLeft"} title={t("Symbol")}>
                    <div>
                      <Form.Item name={"symbol"}>
                        <Input disabled={true} placeholder={t("Symbol")} />
                      </Form.Item>
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Row gutter={token.paddingSM}>
                <Col span={12}>
                  <Tooltip placement={"topLeft"} title={t("Price Id")}>
                    <div>
                      <Form.Item name={"priceId"}>
                        <Input placeholder={t("Price Id")} />
                      </Form.Item>
                    </div>
                  </Tooltip>
                </Col>

                <Col span={12}>
                  <Tooltip placement={"topLeft"} title={t("Chain type")}>
                    <div>
                      <Form.Item name={"type"}>
                        <Input disabled={true} placeholder={t("Chain type")} />
                      </Form.Item>
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Tooltip placement={"topLeft"} title={t("Block explorer")}>
                <div>
                  <Form.Item
                    name={"blockExplorer"}
                    rules={[{ validator: blockExplorerValidator }]}
                    statusHelpAsTooltip={true}
                  >
                    <Input placeholder={t("Block explorer")} />
                  </Form.Item>
                </div>
              </Tooltip>

              <Tooltip placement={"topLeft"} title={t("Crowdloan URL")}>
                <div>
                  <Form.Item
                    name={"crowdloanUrl"}
                    rules={[{ validator: crowdloanUrlValidator }]}
                    statusHelpAsTooltip={true}
                  >
                    <Input placeholder={t("Crowdloan URL")} />
                  </Form.Item>
                </div>
              </Tooltip>
            </div>
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  )
}

const ChainImport = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    ".chain_import__header_info": {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      fontWeight: token.bodyFontWeight,
      width: "100%",
      textAlign: "center",
      marginBottom: token.margin,
      marginTop: 22,
    },

    ".chain_import__container": {
      marginRight: token.margin,
      marginLeft: token.margin,
    },

    ".chain_import__attributes_container": {
      display: "flex",
      flexDirection: "column",
      gap: token.marginSM,
    },

    ".ant-input-container .ant-input-wrapper": {
      overflow: "hidden",
    },

    ".ant-form-item": {
      marginBottom: 0,
    },

    ".ant-input-container.-disabled .ant-input": {
      cursor: "default",
    },

    ".ant-input-container.-disabled": {
      cursor: "default",
    },

    ".ant-form-item-with-help .ant-form-item-explain": {
      paddingBottom: 0,
    },

    ".ant-input-container .ant-input-suffix": {
      marginRight: 0,
    },
  }
})

export default ChainImport
