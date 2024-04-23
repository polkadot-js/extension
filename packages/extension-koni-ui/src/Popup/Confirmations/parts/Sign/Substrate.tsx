// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, RequestSign } from '@subwallet/extension-base/background/types';
import { SUBSTRATE_GENERIC_KEY } from '@subwallet/extension-koni-ui/constants';
import { CONFIRMATION_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { InjectContext } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import { useGetChainInfoByGenesisHash, useNotification, useParseSubstrateRequestPayload, useSelector, useUnlockChecker } from '@subwallet/extension-koni-ui/hooks';
import { useLedger } from '@subwallet/extension-koni-ui/hooks/ledger/useLedger';
import { approveSignPasswordV2, approveSignSignature, cancelSignRequest } from '@subwallet/extension-koni-ui/messaging';
import { AccountSignMode, PhosphorIcon, SigData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getShortMetadata, isSubstrateMessage, removeTransactionPersist } from '@subwallet/extension-koni-ui/utils';
import { getSignMode } from '@subwallet/extension-koni-ui/utils/account/account';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, QrCode, Swatches, Wallet, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { SignerResult } from '@polkadot/types/types';
import { SignerPayloadJSON } from '@polkadot/types/types/extrinsic';
import { hexToU8a, u8aToHex, u8aToU8a } from '@polkadot/util';

import { DisplayPayloadModal, ScanSignature, SubstrateQr } from '../Qr';

interface Props extends ThemeProps {
  account: AccountJson;
  id: string;
  request: RequestSign;
  extrinsicType?: ExtrinsicType;
  txExpirationTime?: number;
}

const handleConfirm = async (id: string) => await approveSignPasswordV2({ id });

const handleCancel = async (id: string) => await cancelSignRequest(id);

const handleSignature = async (id: string, { signature }: SigData) => await approveSignSignature(id, signature);

const modeCanSignMessage: AccountSignMode[] = [AccountSignMode.QR, AccountSignMode.PASSWORD, AccountSignMode.INJECTED, AccountSignMode.LEGACY_LEDGER, AccountSignMode.GENERIC_LEDGER];

const Component: React.FC<Props> = (props: Props) => {
  const { account, className, extrinsicType, id, request, txExpirationTime } = props;

  const { t } = useTranslation();
  const notify = useNotification();
  const checkUnlock = useUnlockChecker();

  const { activeModal } = useContext(ModalContext);
  const { substrateWallet } = useContext(InjectContext);

  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const payload = useParseSubstrateRequestPayload(request);

  const [loading, setLoading] = useState(false);
  const [showQuoteExpired, setShowQuoteExpired] = useState<boolean>(false);

  const signMode = useMemo(() => getSignMode(account), [account]);

  const isLedger = useMemo(() => signMode === AccountSignMode.LEGACY_LEDGER || signMode === AccountSignMode.GENERIC_LEDGER, [signMode]);
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

  const genesisHash = useMemo(() => {
    if (isSubstrateMessage(payload)) {
      return account.originGenesisHash || chainInfoMap.polkadot.substrateInfo?.genesisHash || '';
    } else {
      return payload.genesisHash.toHex();
    }
  }, [account.originGenesisHash, chainInfoMap.polkadot.substrateInfo?.genesisHash, payload]);

  const chainInfo = useGetChainInfoByGenesisHash(genesisHash);

  const chainSlug = useMemo(() => {
    if (signMode === AccountSignMode.GENERIC_LEDGER) {
      return SUBSTRATE_GENERIC_KEY;
    } else {
      return chainInfo?.slug || '';
    }
  }, [chainInfo?.slug, signMode]);

  const { error: ledgerError,
    isLoading: isLedgerLoading,
    isLocked,
    ledger,
    refresh: refreshLedger,
    signMessage: ledgerSignMessage,
    signTransaction: ledgerSignTransaction,
    warning: ledgerWarning } = useLedger(chainSlug, isLedger);

  const isLedgerConnected = useMemo(() => !isLocked && !isLedgerLoading && !!ledger, [
    isLedgerLoading,
    isLocked,
    ledger
  ]);

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

  const onApproveSignature = useCallback((signature: SigData) => {
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
        ledgerSignMessage(u8aToU8a(payload), account.accountIndex, account.addressOffset)
          .then(({ signature }) => {
            onApproveSignature({ signature });
          })
          .catch((e: Error) => {
            console.error(e);
            setLoading(false);
          });
      } else {
        const payloadU8a = payload.toU8a(true);

        const blob = u8aToHex(payloadU8a);
        const shortener = await getShortMetadata(chainInfo?.slug || '', blob);

        ledgerSignTransaction(payloadU8a, hexToU8a(shortener), account.accountIndex, account.addressOffset)
          .then(({ signature }) => {
            onApproveSignature({ signature });
          })
          .catch((e: Error) => {
            console.error(e);
            setLoading(false);
          });
      }
    }, 100);
  }, [account, isLedgerConnected, ledger, ledgerSignMessage, ledgerSignTransaction, onApproveSignature, payload, refreshLedger, chainInfo]);

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
        .then(({ signature }) => {
          onApproveSignature({ signature });
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
        disabled={showQuoteExpired || (isMessage && !modeCanSignMessage.includes(signMode))}
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
  );
};

const SubstrateSignArea = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default SubstrateSignArea;
