// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {useSelector} from "react-redux";
import {RootState} from "@subwallet/extension-koni-ui/stores";

export default function useGetNftData () {
  const {nftCollections, nftItems} = useSelector((state: RootState) => state.nft);


}
