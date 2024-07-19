// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

export interface RequestMetadataHash {
  chain: string;
}

export interface ResponseMetadataHash {
  metadataHash: string;
}

export interface RequestShortenMetadata {
  chain: string;
  txBlob: string;
}

export interface ResponseShortenMetadata {
  txMetadata: string;
}
