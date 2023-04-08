// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from "@subwallet/chain-list/types";
import { AccountJson } from "@subwallet/extension-base/background/types";
import { _isChainEvmCompatible } from "@subwallet/extension-base/services/chain-service/utils";
import { RootState } from "@subwallet-webapp/stores";
import { AccountType } from "@subwallet-webapp/types";
import { findAccountByAddress } from "@subwallet-webapp/util/account/account";
import { findNetworkJsonByGenesisHash } from "@subwallet-webapp/util/chain/getNetworkJsonByGenesisHash";
import { useMemo } from "react";
import { useSelector } from "react-redux";

import { isEthereumAddress } from "@polkadot/util-crypto";

function getChainsAccountType(
  accountType: AccountType,
  chainInfoMap: Record<string, _ChainInfo>,
  accountNetwork?: string
): string[] {
  const result: string[] = [];

  Object.keys(chainInfoMap).forEach((chain) => {
    if (accountNetwork) {
      if (chain === accountNetwork) {
        result.push(chain);
      }
    } else {
      const isChainEvmCompatible = _isChainEvmCompatible(chainInfoMap[chain]);

      if (isChainEvmCompatible) {
        if (accountType === "ALL" || accountType === "ETHEREUM") {
          result.push(chain);
        }
      } else {
        if (accountType === "ALL" || accountType === "SUBSTRATE") {
          result.push(chain);
        }
      }
    }
  });

  return result;
}

export function useGetChainSlugsByAccountType(address?: string): string[] {
  const chainInfoMap = useSelector(
    (state: RootState) => state.chainStore.chainInfoMap
  );
  const { accounts, currentAccount } = useSelector(
    (state: RootState) => state.accountState
  );

  const accountType = useMemo(() => {
    let accountType: AccountType = "ALL";

    if (address) {
      if (isEthereumAddress(address)) {
        accountType = "ETHEREUM";
      } else {
        accountType = "SUBSTRATE";
      }
    } else {
      if (currentAccount?.type === "ethereum") {
        accountType = "ETHEREUM";
      } else if (currentAccount?.type === "sr25519") {
        accountType = "SUBSTRATE";
      }
    }

    return accountType;
  }, [address, currentAccount?.type]);

  const accountNetwork = useMemo(() => {
    let account: AccountJson | null = currentAccount;

    if (address) {
      account = findAccountByAddress(accounts, address);
    }

    const originGenesisHash = account?.originGenesisHash;

    if (originGenesisHash) {
      return findNetworkJsonByGenesisHash(chainInfoMap, originGenesisHash)
        ?.slug;
    } else {
      return undefined;
    }
  }, [accounts, address, chainInfoMap, currentAccount]);

  return useMemo<string[]>(() => {
    return getChainsAccountType(accountType, chainInfoMap, accountNetwork);
  }, [accountType, chainInfoMap, accountNetwork]);
}
