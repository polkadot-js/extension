// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, NominatorMetadata } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, CancelUnstakeSelector, HiddenInput } from '@subwallet/extension-web-ui/components';
import { useGetYieldPositionInfo, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useTransactionContext, useWatchTransaction } from '@subwallet/extension-web-ui/hooks';
import { yieldSubmitStakingCancelWithdrawal } from '@subwallet/extension-web-ui/messaging';
import { CancelUnYieldParams, FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertFieldToObject, simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Button, Form, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { accountFilterFunc } from '../../helper';
import { FreeBalance, TransactionContent, TransactionFooter, YieldOutlet } from '../../parts';

type Props = ThemeProps;

const hideFields: Array<keyof CancelUnYieldParams> = ['method', 'chain', 'asset'];
const validateFields: Array<keyof CancelUnYieldParams> = ['from'];

const Component: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { defaultData, onDone, persistData } = useTransactionContext<CancelUnYieldParams>();
  const { chain, method } = defaultData;

  const [form] = Form.useForm<CancelUnYieldParams>();
  const formDefault = useMemo((): CancelUnYieldParams => ({ ...defaultData }), [defaultData]);

  const { isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const from = useWatchTransaction('from', form, defaultData);

  const preCheckAction = usePreCheckAction(from);

  const allNominatorInfo = useGetYieldPositionInfo(method);
  const nominatorInfo = useGetYieldPositionInfo(method, from);
  const nominatorMetadata = nominatorInfo[0].metadata as NominatorMetadata;
  const type = nominatorMetadata.type;

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [isChangeData, setIsChangeData] = useState(false);

  const goHome = useCallback(() => {
    navigate('/home/earning/');
  }, [navigate]);

  const persistUnstake = useMemo(() => {
    if (from === defaultData.from && !isChangeData) {
      return defaultData.unstake;
    } else {
      return '';
    }
  }, [defaultData.from, defaultData.unstake, from, isChangeData]);

  const onFieldsChange: FormCallbacks<CancelUnYieldParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['asset']);

    const values = convertFieldToObject<CancelUnYieldParams>(allFields);
    const changes = convertFieldToObject<CancelUnYieldParams>(changedFields);

    if (changes.from) {
      setIsChangeData(true);
    }

    setIsDisable(empty || error);
    persistData(values);
  }, [persistData]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onSubmit: FormCallbacks<CancelUnYieldParams>['onFinish'] = useCallback((values: CancelUnYieldParams) => {
    setLoading(true);

    const { chain, from, unstake: unstakeIndex } = values;

    setTimeout(() => {
      yieldSubmitStakingCancelWithdrawal({
        address: from,
        chain: chain,
        selectedUnstaking: nominatorMetadata.unstakings[parseInt(unstakeIndex)]
      })
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [nominatorMetadata.unstakings, onError, onSuccess]);

  const filterAccount = useCallback((account: AccountJson): boolean => {
    const nomination = allNominatorInfo.find((data) => isSameAddress(data.address, account.address));

    return (nomination ? (nomination.metadata as NominatorMetadata)?.unstakings.length > 0 : false) && accountFilterFunc(chainInfoMap, type, chain)(account);
  }, [chainInfoMap, allNominatorInfo, chain, type]);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  return (
    <>
      <TransactionContent>
        <Form
          className={'form-container form-space-sm'}
          form={form}
          initialValues={formDefault}
          onFieldsChange={onFieldsChange}
          onFinish={onSubmit}
        >
          <HiddenInput fields={hideFields} />
          <Form.Item
            hidden={!isAllAccount}
            name={'from'}
          >
            <AccountSelector filter={filterAccount} />
          </Form.Item>
          <FreeBalance
            address={from}
            chain={chain}
            className={'free-balance'}
            label={t('Available balance:')}
            onBalanceReady={setIsBalanceReady}
          />
          <Form.Item name={'unstake'}>
            <CancelUnstakeSelector
              chain={chain}
              defaultValue={persistUnstake}
              disabled={!from}
              label={t('Select an unstake request')}
              nominators={from ? nominatorMetadata?.unstakings || [] : []}
            />
          </Form.Item>
        </Form>
      </TransactionContent>
      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <Button
          disabled={loading}
          icon={(
            <Icon
              phosphorIcon={XCircle}
              weight='fill'
            />
          )}
          onClick={goHome}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>

        <Button
          disabled={isDisable || !isBalanceReady}
          icon={(
            <Icon
              phosphorIcon={ArrowCircleRight}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={preCheckAction(form.submit, ExtrinsicType.STAKING_CANCEL_UNSTAKE)}
        >
          {t('Approve')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  return (
    <YieldOutlet
      className={CN(className)}
      path={'/transaction/cancel-un-yield'}
      stores={['yieldPool']}
    >
      <Component />
    </YieldOutlet>
  );
};

const YieldCancelUnstake = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',

    '.web-ui-enable &': {
      display: 'block',
      maxWidth: 416,
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',

      '.transaction-footer': {
        paddingTop: 4,
        gap: token.size
      }
    },

    '.unstaked-field, .free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    },

    '.cancel-unstake-info-item > .__col': {
      flex: 'initial',
      paddingRight: token.paddingXXS
    }
  };
});

export default YieldCancelUnstake;
