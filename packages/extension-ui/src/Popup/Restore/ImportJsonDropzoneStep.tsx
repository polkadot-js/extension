// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { InputFileWithLabel, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';

const acceptedFormats = ['application/json', 'text/plain'].join(', ');

interface Props {
  className?: string;
  onChangeFile: (file: Uint8Array) => void;
  isFileError: boolean;
  setFileName: (fileName: string) => void;
}

function ImportJsonDropzoneStep({ className, isFileError, onChangeFile, setFileName }: Props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <div className={className}>
        <InputFileWithLabel
          accept={acceptedFormats}
          isError={isFileError}
          onChange={onChangeFile}
          setFileName={setFileName}
        />
        {isFileError && <Warning isDanger>{t<string>('Invalid Json file')}</Warning>}
      </div>
    </>
  );
}

export default styled(ImportJsonDropzoneStep)`
  .restoreButton {
    margin-top: 16px;
  }
`;
