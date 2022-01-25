import fetch from "node-fetch";
import { KANARIA_ENDPOINT, SERVER, SINGULAR_ENDPOINT } from "./config";

// data for test
// const singular_account = 'DMkCuik9UA1nKDZzC683Hr6GMermD8Tcqq9HvyCtkfF5QRW';
// const kanaria_account = 'Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr'

const headers = {
  'Content-Type': 'application/json'
};

export const getSingularByAccount = async (account: string) => {
  const url = SINGULAR_ENDPOINT + account
  const data = await fetch(url, {
    method: 'GET',
    headers
  })
    .then(res => res.json())

  let nfts = []
  for (let i = 0; i < data.length; i++) {
    const { description, name, attributes, animation_url, image } = await getMetadata(data[i].metadata)

    nfts.push({
      ...data[i],
      metadata: {
        description,
        name,
        attributes,
        animation_url: getIPFSLink(animation_url),
        image: getIPFSLink(image)
      }
    })
  }

  // console.log(nfts)
  return nfts
}

export const getItemsKanariaByAccount = async (account: string) => {
  const url = KANARIA_ENDPOINT + 'account-items/' + account
  const data = await fetch(url, {
    method: 'GET',
    headers
  })
    .then(res => res.json())

  let nfts = []
  for (let i = 0; i < data.length; i++) {
    const result = await getMetadata(data[i].metadata)

    nfts.push({
      ...data[i],
      metadata: {
        ...result,
        image: getIPFSLink(result.image)
      }
    })
  }

  return nfts
}

export const getBirdsKanariaByAccount = async (account: string) => {
  const url = KANARIA_ENDPOINT + 'account-birds/' + account
  const data = await fetch(url, {
    method: 'GET',
    headers
  })
    .then(res => res.json())

  let nfts = []
  for (let i = 0; i < data.length; i++) {
    const result = await getMetadata(data[i].metadata)

    nfts.push({
      ...data[i],
      metadata: result
    })
  }

  return nfts
}

export const getMetadata = (metadata_url: string) => {
  const url = getIPFSLink(metadata_url)
  if(!url) return undefined
  return fetch(url, {
    method: 'GET',
    headers
  })
    .then(res => res.json())
}

const getIPFSLink = (string: string): string | undefined => string ? SERVER + string.slice(12) : undefined;
