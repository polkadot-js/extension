// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { BlockNumber, ExtrinsicEra, ExtrinsicPayload } from '@polkadot/types/interfaces';
import { SignerPayloadJSON } from '@polkadot/types/types';

import React from 'react';
import styled from 'styled-components';
import fromMetadata from '@polkadot/api-metadata/extrinsics/fromMetadata';
import findChain from '@polkadot/extension-chains';
import { createType, GenericCall, Metadata } from '@polkadot/types';
import { formatNumber } from '@polkadot/util';

interface MethodJson {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>;
}

interface Props {
  className?: string;
  isDecoded: boolean;
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
  url: string;
}

function renderMethod (data: string, meta?: Metadata | null): React.ReactNode {
  if (!meta) {
    return (
      <tr>
        <td className='label'>method data</td>
        <td className='data'>{data}</td>
      </tr>
    );
  }

  GenericCall.injectMethods(fromMetadata(meta));

  const method = new GenericCall(data);
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

function renderMortality (era: ExtrinsicEra, blockNumber: BlockNumber): string {
  if (era.isImmortalEra) {
    return 'immortal';
  }

  const mortal = era.asMortalEra;

  return `mortal, valid from #${formatNumber(mortal.birth(blockNumber))} to #${formatNumber(mortal.death(blockNumber))}`;
}

function Details ({ className, isDecoded, payload, request, url }: Props): React.ReactElement<Props> {
  const blockNumber = createType('BlockNumber', request.blockNumber);
  const { genesisHash, method } = request;
  const { era, nonce, tip } = payload;
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
          <td className='data'>{formatNumber(nonce)}</td>
        </tr>
        {!tip.isEmpty && (
          <tr>
            <td className='label'>tip</td>
            <td className='data'>{formatNumber(tip)}</td>
          </tr>
        )}
        {renderMethod(method, isDecoded ? chain.meta : null)}
        <tr>
          <td className='label'>lifetime</td>
          <td className='data'>{renderMortality(era, blockNumber)}</td>
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
