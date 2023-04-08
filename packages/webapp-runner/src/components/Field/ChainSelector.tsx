// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from "@subwallet-webapp/components/Field/Base";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { useSelectModalInputHelper } from "@subwallet-webapp/hooks/form/useSelectModalInputHelper";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { ChainItemType } from "@subwallet-webapp/types/network";
import {
  Icon,
  InputRef,
  Logo,
  NetworkItem,
  SelectModal,
} from "@subwallet/react-ui";
import { CheckCircle } from "phosphor-react";
import React, { ForwardedRef, forwardRef, useCallback, useMemo } from "react";
import styled, { useTheme } from "styled-components";

import GeneralEmptyList from "../GeneralEmptyList";

interface Props extends ThemeProps, BasicInputWrapper {
  items: ChainItemType[];
}

const renderEmpty = () => <GeneralEmptyList />;

function Component(
  props: Props,
  ref: ForwardedRef<InputRef>
): React.ReactElement<Props> {
  const {
    className = "",
    disabled,
    id = "address-input",
    items,
    label,
    placeholder,
    statusHelp,
    value,
  } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { onSelect } = useSelectModalInputHelper(props, ref);

  const renderChainSelected = useCallback((item: ChainItemType) => {
    return <div className={"__selected-item"}>{item.name}</div>;
  }, []);

  const searchFunction = useCallback(
    (item: ChainItemType, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return item.name.toLowerCase().includes(searchTextLowerCase);
    },
    []
  );

  const chainLogo = useMemo(() => {
    return <Logo network={value} size={token.controlHeightSM} />;
  }, [value, token.controlHeightSM]);

  const renderItem = useCallback(
    (item: ChainItemType, selected: boolean) => {
      return (
        <NetworkItem
          name={item.name}
          networkKey={item.slug}
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
        />
      );
    },
    [token]
  );

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
      placeholder={placeholder || t("Select chain")}
      prefix={value !== "" && chainLogo}
      renderItem={renderItem}
      renderSelected={renderChainSelected}
      renderWhenEmpty={renderEmpty}
      searchFunction={searchFunction}
      searchPlaceholder={t<string>("Search chain")}
      searchableMinCharactersCount={2}
      selected={value || ""}
      statusHelp={statusHelp}
      title={label || placeholder || t("Select chain")}
    />
  );
}

export const ChainSelector = styled(forwardRef(Component))<Props>(
  ({ theme: { token } }: Props) => {
    return {
      "&.chain-selector-input .__selected-item": {
        color: token.colorText,
      },

      ".ant-network-item .__check-icon": {
        display: "flex",
        width: 40,
        justifyContent: "center",
      },
    };
  }
);
