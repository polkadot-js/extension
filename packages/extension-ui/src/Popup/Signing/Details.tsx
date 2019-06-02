// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import findChain from '@polkadot/extension/chains';
import fromMetadata from '@polkadot/extrinsics/fromMetadata';
import { Metadata, Method } from '@polkadot/types';

type Props = {
  className?: string,
  genesisHash: string,
  method: string,
  nonce: string,
  url: string
};

function renderMethod (data: string, meta?: Metadata | null) {
  if (!meta) {
    return (
      <tr>
        <td className='label'>method data</td>
        <td className='data'>{data}</td>
      </tr>
    );
  }

  Method.injectMethods(fromMetadata(meta));

  const method = new Method(data);
  const methodfn = Method.findFunction(method.callIndex);

  return (
    <tr>
      <td className='label'>{methodfn.section}.{methodfn.method}</td>
      <td className='data'><pre>{JSON.stringify(method.toJSON().args, null, 2)}</pre></td>
    </tr>
  );
}

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
        {renderMethod(method, chain ? chain.meta : null)}
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
    vertical-align: top;
    width: 100%;

    pre {
      font-family: inherit;
      font-size: 0.75rem;
      margin: 0;
    }
  }

  td.label {
    opacity: 0.5;
    text-align: right;
    vertical-align: top;
    white-space: nowrap;
  }
`;
