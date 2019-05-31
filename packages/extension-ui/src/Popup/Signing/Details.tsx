// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import findChain from '@polkadot/extension/chains';

type Props = {
  className?: string,
  genesisHash: string,
  method: string,
  nonce: string,
  url: string
};

function Details ({ className, genesisHash, method, nonce, url }: Props) {
  const chain = findChain(genesisHash);

  return (
    <table className={className}>
      <tbody>
        <tr>
          <td className='label'>from</td>
          <td className='data'>{url}</td>
        </tr>
        <tr>
          <td className='label'>{chain ? 'chain' : 'genesis'}</td>
          <td className='data'>{chain ? chain.name : genesisHash}</td>
        </tr>
        <tr>
          <td className='label'>nonce</td>
          <td className='data'>{nonce}</td>
        </tr>
        <tr>
          <td className='label'>method</td>
          <td className='data'>{method}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default styled(Details)`
  border: 0;
  display: block;
  font-size: 0.75rem;
  margin-top: 0.75rem;

  td.data {
    max-width: 0;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    width: 100%;
  }

  td.label {
    opacity: 0.5;
    text-align: right;
  }
`;
