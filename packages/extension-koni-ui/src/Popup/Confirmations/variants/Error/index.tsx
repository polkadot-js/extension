// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationResult } from '@subwallet/extension-base/background/KoniTypes';
import { AlertBox, ConfirmationGeneralInfo, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { useGetAccountByAddress } from '@subwallet/extension-koni-ui/hooks';
import { completeConfirmation } from '@subwallet/extension-koni-ui/messaging';
import { ConfirmationQueueItem } from '@subwallet/extension-koni-ui/stores/base/RequestState';
import { EvmErrorSupportType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { XCircle } from 'phosphor-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  confirmation: ConfirmationQueueItem;
}

const handleCancel = async (type: EvmErrorSupportType, id: string) => {
  return await completeConfirmation(type, {
    id,
    isApproved: false
  } as ConfirmationResult<null>);
};

function Component ({ className, confirmation }: Props) {
  const type = confirmation.type as EvmErrorSupportType;
  const { id, payload } = confirmation.item as ConfirmationDefinitions[EvmErrorSupportType][0];
  const { t } = useTranslation();
  const { address, errors, networkKey } = payload;
  const [loading, setLoading] = useState(false);
  const account = useGetAccountByAddress(address);

  const title = useMemo(() => {
    switch (type) {
      case 'errorConnectNetwork':
        return t('Network Connection Error');
      default:
        return t('Request Error');
    }
  }, [t, type]);

  const content = useMemo(() => {
    switch (type) {
      case 'errorConnectNetwork':
        return networkKey
          ? (
            <MetaInfo.Chain
              chain={networkKey}
              label={t<string>('Network')}
            />)
          : <></>;
      default:
        return <></>;
    }
  }, [networkKey, t, type]);

  // Handle buttons actions
  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(type, id).finally(() => {
      setLoading(false);
    });
  }, [id, type]);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={confirmation.item} />
        <div className='title'>
          {title}
        </div>
        {/* <div className='description'> */}
        {/*  {t('You are approving a request with the following account')} */}
        {/* </div> */}
        <MetaInfo>
          {account && <MetaInfo.Account
            address={account.address}
            label={t('From account')}
            name={account.name}
          />}
          {content}
        </MetaInfo>

      </div>
      <div className={CN(className, 'confirmation-footer')}>
        {
          errors && errors.length > 0 && (
            <AlertBox
              className={CN(className, 'alert-box')}
              description={errors[0].message}
              title={'Error'}
              type={'error'}
            />
          )
        }

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
      </div>
    </>
  );
}

const ErrorRequestConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '.account-list': {
    '.__prop-label': {
      marginRight: token.marginMD,
      width: '50%',
      float: 'left'
    }
  },

  '.__label': {
    textAlign: 'left'
  }
}));

export default ErrorRequestConfirmation;
