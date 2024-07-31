// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationResult, ConfirmationsQueueItem, ErrorNetworkConnection } from '@subwallet/extension-base/background/KoniTypes';
import { AlertBox, ConfirmationGeneralInfo, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { useGetAccountByAddress } from '@subwallet/extension-koni-ui/hooks';
import { completeConfirmation } from '@subwallet/extension-koni-ui/messaging';
import { EvmErrorSupportType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { XCircle } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  type: EvmErrorSupportType
  request: ConfirmationsQueueItem<ErrorNetworkConnection>
}

const handleCancel = async (type: EvmErrorSupportType, id: string) => {
  return await completeConfirmation(type, {
    id,
    isApproved: false
  } as ConfirmationResult<null>);
};

function Component ({ className, request, type }: Props) {
  const { id, payload } = request;
  const { t } = useTranslation();
  const { address, errors, networkKey } = payload;
  const [loading, setLoading] = useState(false);
  const account = useGetAccountByAddress(address);

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
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          {t('Network Connection Error')}
        </div>
        {/* <div className='description'> */}
        {/*  {t('You are approving a request with the following account')} */}
        {/* </div> */}
        <MetaInfo>
          {account && <MetaInfo.Account
            address={account.address}
            label={t('Account')}
            name={account.name}
          />}
          { networkKey
            ? (
              <MetaInfo.Chain
                chain={networkKey}
                label={t<string>('Network')}
              />)
            : <></>}
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
          schema={'primary'}
        >
          {t('Cancel')}
        </Button>
      </div>
    </>
  );
}

const NetworkConnectionErrorConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
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

export default NetworkConnectionErrorConfirmation;
