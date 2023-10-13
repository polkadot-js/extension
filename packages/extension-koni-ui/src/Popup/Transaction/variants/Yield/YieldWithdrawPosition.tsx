// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, AmountInput, HiddenInput, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { BN_ZERO } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useGetYieldMetadata, useGetYieldPositionByAddressAndSlug, useHandleSubmitTransaction, usePreCheckAction, useSelector, useSetCurrentPage, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import { yieldSubmitRedeem } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { FormCallbacks, FormFieldData, ThemeProps, YieldFastWithdrawParams } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, simpleCheckForm, validateYieldWithdrawPosition } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { MinusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { FreeBalance, TransactionContent, TransactionFooter } from '../../parts';

type Props = ThemeProps;

const _accountFilterFunc = (
  allYieldPosition: YieldPositionInfo[],
  selectedPoolSlug: string
): (account: AccountJson) => boolean => {
  return (account: AccountJson): boolean => {
    const yieldPositionInfo = allYieldPosition.find((item) => {
      return isSameAddress(item.address, account.address) && item.slug === selectedPoolSlug;
    });

    return new BigN(yieldPositionInfo?.balance[0].totalBalance || BN_ZERO).gt(BN_ZERO);
  };
};

const hideFields: Array<keyof YieldFastWithdrawParams> = ['chain', 'asset', 'method'];

const Component: React.FC = () => {
  useSetCurrentPage('/transaction/yield-withdraw-position');

  const { t } = useTranslation();
  const { defaultData, onDone, persistData } = useTransactionContext<YieldFastWithdrawParams>();

  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm<YieldFastWithdrawParams>();
  const formDefault = useMemo((): YieldFastWithdrawParams => ({ ...defaultData }), [defaultData]);
  const { isAllAccount } = useSelector((state) => state.accountState);

  const from = useWatchTransaction('from', form, defaultData);
  const method = useWatchTransaction('method', form, defaultData);
  const { chain } = defaultData;

  const allYieldPosition = useSelector((state: RootState) => state.yieldPool.yieldPosition);
  const yieldPoolInfo = useGetYieldMetadata(method);
  const yieldPosition = useGetYieldPositionByAddressAndSlug(from, method);
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);

  const minWithdraw = useMemo((): string => {
    return yieldPoolInfo?.stats?.minWithdrawal || '0';
  }, [yieldPoolInfo?.stats?.minWithdrawal]);

  const activeBalance = useMemo(() => {
    return yieldPosition?.balance[0]?.activeBalance || '0';
  }, [yieldPosition?.balance]);

  const tokenDecimals = useMemo(() => {
    if (!yieldPoolInfo) {
      return;
    }

    const tokenSlug = yieldPoolInfo.derivativeAssets ? yieldPoolInfo?.derivativeAssets[0] : yieldPoolInfo?.inputAssets[0];
    const tokenInfo = assetRegistry[tokenSlug];

    return _getAssetDecimals(tokenInfo);
  }, [assetRegistry, yieldPoolInfo]);

  const onFieldsChange: FormCallbacks<YieldFastWithdrawParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['asset']);

    const values = convertFieldToObject<YieldFastWithdrawParams>(allFields);

    setIsDisable(empty || error);
    persistData(values);
  }, [persistData]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onSubmit: FormCallbacks<YieldFastWithdrawParams>['onFinish'] = useCallback((values: YieldFastWithdrawParams) => {
    setLoading(true);

    if (!yieldPosition || !yieldPoolInfo) {
      setLoading(false);

      return;
    }

    setTimeout(() => {
      yieldSubmitRedeem({
        address: from,
        amount: values.amount,
        yieldPoolInfo,
        yieldPositionInfo: yieldPosition
      })
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [from, onError, onSuccess, yieldPoolInfo, yieldPosition]);

  const onPreCheck = usePreCheckAction(from);

  const extrinsicType = useMemo((): ExtrinsicType => {
    if (!yieldPoolInfo) {
      return ExtrinsicType.UNKNOWN;
    }

    switch (yieldPoolInfo.slug) {
      case 'DOT___acala_liquid_staking':
        return ExtrinsicType.REDEEM_LDOT;
      case 'DOT___bifrost_liquid_staking':
        return ExtrinsicType.REDEEM_VDOT;
      case 'DOT___parallel_liquid_staking':
        return ExtrinsicType.REDEEM_SDOT;
      case 'DOT___interlay_lending':
        return ExtrinsicType.REDEEM_QDOT;
      default:
        return ExtrinsicType.UNKNOWN;
    }
  }, [yieldPoolInfo]);

  return (
    <div>
      <TransactionContent>
        <Form
          className={CN('form-container', 'form-space-xxs')}
          form={form}
          initialValues={formDefault}
          name='yield-withdraw-form'
          onFieldsChange={onFieldsChange}
          onFinish={onSubmit}
        >
          <HiddenInput fields={hideFields} />
          <Form.Item
            hidden={!isAllAccount}
            name={'from'}
          >
            <AccountSelector
              filter={_accountFilterFunc(allYieldPosition, method)}
              label={t('Withdraw from account')}
            />
          </Form.Item>

          <FreeBalance
            address={from}
            chain={chain}
            className={'free-balance'}
            label={t('Available balance:')}
            onBalanceReady={setIsBalanceReady}
            tokenSlug={yieldPoolInfo?.derivativeAssets?.[0]}
          />

          <Form.Item
            name={'amount'}
            rules={[
              { required: true, message: t('Amount is required') },
              validateYieldWithdrawPosition(minWithdraw, activeBalance, tokenDecimals || 0, t)
            ]}
            statusHelpAsTooltip={true}
          >
            <AmountInput
              decimals={tokenDecimals || 0}
              maxValue={activeBalance}
              showMaxButton={true}
            />
          </Form.Item>
        </Form>
      </TransactionContent>

      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <Button
          disabled={isDisable || !isBalanceReady}
          icon={(
            <Icon
              phosphorIcon={MinusCircle}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={onPreCheck(form.submit, extrinsicType)}
        >
          {t('Withdraw')}
        </Button>
      </TransactionFooter>
    </div>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  useSetCurrentPage('/transaction/withdraw-yield');

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(['yieldPool'])}
    >
      <Component />
    </PageWrapper>
  );
};

const YieldWithdrawPosition = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
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

    '.free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    }
  };
});

export default YieldWithdrawPosition;
