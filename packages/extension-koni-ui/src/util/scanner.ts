// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EthereumParsedData, MultiFramesInfo, NetworkParsedData, ParsedData, SubstrateCompletedParsedData, SubstrateMessageParsedData, SubstrateMultiParsedData } from '@subwallet/extension-koni-ui/types/scanner';

export const unwrapMessage = (message: string) => {
  const prefix = '<Bytes>';
  const suffix = '</Bytes>';

  let unwrapped = message;

  unwrapped = unwrapped.substr(0, prefix.length) === prefix ? unwrapped.substr(prefix.length, unwrapped.length) : unwrapped;
  unwrapped = unwrapped.substr(unwrapped.length - suffix.length, suffix.length) === suffix ? unwrapped.substr(0, unwrapped.length - suffix.length) : unwrapped;

  return unwrapped;
};

export function isMultiFramesInfo (data: MultiFramesInfo | SubstrateCompletedParsedData): data is MultiFramesInfo {
  return (data as MultiFramesInfo).completedFramesCount !== undefined;
}

export function isEthereumCompletedParsedData (parsedData: ParsedData): parsedData is EthereumParsedData {
  return (parsedData as EthereumParsedData).data.rlp !== undefined;
}

export function isSubstrateCompletedParsedData (parsedData: ParsedData | null): parsedData is SubstrateCompletedParsedData {
  return (
    (parsedData as SubstrateCompletedParsedData)?.data?.crypto !== undefined
  );
}

export function isSubstrateMessageParsedData (parsedData: ParsedData | null): parsedData is SubstrateMessageParsedData {
  return (
    (parsedData as SubstrateCompletedParsedData)?.data?.crypto !== undefined && (parsedData as SubstrateCompletedParsedData)?.action === 'signData'
  );
}

export function isMultipartData (parsedData: ParsedData | null): parsedData is SubstrateMultiParsedData {
  const hasMultiFrames = (parsedData as SubstrateMultiParsedData)?.frameCount !== undefined && (parsedData as SubstrateMultiParsedData).frameCount > 1;

  return (
    (parsedData as SubstrateMultiParsedData)?.isMultipart || hasMultiFrames
  );
}

export function isNetworkParsedData (parsedData: ParsedData | null): parsedData is NetworkParsedData {
  return (parsedData as NetworkParsedData).action === 'addNetwork';
}
