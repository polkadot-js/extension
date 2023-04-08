// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from "@subwallet/chain-list/types";
import { _ChainState } from "@subwallet/extension-base/services/chain-service/types";
import { RootState } from "@subwallet-webapp/stores";
import { useMemo } from "react";
import { useSelector } from "react-redux";

export type ChainInfoWithState = _ChainInfo & _ChainState;

export default function useChainInfoWithState(): ChainInfoWithState[] {
  const chainInfoMap = useSelector(
    (state: RootState) => state.chainStore.chainInfoMap
  );
  const chainStateMap = useSelector(
    (state: RootState) => state.chainStore.chainStateMap
  );

  const chainInfoList: ChainInfoWithState[] = useMemo(() => {
    return Object.values(chainInfoMap).map((item) => {
      return { ...item, ...(chainStateMap[item.slug] || {}) };
    });
  }, [chainInfoMap, chainStateMap]);

  return chainInfoList;
}
