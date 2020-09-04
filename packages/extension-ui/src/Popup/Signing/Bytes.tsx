// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import styled from 'styled-components';
import React from 'react';

import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  bytes: string;
  url: string;
}

function Bytes ({ bytes, className, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <table className={className}>
      <tbody>
        <tr>
          <td className='label'>{t('from')}</td>
          <td className='data'>{url}</td>
        </tr>
        <tr>
          <td className='label'>{t('bytes')}</td>
          <td className='data'>{bytes}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default styled(Bytes)`
  border: 0;
  display: block;
  font-size: 0.75rem;
  margin-top: 0.75rem;

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
