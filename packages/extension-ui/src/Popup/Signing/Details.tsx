// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import findChain from '@polkadot/extension/chains';
import { Metadata, Method } from '@polkadot/types';

type MethodJson = {
  args: { [index: string]: any }
};

type Props = {
  className?: string,
  genesisHash: string,
  isDecoded: boolean,
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

  const method = new Method(data, Method.findByValue(data, meta));
  const json = method.toJSON() as unknown as MethodJson;

  return (
    <>
      <tr>
        <td className='label'>method</td>
        <td className='data'>{method.sectionName}.{method.methodName}</td>
      </tr>
      <tr>
        <td className='label'>&nbsp;</td>
        <td className='data'><pre>{JSON.stringify(json.args, null, 2)}</pre></td>
      </tr>
      {method.meta && (
        <tr>
          <td className='label'>info</td>
          <td className='data'>
            <details>
              <summary>{method.meta.documentation.join(' ')}</summary>
            </details>
          </td>
        </tr>
      )}
    </>
  );
}

function Details ({ className, genesisHash, isDecoded, method, nonce, url }: Props) {
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
        {renderMethod(method, (chain && isDecoded) ? chain.meta : null)}
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

  details {
    cursor: pointer;
    max-width: 24rem;

    &[open] summary {
      white-space: normal;
    }

    summary {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      outline: 0;
    }
  }
`;
