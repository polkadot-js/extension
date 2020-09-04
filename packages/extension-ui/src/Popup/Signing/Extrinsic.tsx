// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Chain } from '@polkadot/extension-chains/types';
import { Call, ExtrinsicEra, ExtrinsicPayload } from '@polkadot/types/interfaces';
import { AnyJson, SignerPayloadJSON } from '@polkadot/types/types';

import BN from 'bn.js';
import React, { useEffect, useRef, useState } from 'react';
import { formatNumber, bnToBn } from '@polkadot/util';

import { Table } from '../../components';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';

interface Decoded {
  args: AnyJson | null;
  method: Call | null;
}

interface Props {
  className?: string;
  isDecoded: boolean;
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
  url: string;
}

function decodeMethod (data: string, isDecoded: boolean, chain: Chain | null, specVersion: BN): Decoded {
  let args: AnyJson | null = null;
  let method: Call | null = null;

  try {
    if (isDecoded && chain && chain.hasMetadata && specVersion.eqn(chain.specVersion)) {
      method = chain.registry.createType('Call', data);
      args = (method.toHuman() as { args: AnyJson }).args;
    }
  } catch (error) {
    args = null;
    method = null;
  }

  return { args, method };
}

function renderMethod (data: string, { args, method }: Decoded, t: (key: string) => string): React.ReactNode {
  if (!args || !method) {
    return (
      <tr>
        <td className='label'>{t('method data')}</td>
        <td className='data'>{data}</td>
      </tr>
    );
  }

  return (
    <>
      <tr>
        <td className='label'>{t('method')}</td>
        <td className='data'>
          <details>
            <summary>{method.sectionName}.{method.methodName}{
              method.meta
                ? `(${method.meta.args.map(({ name }) => name).join(', ')})`
                : ''
            }</summary>
            <pre>{JSON.stringify(args, null, 2)}</pre>
          </details>
        </td>
      </tr>
      {method.meta && (
        <tr>
          <td className='label'>{t('info')}</td>
          <td className='data'>
            <details>
              <summary>{method.meta.documentation.map((d) => d.toString().trim()).join(' ')}</summary>
            </details>
          </td>
        </tr>
      )}
    </>
  );
}

function mortalityAsString (era: ExtrinsicEra, hexBlockNumber: string, t: (key: string, options?: { replace: Record<string, string> }) => string): string {
  if (era.isImmortalEra) {
    return t('immortal');
  }

  const blockNumber = bnToBn(hexBlockNumber);
  const mortal = era.asMortalEra;

  return t('mortal, valid from {{birth}} to {{death}}', {
    replace: {
      birth: formatNumber(mortal.birth(blockNumber)),
      death: formatNumber(mortal.death(blockNumber))
    }
  });
}

function Extrinsic ({ className, isDecoded, payload: { era, nonce, tip }, request: { blockNumber, genesisHash, method, specVersion: hexSpec }, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chain = useMetadata(genesisHash);
  const specVersion = useRef(bnToBn(hexSpec)).current;
  const [decoded, setDecoded] = useState<Decoded>({ args: null, method: null });

  useEffect((): void => {
    setDecoded(decodeMethod(method, isDecoded, chain, specVersion));
  }, [method, isDecoded, chain, specVersion]);

  return (
    <Table
      className={className}
      isFull
    >
      <tr>
        <td className='label'>{t('from')}</td>
        <td className='data'>{url}</td>
      </tr>
      <tr>
        <td className='label'>{chain ? t('chain') : t('genesis')}</td>
        <td className='data'>{chain ? chain.name : genesisHash}</td>
      </tr>
      <tr>
        <td className='label'>{t('version')}</td>
        <td className='data'>{specVersion.toNumber()}</td>
      </tr>
      <tr>
        <td className='label'>{t('nonce')}</td>
        <td className='data'>{formatNumber(nonce)}</td>
      </tr>
      {!tip.isEmpty && (
        <tr>
          <td className='label'>{t('tip')}</td>
          <td className='data'>{formatNumber(tip)}</td>
        </tr>
      )}
      {renderMethod(method, decoded, t)}
      <tr>
        <td className='label'>lifetime</td>
        <td className='data'>{mortalityAsString(era, blockNumber, t)}</td>
      </tr>
    </Table>
  );
}

export default React.memo(Extrinsic);
