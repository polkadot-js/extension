// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'node-fetch';

import { KANARIA_ENDPOINT, KANARIA_EXTERNAL_SERVER, PINATA_SERVER, SINGULAR_ENDPOINT, SINGULAR_EXTERNAL_SERVER } from './config';
import {isUrl} from "@polkadot/extension-koni-base/utils/utils";

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
