// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface UnlockDotAdditionalData {
  slug: string;
  network: string;
  extrinsicHash?: string;
}

/* Axios */

export interface UnlockDotCheckMintRequest {
  address: string;
  additionalData: UnlockDotAdditionalData;
  category: string;
  campaignId: number;
}

export interface UnlockDotCheckMintResponse {
  requestId: number | null;
  userId: number;
  validUser: boolean;
  validCampaign: boolean;
  validCategory: boolean;
  isWhiteList: boolean;
  isOwner: boolean;
  hasBalance: boolean;
  notDuplicated: boolean;
  inMintingTime: boolean;
}

export interface UnlockDotMintedData {
  id: number;
  campaignId: number;
  collectionId: number;
  userId: number;
  address: string;
  status: string;
  extrinsicHash: string;
  mintCategory: string;
  mintDate: null;
  rmrkNftId: string;
  nftName: string;
  nftImage: string;
  recipient: string;
  blockNumber: number;
  additionalData: string;
}

export type UnlockDotTransactionNft = UnlockDotMintedData | undefined | Pick<UnlockDotMintedData, 'nftImage'>;

export interface UnlockDotFetchMintedRequest {
  address: string;
}

export type UnlockDotFetchMintedResponse = UnlockDotMintedData[];

export interface UnlockDotMintSubmitRequest {
  recipient: string;
  requestId: number;
}

export type UnlockDotMintSubmitResponse = UnlockDotMintedData;

/* Axios */

/* Background */

export interface UnlockDotCheckMintData {
  address: string;
  slug: string;
  network: string;
  extrinsicHash?: string;
}

export interface UnlockDotSubmitMintData {
  transactionId: string;
  address: string;
  slug: string;
  network: string;
  extrinsicHash: string;
}

export interface RequestUnlockDotCheckCanMint {
  address: string;
  slug: string;
  network: string;
}

export interface RequestUnlockDotSubscribeMintedData {
  transactionId: string;
}

/* Background */
