import {
  getBirdsKanariaByAccount,
  getItemsKanariaByAccount,
  getSingularByAccount
} from "@polkadot/extension-koni-base/api/rmrk_nft";
import fetch from "node-fetch";
import { SERVER, SINGULAR_COLLECTION_ENDPOINT } from "@polkadot/extension-koni-base/api/rmrk_nft/config";
import { NftCollection, NftItem, NftJson } from "@polkadot/extension-koni-base/stores/types";
import UniqueNftApi from "./unique_nft";

const parseIpfsLink = (ipfsLink: string) => {
  return SERVER + ipfsLink.split('ipfs://ipfs/')[1]
}

interface NftIdList {
  collectionId: number,
  nfts: string[]
}

interface TokenData {
  owner: string,
  prefix: string,
  collectionName: string,
  collectionDescription: string,
  properties: any
}

export const handleUniqueNfts = async (account: string): Promise<NftItem[]> => {
  if (!account) return [];

  const api = new UniqueNftApi();

  await api.connect();

  const collectionCount = await api.getCollectionCount();

  let data: NftIdList[] = []
  for (let i = 0; i < collectionCount; i ++) {
    const rs = await api.getAddressTokens(i, account)
    if(rs && rs.length > 0)
      data.push({ collectionId: i, nfts: rs })
  }

  let nftDetailsList: NftItem[] = []
  for (let j = 0; j < data.length; j++) {
    const collectionId = data[j].collectionId;
    const nfts = data[j].nfts

    for (let i = 0; i < nfts.length; i++) {
      let tokenId = nfts[i]
      // Get token image URL
      const imageUrl = await api.getNftImageUrl(collectionId, tokenId) as unknown as string;

      // Get token data
      const tokenData = await api.getNftData(collectionId, tokenId, "en") as unknown as TokenData;
      const tokenDetail: NftItem = {
        id: tokenId,
        name: tokenData.prefix + '#' + tokenId,
        image: imageUrl,
        external_url: `https://unqnft.io/#/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`,
        collectionId: collectionId.toString(),
        properties: tokenData.properties,
        rarity: ''
      }

      nftDetailsList.push(tokenDetail)
    }
  }

  return nftDetailsList
}

export const handleRmrkNfts = async (account: string) => {
  if (!account) return;

  try {
    const [singular, birds, items] = await Promise.all([
      getSingularByAccount('DMkCuik9UA1nKDZzC683Hr6GMermD8Tcqq9HvyCtkfF5QRW'),
      getBirdsKanariaByAccount('Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr'),
      getItemsKanariaByAccount('Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr')
    ])
    const allNfts = [...singular, ...birds, ...items]
    let allCollections: any[] = []
    let collectionInfoUrl: string[] = []
    allNfts.map(item => {
      const url = SINGULAR_COLLECTION_ENDPOINT + item.collectionId
      if (!collectionInfoUrl.includes(url)) {
        allCollections.push({ collectionId: item.collectionId })
        collectionInfoUrl.push(url)
      }
    })
    let allCollectionMetaUrl: any[] = []
    const collectionInfo = await Promise.all(collectionInfoUrl.map(async url => {
      const resp = await fetch(url);
      const data: any[] = await resp.json();
      const result = data[0]
      if (result && 'metadata' in result) allCollectionMetaUrl.push({ url: parseIpfsLink(result?.metadata), id: result?.id })
      if (data.length > 0) return result
      else return {}
    }))

    let allCollectionMeta = {}
    await Promise.all(allCollectionMetaUrl.map(async item => {
      const resp = await fetch(item.url);
      const data = await resp.json()
      // @ts-ignore
      allCollectionMeta[item?.id] = { ...data }
    }))

    let collectionInfoDict = Object.assign({}, ...collectionInfo.map((item) => ({ [item.id]: item.name })));
    let nftDict = {}
    for (let item of allNfts) {
      const parsedItem = {
        id: item?.id,
        name: item?.metadata?.name,
        image: item?.metadata?.image,
        description: item?.metadata?.description,
        external_url: item?.external_url,
        rarity: item?.metadata_rarity,
        collectionId: item?.collectionId,
        properties: item?.metadata?.properties
      } as NftItem

      if (item.collectionId in nftDict) {
        // @ts-ignore
        nftDict[item.collectionId] = [...nftDict[item.collectionId], parsedItem]
      } else {
        // @ts-ignore
        nftDict[item.collectionId] = [parsedItem]
      }
    }

    allCollections = allCollections.map(item => {
      return {
        collectionId: item.collectionId,
        collectionName: collectionInfoDict[item.collectionId] ? collectionInfoDict[item.collectionId] : null,
        // @ts-ignore
        image: allCollectionMeta[item.collectionId] ? parseIpfsLink(allCollectionMeta[item.collectionId].image) : null,
        // @ts-ignore
        nftItems: nftDict[item.collectionId]
      } as NftCollection
    })

    console.log(allCollections)

    // should return list of NftCollection
    return { total: allNfts.length, allCollections }
  } catch (e) {
    console.error('Failed to fetch nft', e);
    throw e;
  }
}


// should get all nfts from all sources
export const getAllNftsByAccount = async (account: string): Promise<NftJson> => {
  try {
    // @ts-ignore
    const { total, allCollections } = await handleRmrkNfts(account);
    return {
      total,
      nftList: allCollections
    } as NftJson
  } catch (e) {
    console.error('Failed to fetch nft', e);
    throw e;
  }
}
