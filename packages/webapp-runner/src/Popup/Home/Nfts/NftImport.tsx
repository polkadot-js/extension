// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainInfo } from "@subwallet/chain-list/types"
import {
  _getNftTypesSupportedByChain,
  _isChainTestNet,
  _parseMetadataForSmartContractAsset,
} from "@subwallet/extension-base/services/chain-service/utils"
import { isValidSubstrateAddress } from "@subwallet/extension-base/utils"
import {
  GeneralEmptyList,
  Layout,
  PageWrapper,
} from "@subwallet-webapp/components"
import { AddressInput } from "@subwallet-webapp/components/Field/AddressInput"
import { DataContext } from "@subwallet-webapp/contexts/DataContext"
import useNotification from "@subwallet-webapp/hooks/common/useNotification"
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation"
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate"
import useGetContractSupportedChains from "@subwallet-webapp/hooks/screen/nft/useGetContractSupportedChains"
import {
  upsertCustomToken,
  validateCustomToken,
} from "@subwallet-webapp/messaging"
import { Theme, ThemeProps } from "@subwallet-webapp/types"
import { ValidateStatus } from "@subwallet-webapp/types/validator"
import {
  BackgroundIcon,
  Form,
  Icon,
  Image,
  Input,
  NetworkItem,
  SelectModal,
  SettingItem,
} from "@subwallet/react-ui"
import { FormInstance } from "@subwallet/react-ui/es/form/hooks/useForm"
import { CheckCircle, Coin, PlusCircle } from "phosphor-react"
import { RuleObject } from "rc-field-form/lib/interface"
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import styled, { useTheme } from "styled-components"

import { isEthereumAddress } from "@polkadot/util-crypto"

import ChainLogoMap from "../../../assets/logo"

type Props = ThemeProps

interface NftImportFormType {
  contractAddress: string
  chain: string
  collectionName: string
  type: _AssetType
  symbol: string
}

interface ValidationInfo {
  status: ValidateStatus
  message?: string
}

interface NftTypeOption {
  label: string
  value: _AssetType
}

function getNftTypeSupported(chainInfo: _ChainInfo) {
  if (!chainInfo) {
    return []
  }

  const nftTypes = _getNftTypesSupportedByChain(chainInfo)
  const result: NftTypeOption[] = []

  nftTypes.forEach((nftType) => {
    result.push({
      label: nftType.toString(),
      value: nftType,
    })
  })

  return result
}

const renderEmpty = () => <GeneralEmptyList />

function Component({ className = "" }: Props): React.ReactElement<Props> {
  const { t } = useTranslation()
  const goBack = useDefaultNavigate().goBack
  const dataContext = useContext(DataContext)
  const { token } = useTheme() as Theme
  const showNotification = useNotification()

  const formRef = useRef<FormInstance<NftImportFormType>>(null)
  const chainInfoMap = useGetContractSupportedChains()
  const [selectedChain, setSelectedChain] = useState<string>("")
  const [selectedNftType, setSelectedNftType] = useState<string>("")
  const [contractValidation, setContractValidation] = useState<ValidationInfo>({
    status: "",
  })
  const [symbol, setSymbol] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const nftTypeOptions = useMemo(() => {
    return getNftTypeSupported(chainInfoMap[selectedChain])
  }, [chainInfoMap, selectedChain])

  const onSubmit = useCallback(() => {
    const formValues = formRef.current?.getFieldsValue() as NftImportFormType
    const formattedCollectionName = formValues.collectionName
      .replace(/ /g, "")
      .toUpperCase()

    setLoading(true)

    upsertCustomToken({
      originChain: formValues.chain,
      slug: "",
      name: formValues.collectionName,
      symbol: symbol !== "" ? symbol : formattedCollectionName,
      decimals: null,
      priceId: null,
      minAmount: null,
      assetType: formValues.type,
      metadata: _parseMetadataForSmartContractAsset(formValues.contractAddress),
      multiChainAsset: null,
      hasValue: _isChainTestNet(chainInfoMap[formValues.chain]),
    })
      .then((result) => {
        setLoading(false)

        if (result) {
          showNotification({
            message: t("Imported NFT successfully"),
          })
          goBack()
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
  }, [symbol, chainInfoMap, showNotification, t, goBack])

  const isSubmitDisabled = useCallback(() => {
    return (
      contractValidation.status === "" || contractValidation.status === "error"
    )
  }, [contractValidation.status])

  const onChangeChain = useCallback(
    (value: string) => {
      formRef.current?.setFieldValue("chain", value)
      const nftTypes = getNftTypeSupported(chainInfoMap[value])

      if (nftTypes.length === 1) {
        formRef.current?.setFieldValue("type", nftTypes[0].value)
        setSelectedNftType(nftTypes[0].value)
      } else {
        formRef.current?.resetFields(["type"])
        setSelectedNftType("")
      }

      formRef.current?.resetFields(["contractAddress", "collectionName"])
      setSelectedChain(value)
      setContractValidation({ status: "" })
    },
    [chainInfoMap]
  )

  const onChangeNftType = useCallback(
    (value: string) => {
      if (selectedNftType !== value) {
        formRef.current?.resetFields(["contractAddress", "collectionName"])
      }

      formRef.current?.setFieldValue("type", value as _AssetType)
      setSelectedNftType(value)
    },
    [selectedNftType]
  )

  const renderChainOption = useCallback(
    (chainInfo: _ChainInfo, selected: boolean) => {
      return (
        <NetworkItem
          name={chainInfo.name}
          networkKey={chainInfo.slug}
          networkMainLogoShape={"circle"}
          networkMainLogoSize={28}
          rightItem={
            selected && (
              <Icon
                customSize={"20px"}
                iconColor={token.colorSuccess}
                phosphorIcon={CheckCircle}
                type="phosphor"
                weight={"fill"}
              />
            )
          }
        />
      )
    },
    [token]
  )

  const renderNftTypeOption = useCallback(
    (nftType: NftTypeOption, selected: boolean) => {
      return (
        <SettingItem
          className="nft-type-item"
          leftItemIcon={
            <BackgroundIcon
              backgroundColor="var(--nft-type-icon-bg-color)"
              iconColor="var(--nft-type-icon-color)"
              phosphorIcon={Coin}
              size="sm"
              weight="fill"
            />
          }
          name={nftType.label}
          rightItem={
            selected && (
              <Icon
                iconColor="var(--nft-selected-icon-color)"
                phosphorIcon={CheckCircle}
                size="sm"
                weight="fill"
              />
            )
          }
        />
      )
    },
    []
  )

  const renderNftTypeSelected = useCallback((nftType: NftTypeOption) => {
    return <div className={"nft_import__selected_option"}>{nftType.label}</div>
  }, [])

  const renderChainSelected = useCallback((chainInfo: _ChainInfo) => {
    return <div className={"nft_import__selected_option"}>{chainInfo.name}</div>
  }, [])

  const originChainLogo = useCallback(() => {
    return (
      <Image
        height={token.fontSizeXL}
        shape={"circle"}
        src={ChainLogoMap[selectedChain]}
        width={token.fontSizeXL}
      />
    )
  }, [selectedChain, token.fontSizeXL])

  const collectionNameValidator = useCallback(
    (rule: RuleObject, value: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (value.length >= 3) {
          resolve()
        } else {
          reject(
            new Error(t("Collection name must have at least 3 characters"))
          )
        }
      })
    },
    [t]
  )

  const contractAddressValidator = useCallback(
    (rule: RuleObject, contractAddress: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const isValidEvmContract =
          [_AssetType.ERC721].includes(selectedNftType as _AssetType) &&
          isEthereumAddress(contractAddress)
        const isValidWasmContract =
          [_AssetType.PSP34].includes(selectedNftType as _AssetType) &&
          isValidSubstrateAddress(contractAddress)

        if (isValidEvmContract || isValidWasmContract) {
          setLoading(true)
          validateCustomToken({
            contractAddress,
            originChain: selectedChain,
            type: selectedNftType as _AssetType,
          })
            .then((validationResult) => {
              setLoading(false)

              if (validationResult.isExist) {
                setContractValidation({
                  status: "error",
                  message: t("Existed NFT"),
                })
                resolve()
              }

              if (validationResult.contractError) {
                setContractValidation({
                  status: "error",
                  message: t("Error validating this NFT"),
                })
                resolve()
              }

              if (
                !validationResult.isExist &&
                !validationResult.contractError
              ) {
                setContractValidation({
                  status: "success",
                })
                formRef.current?.setFieldValue(
                  "collectionName",
                  validationResult.name
                )
                setSymbol(validationResult.symbol)
                resolve()
              }
            })
            .catch(() => {
              setLoading(false)
              setContractValidation({
                status: "error",
                message: t("Error validating this NFT"),
              })
              resolve()
            })
        } else {
          setContractValidation({
            status: "error",
          })
          reject(t("Invalid contract address"))
        }
      })
    },
    [selectedChain, selectedNftType, t]
  )

  const isCollectionNameDisabled = useCallback(() => {
    if (
      contractValidation.status === "" ||
      contractValidation.status === "error"
    ) {
      return true
    }

    return selectedNftType === "" || selectedChain === ""
  }, [contractValidation, selectedChain, selectedNftType])

  const searchChain = useCallback(
    (chainInfo: _ChainInfo, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase()

      return chainInfo.name.toLowerCase().includes(searchTextLowerCase)
    },
    []
  )

  return (
    <PageWrapper
      className={className}
      resolve={dataContext.awaitStores(["nft"])}
    >
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        rightFooterButton={{
          disabled: isSubmitDisabled(),
          icon: <Icon phosphorIcon={PlusCircle} weight="fill" />,
          loading: loading,
          onClick: onSubmit,
          children: t("Import"),
        }}
        title={t<string>("Import NFT")}
      >
        <div className={"nft_import__container"}>
          <Form
            initialValues={{
              contractAddress: "",
              chain: "",
              collectionName: "",
              type: "",
            }}
            name={"nft-import"}
            ref={formRef}
          >
            <Form.Item name="chain">
              <SelectModal
                className={className}
                id="import-nft-select-chain"
                itemKey={"slug"}
                items={Object.values(chainInfoMap)}
                label={t<string>("Network")}
                onSelect={onChangeChain}
                placeholder={t("Select network")}
                prefix={selectedChain !== "" && originChainLogo()}
                renderItem={renderChainOption}
                renderSelected={renderChainSelected}
                renderWhenEmpty={renderEmpty}
                searchFunction={searchChain}
                searchPlaceholder={"Search network"}
                searchableMinCharactersCount={2}
                selected={selectedChain}
                title={t("Select network")}
              />
            </Form.Item>

            <Form.Item name="type">
              <SelectModal
                className={className}
                disabled={selectedChain === ""}
                id="import-nft-select-type"
                itemKey={"value"}
                items={nftTypeOptions}
                label={t<string>("NFT type")}
                onSelect={onChangeNftType}
                placeholder={t("Select NFT type")}
                renderItem={renderNftTypeOption}
                renderSelected={renderNftTypeSelected}
                selected={selectedNftType}
                title={t("Select NFT type")}
              />
            </Form.Item>

            <Form.Item
              name="contractAddress"
              rules={[{ validator: contractAddressValidator }]}
              statusHelpAsTooltip={true}
            >
              <AddressInput
                disabled={selectedNftType === ""}
                label={t<string>("NFT contract address")}
                showScanner={true}
              />
            </Form.Item>

            <Form.Item
              name="collectionName"
              rules={[{ validator: collectionNameValidator }]}
              statusHelpAsTooltip={true}
            >
              <Input
                disabled={isCollectionNameDisabled()}
                label={t<string>("NFT collection name")}
              />
            </Form.Item>

            <Form.Item
              help={contractValidation.message}
              validateStatus={contractValidation.status}
            />
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  )
}

const NftImport = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    ".nft_import__container": {
      marginTop: token.margin,
      paddingLeft: token.padding,
      paddingRight: token.padding,
    },

    ".nft_import__Qr": {
      cursor: "pointer",
    },

    ".ant-web3-block-right-item": {
      marginRight: 0,
    },

    ".ant-input-suffix": {
      marginRight: 0,
    },

    ".nft_import__selected_option": {
      color: token.colorTextHeading,
    },

    ".nft-type-item": {
      "--nft-type-icon-bg-color": token["orange-6"],
      "--nft-type-icon-color": token.colorWhite,
      "--nft-selected-icon-color": token.colorSuccess,

      ".ant-web3-block-right-item": {
        marginRight: 0,
      },
    },
  }
})

export default NftImport
