// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationResult } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, ConfirmationRequestBase } from '@subwallet/extension-base/background/types';
import { AccountItemWithName, ConfirmationGeneralInfo } from '@subwallet/extension-web-ui/components';
import { NEED_SIGN_CONFIRMATION } from '@subwallet/extension-web-ui/constants';
import { useGetAccountTitleByAddress } from '@subwallet/extension-web-ui/hooks';
import { cancelSignRequest, completeConfirmation } from '@subwallet/extension-web-ui/messaging';
import { EvmSignatureSupportType, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: ConfirmationRequestBase;
  isMessage: boolean;
  type: typeof NEED_SIGN_CONFIRMATION[number];
  account?: AccountJson;
}

const handleCancelEvm = async (type: EvmSignatureSupportType, id: string) => {
  return await completeConfirmation(type, {
    id,
    isApproved: false
  } as ConfirmationResult<string>);
};

const handleCancelSubstrate = async (id: string) => await cancelSignRequest(id);

const Component: React.FC<Props> = (props: Props) => {
  const { account, className, isMessage, request, type } = props;

  const { t } = useTranslation();

  const accountTitle = useGetAccountTitleByAddress(account?.address);

  const [loading, setLoading] = useState(false);

  const handleCancel = useCallback(() => {
    let promise: (() => Promise<unknown>) | undefined;

    switch (type) {
      case 'evmSignatureRequest':
      case 'evmSendTransactionRequest':
        promise = () => handleCancelEvm(type, request.id);
        break;
      case 'signingRequest':
        promise = () => handleCancelSubstrate(request.id);
        break;
    }

    if (promise) {
      setLoading(true);

      setTimeout(() => {
        if (promise) {
          promise().finally(() => {
            setLoading(false);
          });
        }
      }, 300);
    }
  }, [request.id, type]);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          { isMessage ? t('Signature required') : t('Transaction request')}
        </div>
        <div className='description'>
          <span>{t('This feature is not available for')}</span>
          <span className='highlight'>&nbsp;{accountTitle}</span>
          <span>.&nbsp;{t('Please change to another account type.')}</span>
        </div>
        <AccountItemWithName
          accountName={account?.name}
          address={account?.address || ''}
          avatarSize={24}
          className='account-item'
          showUnselectIcon={true}
        />
      </div>
      <div className='confirmation-footer'>
        <Button
          loading={loading}
          onClick={handleCancel}
        >
          {t('Back to home')}
        </Button>
      </div>
    </>
  );
};

const NotSupportConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.highlight': {
      color: token.colorWarning
    },

    '.account-item': {
      '.ant-web3-block': {
        cursor: 'not-allowed',
        opacity: token.opacityDisable
      },

      '.ant-web3-block:hover': {
        cursor: 'not-allowed',
        background: token.colorBgSecondary
      }
    }
  };
});

export default NotSupportConfirmation;
