// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'node-fetch';

import {
  KANARIA_ENDPOINT,
  KANARIA_EXTERNAL_SERVER,
  PINATA_SERVER,
  SINGULAR_COLLECTION_ENDPOINT,
  SINGULAR_ENDPOINT,
  SINGULAR_EXTERNAL_SERVER
} from './config';
import {isUrl} from "@polkadot/extension-koni-base/utils/utils";
import {NftCollection, NftItem} from "@polkadot/extension-base/background/KoniTypes";

// data for test
// const singular_account = 'DMkCuik9UA1nKDZzC683Hr6GMermD8Tcqq9HvyCtkfF5QRW';
// const kanaria_account = 'Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr'

const headers = {
  'Content-Type': 'application/json'
};

export const getSingularByAccount = async (account: string) => {
  const url = SINGULAR_ENDPOINT + account;
  const data = await fetch(url, {
    method: 'GET',
    headers
  })
    .then((res) => res.json());

  const nfts = [];

  for (let i = 0; i < data.length; i++) {
    const { animation_url, attributes, description, image, name } = await getMetadata(data[i].metadata);

    nfts.push({
      ...data[i],
      metadata: {
        description,
        name,
        attributes,
        animation_url: parseIpfsLink(animation_url),
        image: parseIpfsLink(image)
      },
      external_url: SINGULAR_EXTERNAL_SERVER + data[i].id
    });
  }

  return nfts;
};

export const getItemsKanariaByAccount = async (account: string) => {
  const url = KANARIA_ENDPOINT + 'account-items/' + account;
  const data = await fetch(url, {
    method: 'GET',
    headers
  })
    .then((res) => res.json());

  const nfts = [];

  for (let i = 0; i < data.length; i++) {
    const result = await getMetadata(data[i].metadata);

    nfts.push({
      ...data[i],
      metadata: {
        ...result,
        image: parseIpfsLink(result.image),
        external_url: KANARIA_EXTERNAL_SERVER + data[i].id
      }
    });
  }

  return nfts;
};

export const getBirdsKanariaByAccount = async (account: string) => {
  const url = KANARIA_ENDPOINT + 'account-birds/' + account;
  const data = await fetch(url, {
    method: 'GET',
    headers
  })
    .then((res) => res.json());

  const nfts = [];

  for (let i = 0; i < data.length; i++) {
    const result = await getMetadata(data[i].metadata);

    nfts.push({
      ...data[i],
      metadata: result,
      external_url: KANARIA_EXTERNAL_SERVER + data[i].id
    });
  }

  return nfts;
};

export const getMetadata = (metadata_url: string) => {
  let url: string | null = metadata_url
  if (!isUrl(metadata_url)) {
    url = parseIpfsLink(metadata_url)
    if(!url || url.length === 0) return undefined
  }

  return fetch(url, {
    method: 'GET',
    headers
  })
    .then((res) => res.json());
};

const parseIpfsLink = (ipfsLink: string) => {
  if (!ipfsLink || ipfsLink.length === 0) return null;

  if (!ipfsLink.includes('ipfs://ipfs/'))
    return PINATA_SERVER + ipfsLink;

  return PINATA_SERVER + ipfsLink.split('ipfs://ipfs/')[1];
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

    return { total: allNfts.length, allCollections };
  } catch (e) {
    console.error('Failed to fetch nft', e);
    throw e;
  }
};
