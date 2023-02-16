// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ResponseJsonGetAccountInfo } from '@polkadot/extension-base/background/types';
import type { KeyringPair$Json } from '@polkadot/keyring/types';
import type { KeyringPairs$Json } from '@polkadot/ui-keyring/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { u8aToString } from '@polkadot/util';

import { AccountContext, ActionContext } from '../../components';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { batchRestore, jsonGetAccountInfo, jsonRestore } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import { isKeyringPairs$Json } from '../../util/typeGuards';
import ImportJsonConfirmStep from './ImportJsonConfirmStep';
import ImportJsonDropzoneStep from './ImportJsonDropzoneStep';

function Upload(): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const { show } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const [accountsInfo, setAccountsInfo] = useState<ResponseJsonGetAccountInfo[]>([]);
  const [password, setPassword] = useState<string>('');
  const [isFileError, setFileError] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [step, setStep] = useState<number>(1);
  // don't use the info from the file directly
  // rather use what comes from the background from jsonGetAccountInfo
  const [file, setFile] = useState<KeyringPair$Json | KeyringPairs$Json | undefined>(undefined);
  const [fileName, setFileName] = useState<string>('');

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);

  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  const _onChangePass = useCallback((pass: string): void => {
    setPassword(pass);
    setIsPasswordError(false);
  }, []);

  const _onChangeFile = useCallback(
    (file: Uint8Array): void => {
      setAccountsInfo(() => []);

      let json: KeyringPair$Json | KeyringPairs$Json | undefined;

      try {
        json = JSON.parse(u8aToString(file)) as KeyringPair$Json | KeyringPairs$Json;
        setFile(json);
        _onNextStep();
      } catch (e) {
        console.error(e);
        setFileError(true);
      }

      if (json === undefined) {
        return;
      }

      if (isKeyringPairs$Json(json)) {
        setRequirePassword(true);
        json.accounts.forEach((account) => {
          setAccountsInfo((old) => [
            ...old,
            {
              address: account.address,
              genesisHash: account.meta.genesisHash,
              name: account.meta.name
            } as ResponseJsonGetAccountInfo
          ]);
        });
      } else {
        setRequirePassword(true);
        jsonGetAccountInfo(json)
          .then((accountInfo) => setAccountsInfo((old) => [...old, accountInfo]))
          .catch((e) => {
            setFileError(true);
            console.error(e);
          });
      }
    },
    [_onNextStep]
  );

  const _onRestore = useCallback((): void => {
    if (!file) {
      return;
    }

    if (requirePassword && !password) {
      return;
    }

    setIsBusy(true);

    (isKeyringPairs$Json(file) ? batchRestore(file, password) : jsonRestore(file, password))
      .then(() => {
        show(t('Import successful'), 'success');
        onAction('/');
      })
      .catch((e) => {
        console.error(e);
        setIsBusy(false);
        setIsPasswordError(true);
      });
  }, [file, onAction, password, requirePassword, show, t]);

  return (
    <>
      <HeaderWithSteps
        step={step}
        text={t<string>('Import from JSON file')}
        total={2}
        withBackArrow
      />
      {step === 1 && (
        <ImportJsonDropzoneStep
          isFileError={isFileError}
          onChangeFile={_onChangeFile}
          setFileName={setFileName}
        />
      )}
      {step === 2 && (
        <ImportJsonConfirmStep
          accountsInfo={accountsInfo}
          fileName={fileName}
          isPasswordError={isPasswordError}
          onChangePass={_onChangePass}
          onNextStep={_onRestore}
          onPreviousStep={_onPreviousStep}
          requirePassword={requirePassword}
        />
      )}
    </>
  );
}

export default Upload;
