// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getItemsKanariaByAccount } from "./api/rmrk_nft";
// import UniqueNftApi from "./api/unique_nft";

// no direct exports
// import { getBalances, subscribeBalances } from "./controllers/apis.js";
// import { getMetadata, getSingularByAccount } from "./controllers/rmrk_nft.js";
// import { connect, disconnect, getNftImageUrl, getNftData, getAddressTokens } from './api/unique_nft/index';

const index = async () => {
   // let result = await getBalances([{ paraId: 2000, chainId: 2 }], 'seAJwjS9prpF7BLXK2DoyuYWZcScrtayEN5kwsjsXmXQxrp')
   // console.log(result)

   // test nft for unique
   // const collectionId_unique = 25;
   // const locale = "en";
   // const owner_unique = "5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb";


   // const api = new UniqueNftApi();

   // const data = await api.getAddressTokens(collectionId_unique, owner_unique)
   // console.log(data)

   // for (let i = 0; i < data.length; i++) {
   //     let tokenId = data[i]
   //     // Get token image URL
   //     const imageUrl = await api.getNftImageUrl(collectionId_unique, tokenId);
   //     console.log(`NFT ${collectionId_unique}-${tokenId} Image URL: `, imageUrl);

   //     // Get token data
   //     const tokenData = await api.getNftData(collectionId_unique, tokenId, locale);
   //     console.log(`NFT ${collectionId_unique}-${tokenId} data: `, tokenData);
   // }

   // await api.disconnect();


   // data for test ntf of rmrk
   const singular_account = 'DMkCuik9UA1nKDZzC683Hr6GMermD8Tcqq9HvyCtkfF5QRW';
   const kanaria_account = 'Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr'

   // const nfts_rmrk = await getSingularByAccount(singular_account)
   const nfts_rmrk = await getItemsKanariaByAccount(kanaria_account)
   console.log("nft of rmrk: ", nfts_rmrk)

   for (let i = 0; i < nfts_rmrk.length; i++) {
      console.log(nfts_rmrk[i])
   }
}

// Test wallet:
// 13wNbioJt44NKrcQ5ZUrshJqP7TKzQbzZt5nhkeL4joa3PAX
// qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1a
// seAJwjS9prpF7BLXK2DoyuYWZcScrtayEN5kwsjsXmXQxrp

index()