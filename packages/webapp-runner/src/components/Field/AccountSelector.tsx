// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from "@subwallet/extension-base/background/types";
import { isAccountAll } from "@subwallet/extension-base/utils";
import AccountItemWithName from "@subwallet-webapp/components/Account/Item/AccountItemWithName";
import { Avatar } from "@subwallet-webapp/components/Avatar";
import { BasicInputWrapper } from "@subwallet-webapp/components/Field/Base";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { useSelectModalInputHelper } from "@subwallet-webapp/hooks/form/useSelectModalInputHelper";
import { RootState } from "@subwallet-webapp/stores";
import { ThemeProps } from "@subwallet-webapp/types";
import { toShort } from "@subwallet-webapp/util";
import { InputRef, SelectModal } from "@subwallet/react-ui";
import React, { ForwardedRef, forwardRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

import GeneralEmptyList from "../GeneralEmptyList";

interface Props extends ThemeProps, BasicInputWrapper {
  externalAccounts?: AccountJson[];
  filter?: (account: AccountJson) => boolean;
}

const renderEmpty = () => <GeneralEmptyList />;

function defaultFiler(account: AccountJson): boolean {
  return !isAccountAll(account.address);
}

const Component = (
  props: Props,
  ref: ForwardedRef<InputRef>
): React.ReactElement<Props> => {
  const {
    className = "",
    disabled,
    externalAccounts,
    filter,
    id = "account-selector",
    label,
    placeholder,
    readOnly,
    statusHelp,
    value,
  } = props;
  const _items = useSelector((state: RootState) => state.accountState.accounts);

  const items = useMemo(() => {
    return (externalAccounts || _items).filter(filter || defaultFiler);
  }, [_items, externalAccounts, filter]);

  const { t } = useTranslation();
  const { onSelect } = useSelectModalInputHelper(props, ref);

  const renderSelected = useCallback((item: AccountJson) => {
    return (
      <div className={"__selected-item"}>
        <div className={"__selected-item-name common-text"}>{item.name}</div>

        <div className={"__selected-item-address common-text"}>
          ({toShort(item.address, 4, 4)})
        </div>
      </div>
    );
  }, []);

  const searchFunction = useCallback(
    (item: AccountJson, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return (
        item.address.toLowerCase().includes(searchTextLowerCase) ||
        (item.name
          ? item.name.toLowerCase().includes(searchTextLowerCase)
          : false)
      );
    },
    []
  );

  const renderItem = useCallback((item: AccountJson, selected: boolean) => {
    return (
      <AccountItemWithName
        accountName={item.name}
        address={item.address}
        isSelected={selected}
      />
    );
  }, []);

  return (
    <>
      <SelectModal
        className={`${className} account-selector-modal`}
        disabled={disabled || readOnly}
        id={id}
        inputClassName={`${className} account-selector-input`}
        itemKey={"address"}
        items={items}
        label={label}
        onSelect={onSelect}
        placeholder={placeholder || t("Select account")}
        prefix={
          <Avatar
            size={20}
            theme={
              value
                ? isEthereumAddress(value)
                  ? "ethereum"
                  : "polkadot"
                : undefined
            }
            value={value}
          />
        }
        renderItem={renderItem}
        renderSelected={renderSelected}
        renderWhenEmpty={renderEmpty}
        searchFunction={searchFunction}
        searchPlaceholder={t<string>("Search name")}
        searchableMinCharactersCount={2}
        selected={value || ""}
        statusHelp={statusHelp}
        title={label || placeholder || t("Select account")}
      />
    </>
  );
};

export const AccountSelector = styled(forwardRef(Component))<Props>(
  ({ theme: { token } }: Props) => {
    return {
      "&.account-selector-input": {
        ".__selected-item": {
          display: "flex",
          color: token.colorTextLight1,
          whiteSpace: "nowrap",
          overflow: "hidden",
        },
        ".__selected-item-name": {
          textOverflow: "ellipsis",
          fontWeight: token.headingFontWeight,
          overflow: "hidden",
        },
        ".__selected-item-address": {
          color: token.colorTextLight4,
          paddingLeft: token.sizeXXS,
        },
      },
    };
  }
);
