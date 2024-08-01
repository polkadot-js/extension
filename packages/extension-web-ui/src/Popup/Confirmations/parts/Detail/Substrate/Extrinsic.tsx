// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@subwallet/extension-chains/types';
import type { Call, ExtrinsicEra, ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { AnyJson, SignerPayloadJSON } from '@polkadot/types/types';

import { AccountJson } from '@subwallet/extension-base/background/types';
import MetaInfo from '@subwallet/extension-web-ui/components/MetaInfo/MetaInfo';
import useGetChainInfoByGenesisHash from '@subwallet/extension-web-ui/hooks/chain/useGetChainInfoByGenesisHash';
import useMetadata from '@subwallet/extension-web-ui/hooks/transaction/confirmation/useMetadata';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { toShort } from '@subwallet/extension-web-ui/utils';
import { TFunction } from 'i18next';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BN, bnToBn, formatNumber } from '@polkadot/util';

interface Decoded {
  args: AnyJson | null;
  method: Call | null;
}

interface Props extends ThemeProps {
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
  account: AccountJson;
}

const displayDecodeVersion = (message: string, chain: Chain, specVersion: BN): string => {
  return `${message}: chain=${chain.name}, specVersion=${chain.specVersion.toString()} (request specVersion=${specVersion.toString()})`;
};

const decodeMethod = (data: string, chain: Chain, specVersion: BN): Decoded => {
  let args: AnyJson | null = null;
  let method: Call | null = null;

  try {
    if (specVersion.eqn(chain.specVersion)) {
      method = chain.registry.createType('Call', data);
      args = (method.toHuman() as { args: AnyJson }).args;
    } else {
      console.log(displayDecodeVersion('Your metadata is out of date', chain, specVersion));
    }
  } catch (error) {
    console.error(`${displayDecodeVersion('Error decoding method', chain, specVersion)}:: ${(error as Error).message}`);

    args = null;
    method = null;
  }

  return { args, method };
};

const renderMethod = (data: string, { args, method }: Decoded, t: TFunction): React.ReactNode => {
  if (!args || !method) {
    return (
      <MetaInfo.Data label={t<string>('Method data')}>
        {data}
      </MetaInfo.Data>
    );
  }

  return (
    <div className='method-container'>
      <MetaInfo.Data label={t<string>('Method')}>
        <details>
          <summary>
            {method.section}.{method.method}{method.meta ? `(${method.meta.args.map(({ name }) => name).join(', ')})` : ''}
          </summary>
          <pre>{JSON.stringify(args, null, 2)}</pre>
        </details>
      </MetaInfo.Data>
      {
        method.meta && (
          <MetaInfo.Data label={t<string>('Info')}>
            <details>
              <summary>{method.meta.docs.map((d) => d.toString().trim()).join(' ')}</summary>
            </details>
          </MetaInfo.Data>
        )
      }
    </div>
  );
};

const mortalityAsString = (era: ExtrinsicEra, hexBlockNumber: string, t: TFunction): string => {
  if (era.isImmortalEra) {
    return t<string>('immortal');
  }

  const blockNumber = bnToBn(hexBlockNumber);
  const mortal = era.asMortalEra;

  return t<string>('mortal, valid from {{birth}} to {{death}}', {
    replace: {
      birth: formatNumber(mortal.birth(blockNumber)),
      death: formatNumber(mortal.death(blockNumber))
    }
  });
};

const Component: React.FC<Props> = ({ account, className, payload: { era, nonce, tip }, request: { blockNumber, genesisHash, method, specVersion: hexSpec } }: Props) => {
  const { t } = useTranslation();
  const { chain } = useMetadata(genesisHash);
  const chainInfo = useGetChainInfoByGenesisHash(genesisHash);
  const specVersion = useRef(bnToBn(hexSpec)).current;
  const decoded = useMemo(
    () => chain && chain.hasMetadata
      ? decodeMethod(method, chain, specVersion)
      : { args: null, method: null },
    [method, chain, specVersion]
  );

  return (
    <MetaInfo className={className}>
      {
        chainInfo
          ? (
            <MetaInfo.Chain
              chain={chainInfo.slug}
              label={t<string>('Network')}
            />
          )
          : (
            <MetaInfo.Default
              label={t<string>('GenesisHash')}
            >
              {toShort(genesisHash, 10, 10)}
            </MetaInfo.Default>
          )
      }
      <MetaInfo.Account
        address={account.address}
        label={t('From')}
        name={account.name}
        networkPrefix={chain?.ss58Format ?? chainInfo?.substrateInfo?.addressPrefix}
      />
      <MetaInfo.Number
        label={t<string>('Version')}
        value={specVersion.toNumber()}
      />
      <MetaInfo.Number
        label={t<string>('Nonce')}
        value={formatNumber(nonce)}
      />
      {!tip.isEmpty && (
        <MetaInfo.Number
          decimals={chainInfo?.substrateInfo?.decimals || 0}
          label={t<string>('Tip')}
          suffix={chainInfo?.substrateInfo?.symbol}
          value={tip.toPrimitive() as string | number}
        />
      )}
      {renderMethod(method, decoded, t)}
      <MetaInfo.Data
        label={t('Lifetime')}
      >
        {mortalityAsString(era, blockNumber, t)}
      </MetaInfo.Data>
    </MetaInfo>
  );
};

const SubstrateExtrinsic = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.method-container': {
      marginTop: token.margin,
      marginBottom: token.margin,

      '.__value': {
        width: '100%'
      },

      details: {
        cursor: 'pointer',

        summary: {
          textOverflow: 'ellipsis',
          outline: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        },

        '&[open] summary': {
          whiteSpace: 'normal'
        },

        pre: {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }
      }
    }
  };
});

export default SubstrateExtrinsic;
