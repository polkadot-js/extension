// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Chain } from '@polkadot/extension-chains/types';
import { ExtrinsicEra, ExtrinsicPayload } from '@polkadot/types/interfaces';
import { SignerPayloadJSON } from '@polkadot/types/types';

import BN from 'bn.js';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import findChain from '@polkadot/extension-chains';
import { GenericCall } from '@polkadot/types';
import { formatNumber, bnToBn } from '@polkadot/util';

interface Decoded {
  json: MethodJson | null;
  method: GenericCall | null;
}

interface MethodJson {
  args: Record<string, string>;
}

interface Props {
  className?: string;
  isDecoded: boolean;
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
  url: string;
}

function decodeMethod (data: string, isDecoded: boolean, chain: Chain, specVersion: BN): Decoded {
  let json: MethodJson | null = null;
  let method: GenericCall | null = null;

  try {
    if (isDecoded && chain.hasMetadata && specVersion.eqn(chain.specVersion)) {
      method = new GenericCall(chain.registry, data);
      json = method.toJSON() as unknown as MethodJson;
    }
  } catch (error) {
    json = null;
    method = null;
  }

  return { json, method };
}

function renderMethod (data: string, { json, method }: Decoded): React.ReactNode {
  if (!json || !method) {
    return (
      <tr>
        <td className='label'>method data</td>
        <td className='data'>{data}</td>
      </tr>
    );
  }

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

function mortalityAsString (era: ExtrinsicEra, hexBlockNumber: string): string {
  if (era.isImmortalEra) {
    return 'immortal';
  }

  const blockNumber = bnToBn(hexBlockNumber);
  const mortal = era.asMortalEra;

  return `mortal, valid from #${formatNumber(mortal.birth(blockNumber))} to #${formatNumber(mortal.death(blockNumber))}`;
}

function Extrinsic ({ className, isDecoded, payload: { era, nonce, tip }, request: { blockNumber, genesisHash, method, specVersion: hexSpec }, url }: Props): React.ReactElement<Props> {
  const chain = useRef(findChain(genesisHash)).current;
  const specVersion = useRef(bnToBn(hexSpec)).current;
  const [decoded, setDecoded] = useState<Decoded>({ json: null, method: null });

  useEffect((): void => {
    setDecoded(decodeMethod(method, isDecoded, chain, specVersion));
  }, [method, isDecoded, chain, specVersion]);

  return (
    <table className={className}>
      <tbody>
        <tr>
          <td className='label'>from</td>
          <td className='data'>{url}</td>
        </tr>
        <tr>
          <td className='label'>{chain.isUnknown ? 'genesis' : 'chain'}</td>
          <td className='data'>{chain.isUnknown ? genesisHash : chain.name}</td>
        </tr>
        <tr>
          <td className='label'>version</td>
          <td className='data'>{specVersion.toNumber()}</td>
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
        {renderMethod(method, decoded)}
        <tr>
          <td className='label'>lifetime</td>
          <td className='data'>{mortalityAsString(era, blockNumber)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default styled(Extrinsic)`
  height: 100%;
  overflow: scroll;
  display: block;
  border: 0;
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};

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
