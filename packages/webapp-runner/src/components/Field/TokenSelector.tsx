// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from "@subwallet-webapp/components/Field/Base";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { useSelectModalInputHelper } from "@subwallet-webapp/hooks/form/useSelectModalInputHelper";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { Icon, InputRef, Logo, SelectModal } from "@subwallet/react-ui";
import TokenItem from "@subwallet/react-ui/es/web3-block/token-item";
import { CheckCircle } from "phosphor-react";
import React, {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import styled, { useTheme } from "styled-components";

import GeneralEmptyList from "../GeneralEmptyList";

export type TokenItemType = {
  name: string;
  slug: string;
  symbol: string;
  originChain: string;
};

interface Props extends ThemeProps, BasicInputWrapper {
  items: TokenItemType[];
  showChainInSelected?: boolean;
  prefixShape?: "circle" | "none" | "squircle" | "square";
}

const renderEmpty = () => <GeneralEmptyList />;

function Component(
  props: Props,
  ref: ForwardedRef<InputRef>
): React.ReactElement<Props> {
  const {
    className = "",
    disabled,
    id = "token-select",
    items,
    label,
    placeholder,
    showChainInSelected = false,
    statusHelp,
    value,
  } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const renderTokenSelected = useCallback(
    (item: TokenItemType) => {
      return (
        <div className={"__selected-item"}>
          {item.symbol}
          {showChainInSelected}
        </div>
      );
    },
    [showChainInSelected]
  );
  const { onSelect } = useSelectModalInputHelper(props, ref);
  const searchFunction = useCallback(
    (item: TokenItemType, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return item.symbol.toLowerCase().includes(searchTextLowerCase);
    },
    []
  );

  const chainLogo = useMemo(() => {
    const tokenInfo = items.find((x) => x.slug === value);

    return (
      tokenInfo && (
        <Logo
          isShowSubLogo={true}
          shape={"square"}
          size={token.controlHeightSM}
          subNetwork={tokenInfo.originChain}
          token={tokenInfo.symbol.toLowerCase()}
        />
      )
    );
  }, [items, token.controlHeightSM, value]);

  const renderItem = useCallback(
    (item: TokenItemType, selected: boolean) => {
      return (
        <TokenItem
          className={"token-item"}
          isShowSubLogo={true}
          name={item.symbol}
          networkMainLogoShape={"circle"}
          networkMainLogoSize={28}
          rightItem={
            selected && (
              <div className={"__check-icon"}>
                <Icon
                  customSize={"20px"}
                  iconColor={token.colorSuccess}
                  phosphorIcon={CheckCircle}
                  type="phosphor"
                  weight={"fill"}
                />
              </div>
            )
          }
          subName={""}
          subNetworkKey={item.originChain}
          symbol={item.symbol.toLowerCase()}
        />
      );
    },
    [token]
  );

  useEffect(() => {
    if (!value) {
      onSelect(items[0]?.slug || "");
    } else {
      const existed = items.find((item) => item.slug === value);

      if (!existed) {
        onSelect(items[0]?.slug || "");
      }
    }
  }, [value, items, onSelect]);

  return (
    <SelectModal
      className={`${className} chain-selector-modal`}
      disabled={disabled}
      id={id}
      inputClassName={`${className} chain-selector-input`}
      itemKey={"slug"}
      items={items}
      label={label}
      onSelect={onSelect}
      placeholder={placeholder || t("Select token")}
      prefix={value !== "" && chainLogo}
      renderItem={renderItem}
      renderSelected={renderTokenSelected}
      renderWhenEmpty={renderEmpty}
      searchFunction={searchFunction}
      searchPlaceholder={t<string>("Search token")}
      searchableMinCharactersCount={2}
      selected={value || ""}
      statusHelp={statusHelp}
      title={label || placeholder || t("Select token")}
    />
  );
}

export const TokenSelector = styled(forwardRef(Component))<Props>(
  ({ theme: { token } }: Props) => {
    return {
      "&.chain-selector-input .__selected-item": {
        color: token.colorText,
      },

      // TODO: delete this when fix component in ui-base
      ".token-item .ant-network-item-sub-name": {
        display: "none",
      },

      ".token-item .__check-icon": {
        display: "flex",
        width: 40,
        justifyContent: "center",
      },
    };
  }
);
