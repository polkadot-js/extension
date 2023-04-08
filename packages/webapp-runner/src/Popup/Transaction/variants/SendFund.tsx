// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  _AssetRef,
  _AssetType,
  _ChainAsset,
  _ChainInfo,
  _MultiChainAsset,
} from "@subwallet/chain-list/types";
import { AssetSetting } from "@subwallet/extension-base/background/KoniTypes";
import { AccountJson } from "@subwallet/extension-base/background/types";
import { _ChainState } from "@subwallet/extension-base/services/chain-service/types";
import {
  _getAssetDecimals,
  _getOriginChainOfAsset,
  _isChainEvmCompatible,
} from "@subwallet/extension-base/services/chain-service/utils";
import { SWTransactionResponse } from "@subwallet/extension-base/services/transaction-service/types";
import { AccountSelector } from "@subwallet-webapp/components/Field/AccountSelector";
import { AddressInput } from "@subwallet-webapp/components/Field/AddressInput";
import AmountInput from "@subwallet-webapp/components/Field/AmountInput";
import { ChainSelector } from "@subwallet-webapp/components/Field/ChainSelector";
import {
  TokenItemType,
  TokenSelector,
} from "@subwallet-webapp/components/Field/TokenSelector";
import {
  useHandleSubmitTransaction,
  usePreCheckReadOnly,
  useSelector,
} from "@subwallet-webapp/hooks";
import {
  getFreeBalance,
  makeCrossChainTransfer,
  makeTransfer,
} from "@subwallet-webapp/messaging";
import FreeBalance from "@subwallet-webapp/Popup/Transaction/parts/FreeBalance";
import TransactionContent from "@subwallet-webapp/Popup/Transaction/parts/TransactionContent";
import TransactionFooter from "@subwallet-webapp/Popup/Transaction/parts/TransactionFooter";
import {
  TransactionContext,
  TransactionFormBaseProps,
} from "@subwallet-webapp/Popup/Transaction/Transaction";
import { RootState } from "@subwallet-webapp/stores";
import { FormCallbacks, Theme, ThemeProps } from "@subwallet-webapp/types";
import { SendFundParam } from "@subwallet-webapp/types/navigation";
import { ChainItemType } from "@subwallet-webapp/types/network";
import { findAccountByAddress } from "@subwallet-webapp/util";
import { findNetworkJsonByGenesisHash } from "@subwallet-webapp/util/chain/getNetworkJsonByGenesisHash";
import { Button, Form, Icon, Input } from "@subwallet/react-ui";
import { Rule } from "@subwallet/react-ui/es/form";
import BigN from "bignumber.js";
import CN from "classnames";
import { PaperPlaneTilt } from "phosphor-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import styled from "styled-components";

import { isAddress, isEthereumAddress } from "@polkadot/util-crypto";

interface TransferFormProps extends TransactionFormBaseProps {
  to: string;
  destChain: string;
  value: string;
}

type Props = ThemeProps;

function isAssetTypeValid(
  chainAsset: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>,
  isAccountEthereum: boolean
) {
  return (
    _isChainEvmCompatible(chainInfoMap[chainAsset.originChain]) ===
    isAccountEthereum
  );
}

function getTokenItems(
  address: string,
  accounts: AccountJson[],
  chainInfoMap: Record<string, _ChainInfo>,
  chainStateMap: Record<string, _ChainState>,
  assetRegistry: Record<string, _ChainAsset>,
  assetSettingMap: Record<string, AssetSetting>,
  multiChainAssetMap: Record<string, _MultiChainAsset>,
  tokenGroupSlug?: string // is ether a token slug or a multiChainAsset slug
): TokenItemType[] {
  const account = findAccountByAddress(accounts, address);

  if (!account) {
    return [];
  }

  const ledgerNetwork = findNetworkJsonByGenesisHash(
    chainInfoMap,
    account.originGenesisHash
  )?.slug;
  const isAccountEthereum = isEthereumAddress(address);
  const isSetTokenSlug = !!tokenGroupSlug && !!assetRegistry[tokenGroupSlug];
  const isSetMultiChainAssetSlug =
    !!tokenGroupSlug && !!multiChainAssetMap[tokenGroupSlug];

  if (tokenGroupSlug) {
    if (!(isSetTokenSlug || isSetMultiChainAssetSlug)) {
      return [];
    }

    const chainAsset = assetRegistry[tokenGroupSlug];
    const isValidLedger = ledgerNetwork
      ? ledgerNetwork === chainAsset.originChain
      : true;

    if (isSetTokenSlug) {
      if (
        isAssetTypeValid(chainAsset, chainInfoMap, isAccountEthereum) &&
        isValidLedger
      ) {
        const { name, originChain, slug, symbol } =
          assetRegistry[tokenGroupSlug];

        return [
          {
            name,
            slug,
            symbol,
            originChain,
          },
        ];
      } else {
        return [];
      }
    }
  }

  const items: TokenItemType[] = [];

  Object.values(assetRegistry).forEach((chainAsset) => {
    const isValidLedger = ledgerNetwork
      ? ledgerNetwork === chainAsset.originChain
      : true;

    if (
      !(
        isAssetTypeValid(chainAsset, chainInfoMap, isAccountEthereum) &&
        isValidLedger
      )
    ) {
      return;
    }

    if (isSetMultiChainAssetSlug) {
      if (chainAsset.multiChainAsset === tokenGroupSlug) {
        items.push({
          name: chainAsset.name,
          slug: chainAsset.slug,
          symbol: chainAsset.symbol,
          originChain: chainAsset.originChain,
        });
      }
    } else {
      items.push({
        name: chainAsset.name,
        slug: chainAsset.slug,
        symbol: chainAsset.symbol,
        originChain: chainAsset.originChain,
      });
    }
  });

  return items;
}

function getTokenAvailableDestinations(
  tokenSlug: string,
  xcmRefMap: Record<string, _AssetRef>,
  chainInfoMap: Record<string, _ChainInfo>
): ChainItemType[] {
  if (!tokenSlug) {
    return [];
  }

  const result: ChainItemType[] = [];
  const originChain = chainInfoMap[_getOriginChainOfAsset(tokenSlug)];

  // Firstly, push the originChain of token
  result.push({
    name: originChain.name,
    slug: originChain.slug,
  });

  Object.values(xcmRefMap).forEach((xcmRef) => {
    if (xcmRef.srcAsset === tokenSlug) {
      const destinationChain = chainInfoMap[xcmRef.destChain];

      result.push({
        name: destinationChain.name,
        slug: destinationChain.slug,
      });
    }
  });

  return result;
}

const _SendFund = ({ className = "" }: Props): React.ReactElement<Props> => {
  const { t } = useTranslation();
  const locationState = useLocation().state as SendFundParam;
  const [sendFundSlug] = useState<string | undefined>(locationState?.slug);

  const { asset, chain, from, onDone, setAsset, setChain, setFrom } =
    useContext(TransactionContext);

  const { chainInfoMap, chainStateMap } = useSelector(
    (root) => root.chainStore
  );
  const { assetRegistry, assetSettingMap, multiChainAssetMap, xcmRefMap } =
    useSelector((root) => root.assetRegistry);
  const { accounts, isAllAccount } = useSelector(
    (state: RootState) => state.accountState
  );
  const [maxTransfer, setMaxTransfer] = useState<string>("0");
  const preCheckReadOnly = usePreCheckReadOnly(
    from,
    "The account you are using is read-only, you cannot send assets with it"
  );

  const [loading, setLoading] = useState(false);
  const [isTransferAll, setIsTransferAll] = useState(false);

  const { onError, onSuccess } = useHandleSubmitTransaction(
    onDone,
    setIsTransferAll
  );

  const [form] = Form.useForm<TransferFormProps>();
  const formDefault = useMemo((): TransferFormProps => {
    return {
      from: from,
      chain: chain,
      destChain: "",
      asset: "",
      to: "",
      value: "",
    };
  }, [chain, from]);

  const destChain = Form.useWatch("destChain", form);

  const destChainItems = useMemo<ChainItemType[]>(() => {
    return getTokenAvailableDestinations(asset, xcmRefMap, chainInfoMap);
  }, [chainInfoMap, asset, xcmRefMap]);

  const tokenItems = useMemo<TokenItemType[]>(() => {
    return getTokenItems(
      from,
      accounts,
      chainInfoMap,
      chainStateMap,
      assetRegistry,
      assetSettingMap,
      multiChainAssetMap,
      sendFundSlug
    );
  }, [
    accounts,
    assetRegistry,
    assetSettingMap,
    chainInfoMap,
    chainStateMap,
    from,
    multiChainAssetMap,
    sendFundSlug,
  ]);

  const validateRecipientAddress = useCallback(
    (rule: Rule, _recipientAddress: string): Promise<void> => {
      if (!_recipientAddress) {
        return Promise.reject(t("Recipient address is required"));
      }

      if (!isAddress(_recipientAddress)) {
        return Promise.reject(t("Invalid Recipient address"));
      }

      const { chain, destChain, from, to } = form.getFieldsValue();

      const isOnChain = chain === destChain;

      if (isOnChain) {
        if (from === _recipientAddress) {
          // todo: change message later
          return Promise.reject(
            t(
              "On Chain: The recipient address can not be the same as the sender address"
            )
          );
        }

        const isNotSameAddressType =
          (isEthereumAddress(from) &&
            !!_recipientAddress &&
            !isEthereumAddress(_recipientAddress)) ||
          (!isEthereumAddress(from) &&
            !!_recipientAddress &&
            isEthereumAddress(_recipientAddress));

        if (isNotSameAddressType) {
          // todo: change message later
          return Promise.reject(
            t(
              "On Chain: The recipient address must be same type as the current account address."
            )
          );
        }
      } else {
        const isDestChainEvmCompatible = _isChainEvmCompatible(
          chainInfoMap[destChain]
        );

        if (isDestChainEvmCompatible !== isEthereumAddress(to)) {
          // todo: change message later
          return Promise.reject(
            t(
              `Cross chain: The recipient address must be ${
                isDestChainEvmCompatible ? "EVM" : "substrate"
              } type`
            )
          );
        }
      }

      return Promise.resolve();
    },
    [chainInfoMap, form, t]
  );

  const validateAmount = useCallback(
    (rule: Rule, amount: string): Promise<void> => {
      if (!amount) {
        return Promise.reject(t("Amount is required"));
      }

      if (new BigN(amount).eq(new BigN(0))) {
        return Promise.reject(t("Amount must be greater than 0"));
      }

      return Promise.resolve();
    },
    [t]
  );

  const onFieldsChange: FormCallbacks<TransferFormProps>["onValuesChange"] =
    useCallback(
      (part: Partial<TransferFormProps>, values: TransferFormProps) => {
        if (part.from || part.asset || part.destChain) {
          form.resetFields(["to"]);
        }

        if (part.from) {
          setFrom(part.from);
        }

        if (part.asset) {
          form.resetFields(["value"]);
          const chain = assetRegistry[part.asset].originChain;

          form.setFieldsValue({
            chain: chain,
            destChain: chain,
          });

          setChain(chain);
          setAsset(part.asset);
          setIsTransferAll(false);
        }

        if (part.destChain) {
          if (
            part.destChain !== values.chain &&
            assetRegistry[values.asset]?.assetType === _AssetType.NATIVE
          ) {
            setIsTransferAll(false);
          }
        }
      },
      [form, setFrom, assetRegistry, setChain, setAsset]
    );

  // Submit transaction
  const onSubmit: FormCallbacks<TransferFormProps>["onFinish"] = useCallback(
    (values: TransferFormProps) => {
      setLoading(true);
      const { destChain, to, value } = values;

      let sendPromise: Promise<SWTransactionResponse>;

      if (chain === destChain) {
        // Transfer token or send fund
        sendPromise = makeTransfer({
          from,
          networkKey: chain,
          to: to,
          tokenSlug: asset,
          value: value,
          transferAll: isTransferAll,
        });
      } else {
        // Make cross chain transfer
        sendPromise = makeCrossChainTransfer({
          destinationNetworkKey: destChain,
          from,
          originNetworkKey: chain,
          tokenSlug: asset,
          to,
          value,
        });
      }

      setTimeout(() => {
        // Handle transfer action
        sendPromise
          .then(onSuccess)
          .catch(onError)
          .finally(() => {
            setLoading(false);
          });
      }, 300);
    },
    [chain, from, asset, isTransferAll, onSuccess, onError]
  );

  const currentChainAsset = useMemo(() => {
    return asset ? assetRegistry[asset] : undefined;
  }, [assetRegistry, asset]);

  const decimals = useMemo(() => {
    return currentChainAsset ? _getAssetDecimals(currentChainAsset) : 0;
  }, [currentChainAsset]);

  // TODO: Need to review
  useEffect(() => {
    const { asset, from } = form.getFieldsValue();

    if (tokenItems.length) {
      if (!asset) {
        const account = findAccountByAddress(accounts, from);

        let pass = false;

        if (account?.originGenesisHash) {
          const network = findNetworkJsonByGenesisHash(
            chainInfoMap,
            account.originGenesisHash
          );

          if (network) {
            const token = tokenItems.find(
              (item) => item.originChain === network.slug
            );

            if (token) {
              form.setFieldsValue({
                asset: token.slug,
                chain: assetRegistry[token.slug].originChain,
                destChain: assetRegistry[token.slug].originChain,
              });
              setChain(assetRegistry[token.slug].originChain);
              pass = true;
            }
          }
        }

        if (!pass) {
          form.setFieldsValue({
            asset: tokenItems[0].slug,
            chain: assetRegistry[tokenItems[0].slug].originChain,
            destChain: assetRegistry[tokenItems[0].slug].originChain,
          });
          setChain(assetRegistry[tokenItems[0].slug].originChain);
        }
      } else {
        const isSelectedTokenInList = tokenItems.some((i) => i.slug === asset);

        if (!isSelectedTokenInList) {
          form.setFieldsValue({
            asset: tokenItems[0].slug,
            chain: assetRegistry[tokenItems[0].slug].originChain,
            destChain: assetRegistry[tokenItems[0].slug].originChain,
          });
          setChain(assetRegistry[tokenItems[0].slug].originChain);
        }
      }
    }
  }, [accounts, tokenItems, assetRegistry, form, setChain, chainInfoMap]);

  // Get max transfer value
  useEffect(() => {
    let cancel = false;

    if (from && asset) {
      getFreeBalance({
        address: from,
        networkKey: assetRegistry[asset].originChain,
        token: asset,
      })
        .then((balance) => {
          !cancel && setMaxTransfer(balance.value);
        })
        .catch(console.error);
    }

    return () => {
      cancel = true;
    };
  }, [asset, assetRegistry, from]);

  return (
    <>
      <TransactionContent className={CN(`${className} -transaction-content`)}>
        <div className={"__brief common-text text-light-4 text-center"}>
          {t("You are doing a token transfer with the following information")}
        </div>

        <Form
          className={"form-container form-space-sm"}
          form={form}
          initialValues={formDefault}
          onFinish={onSubmit}
          onValuesChange={onFieldsChange}
        >
          <Form.Item className={CN({ hidden: !isAllAccount })} name={"from"}>
            <AccountSelector
              disabled={!isAllAccount}
              label={t("Send from account")}
            />
          </Form.Item>

          <div className={"form-row"}>
            <Form.Item name={"asset"}>
              <TokenSelector
                disabled={!tokenItems.length}
                items={tokenItems}
                placeholder={t("Select token")}
                showChainInSelected
              />
            </Form.Item>

            <Form.Item
              name={"value"}
              rules={[
                {
                  validator: validateAmount,
                },
              ]}
              statusHelpAsTooltip={true}
              validateTrigger="onBlur"
            >
              <AmountInput
                decimals={decimals}
                isDisableMax={
                  destChain !== chain &&
                  assetRegistry[asset]?.assetType === _AssetType.NATIVE
                }
                maxValue={maxTransfer}
                setIsMax={setIsTransferAll}
              />
            </Form.Item>
          </div>

          <Form.Item className={"hidden"} name={"chain"}>
            <Input placeholder={t("value")} />
          </Form.Item>

          <Form.Item
            name={"to"}
            rules={[
              {
                validator: validateRecipientAddress,
              },
            ]}
            statusHelpAsTooltip={true}
            validateTrigger="onBlur"
          >
            <AddressInput
              autoReformatValue
              label={t("Send to account")}
              showScanner={true}
            />
          </Form.Item>

          <Form.Item name={"destChain"}>
            <ChainSelector
              disabled={!destChainItems.length}
              items={destChainItems}
            />
          </Form.Item>
        </Form>

        <FreeBalance address={from} chain={chain} tokenSlug={asset} />
      </TransactionContent>
      <TransactionFooter
        className={`${className} -transaction-footer`}
        errors={[]}
        warnings={[]}
      >
        <Button
          icon={<Icon phosphorIcon={PaperPlaneTilt} weight={"fill"} />}
          loading={loading}
          onClick={preCheckReadOnly(form.submit)}
          schema={isTransferAll ? "warning" : undefined}
        >
          {isTransferAll ? t("Transfer all") : t("Transfer")}
        </Button>
      </TransactionFooter>
    </>
  );
};

const SendFund = styled(_SendFund)(({ theme }) => {
  const token = (theme as Theme).token;

  return {
    ".__brief": {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      marginBottom: token.marginLG,
    },

    "&.-transaction-content.-is-zero-balance": {
      ".free-balance .ant-number": {
        ".ant-number-integer, .ant-number-decimal": {
          color: `${token.colorError} !important`,
        },
      },
    },
  };
});

export default SendFund;
