// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SigningRequest } from '@subwallet/extension-base/background/types';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/components/Confirmation/ConfirmationGeneralInfo';
import ViewDetailIcon from '@subwallet/extension-koni-ui/components/Icon/ViewDetailIcon';
import { CONFIRMATION_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useOpenDetailModal from '@subwallet/extension-koni-ui/hooks/confirmation/useOpenDetailModal';
import { approveSignPasswordV2, cancelSignRequest } from '@subwallet/extension-koni-ui/messaging';
import BaseDetailModal from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/BaseDetailModal';
import SubstrateMessageDetail from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Substrate/Message';
import DisplaySubstrateQr from '@subwallet/extension-koni-ui/Popup/Confirmations/Qr/Display/Substrate';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
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

const registry = new TypeRegistry();

function Component ({ className, request }: Props) {
  const { account } = request;

  const { t } = useTranslation();
  const { activeModal } = useContext(ModalContext);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const [loading, setLoading] = useState(false);
  const [{ hexBytes, payload }, setData] = useState<Data>({ hexBytes: null, payload: null });

  const signMode = useMemo(() => getSignMode(account), [account]);

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

  // Handle buttons actions
  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(request).finally(() => {
      setLoading(false);
    });
  }, [request]);

  const onConfirmPassword = useCallback(() => {
    setLoading(true);

    setTimeout(() => {
      handleConfirm(request)
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

  const onConfirm = useCallback(() => {
    switch (signMode) {
      case SIGN_MODE.QR:
        onConfirmQr();
        break;
      default:
        onConfirmPassword();
    }
  }, [onConfirmPassword, onConfirmQr, signMode]);

  useEffect((): void => {
    const payload = request.request.payload;

    if (isRawPayload(payload)) {
      setData({
        hexBytes: payload.data,
        payload: null
      });
    } else {
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
          icon={(
            <Icon
              phosphorIcon={approveIcon}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onConfirm}
        >
          {t('Approve')}
        </Button>
      </div>
      <BaseDetailModal
        title={hexBytes ? t('Message details') : t('Transaction details')}
      >
        {hexBytes && (<SubstrateMessageDetail bytes={hexBytes} />)}
      </BaseDetailModal>
      <DisplaySubstrateQr
        address={account.address}
        genesisHash={genesisHash}
        payload={payload || hexBytes || ''}
      />
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
