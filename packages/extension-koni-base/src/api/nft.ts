// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'node-fetch';

import { NftCollection, NftItem, NftJson } from '@polkadot/extension-base/background/KoniTypes';
import { getBirdsKanariaByAccount, getItemsKanariaByAccount, getSingularByAccount } from '@polkadot/extension-koni-base/api/rmrk_nft';
import { SERVER, SINGULAR_COLLECTION_ENDPOINT } from '@polkadot/extension-koni-base/api/rmrk_nft/config';

import UniqueNftApi from './unique_nft';

const parseIpfsLink = (ipfsLink: string) => {
  if (!ipfsLink.includes('ipfs://ipfs/')) return ipfsLink;

  return SERVER + ipfsLink.split('ipfs://ipfs/')[1];
};

interface NftIdList {
  collectionId: number,
  nfts: string[]
}

interface TokenData {
  owner: string,
  prefix: string,
  collectionName: string,
  collectionDescription: string,
  properties: any,
  image: string,
}

export const handleUniqueNfts = async (account: string): Promise<any> => {
  if (!account) return [];

  const api = new UniqueNftApi();

  await api.connect();

  const collectionCount = await api.getCollectionCount();

  const data: NftIdList[] = [];
  const allCollections: NftCollection[] = [];

  const addressTokenDict: any[] = [];

  for (let i = 0; i < collectionCount; i++) {
    addressTokenDict.push({ i, account });
  }

  await Promise.all(addressTokenDict.map(async (item) => {
    const rs = await api.getAddressTokens(item.i, item.account);

    if (rs && rs.length > 0) { data.push({ collectionId: item.i, nfts: rs }); }
  }));

  let total = 0;

  for (let j = 0; j < data.length; j++) {
    const nftItems: NftItem[] = [];
    const collectionId = data[j].collectionId;
    const nfts = data[j].nfts;
    let collectionName = '';
    let collectionImage = '';

    total += nfts.length;

    for (let i = 0; i < nfts.length; i++) {
      const tokenId = nfts[i];
      // Get token image URL
      const _imageUrl = api.getNftImageUrl(collectionId, tokenId) as unknown as string;
      // Get token data
      const _tokenData = api.getNftData(collectionId, tokenId, 'en') as unknown as TokenData;

      const [imageUrl, tokenData] = await Promise.all([_imageUrl, _tokenData]);

      collectionName = tokenData.collectionName;
      collectionImage = parseIpfsLink(tokenData.image);
      const tokenDetail: NftItem = {
        id: tokenId,
        name: tokenData.prefix + '#' + tokenId,
        image: parseIpfsLink(imageUrl),
        external_url: `https://unqnft.io/#/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`,
        collectionId: collectionId.toString(),
        properties: tokenData.properties,
        rarity: ''
      };

      nftItems.push(tokenDetail);
    }

    allCollections.push({
      collectionId: collectionId.toString(),
      collectionName: collectionName,
      image: collectionImage,
      nftItems: nftItems
    } as NftCollection);
  }

  return { total, allCollections };
};

export const handleRmrkNfts = async (account: string): Promise<any> => {
  if (!account) return;

  try {
    const [singular, birds, items] = await Promise.all([
      getSingularByAccount(account),
      getBirdsKanariaByAccount(account),
      getItemsKanariaByAccount(account)
      // getSingularByAccount('DMkCuik9UA1nKDZzC683Hr6GMermD8Tcqq9HvyCtkfF5QRW'),
      // getBirdsKanariaByAccount('Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr'),
      // getItemsKanariaByAccount('Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr')
    ]);
    const allNfts = [...singular, ...birds, ...items];
    let allCollections: any[] = [];
    const collectionInfoUrl: string[] = [];

    allNfts.map((item) => {
      const url = SINGULAR_COLLECTION_ENDPOINT + item.collectionId;

      if (!collectionInfoUrl.includes(url)) {
        allCollections.push({ collectionId: item.collectionId });
        collectionInfoUrl.push(url);
      }
    });
    const allCollectionMetaUrl: any[] = [];
    const collectionInfo = await Promise.all(collectionInfoUrl.map(async (url) => {
      const resp = await fetch(url);
      const data: any[] = await resp.json();
      const result = data[0];

      if (result && 'metadata' in result) allCollectionMetaUrl.push({ url: parseIpfsLink(result?.metadata), id: result?.id });
      if (data.length > 0) return result;
      else return {};
    }));

    const allCollectionMeta = {};

    await Promise.all(allCollectionMetaUrl.map(async (item) => {
      const resp = await fetch(item.url);
      const data = await resp.json();

      // @ts-ignore
      allCollectionMeta[item?.id] = { ...data };
    }));

    const collectionInfoDict = Object.assign({}, ...collectionInfo.map((item) => ({ [item.id]: item.name })));
    const nftDict = {};

    for (const item of allNfts) {
      const parsedItem = {
        id: item?.id,
        name: item?.metadata?.name,
        image: item?.metadata?.image,
        description: item?.metadata?.description,
        external_url: item?.external_url,
        rarity: item?.metadata_rarity,
        collectionId: item?.collectionId,
        properties: item?.metadata?.properties
      } as NftItem;

      if (item.collectionId in nftDict) {
        // @ts-ignore
        nftDict[item.collectionId] = [...nftDict[item.collectionId], parsedItem];
      } else {
        // @ts-ignore
        nftDict[item.collectionId] = [parsedItem];
      }
    }

    allCollections = allCollections.map((item) => {
      return {
        collectionId: item.collectionId,
        collectionName: collectionInfoDict[item.collectionId] ? collectionInfoDict[item.collectionId] : null,
        // @ts-ignore
        image: allCollectionMeta[item.collectionId] ? parseIpfsLink(allCollectionMeta[item.collectionId].image) : null,
        // @ts-ignore
        nftItems: nftDict[item.collectionId]
      } as NftCollection;
    });

    // should return list of NftCollection
    return { total: allNfts.length, allCollections };
  } catch (e) {
    console.error('Failed to fetch nft', e);
    throw e;
  }
};

// should get all nfts from all sources
export const getAllNftsByAccount = async (account: string): Promise<NftJson> => {
  try {
    console.log('Getting nfts for ', account);
    // @ts-ignore
    const _rmrkNfts = handleRmrkNfts(account);
    const _uniqueNfts = handleUniqueNfts(account);
    const [rmrkNfts, uniqueNfts] = await Promise.all([_rmrkNfts, _uniqueNfts]);
    const total = rmrkNfts.total + uniqueNfts.total;
    const allCollections = [...rmrkNfts.allCollections, ...uniqueNfts.allCollections];

    // const [rmrkNfts] = await Promise.all([_rmrkNfts]);
    // let total = rmrkNfts.total;
    // let allCollections = [...rmrkNfts.allCollections]
    console.log(`Fetched ${total} nfts`)
    return {
      total,
      nftList: allCollections
    } as NftJson;
  } catch (e) {
    console.error('Failed to fetch nft', e);
    throw e;
  }
};

