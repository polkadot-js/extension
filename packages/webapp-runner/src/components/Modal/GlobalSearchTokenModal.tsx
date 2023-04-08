// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EmptyList } from "@subwallet-webapp/components";
import { TokenBalanceSelectionItem } from "@subwallet-webapp/components/TokenItem/TokenBalanceSelectionItem";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { ThemeProps } from "@subwallet-webapp/types";
import { TokenBalanceItemType } from "@subwallet-webapp/types/balance";
import {
  AccountBalanceHookType,
  TokenGroupHookType,
} from "@subwallet-webapp/types/hook";
import { SwList, SwModal } from "@subwallet/react-ui";
import { Coins } from "phosphor-react";
import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

type Props = ThemeProps & {
  id: string;
  onCancel: () => void;
  tokenBalanceMap: AccountBalanceHookType["tokenBalanceMap"];
  sortedTokenSlugs: TokenGroupHookType["sortedTokenSlugs"];
};

function getTokenBalances(
  tokenBalanceMap: AccountBalanceHookType["tokenBalanceMap"],
  sortedTokenSlugs: TokenGroupHookType["sortedTokenSlugs"]
): TokenBalanceItemType[] {
  const result: TokenBalanceItemType[] = [];

  sortedTokenSlugs.forEach((tokenSlug) => {
    if (tokenBalanceMap[tokenSlug]) {
      result.push(tokenBalanceMap[tokenSlug]);
    }
  });

  return result;
}

function Component({
  className = "",
  id,
  onCancel,
  sortedTokenSlugs,
  tokenBalanceMap,
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tokenBalances = useMemo<TokenBalanceItemType[]>(() => {
    return getTokenBalances(tokenBalanceMap, sortedTokenSlugs);
  }, [tokenBalanceMap, sortedTokenSlugs]);

  const onClickItem = useCallback(
    (item: TokenBalanceItemType) => {
      return () => {
        navigate(`/home/tokens/detail/${item.slug}`);
        onCancel();
      };
    },
    [navigate, onCancel]
  );

  // todo: auto clear search when closing modal, may need update reactUI swList component

  const renderItem = useCallback(
    (tokenBalance: TokenBalanceItemType) => {
      return (
        <TokenBalanceSelectionItem
          key={tokenBalance.slug}
          {...tokenBalance}
          onPressItem={onClickItem(tokenBalance)}
        />
      );
    },
    [onClickItem]
  );

  const searchFunc = useCallback(
    (item: TokenBalanceItemType, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return item.symbol.toLowerCase().includes(searchTextLowerCase);
    },
    []
  );

  const renderEmpty = useCallback(
    () => (
      <EmptyList
        className={"__empty-list"}
        emptyMessage={t("Add tokens to get started.")}
        emptyTitle={t("No tokens found")}
        phosphorIcon={Coins}
      />
    ),
    [t]
  );

  return (
    <SwModal
      className={className}
      destroyOnClose={true}
      id={id}
      onCancel={onCancel}
      title={t("Select token")}
    >
      <SwList.Section
        displayRow
        enableSearchInput
        list={tokenBalances}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        rowGap={"8px"}
        searchFunction={searchFunc}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>("Token name")}
      />
    </SwModal>
  );
}

export const GlobalSearchTokenModal = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".ant-sw-modal-body": {
        paddingLeft: 0,
        paddingRight: 0,
        display: "flex",
      },

      ".ant-sw-list-section": {
        maxHeight: "inherit",
        flex: 1,
      },

      ".ant-sw-list-search-input": {
        paddingBottom: token.paddingXS,
      },

      ".ant-sw-list": {
        paddingRight: token.padding,
      },
    };
  }
);
