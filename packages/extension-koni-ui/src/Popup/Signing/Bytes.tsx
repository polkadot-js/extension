// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from 'react';
import styled from 'styled-components';

import { isAscii, u8aToString, u8aUnwrapBytes } from '@polkadot/util';

import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  bytes: string;
  url: string;
}

function Bytes ({ bytes, className, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const text = useMemo(
    () => isAscii(bytes)
      ? u8aToString(u8aUnwrapBytes(bytes))
      : bytes,
    [bytes]
  );

  return (
    <table className={className}>
      <tbody>
        <tr>
          <td className='label'>{t<string>('from')}</td>
          <td className='data'>{url}</td>
        </tr>
        <tr>
          <td className='label'>{t<string>('bytes')}</td>
          <td className='data'>{text}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default styled(Bytes)`
  border: 0;
  display: block;
  font-size: 15px;
  margin: 20px 15px 0;

  td.data {
    max-width: 0;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    vertical-align: middle;
    width: 100%;

    pre {
      font-family: inherit;
      font-size: 0.75rem;
      margin: 0;
    }
  }

  td.label {
    opacity: 0.5;
    padding: 0 0.5rem;
    text-align: right;
    vertical-align: middle;
    white-space: nowrap;
  }
`;
