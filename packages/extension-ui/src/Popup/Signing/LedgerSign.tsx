// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@polkadot/extension-chains/types';
import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';

import { assert, objectSpread, u8aToHex } from '@polkadot/util';
import { merkleizeMetadata } from '@polkadot-api/merkleize-metadata';

import { Button, Warning } from '../../components/index.js';
import { useLedger, useMetadata, useTranslation } from '../../hooks/index.js';
import { styled } from '../../styled.js';

interface Props {
  accountIndex?: number;
  addressOffset?: number;
  className?: string;
  error: string | null;
  genesisHash?: string;
  onSignature?: ({ signature }: { signature: HexString }, signedTransaction: HexString) => void;
  payload?: SignerPayloadJSON;
  setError: (value: string | null) => void;
}

function getMetadataProof (chain: Chain, payload: SignerPayloadJSON) {
  const m = chain.definition.rawMetadata;

  assert(m, 'To sign with Ledger\'s Polkadot Generic App, the metadata must be present in the extension.');

  const merkleizedMetadata = merkleizeMetadata(m, {
    base58Prefix: chain.ss58Format,
    decimals: chain.tokenDecimals,
    specName: chain.name.toLowerCase(),
    specVersion: chain.specVersion,
    tokenSymbol: chain.tokenSymbol
  });
  const metadataHash = u8aToHex(merkleizedMetadata.digest());
  const newPayload = objectSpread<SignerPayloadJSON>({}, payload, { metadataHash, mode: 1 });
  const raw = chain.registry.createType('ExtrinsicPayload', newPayload);

  return {
    raw,
    txMetadata: merkleizedMetadata.getProofForExtrinsicPayload(u8aToHex(raw.toU8a(true)))
  };
}

function LedgerSign ({ accountIndex, addressOffset, className, error, genesisHash, onSignature, payload, setError }: Props): React.ReactElement<Props> {
  const [isBusy, setIsBusy] = useState(false);
  const { t } = useTranslation();
  const chain = useMetadata(genesisHash);
  const { error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, ledger, refresh, warning: ledgerWarning } = useLedger(genesisHash, accountIndex, addressOffset);

  useEffect(() => {
    if (ledgerError) {
      setError(ledgerError);
    }
  }, [chain, ledgerError, setError]);

  const _onRefresh = useCallback(() => {
    refresh();
    setError(null);
  }, [refresh, setError]);

  const _onSignLedger = useCallback(
    (): void => {
      if (!ledger || !payload || !onSignature || !chain) {
        return;
      }

      if (!chain?.definition.rawMetadata) {
        setError('No metadata found for this chain. You must upload the metadata to the extension in order to use Ledger.');
      }

      const { raw, txMetadata } = getMetadataProof(chain, payload);

      const metaBuff = Buffer.from(txMetadata);

      setError(null);
      setIsBusy(true);
      ledger.signWithMetadata(raw.toU8a(true), accountIndex, addressOffset, { metadata: metaBuff })
        .then((signature) => {
          const extrinsic = chain.registry.createType(
            'Extrinsic',
            { method: raw.method },
            { version: 4 }
          );

          ledger.getAddress(chain.ss58Format, false, accountIndex, addressOffset)
            .then(({ address }) => {
              extrinsic.addSignature(address, signature.signature, raw.toHex());
              onSignature(signature, extrinsic.toHex());
            })
            .catch((e: Error) => {
              setError(e.message);
              setIsBusy(false);
            });
        }).catch((e: Error) => {
          setError(e.message);
          setIsBusy(false);
        });
    },
    [accountIndex, addressOffset, chain, ledger, onSignature, payload, setError]
  );

  return (
    <div className={className}>
      {!!ledgerWarning && (
        <Warning>
          {ledgerWarning}
        </Warning>
      )}
      {error && (
        <Warning isDanger>
          {error}
        </Warning>
      )}
      {(ledgerLocked || error)
        ? (
          <Button
            isBusy={isBusy || ledgerLoading}
            onClick={_onRefresh}
          >
            <FontAwesomeIcon icon={faSync} />
            {t('Refresh')}
          </Button>
        )
        : (
          <Button
            isBusy={isBusy || ledgerLoading}
            onClick={_onSignLedger}
          >
            {t('Sign on Ledger')}
          </Button>
        )
      }
    </div>
  );
}

export default styled(LedgerSign) <Props>`
  flex-direction: column;
  padding: 6px 24px;

  .danger {
    margin-bottom: .5rem;
  }
`;
