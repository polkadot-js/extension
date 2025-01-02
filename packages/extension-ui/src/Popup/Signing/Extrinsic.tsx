// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@polkadot/extension-chains/types';
import type { Call, ExtrinsicEra, ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { AnyJson, SignerPayloadJSON } from '@polkadot/types/types';
import type { BN } from '@polkadot/util';
import type { TFunction } from '../../hooks/useTranslation.js';

import { convertMultilocationToUrl } from '@paraspell/xcm-analyser';
import React, { useMemo, useRef } from 'react';

import { bnToBn, formatNumber } from '@polkadot/util';

import { Table } from '../../components/index.js';
import { useMetadata, useTranslation } from '../../hooks/index.js';

interface Decoded {
  args: AnyJson | null;
  method: Call | null;
}

interface Props {
  className?: string;
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
  url: string;
}

function displayDecodeVersion (message: string, chain: Chain, specVersion: BN): string {
  return `${message}: chain=${chain.name}, specVersion=${chain.specVersion.toString()} (request specVersion=${specVersion.toString()})`;
}

function decodeMethod (data: string, chain: Chain, specVersion: BN): Decoded {
  let args: AnyJson | null = null;
  let method: Call | null = null;

  try {
    if (specVersion.eqn(chain.specVersion)) {
      method = chain.registry.createType('Call', data);
      args = (method.toHuman() as { args: AnyJson }).args;
    } else {
      console.log(displayDecodeVersion('Outdated metadata to decode', chain, specVersion));
    }
  } catch (error) {
    console.error(`${displayDecodeVersion('Error decoding method', chain, specVersion)}:: ${(error as Error).message}`);

    args = null;
    method = null;
  }

  return { args, method };
}

function renderMethod (data: string, { args, method }: Decoded, t: TFunction): React.ReactNode {
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
            <summary>{method.section}.{method.method}{
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
              <summary>{method.meta.docs.map((d) => d.toString().trim()).join(' ')}</summary>
            </details>
          </td>
        </tr>
      )}
    </>
  );
}

function mortalityAsString (era: ExtrinsicEra, hexBlockNumber: string, t: TFunction): string {
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

function getHumanReadableAssetId (assetId: unknown): string | undefined {
  try {
    return convertMultilocationToUrl(assetId);
  } catch (_) {
    return undefined;
  }
}

function Extrinsic ({ className, payload, request: { blockNumber, genesisHash, method, specVersion: hexSpec }, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chain = useMetadata(genesisHash);
  const specVersion = useRef(bnToBn(hexSpec)).current;
  const decoded = useMemo(
    () => chain && chain.hasMetadata
      ? decodeMethod(method, chain, specVersion)
      : { args: null, method: null },
    [method, chain, specVersion]
  );

  const humanReadablePayload = payload.toHuman() as Record<string, unknown>;
  const assetId = humanReadablePayload['assetId'];
  const humanReadableAssetId = getHumanReadableAssetId(assetId);

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
        <td className='data'>{formatNumber(payload.nonce)}</td>
      </tr>
      {!payload.tip.isEmpty && (
        <tr>
          <td className='label'>{t('tip')}</td>
          <td className='data'>{formatNumber(payload.tip)}</td>
        </tr>
      )}
      {assetId && (
        <tr>
          <td className='label'>{t('assetId')}</td>
          <td className='data'>
            <details>
              <summary>{humanReadableAssetId || '{...}'}</summary>
              <pre>{JSON.stringify(assetId, null, 2)}</pre>
            </details>
          </td>
        </tr>
      )}
      {renderMethod(method, decoded, t)}
      <tr>
        <td className='label'>{t('lifetime')}</td>
        <td className='data'>{mortalityAsString(payload.era, blockNumber, t)}</td>
      </tr>
    </Table>
  );
}

export default React.memo(Extrinsic);
