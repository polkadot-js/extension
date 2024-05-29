// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataRequest } from '@subwallet/extension-base/background/types';
import { ConfirmationGeneralInfo } from '@subwallet/extension-web-ui/components';
import { approveMetaRequest, rejectMetaRequest } from '@subwallet/extension-web-ui/messaging';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: MetadataRequest
}

async function handleConfirm ({ id }: MetadataRequest) {
  return await approveMetaRequest(id);
}

async function handleCancel ({ id }: MetadataRequest) {
  return await rejectMetaRequest(id);
}

function Component ({ className, request }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { chain, specVersion, tokenDecimals, tokenSymbol } = request.request;
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
            {t('Your metadata is out of date')}
          </Typography.Title>
          <Typography.Paragraph className='text-tertiary'>
            {t('Approving this update will sync your metadata for {{chainName}} chain from {{dAppUrl}}', { replace: { dAppUrl: request.url, chainName: chain } })}
          </Typography.Paragraph>
          <Typography.Paragraph className={'text-left'}>
            <span className='__prop-label text-tertiary text-right'>{t('Symbol')}</span> <span>{tokenSymbol}</span>
          </Typography.Paragraph>
          <Typography.Paragraph className={'text-left'}>
            <span className='__prop-label text-tertiary text-right'>{t('Decimal')}</span> <span>{tokenDecimals}</span>
          </Typography.Paragraph>
          <Typography.Paragraph className={'text-left'}>
            <span className='__prop-label text-tertiary text-right'>{t('Spec Version')}</span> <span>{specVersion}</span>
          </Typography.Paragraph>
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
              phosphorIcon={CheckCircle}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onConfirm}
        >
          {t('Approve')}
        </Button>
      </div>
    </>
  );
}

const MetadataConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '.account-list': {
    '.__prop-label': {
      marginRight: token.marginMD,
      width: '50%',
      float: 'left'
    }
  }
}));

export default MetadataConfirmation;
