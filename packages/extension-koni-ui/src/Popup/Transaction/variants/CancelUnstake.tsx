// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, CancelUnstakeSelector, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useGetNominatorInfo, useHandleSubmitTransaction, usePreCheckAction, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { submitStakeCancelWithdrawal } from '@subwallet/extension-koni-ui/messaging';
import { accountFilterFunc } from '@subwallet/extension-koni-ui/Popup/Transaction/helper';
import { FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon } from '@subwallet/react-ui';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { FreeBalance, TransactionContent, TransactionFooter } from '../parts';
import { TransactionContext, TransactionFormBaseProps } from '../Transaction';

type Props = ThemeProps;

enum FormFieldName {
  UNSTAKE = 'unstake'
}

interface CancelUnstakeFormProps extends TransactionFormBaseProps {
  [FormFieldName.UNSTAKE]: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className = '' } = props;

  const { chain: stakingChain, type: _stakingType } = useParams();
  const stakingType = _stakingType as StakingType;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);
  const { asset, chain, from, onDone, setChain, setFrom } = useContext(TransactionContext);

  const { currentAccount, isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const allNominatorInfo = useGetNominatorInfo(stakingChain, stakingType);
  const nominatorInfo = useGetNominatorInfo(stakingChain, stakingType, from);
  const nominatorMetadata = nominatorInfo[0];

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const [form] = Form.useForm<CancelUnstakeFormProps>();
  const formDefault = useMemo((): CancelUnstakeFormProps => ({
    from: from,
    chain: chain,
    asset: asset,
    [FormFieldName.UNSTAKE]: ''
  }), [asset, chain, from]);

  const goHome = useCallback(() => {
    navigate('/home/staking');
  }, [navigate]);

  const onFieldsChange: FormCallbacks<CancelUnstakeFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields);

    const changesMap = convertFieldToObject<CancelUnstakeFormProps>(changedFields);

    const { from } = changesMap;

    if (from !== undefined) {
      setFrom(from);
    }

    setIsDisable(empty || error);
  }, [setFrom]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onSubmit: FormCallbacks<CancelUnstakeFormProps>['onFinish'] = useCallback((values: CancelUnstakeFormProps) => {
    setLoading(true);

    const { [FormFieldName.UNSTAKE]: unstakeIndex } = values;

    setTimeout(() => {
      submitStakeCancelWithdrawal({
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
  }, [chain, from, nominatorMetadata.unstakings, onError, onSuccess]);

  const filterAccount = useCallback((account: AccountJson): boolean => {
    const nomination = allNominatorInfo.find((data) => isSameAddress(data.address, account.address));

    return (nomination ? nomination.unstakings.length > 0 : false) && accountFilterFunc(chainInfoMap, stakingType, stakingChain)(account);
  }, [chainInfoMap, allNominatorInfo, stakingChain, stakingType]);

  const onPreCheck = usePreCheckAction(from);

  useEffect(() => {
    const address = currentAccount?.address || '';

    if (address) {
      if (!isAccountAll(address)) {
        setFrom(address);
      }
    }
  }, [currentAccount?.address, setFrom]);

  useEffect(() => {
    setChain(stakingChain || '');
  }, [setChain, stakingChain]);

  return (
    <div className={className}>
      <TransactionContent>
        <PageWrapper resolve={dataContext.awaitStores(['staking'])}>
          <Form
            className={'form-container form-space-sm'}
            form={form}
            initialValues={formDefault}
            onFieldsChange={onFieldsChange}
            onFinish={onSubmit}
          >
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
            <Form.Item name={FormFieldName.UNSTAKE}>
              <CancelUnstakeSelector
                chain={chain}
                disabled={!from}
                label={t('Select an unstake request')}
                nominators={from ? nominatorMetadata?.unstakings || [] : []}
              />
            </Form.Item>
          </Form>
        </PageWrapper>
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
          onClick={onPreCheck(form.submit, ExtrinsicType.STAKING_CANCEL_UNSTAKE)}
        >
          {t('Approve')}
        </Button>
      </TransactionFooter>
    </div>
  );
};

const CancelUnstake = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

export default CancelUnstake;
