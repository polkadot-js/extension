// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { makeTransfer } from '@subwallet/extension-koni-ui/messaging';
import { Button, Form, Input } from '@subwallet/react-ui';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import TransactionBase from './TransactionBase';

const _SendFund: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const sendFund = useCallback(
    () => {
      setLoading(true);
      makeTransfer({
        from: '0x40a207109cf531024B55010A1e760199Df0d3a13',
        networkKey: 'moonbeam',
        to: '0x2D3051BC4Ed05aE74AcB53Bff8034252C3F43755',
        tokenSlug: 'moonbeam-NATIVE-GLMR',
        value: '0'
      }).then(({ errors, extrinsicHash }) => {
        if (errors?.length) {
          setError(errors.map((e) => e.message).join(','));
        } else if (extrinsicHash) {
          setError('extrinsicHash');
        }
      }).catch(console.error);
    },
    []
  );

  return (
    <TransactionBase title={t('Transfer')}>
      <div className='transaction-content'>
        <Form className='form-container'>
          <Form.Item>
            <Input.TextArea
              className='private-key-input'
              placeholder={t('Input Address')}
            />
          </Form.Item>
        </Form>
      </div>
      <div className='transaction-footer'>
        {error && <div className='error-messages'>
          {error}
        </div>}
        <Button
          loading={loading}
          onClick={sendFund}
        >{t('Next')}</Button>
      </div>
    </TransactionBase>
  );
};

const SendFund = styled(_SendFund)(({ theme }) => {
  return ({

  });
});

export default SendFund;
