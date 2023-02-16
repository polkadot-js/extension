// Copyright 2017-2023 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { createRef, useCallback, useState } from 'react';
import Dropzone, { DropzoneRef } from 'react-dropzone';
import styled from 'styled-components';

import { formatNumber, hexToU8a, isHex, u8aToString } from '@polkadot/util';

import uploadIcon from '../assets/upload.svg';
import useTranslation from '../hooks/useTranslation';
import Label from './Label';
import Svg from './Svg';

function classes(...classNames: (boolean | null | string | undefined)[]): string {
  return classNames.filter((className): boolean => !!className).join(' ');
}

export interface InputFileProps {
  // Reference Example Usage: https://github.com/react-dropzone/react-dropzone/tree/master/examples/Accept
  // i.e. MIME types: 'application/json, text/plain', or '.json, .txt'
  className?: string;
  accept?: string;
  clearContent?: boolean;
  convertHex?: boolean;
  help?: React.ReactNode;
  isDisabled?: boolean;
  isError?: boolean;
  label: string;
  onChange?: (contents: Uint8Array, name: string) => void;
  placeholder?: React.ReactNode | null;
  withEllipsis?: boolean;
  withLabel?: boolean;
  setFileName: (name: string) => void;
}

interface FileState {
  name: string;
  size: number;
}

const BYTE_STR_0 = '0'.charCodeAt(0);
const BYTE_STR_X = 'x'.charCodeAt(0);
const NOOP = (): void => undefined;

function convertResult(result: ArrayBuffer, convertHex?: boolean): Uint8Array {
  const data = new Uint8Array(result);

  // this converts the input (if detected as hex), vai the hex conversion route
  if (convertHex && data[0] === BYTE_STR_0 && data[1] === BYTE_STR_X) {
    const hex = u8aToString(data);

    if (isHex(hex)) {
      return hexToU8a(hex);
    }
  }

  return data;
}

function InputFile({
  accept,
  className = '',
  clearContent,
  convertHex,
  isDisabled,
  isError = false,
  label,
  onChange,
  placeholder,
  setFileName
}: InputFileProps): React.ReactElement<InputFileProps> {
  const { t } = useTranslation();
  const dropRef = createRef<DropzoneRef>();
  const [file, setFile] = useState<FileState | undefined>();

  const _onDrop = useCallback(
    (files: File[]): void => {
      files.forEach((file): void => {
        const reader = new FileReader();

        reader.onabort = NOOP;
        reader.onerror = NOOP;

        reader.onload = ({ target }: ProgressEvent<FileReader>): void => {
          if (target && target.result) {
            const name = file.name;
            const data = convertResult(target.result as ArrayBuffer, convertHex);

            onChange && onChange(data, name);

            if (dropRef) {
              setFile({
                name,
                size: data.length
              });

              setFileName(name);
            }
          }
        };

        reader.readAsArrayBuffer(file);
      });
    },
    [convertHex, dropRef, onChange, setFileName]
  );

  const dropZone = (
    <Dropzone
      accept={accept}
      disabled={isDisabled}
      multiple={false}
      onDrop={_onDrop}
      ref={dropRef}
    >
      {({ getInputProps, getRootProps }): JSX.Element => (
        <div {...getRootProps({ className: classes('ui--InputFile', isError ? 'error' : '', className) })}>
          <input {...getInputProps()} />
          <div className='container'>
            <Svg
              className='upload-icon'
              src={uploadIcon}
            />
            <em className='label'>
              {!file || clearContent
                ? placeholder || (
                    <span>
                      {t('Drag & drop JSON file here\nor')}&nbsp;<span className='link'>{t('browse')}.</span>
                    </span>
                  )
                : placeholder ||
                  t('{{name}} ({{size}} bytes)', {
                    replace: {
                      name: file.name,
                      size: formatNumber(file.size)
                    }
                  })}
            </em>
          </div>
        </div>
      )}
    </Dropzone>
  );

  return label ? <Label label={label}>{dropZone}</Label> : dropZone;
}

export default React.memo(
  styled(InputFile)(
    ({ isError, theme }: InputFileProps & ThemeProps) => `
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed ${isError ? theme.errorBorderColor : theme.inputFileBorderColor};
  border-radius: 2px;
  color: ${isError ? theme.errorBorderColor : theme.subTextColor};
  overflow-wrap: anywhere;
  padding: 0.5rem 0.75rem;
  margin-top: 72px;
  height: 328px;


  &:hover {
    cursor: pointer;
  }

  .upload-icon {
    width: 20px;
    height: 20px;
    background: ${theme.iconNeutralColor}
  }

  .link {
    color: ${theme.primaryColor};
    cursor: pointer;

    :hover {
      text-decoration: underline;
    }
  }

  span {
    font-style: normal;
    font-weight: 300;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0.04em;
    white-space: pre-line;
    text-align: center;
  }

  .container{
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    text-align: center;
  }
`
  )
);
