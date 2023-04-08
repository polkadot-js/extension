// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ExtrinsicType,
  NftCollection,
  NftItem,
} from "@subwallet/extension-base/background/KoniTypes";
import { SWTransactionResponse } from "@subwallet/extension-base/services/transaction-service/types";
import { isSameAddress } from "@subwallet/extension-base/utils";
import {
  AddressInput,
  ChainSelector,
  PageWrapper,
} from "@subwallet-webapp/components";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import {
  useFocusFormItem,
  usePreCheckReadOnly,
  useSelector,
} from "@subwallet-webapp/hooks";
import {
  evmNftSubmitTransaction,
  substrateNftSubmitTransaction,
} from "@subwallet-webapp/messaging";
import {
  FormCallbacks,
  FormFieldData,
  FormInstance,
  FormRule,
  ThemeProps,
} from "@subwallet-webapp/types";
import { reformatAddress, simpleCheckForm } from "@subwallet-webapp/util";
import { Button, Form, Icon, Image, Typography } from "@subwallet/react-ui";
import CN from "classnames";
import { ArrowCircleRight } from "phosphor-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

import { nftParamsHandler } from "../helper";
import { FreeBalance, TransactionContent, TransactionFooter } from "../parts";
import { TransactionContext, TransactionFormBaseProps } from "../Transaction";

type Props = ThemeProps;

enum FormFieldName {
  TO = "to",
}

interface SendNFTFormProps extends TransactionFormBaseProps {
  [FormFieldName.TO]: string;
}

const DEFAULT_COLLECTION: NftCollection = {
  collectionId: "unknown",
  chain: "unknown",
};

const DEFAULT_ITEM: NftItem = {
  collectionId: "unknown",
  chain: "unknown",
  owner: "unknown",
  id: "unknown",
};

const Component: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    chain: nftChain = "",
    collectionId,
    itemId,
    owner = "",
  } = useParams();

  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { nftCollections, nftItems } = useSelector((state) => state.nft);

  const nftItem = useMemo(
    (): NftItem =>
      nftItems.find(
        (item) =>
          isSameAddress(item.owner, owner) &&
          nftChain === item.chain &&
          item.collectionId === collectionId &&
          item.id === itemId
      ) || DEFAULT_ITEM,
    [collectionId, itemId, nftChain, nftItems, owner]
  );

  const collectionInfo = useMemo(
    (): NftCollection =>
      nftCollections.find(
        (item) => nftChain === item.chain && item.collectionId === collectionId
      ) || DEFAULT_COLLECTION,
    [collectionId, nftChain, nftCollections]
  );

  const chainInfo = useMemo(
    () => chainInfoMap[nftChain],
    [chainInfoMap, nftChain]
  );

  const { chain, from, onDone, setChain, setFrom, setTransactionType } =
    useContext(TransactionContext);

  const [form] = Form.useForm<SendNFTFormProps>();
  const formDefault = useMemo(() => {
    return {
      from,
      chain,
      to: "",
    };
  }, [chain, from]);

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const recipientValidator = useCallback(
    ({ getFieldValue }: FormInstance<SendNFTFormProps>) => {
      const from = getFieldValue("from") as string;

      return {
        validator: (
          rule: FormRule,
          _recipientAddress: string
        ): Promise<void> => {
          if (!_recipientAddress) {
            return Promise.reject(t("The recipient address is required"));
          }

          try {
            reformatAddress(_recipientAddress);
          } catch (e) {
            return Promise.reject(t("Invalid recipient address"));
          }

          if (isSameAddress(_recipientAddress, from)) {
            return Promise.reject(
              t(
                "The recipient address can not be the same as the sender address"
              )
            );
          }

          if (
            isEthereumAddress(_recipientAddress) !== isEthereumAddress(from)
          ) {
            const message = isEthereumAddress(from)
              ? t("Receive address must be of evm account.")
              : t("Receive address must be of substrate account.");

            return Promise.reject(message);
          }

          return Promise.resolve();
        },
      };
    },
    [t]
  );

  const onFieldsChange: FormCallbacks<SendNFTFormProps>["onFieldsChange"] =
    useCallback(
      (changedFields: FormFieldData[], allFields: FormFieldData[]) => {
        const { error } = simpleCheckForm(allFields);

        setIsDisable(error);
      },
      []
    );

  // Submit transaction
  const onSubmit: FormCallbacks<SendNFTFormProps>["onFinish"] = useCallback(
    (values: SendNFTFormProps) => {
      const isEthereumInterface = isEthereumAddress(from);
      const { to } = values;
      const params = nftParamsHandler(nftItem, chain);
      let sendPromise: Promise<SWTransactionResponse>;

      if (isEthereumInterface) {
        // Send NFT with EVM interface
        sendPromise = evmNftSubmitTransaction({
          senderAddress: from,
          networkKey: chain,
          recipientAddress: to,
          nftItemName: nftItem?.name,
          params,
          nftItem,
        });
      } else {
        // Send NFT with substrate interface
        sendPromise = substrateNftSubmitTransaction({
          recipientAddress: to,
          senderAddress: from,
          nftItemName: nftItem?.name,
          params,
        });
      }

      setLoading(true);

      setTimeout(() => {
        // Handle transfer action
        sendPromise
          .then((rs) => {
            const { errors, extrinsicHash, warnings } = rs;

            if (errors.length || warnings.length) {
              setErrors(errors.map((e) => e.message));
              setWarnings(warnings.map((w) => w.message));
            } else if (extrinsicHash) {
              onDone(extrinsicHash);
            }
          })
          .catch((e: Error) => {
            setErrors([e.message]);
          })
          .finally(() => {
            setLoading(false);
          });
      }, 300);
    },
    [chain, from, nftItem, onDone]
  );

  const preCheckReadOnly = usePreCheckReadOnly(from);

  useEffect(() => {
    setTransactionType(ExtrinsicType.SEND_NFT);
    setChain(nftChain);
    setFrom(owner);
  }, [nftChain, owner, setChain, setFrom, setTransactionType]);

  useEffect(() => {
    if (nftItem === DEFAULT_ITEM || collectionInfo === DEFAULT_COLLECTION) {
      navigate("/home/nfts/collections");
    }
  }, [collectionInfo, navigate, nftItem]);

  // Focus to the first field
  useFocusFormItem(form, "to");

  return (
    <>
      <TransactionContent className={CN("-transaction-content")}>
        <div className={"nft_item_detail text-center"}>
          <Image height={120} src={nftItem.image} />
          <Typography.Title level={5}>{nftItem.name}</Typography.Title>
        </div>

        <Form
          className={"form-container form-space-sm"}
          form={form}
          initialValues={formDefault}
          onFieldsChange={onFieldsChange}
          onFinish={onSubmit}
        >
          <Form.Item
            name={"to"}
            rules={[recipientValidator]}
            statusHelpAsTooltip={true}
            validateTrigger="onBlur"
          >
            <AddressInput
              autoReformatValue
              label={t("Send to account")}
              showScanner={true}
            />
          </Form.Item>

          <Form.Item>
            <ChainSelector
              disabled={true}
              items={
                chainInfo
                  ? [{ name: chainInfo.name, slug: chainInfo.slug }]
                  : []
              }
              label={t("Network")}
              value={collectionInfo.chain}
            />
          </Form.Item>
        </Form>

        <FreeBalance address={from} chain={chain} />
      </TransactionContent>
      <TransactionFooter
        className={"send-nft-transaction-footer"}
        errors={errors}
        warnings={warnings}
      >
        <Button
          disabled={isDisable}
          icon={<Icon phosphorIcon={ArrowCircleRight} weight={"fill"} />}
          loading={loading}
          onClick={preCheckReadOnly(form.submit)}
        >
          {t("Next")}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={className}
      resolve={dataContext.awaitStores(["nft"])}
    >
      <Component />
    </PageWrapper>
  );
};

const SendNFT = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",

    ".nft_item_detail h5": {
      marginTop: token.marginXS,
      marginBottom: token.margin,
    },
  };
});

export default SendNFT;
