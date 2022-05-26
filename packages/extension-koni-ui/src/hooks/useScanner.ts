// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountContext } from '@subwallet/extension-koni-ui/components';
import { SCANNER_QR_STEP } from '@subwallet/extension-koni-ui/constants/scanner';
import strings from '@subwallet/extension-koni-ui/constants/strings';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { CompletedParsedData, EthereumParsedData, NetworkParsedData, ParsedData, SubstrateCompletedParsedData, SubstrateParsedData } from '@subwallet/extension-koni-ui/types/scanner';
import { constructDataFromBytes, isAddressString, isJsonString, rawDataToU8A } from '@subwallet/extension-koni-ui/util/decoders';
import { isMultiFramesInfo, isMultipartData, isNetworkParsedData } from '@subwallet/extension-koni-ui/util/scanner';
import { Result as TxRequestData } from '@zxing/library';
import { useCallback, useContext } from 'react';

import { hexStripPrefix, u8aToHex } from '@polkadot/util';

interface ProcessBarcodeFunction {
  (txRequestData: TxRequestData): void
}

const useScanner = (showAlertMessage: (message: string, isSuccess?: boolean) => void): ProcessBarcodeFunction => {
  const { getAccountByAddress } = useContext(AccountContext);
  const scannerStore = useContext(ScannerContext);

  const parseQrData = useCallback((txRequestData: TxRequestData): ParsedData => {
    if (isAddressString(txRequestData.getText())) {
      throw new Error(strings.ERROR_ADDRESS_MESSAGE);
    } else if (isJsonString(txRequestData.getText())) {
      // Add Network
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsedJsonData = JSON.parse(txRequestData.getText());

      // eslint-disable-next-line no-prototype-builtins,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (parsedJsonData.hasOwnProperty('genesisHash')) {
        return {
          action: 'addNetwork',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: parsedJsonData
        } as NetworkParsedData;
      }

      // Ethereum Legacy
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return parsedJsonData;
    } else if (!scannerStore.state.multipartComplete) {
      const bytes = txRequestData.getRawBytes();
      const _raw = hexStripPrefix(u8aToHex(bytes));
      const strippedData = rawDataToU8A(_raw);

      if (strippedData === null) {
        throw new Error(strings.ERROR_NO_RAW_DATA);
      }

      return constructDataFromBytes(strippedData, false);
    } else {
      throw new Error(strings.ERROR_NO_RAW_DATA);
    }
  }, [scannerStore.state.multipartComplete]);

  const checkMultiFramesData = useCallback((parsedData: SubstrateParsedData | EthereumParsedData): null | CompletedParsedData => {
    if (isMultipartData(parsedData)) {
      const multiFramesResult = scannerStore.setPartData(parsedData.currentFrame, parsedData.frameCount, parsedData.partData);

      if (isMultiFramesInfo(multiFramesResult)) {
        return null;
      }

      // Otherwise all the frames are assembled as completed parsed data
      return multiFramesResult;
    } else {
      return parsedData;
    }
  }, [scannerStore]);

  const processBarCode = useCallback((txRequestData: TxRequestData): void => {
    try {
      const parsedData = parseQrData(txRequestData);

      const genesisHash = (parsedData as SubstrateCompletedParsedData)?.data?.genesisHash;

      if (isNetworkParsedData(parsedData)) {
        return showAlertMessage(
          'Adding a network is not supported in this screen',
          false);
      }

      const unsignedData = checkMultiFramesData(parsedData);

      if (unsignedData === null) {
        return showAlertMessage(
          'Unsigned data is null',
          false);
      }

      const qrInfo = scannerStore.setData(unsignedData);

      scannerStore.clearMultipartProgress();

      const { senderAddress } = qrInfo;
      const senderAccount = getAccountByAddress(senderAddress, genesisHash);

      if (!senderAccount) {
        return showAlertMessage(strings.ERROR_NO_SENDER_FOUND);
      }

      scannerStore.setStep(SCANNER_QR_STEP.VIEW_DETAIL_STEP);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'unknown error :(';

      return showAlertMessage(message);
    }
  }, [checkMultiFramesData, getAccountByAddress, parseQrData, scannerStore, showAlertMessage]);

  return processBarCode;
};

export default useScanner;
