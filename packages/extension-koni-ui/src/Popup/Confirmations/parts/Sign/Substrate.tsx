// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, RequestSign } from '@subwallet/extension-base/background/types';
import { _isRuntimeUpdated, getShortMetadata } from '@subwallet/extension-base/utils';
import { AlertBox } from '@subwallet/extension-koni-ui/components';
import { CONFIRMATION_QR_MODAL, NotNeedMigrationGens, SUBSTRATE_GENERIC_KEY } from '@subwallet/extension-koni-ui/constants';
import { InjectContext } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import { useGetChainInfoByGenesisHash, useLedger, useMetadata, useNotification, useParseSubstrateRequestPayload, useSelector, useUnlockChecker } from '@subwallet/extension-koni-ui/hooks';
import { approveSignPasswordV2, approveSignSignature, cancelSignRequest } from '@subwallet/extension-koni-ui/messaging';
import { AccountSignMode, PhosphorIcon, SubstrateSigData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getSignMode, isRawPayload, isSubstrateMessage, removeTransactionPersist, toShort } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, QrCode, Swatches, Wallet, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { SignerPayloadJSON, SignerResult } from '@polkadot/types/types';
import { hexToU8a, u8aToHex, u8aToU8a } from '@polkadot/util';

import { DisplayPayloadModal, ScanSignature, SubstrateQr } from '../Qr';

interface Props extends ThemeProps {
  account: AccountJson;
  id: string;
  request: RequestSign;
  extrinsicType?: ExtrinsicType;
  txExpirationTime?: number;
}

interface AlertData {
  description: string;
  title: string;
  isError: boolean;
}

const handleConfirm = async (id: string) => await approveSignPasswordV2({ id });

const handleCancel = async (id: string) => await cancelSignRequest(id);

const handleSignature = async (id: string, { signature, signedTransaction }: SubstrateSigData) => await approveSignSignature(id, signature, signedTransaction);

const modeCanSignMessage: AccountSignMode[] = [AccountSignMode.QR, AccountSignMode.PASSWORD, AccountSignMode.INJECTED, AccountSignMode.LEGACY_LEDGER, AccountSignMode.GENERIC_LEDGER];

const Component: React.FC<Props> = (props: Props) => {
  const { account, className, extrinsicType, id, request, txExpirationTime } = props;

  const { t } = useTranslation();
  const notify = useNotification();
  const checkUnlock = useUnlockChecker();

  const { activeModal } = useContext(ModalContext);
  const { substrateWallet } = useContext(InjectContext);

  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const genesisHash = useMemo(() => {
    const _payload = request.payload;

    return isRawPayload(_payload)
      ? (account.originGenesisHash || chainInfoMap.polkadot.substrateInfo?.genesisHash || '')
      : _payload.genesisHash;
  }, [account.originGenesisHash, chainInfoMap.polkadot.substrateInfo?.genesisHash, request.payload]);
  const signMode = useMemo(() => getSignMode(account), [account]);
  const isLedger = useMemo(() => signMode === AccountSignMode.LEGACY_LEDGER || signMode === AccountSignMode.GENERIC_LEDGER, [signMode]);

  const chain = useMetadata(genesisHash);
  const chainInfo = useGetChainInfoByGenesisHash(genesisHash);
  const { hashLoading, missingData, payload } = useParseSubstrateRequestPayload(chain, request, isLedger);

  const isMessage = isSubstrateMessage(payload);

  const approveIcon = useMemo((): PhosphorIcon => {
    switch (signMode) {
      case AccountSignMode.QR:
        return QrCode;
      case AccountSignMode.LEGACY_LEDGER:
      case AccountSignMode.GENERIC_LEDGER:
        return Swatches;
      case AccountSignMode.INJECTED:
        return Wallet;
      default:
        return CheckCircle;
    }
  }, [signMode]);
  const chainSlug = useMemo(() => signMode === AccountSignMode.GENERIC_LEDGER ? SUBSTRATE_GENERIC_KEY : (chainInfo?.slug || ''), [chainInfo?.slug, signMode]);
  const networkName = useMemo(() => chainInfo?.name || chain?.name || toShort(genesisHash), [chainInfo, genesisHash, chain]);
  const isRuntimeUpdated = useMemo(() => {
    const _payload = request.payload;

    if (isRawPayload(_payload)) {
      return false;
    } else {
      return _isRuntimeUpdated(_payload.signedExtensions);
    }
  }, [request.payload]);

  const alertData = useMemo((): AlertData | undefined => {
    const requireMetadata = signMode === AccountSignMode.GENERIC_LEDGER || (signMode === AccountSignMode.LEGACY_LEDGER && isRuntimeUpdated);

    if (!isMessage) {
      if (!chain || !chain.hasMetadata) {
        if (requireMetadata) {
          return {
            isError: true,
            title: t('Unable to sign'),
            description: t('{{networkName}} network\'s metadata is outdated. Update metadata and try again', { replace: { networkName } })
          };
        } else {
          return {
            isError: false,
            title: t('Pay attention!'),
            description: t('{{networkName}} network\'s metadata is not updated, which can lead to an invalid signature', { replace: { networkName } })
          };
        }
      } else {
        if (isRuntimeUpdated) {
          if (signMode === AccountSignMode.LEGACY_LEDGER) {
            const gens = chain.genesisHash || '___';

            if (NotNeedMigrationGens.includes(gens)) {
              return {
                isError: false,
                title: t('Runtime attention!'),
                description: t('You should re-attach account by Generic App then use it normally')
              };
            } else {
              return {
                isError: false,
                title: t('Runtime attention!'),
                description: t('You\'re using Migration app for signing, please migration asset to new account by Generic App then use it normally')
              };
            }
          }
        } else {
          if (signMode === AccountSignMode.GENERIC_LEDGER) {
            return {
              isError: true,
              title: t('Runtime attention!'),
              description: t('You need to wait {{networkName}} network update runtime', { replace: { networkName } })
            };
          }
        }
      }
    }

    return undefined;
  }, [signMode, isRuntimeUpdated, isMessage, chain, t, networkName]);

  const activeLedger = useMemo(() => {
    if (isLedger) {
      return !alertData?.isError;
    }

    return isLedger;
  }, [isLedger, alertData]);

  const { error: ledgerError,
    isLoading: isLedgerLoading,
    isLocked,
    ledger,
    refresh: refreshLedger,
    signMessage: ledgerSignMessage,
    signTransaction: ledgerSignTransaction,
    warning: ledgerWarning } = useLedger(chainSlug, activeLedger, isRuntimeUpdated || isMessage);

  const isLedgerConnected = useMemo(() => !isLocked && !isLedgerLoading && !!ledger, [isLedgerLoading, isLocked, ledger]);

  const [loading, setLoading] = useState(false);
  const [showQuoteExpired, setShowQuoteExpired] = useState<boolean>(false);

  // Handle buttons actions
  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(id).finally(() => {
      setLoading(false);
    });
  }, [id]);

  const onApprovePassword = useCallback(() => {
    setLoading(true);

    setTimeout(() => {
      handleConfirm(id)
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 1000);
  }, [id]);

  const onApproveSignature = useCallback((signature: SubstrateSigData) => {
    setLoading(true);

    setTimeout(() => {
      handleSignature(id, signature)
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [id]);

  const onConfirmQr = useCallback(() => {
    activeModal(CONFIRMATION_QR_MODAL);
  }, [activeModal]);

  const onConfirmLedger = useCallback(() => {
    if (!payload) {
      return;
    }

    if (!isLedgerConnected || !ledger) {
      refreshLedger();

      return;
    }

    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      if (typeof payload === 'string') {
        try {
          const { signature } = await ledgerSignMessage(u8aToU8a(payload), account.accountIndex, account.addressOffset);

          onApproveSignature({ signature });
        } catch (e) {
          console.error(e);
        }

        setLoading(false);
      } else {
        const payloadU8a = payload.toU8a(true);

        let metadata: Uint8Array;

        if (isRuntimeUpdated) {
          try {
            const blob = u8aToHex(payloadU8a);
            const shortener = await getShortMetadata(chainInfo?.slug || '', blob);

            metadata = hexToU8a(shortener);
          } catch (e) {
            notify({
              message: (e as Error).message,
              type: 'error'
            });
            setLoading(false);

            return;
          }
        } else {
          metadata = new Uint8Array(0);
        }

        try {
          const { signature } = await ledgerSignTransaction(payloadU8a, metadata, account.accountIndex, account.addressOffset);

          if (missingData) {
            const extrinsic = payload.registry.createType(
              'Extrinsic',
              { method: payload.method },
              { version: 4 }
            );

            extrinsic.addSignature(account.address, signature, payload.toHex());

            onApproveSignature({ signature, signedTransaction: extrinsic.toHex() });
          } else {
            onApproveSignature({ signature });
          }
        } catch (e) {
          console.error(e);
        }

        setLoading(false);
      }
    }, 100);
  }, [account, chainInfo, isLedgerConnected, isRuntimeUpdated, ledger, ledgerSignMessage, ledgerSignTransaction, missingData, notify, onApproveSignature, payload, refreshLedger]);

  const onConfirmInject = useCallback(() => {
    if (substrateWallet) {
      let promise: Promise<SignerResult>;

      if (isMessage) {
        if (substrateWallet.signer.signRaw) {
          promise = substrateWallet.signer.signRaw({ address: account.address, type: 'bytes', data: payload });
        } else {
          return;
        }
      } else {
        if (substrateWallet.signer.signPayload) {
          promise = substrateWallet.signer.signPayload(request.payload as SignerPayloadJSON);
        } else {
          return;
        }
      }

      setLoading(true);
      promise
        .then(({ signature, signedTransaction: _signedTransaction }) => {
          const signedTransaction = _signedTransaction
            ? _signedTransaction instanceof Uint8Array
              ? u8aToHex(_signedTransaction)
              : _signedTransaction
            : undefined;

          onApproveSignature({ signature, signedTransaction });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [account.address, isMessage, onApproveSignature, payload, request.payload, substrateWallet]);

  const onConfirm = useCallback(() => {
    removeTransactionPersist(extrinsicType);

    if (txExpirationTime) {
      const currentTime = +Date.now();

      if (currentTime >= txExpirationTime) {
        notify({
          message: t('Transaction expired'),
          type: 'error'
        });
        onCancel();
      }
    }

    switch (signMode) {
      case AccountSignMode.QR:
        onConfirmQr();
        break;
      case AccountSignMode.LEGACY_LEDGER:
      case AccountSignMode.GENERIC_LEDGER:
        onConfirmLedger();
        break;
      case AccountSignMode.INJECTED:
        onConfirmInject();
        break;
      default:
        checkUnlock().then(() => {
          onApprovePassword();
        }).catch(() => {
          // Unlock is cancelled
        });
    }
  }, [extrinsicType, txExpirationTime, signMode, notify, t, onCancel, onConfirmQr, onConfirmLedger, onConfirmInject, checkUnlock, onApprovePassword]);

  useEffect(() => {
    !!ledgerError && notify({
      message: ledgerError,
      type: 'error'
    });
  }, [ledgerError, notify]);

  useEffect(() => {
    !!ledgerWarning && notify({
      message: ledgerWarning,
      type: 'warning'
    });
  }, [ledgerWarning, notify]);

  useEffect(() => {
    let timer: NodeJS.Timer;

    if (txExpirationTime) {
      timer = setInterval(() => {
        if (Date.now() >= txExpirationTime) {
          setShowQuoteExpired(true);
          clearInterval(timer);
        }
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [txExpirationTime]);

  return (
    <>
      {
        alertData && (
          <AlertBox
            className={CN(className, 'alert-box')}
            description={alertData.description}
            title={alertData.title}
            type={alertData.isError ? 'error' : 'warning'}
          />
        )
      }
      <div className={CN(className, 'confirmation-footer')}>
        <Button
          disabled={loading}
          icon={(
            <Icon
              phosphorIcon={XCircle}
              weight='fill'
            />
          )}
          onClick={onCancel}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>
        <Button
          disabled={showQuoteExpired || hashLoading || (isMessage ? !modeCanSignMessage.includes(signMode) : !!alertData?.isError)}
          icon={(
            <Icon
              phosphorIcon={approveIcon}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onConfirm}
        >
          {
            !isLedger
              ? t('Approve')
              : !isLedgerConnected
                ? t('Refresh')
                : t('Approve')
          }
        </Button>
        {
          signMode === AccountSignMode.QR && (
            <DisplayPayloadModal>
              <SubstrateQr
                address={account.address}
                genesisHash={genesisHash}
                payload={payload || ''}
              />
            </DisplayPayloadModal>
          )
        }
        {signMode === AccountSignMode.QR && <ScanSignature onSignature={onApproveSignature} />}
      </div>
    </>
  );
};

const SubstrateSignArea = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.alert-box': {
      margin: token.padding,
      marginBottom: 0
    }
  };
});

export default SubstrateSignArea;
