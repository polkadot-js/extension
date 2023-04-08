// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useOpenQrScanner from "@subwallet-webapp/hooks/qr/useOpenQrScanner";
import { QrAccount, ScannerResult } from "@subwallet-webapp/types/scanner";
import { ValidateState } from "@subwallet-webapp/types/validator";
import { useCallback, useMemo } from "react";

const useScanAccountQr = (
  modalId: string,
  convertResult: (data: string) => QrAccount | null,
  setValidateState: (state: ValidateState) => void,
  onSubmit: (_account: QrAccount) => void
) => {
  const onOpen = useOpenQrScanner(modalId);

  const handleResult = useCallback(
    (val: string): QrAccount | null => {
      const result = convertResult(val);

      if (result) {
        return result;
      } else {
        setValidateState({
          message: "Invalid QR",
          status: "error",
        });

        return null;
      }
    },
    [convertResult, setValidateState]
  );

  const openCamera = useCallback(() => {
    setValidateState({});
    onOpen();
  }, [onOpen, setValidateState]);

  const onSuccess = useCallback(
    (result: ScannerResult) => {
      const rs = handleResult(result.text);

      if (rs) {
        onSubmit(rs);
      }
    },
    [handleResult, onSubmit]
  );

  const onClose = useCallback(() => {
    setValidateState({});
  }, [setValidateState]);

  const onError = useCallback(
    (error: string) => {
      setValidateState({
        message: error,
        status: "error",
      });
    },
    [setValidateState]
  );

  return useMemo(
    () => ({
      openCamera,
      onSuccess,
      onClose,
      onError,
    }),
    [onClose, onError, onSuccess, openCamera]
  );
};

export default useScanAccountQr;
