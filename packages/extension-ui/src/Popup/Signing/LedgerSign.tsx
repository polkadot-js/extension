// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable deprecation/deprecation */

import type { Chain } from '@polkadot/extension-chains/types';
import type { Ledger, LedgerGeneric } from '@polkadot/hw-ledger';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';

import settings from '@polkadot/ui-settings';
import { assert, hexToU8a, objectSpread, u8aToHex } from '@polkadot/util';
import { merkleizeMetadata } from '@polkadot-api/merkleize-metadata';

import { Button, Warning } from '../../components/index.js';
import { useLedger, useMetadata, useTranslation } from '../../hooks/index.js';
import { styled } from '../../styled.js';
import { encodeAddress } from '@polkadot/util-crypto';
//import type { KeypairType } from '@polkadot/util-crypto/types';
//import { blake2AsU8a, keccakAsU8a } from '@polkadot/util-crypto';

interface Props {
  accountIndex?: number;
  addressOffset?: number;
  className?: string;
  error: string | null;
  genesisHash?: string;
  isEcdsa?: boolean;
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

function LedgerSign ({ accountIndex, addressOffset, className, error, genesisHash, isEcdsa = false, onSignature, payloadExt, payloadJson, setError }: Props): React.ReactElement<Props> {
  const [isBusy, setIsBusy] = useState(false);
  const { t } = useTranslation();
  const chain = useMetadata(genesisHash);
  //@ts-ignore
  const { error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, ledger, refresh, warning: ledgerWarning, type: ledgerType } = useLedger(genesisHash, accountIndex, addressOffset, isEcdsa);

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
      if (!ledger || !payloadJson || !onSignature || !chain || !payloadExt) {
        if (!chain) {
          setError('No chain information found. You may need to update/upload the metadata.');
          setIsBusy(false);
        }

        return;
      }

      setError(null);
      setIsBusy(true);

      const currApp = settings.get().ledgerApp;

      if (currApp === 'generic' || currApp === 'migration') {
        if (!chain?.definition.rawMetadata) {
          setError('No metadata found for this chain. You must upload the metadata to the extension in order to use Ledger.');
        }
        const { raw, txMetadata } = getMetadataProof(chain, payloadJson);
        const metaBuff = Buffer.from(txMetadata);

        if (isEcdsa) {
          //let hashedMessage = ledgerType == 'ecdsa'? blake2AsU8a(raw.toU8a(true), undefined, undefined, false) : keccakAsU8a(raw.toU8a(true), undefined, false);

          (ledger as LedgerGeneric).signWithMetadataEcdsa(raw.toU8a(true), accountIndex, addressOffset, { metadata: metaBuff })
            .then((signature) => {
              ledgerType == 'ecdsa' ? signature.signature = `0x${'02'+ signature.signature}` : null;

              const extrinsic = chain.registry.createType(
                'Extrinsic',
                { method: raw.method },
                { version: 4 }
              );

              const sigU8a = hexToU8a(signature.signature);

              console.log("Sig byte length:", sigU8a.length); // should be 65
              console.log("Sig hex:", signature.signature);
              (ledger as LedgerGeneric).getAddressEcdsa(false, accountIndex, addressOffset)
                .then(({ publicKey }) => {
                  const ss58Address = encodeAddress(publicKey, chain.ss58Format);
                  console.log('Public Key:', publicKey);
                  console.log('Address:', ss58Address);
                  console.log('Signature:', signature.signature);
                  const addressType = chain.registry.createType('Address', ss58Address);
                  extrinsic.addSignature(addressType, signature.signature, raw.toHex());
                  onSignature(signature, extrinsic.toHex());
                })
                .catch((e: Error) => {
                  console.log(e)
                  setError(e.message);
                  setIsBusy(false);
                });
            }).catch((e: Error) => {
              console.log(e)
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
    [accountIndex, addressOffset, chain, ledger, onSignature, payloadJson, payloadExt, setError, isEcdsa]
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
      {
        <Warning>
          {`You are using the Ledger ${settings.ledgerApp.toUpperCase()} App. If you would like to switch it, please go to "MANAGE LEDGER APP" in the extension's settings.`}
        </Warning>
      }
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
