// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, RequestSign } from '@subwallet/extension-base/background/types';
import { CONFIRMATION_QR_MODAL } from '@subwallet/extension-web-ui/constants/modal';
import { InjectContext } from '@subwallet/extension-web-ui/contexts/InjectContext';
import { useGetChainInfoByGenesisHash, useNotification, useParseSubstrateRequestPayload, useUnlockChecker } from '@subwallet/extension-web-ui/hooks';
import { useLedger } from '@subwallet/extension-web-ui/hooks/ledger/useLedger';
import { approveSignPasswordV2, approveSignSignature, cancelSignRequest } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { AccountSignMode, PhosphorIcon, SigData, ThemeProps } from '@subwallet/extension-web-ui/types';
import { isSubstrateMessage, removeTransactionPersist } from '@subwallet/extension-web-ui/utils';
import { getSignMode } from '@subwallet/extension-web-ui/utils/account/account';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, QrCode, Swatches, Wallet, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SignerResult } from '@polkadot/types/types';
import { SignerPayloadJSON } from '@polkadot/types/types/extrinsic';

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

const modeCanSignMessage: AccountSignMode[] = [AccountSignMode.QR, AccountSignMode.PASSWORD, AccountSignMode.INJECTED];

const Component: React.FC<Props> = (props: Props) => {
  const { account, className, extrinsicType, id, request, txExpirationTime } = props;

  const { t } = useTranslation();
  const notify = useNotification();
  const checkUnlock = useUnlockChecker();

  const { activeModal } = useContext(ModalContext);
  const { substrateWallet } = useContext(InjectContext);

  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const payload = useParseSubstrateRequestPayload(request);

  const [loading, setLoading] = useState(false);

  const signMode = useMemo(() => getSignMode(account), [account]);

  const isLedger = useMemo(() => signMode === AccountSignMode.LEDGER, [signMode]);
  const isMessage = isSubstrateMessage(payload);

  const [showQuoteExpired, setShowQuoteExpired] = useState<boolean>(false);

  const approveIcon = useMemo((): PhosphorIcon => {
    switch (signMode) {
      case AccountSignMode.QR:
        return QrCode;
      case AccountSignMode.LEDGER:
        return Swatches;
      case AccountSignMode.INJECTED:
        return Wallet;
      default:
        return CheckCircle;
    }
  }, [signMode]);

  const genesisHash = useMemo(() => {
    if (isSubstrateMessage(payload)) {
      return chainInfoMap.polkadot.substrateInfo?.genesisHash || '';
    } else {
      return payload.genesisHash.toHex();
    }
  }, [chainInfoMap.polkadot.substrateInfo?.genesisHash, payload]);

  const chain = useGetChainInfoByGenesisHash(genesisHash);

  const { error: ledgerError,
    isLoading: isLedgerLoading,
    isLocked,
    ledger,
    refresh: refreshLedger,
    signTransaction: ledgerSign,
    warning: ledgerWarning } = useLedger(chain?.slug, isLedger);

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
    if (!payload || typeof payload === 'string') {
      return;
    }

    if (!isLedgerConnected || !ledger) {
      refreshLedger();

      return;
    }

    setLoading(true);

    setTimeout(() => {
      const payloadU8a = payload.toU8a(true);

      ledgerSign(payloadU8a, account.accountIndex, account.addressOffset)
        .then(({ signature }) => {
          onApproveSignature({ signature });
        })
        .catch((e: Error) => {
          console.log(e);
          setLoading(false);
        });
    });
  }, [
    account.accountIndex,
    account.addressOffset,
    isLedgerConnected,
    ledger,
    ledgerSign,
    onApproveSignature,
    payload,
    refreshLedger
  ]);

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
      case AccountSignMode.LEDGER:
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
          signMode !== AccountSignMode.LEDGER
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
