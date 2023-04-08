// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from "@subwallet-webapp/stores";
import { findChainInfoByChainId } from "@subwallet-webapp/util/chain/chain";
import { useMemo } from "react";
import { useSelector } from "react-redux";

const useGetChainInfoByChainId = (chainId?: number) => {
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  return useMemo(
    () => findChainInfoByChainId(chainInfoMap, chainId),
    [chainInfoMap, chainId]
  );
};

export default useGetChainInfoByChainId;
