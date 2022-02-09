// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'node-fetch';

import { KANARIA_ENDPOINT, KANARIA_EXTERNAL_SERVER, SERVER, SINGULAR_ENDPOINT, SINGULAR_EXTERNAL_SERVER } from './config';

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
        animation_url: getIPFSLink(animation_url),
        image: getIPFSLink(image)
      },
      external_url: SINGULAR_EXTERNAL_SERVER + data[i].id
    });
  }

  // console.log(nfts)
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
        image: getIPFSLink(result.image),
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
  const url = parseIpfsLink(metadata_url)
  if(!url) return undefined
  return fetch(url, {
    method: 'GET',
    headers
  })
    .then((res) => res.json());
};

const parseIpfsLink = (ipfsLink: string) => {
  if (!ipfsLink.includes('ipfs://ipfs/'))
    return SERVER + ipfsLink;
  return SERVER + ipfsLink.split('ipfs://ipfs/')[1];
};
