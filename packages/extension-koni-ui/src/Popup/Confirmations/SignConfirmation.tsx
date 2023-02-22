// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountAuthType, AccountJson, SigningRequest } from '@subwallet/extension-base/background/types';
import { approveSignPasswordV2, cancelSignRequest } from '@subwallet/extension-koni-ui/messaging';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/Popup/Confirmations/ConfirmationGeneralInfo';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Button, Icon, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: SigningRequest
}

async function handleConfirm ({ id }: SigningRequest) {
  return await approveSignPasswordV2({ id });
}

async function handleCancel ({ id }: SigningRequest) {
  return await cancelSignRequest(id);
}

export const filterAuthorizeAccounts = (accounts: AccountJson[], accountAuthType: AccountAuthType) => {
  let rs = [...accounts];

  rs = rs.filter((acc) => acc.isReadOnly !== true);

  if (accountAuthType === 'evm') {
    rs = rs.filter((acc) => (isAccountAll(acc.address) || acc.type === 'ethereum'));
  } else {
    rs = rs.filter((acc) => (isAccountAll(acc.address) || acc.type !== 'ethereum'));
  }

  return rs;
};

function Component ({ className, request }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { payload } = request.request;
  // Handle buttons actions

  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(request).finally(() => {
      setLoading(false);
    });
  }, [request]);

  const onConfirm = useCallback(() => {
    setLoading(true);

    handleConfirm(request).finally(() => {
      setLoading(false);
    });
  }, [request]);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className={'account-list text-center'}>
          <Typography.Title level={4}>
            {t('Signing....')}
          </Typography.Title>
          <Typography.Paragraph className='text-tertiary'>
            {JSON.stringify(payload)}
          </Typography.Paragraph>
        </div>
      </div>
      <div className='confirmation-footer'>
        <Button
          disabled={loading}
          icon={<Icon phosphorIcon={XCircle} />}
          onClick={onCancel}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>
        <Button
          icon={<Icon phosphorIcon={CheckCircle} />}
          loading={loading}
          onClick={onConfirm}
        >
          {t('Approve')}
        </Button>
      </div>
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
