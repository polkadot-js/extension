// Copyright 2019-2026 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable deprecation/deprecation */

import type { Chain } from '@polkadot/extension-chains/types';
import type { Ledger, LedgerGeneric } from '@polkadot/hw-ledger';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useState } from 'react';

import { assert, objectSpread, stringShorten, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import { merkleizeMetadata } from '@polkadot-api/merkleize-metadata';

import { Button, SettingsContext, Warning } from '../../components/index.js';
import { useLedger, useMetadata, useTranslation } from '../../hooks/index.js';
import { styled } from '../../styled.js';

interface Props {
  accountIndex?: number;
  addressOffset?: number;
  className?: string;
  error: string | null;
  genesisHash?: string;
  isEthereum?: boolean;
  onSignature?: ({ signature }: { signature: HexString }, signedTransaction?: HexString) => void;
  payloadJson?: SignerPayloadJSON;
  payloadExt?: ExtrinsicPayload
  setError: (value: string | null) => void;
}

function getMetadataProof (chain: Chain, payload: SignerPayloadJSON) {
  const m = chain.definition.rawMetadata;

  assert(m, 'To sign with Ledger\'s Polkadot Generic App, the metadata must be present in the extension.');

  const merkleizedMetadata = merkleizeMetadata(m, {
    base58Prefix: chain.ss58Format,
    decimals: chain.tokenDecimals,
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

function matchesExpectedSigner (derivedAddress: string, expectedAddress: string, isEthereum: boolean): boolean {
  if (isEthereum) {
    return derivedAddress.toLowerCase() === expectedAddress.toLowerCase();
  }

  try {
    return u8aToHex(decodeAddress(derivedAddress)) === u8aToHex(decodeAddress(expectedAddress));
  } catch {
    return derivedAddress === expectedAddress;
  }
}

function LedgerSign ({ accountIndex, addressOffset, className, error, genesisHash, isEthereum = false, onSignature, payloadExt, payloadJson, setError }: Props): React.ReactElement<Props> {
  const [isBusy, setIsBusy] = useState(false);
  const { t } = useTranslation();
  const { ledgerApp } = useContext(SettingsContext);
  const chain = useMetadata(genesisHash);
  const { address, error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, ledger, refresh, type: _ledgerType, warning: ledgerWarning } = useLedger(genesisHash, accountIndex, addressOffset, isEthereum);
  const expectedAddress = payloadJson?.address;
  const signerMismatchError = address && expectedAddress && !matchesExpectedSigner(address, expectedAddress, isEthereum)
    ? t('Address mismatch: derived {{derived}}, expected {{expected}}. Check that the correct Ledger device is connected and the correct app is selected.', {
      replace: {
        derived: stringShorten(address, 8),
        expected: stringShorten(expectedAddress, 8)
      }
    })
    : null;
  const signerMismatchHint = signerMismatchError
    ? t('Possible cause: the Ledger App setting differs from the app originally used to derive this account.')
    : null;

  const _onRefresh = useCallback(() => {
    setError(null);
    refresh();
  }, [refresh, setError]);

  const _onSignLedger = useCallback(
    (): void => {
      if (signerMismatchError) {
        return;
      }

      if (!ledger || !payloadJson || !onSignature || !chain || !payloadExt) {
        if (!chain) {
          setError('No chain information found. You may need to update/upload the metadata.');
          setIsBusy(false);
        }

        return;
      }

      setError(null);
      setIsBusy(true);

      const currApp = ledgerApp;

      if (currApp === 'generic' || currApp === 'migration') {
        if (!chain?.definition.rawMetadata) {
          setError('No metadata found for this chain. You must upload the metadata to the extension in order to use Ledger.');
          setIsBusy(false);

          return;
        }

        const { raw, txMetadata } = getMetadataProof(chain, payloadJson);
        const metaBuff = Buffer.from(txMetadata);

        if (isEthereum) {
          (ledger as LedgerGeneric).signWithMetadataEcdsa(raw.toU8a(true), accountIndex, addressOffset, { metadata: metaBuff })
            .then(({ signature }) => {
              const extrinsic = chain.registry.createType(
                'Extrinsic',
                { method: raw.method },
                { version: 4 }
              );

              (ledger as LedgerGeneric).getAddressEcdsa(false, accountIndex, addressOffset)
                .then(({ address }) => {
                  extrinsic.addSignature(`0x${address}`, signature, raw.toHex());
                  onSignature({ signature }, extrinsic.toHex());
                })
                .catch((e: Error) => {
                  setError(e.message);
                  setIsBusy(false);
                });
            }).catch((e: Error) => {
              setError(e.message);
              setIsBusy(false);
            });
        } else {
          (ledger as LedgerGeneric).signWithMetadata(raw.toU8a(true), accountIndex, addressOffset, { metadata: metaBuff })
            .then((signature) => {
              const extrinsic = chain.registry.createType(
                'Extrinsic',
                { method: raw.method },
                { version: 4 }
              );

              (ledger as LedgerGeneric).getAddress(chain.ss58Format, false, accountIndex, addressOffset)
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
        }
      } else if (currApp === 'chainSpecific') {
        (ledger as Ledger).sign(payloadExt.toU8a(true), accountIndex, addressOffset)
          .then((signature) => {
            onSignature(signature);
          }).catch((e: Error) => {
            setError(e.message);
            setIsBusy(false);
          });
      }
    },
    [accountIndex, addressOffset, chain, ledger, ledgerApp, onSignature, payloadJson, payloadExt, setError, signerMismatchError, isEthereum]
  );

  const activeError = ledgerError || error;
  const hasActiveError = !!activeError;

  return (
    <div className={className}>
      {!!ledgerWarning && (
        <Warning>
          {ledgerWarning}
        </Warning>
      )}
      {hasActiveError && (
        <Warning isDanger>
          {activeError}
        </Warning>
      )}
      {signerMismatchError && !hasActiveError && (
        <Warning isDanger>
          {signerMismatchError}
        </Warning>
      )}
      {signerMismatchHint && !hasActiveError && (
        <Warning>
          {signerMismatchHint}
        </Warning>
      )}
      {(ledgerLocked || hasActiveError)
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
            isDisabled={!!signerMismatchError}
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
