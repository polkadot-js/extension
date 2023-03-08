// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SigningRequest } from '@subwallet/extension-base/background/types';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/components/Confirmation/ConfirmationGeneralInfo';
import ViewDetailIcon from '@subwallet/extension-koni-ui/components/Icon/ViewDetailIcon';
import { CONFIRMATION_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useGetChainInfoByGenesisHash from '@subwallet/extension-koni-ui/hooks/chain/useGetChainInfoByGenesisHash';
import useOpenDetailModal from '@subwallet/extension-koni-ui/hooks/confirmation/useOpenDetailModal';
import { useLedger } from '@subwallet/extension-koni-ui/hooks/useLedger';
import { approveSignPasswordV2, approveSignSignature, cancelSignRequest } from '@subwallet/extension-koni-ui/messaging';
import BaseDetailModal from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/BaseDetailModal';
import SubstrateExtrinsic from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Substrate/Extrinsic';
import SubstrateMessageDetail from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Substrate/Message';
import DisplayPayloadModal from '@subwallet/extension-koni-ui/Popup/Confirmations/Qr/DisplayPayload';
import SubstrateQr from '@subwallet/extension-koni-ui/Popup/Confirmations/Qr/DisplayPayload/Substrate';
import ScanSignature from '@subwallet/extension-koni-ui/Popup/Confirmations/Qr/ScanSignature';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, SigData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getSignMode } from '@subwallet/extension-koni-ui/util/account';
import { isRawPayload } from '@subwallet/extension-koni-ui/util/request/substrate';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, QrCode, Swatches, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { TypeRegistry } from '@polkadot/types';
import { ExtrinsicPayload } from '@polkadot/types/interfaces';
import { SignerPayloadJSON } from '@polkadot/types/types';

interface Props extends ThemeProps {
  request: SigningRequest;
}

interface Data {
  hexBytes: string | null;
  payload: ExtrinsicPayload | null;
}

async function handleConfirm ({ id }: SigningRequest) {
  return await approveSignPasswordV2({ id });
}

async function handleCancel ({ id }: SigningRequest) {
  return await cancelSignRequest(id);
}

async function handleSignature ({ id }: SigningRequest, { signature }: SigData) {
  return await approveSignSignature(id, signature);
}

const registry = new TypeRegistry();

const modeCanSignMessage: SIGN_MODE[] = [SIGN_MODE.QR, SIGN_MODE.PASSWORD];

function Component ({ className, request }: Props) {
  const { account } = request;

  const { t } = useTranslation();
  const { activeModal } = useContext(ModalContext);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const [loading, setLoading] = useState(false);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });

  const signMode = useMemo(() => getSignMode(account), [account]);

  const isMessage = useMemo(() => isRawPayload(request.request.payload), [request.request.payload]);

  const isLedger = useMemo(() => signMode === SIGN_MODE.LEDGER, [signMode]);

  const approveIcon = useMemo((): PhosphorIcon => {
    switch (signMode) {
      case SIGN_MODE.QR:
        return QrCode;
      case SIGN_MODE.LEDGER:
        return Swatches;
      default:
        return CheckCircle;
    }
  }, [signMode]);

  const onClickDetail = useOpenDetailModal();

  const genesisHash = useMemo(() => {
    if (payload) {
      return payload.genesisHash.toHex();
    } else {
      return chainInfoMap.polkadot.substrateInfo?.genesisHash || '';
    }
  }, [chainInfoMap.polkadot.substrateInfo?.genesisHash, payload]);

  const chain = useGetChainInfoByGenesisHash(genesisHash);

  const { isLoading: isLedgerLoading, isLocked, ledger, refresh: refreshLedger } = useLedger(chain?.slug, isLedger);

  const isLedgerConnected = useMemo(() => !isLocked && !isLedgerLoading && !!ledger, [isLedgerLoading, isLocked, ledger]);

  // Handle buttons actions
  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(request).finally(() => {
      setLoading(false);
    });
  }, [request]);

  const onApprovePassword = useCallback(() => {
    setLoading(true);

    setTimeout(() => {
      handleConfirm(request)
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 1000);
  }, [request]);

  const onApproveSignature = useCallback((signature: SigData) => {
    setLoading(true);

    setTimeout(() => {
      handleSignature(request, signature)
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [request]);

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

    setTimeout(() => {
      const payloadU8a = payload.toU8a(true);

      ledger
        .sign(payloadU8a, account.accountIndex, account.addressOffset)
        .then(({ signature }) => {
          console.log(signature);
          onApproveSignature({ signature });
        })
        .catch((e: Error) => {
          console.log(e);
          setLoading(false);
        });
    });
  }, [account.accountIndex, account.addressOffset, isLedgerConnected, ledger, onApproveSignature, payload, refreshLedger]);

  const onConfirm = useCallback(() => {
    switch (signMode) {
      case SIGN_MODE.QR:
        onConfirmQr();
        break;
      case SIGN_MODE.LEDGER:
        onConfirmLedger();
        break;
      default:
        onApprovePassword();
    }
  }, [onApprovePassword, onConfirmLedger, onConfirmQr, signMode]);

  useEffect((): void => {
    const payload = request.request.payload;

    if (isRawPayload(payload)) {
      setData({
        hexBytes: payload.data,
        payload: null
      });
    } else {
      registry.setSignedExtensions(payload.signedExtensions); // Important

      setData({
        hexBytes: null,
        payload: registry.createType('ExtrinsicPayload', payload, { version: payload.version })
      });
    }
  }, [request]);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          {t('Signature request')}
        </div>
        <div className='description'>
          {t('You are approving a request with account')}
        </div>
        <AccountItemWithName
          accountName={account.name}
          address={account.address}
          avatarSize={24}
          className='account-item'
          isSelected={true}
        />
        <div>
          <Button
            icon={<ViewDetailIcon />}
            onClick={onClickDetail}
            size='xs'
            type='ghost'
          >
            {t('View detail')}
          </Button>
        </div>
      </div>
      <div className='confirmation-footer'>
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
          disabled={isMessage && !modeCanSignMessage.includes(signMode)}
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
            signMode !== SIGN_MODE.LEDGER
              ? t('Approve')
              : !isLedgerConnected
                ? t('Refresh')
                : t('Approve')
          }
        </Button>
      </div>
      <BaseDetailModal
        title={hexBytes ? t('Message details') : t('Transaction details')}
      >
        {hexBytes && (<SubstrateMessageDetail bytes={hexBytes} />)}
        {payload && (
          <SubstrateExtrinsic
            account={account}
            payload={payload}
            request={request.request.payload as SignerPayloadJSON}
          />
        )}
      </BaseDetailModal>
      {
        signMode === SIGN_MODE.QR && (
          <DisplayPayloadModal>
            <SubstrateQr
              address={account.address}
              genesisHash={genesisHash}
              payload={payload || hexBytes || ''}
            />
          </DisplayPayloadModal>
        )
      }
      {signMode === SIGN_MODE.QR && <ScanSignature onSignature={onApproveSignature} />}
    </>
  );
}

const SignConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '.account-list': {
    '.__prop-label': {
      marginRight: token.marginMD,
      width: '50%',
      float: 'left'
    }
  }
}));

export default SignConfirmation;
