// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, NominationPoolInfo, StakingType, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { _getChainNativeTokenBasicInfo, _getChainNativeTokenSlug, _getOriginChainOfAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import MultiValidatorSelector from '@subwallet/extension-koni-ui/components/Field/MultiValidatorSelector';
import PoolSelector from '@subwallet/extension-koni-ui/components/Field/PoolSelector';
import { TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { StakingNetworkDetailModal, StakingNetworkDetailModalId } from '@subwallet/extension-koni-ui/components/Modal/Staking/StakingNetworkDetailModal';
import ScreenTab from '@subwallet/extension-koni-ui/components/ScreenTab';
import SelectValidatorInput from '@subwallet/extension-koni-ui/components/SelectValidatorInput';
import { useGetStakeData } from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakeData';
import useGetSupportedStakingTokens from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetSupportedStakingTokens';
import { submitBonding, submitPoolBonding } from '@subwallet/extension-koni-ui/messaging';
import { StakingDataOption } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import { fetchChainValidators } from '@subwallet/extension-koni-ui/Popup/Transaction/helper/stakingHandler';
import FreeBalance from '@subwallet/extension-koni-ui/Popup/Transaction/parts/FreeBalance';
import TransactionContent from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionContent';
import TransactionFooter from '@subwallet/extension-koni-ui/Popup/Transaction/parts/TransactionFooter';
import { TransactionContext, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Button, Divider, Form, Icon } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

interface StakeFromProps extends TransactionFormBaseProps {
  token: string
  value: string
  nominate: string,
  pool: number
}

function parseNominations (nomination: string) {
  const infoList = nomination.split(',');

  const result: string[] = [];

  infoList.forEach((info) => {
    result.push(info.split('___')[0]);
  });

  return result;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const transactionContext = useContext(TransactionContext);
  const location = useLocation();
  const { t } = useTranslation();
  const [form] = useForm<StakeFromProps>();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [locationState] = useState<StakingDataOption>(location?.state as StakingDataOption);

  const { chainStakingMetadata, hideTabList, nominatorMetadata } = locationState;
  const tokenList = useGetSupportedStakingTokens();
  const [loading, setLoading] = useState(false);

  // TODO: should do better to get validators info
  const { nominationPoolInfoMap, validatorInfoMap } = useSelector((state: RootState) => state.bonding);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const [{ decimals, symbol }, setNativeTokenBasicInfo] = useState<{ decimals: number, symbol: string }>({ decimals: 0, symbol: 'Unit' });
  const isAllAccount = isAccountAll(currentAccount?.address || '');
  const defaultTab = useMemo(() => {
    if (nominatorMetadata) {
      if (nominatorMetadata.type === StakingType.POOLED) {
        return 0;
      } else {
        return 1;
      }
    } else {
      return 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [stakingType, setStakingType] = useState<StakingType>(defaultTab === 0 ? StakingType.POOLED : StakingType.NOMINATED);
  const { _chainStakingMetadata, _nominatorMetadata } = useGetStakeData(currentAccount?.address || '', stakingType, chainStakingMetadata, nominatorMetadata, form.getFieldsValue().token);

  const defaultSlug = useMemo(() => {
    if (chainStakingMetadata) {
      const chainInfo = chainInfoMap[chainStakingMetadata.chain];

      return _getChainNativeTokenSlug(chainInfo);
    }

    return '';
  }, [chainInfoMap, chainStakingMetadata]);

  const formDefault = useMemo(() => {
    return {
      from: transactionContext.from,
      token: defaultSlug,
      value: '0'
    };
  }, [defaultSlug, transactionContext.from]);

  const currentValue = Form.useWatch('value', form);
  const currentFrom = Form.useWatch('from', form);
  const currentTokenSlug = Form.useWatch('token', form);
  const currentPool = Form.useWatch('pool', form);
  const currentNominator = Form.useWatch('nominate', form);

  useEffect(() => {
    if (_chainStakingMetadata) {
      const chainInfo = chainInfoMap[_chainStakingMetadata.chain];

      setNativeTokenBasicInfo(_getChainNativeTokenBasicInfo(chainInfo));
    }
  }, [chainInfoMap, _chainStakingMetadata]);

  useEffect(() => {
    transactionContext.setTransactionType(ExtrinsicType.STAKING_JOIN_POOL);
    transactionContext.setShowRightBtn(true);
    transactionContext.setChain(chainStakingMetadata ? chainStakingMetadata.chain : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    transactionContext.setDisabledRightBtn(!_chainStakingMetadata);
  }, [_chainStakingMetadata, transactionContext]);

  useEffect(() => { // fetch validators when change stakingType
    if (transactionContext.chain !== '') {
      fetchChainValidators(transactionContext.chain, stakingType);
    }
  }, [stakingType, transactionContext.chain]);

  const onFieldsChange = useCallback(({ from, nominate, token, value }: Partial<StakeFromProps>, values: StakeFromProps) => {
    // TODO: field change

    if (from) {
      transactionContext.setFrom(from);
    }

    if (token) {
      const chain = _getOriginChainOfAsset(token);

      transactionContext.setChain(chain);
      form.setFieldValue('token', token);
    }

    if (nominate) {
      form.setFieldValue('nominate', nominate);
    }
  }, [form, transactionContext]);

  const getSelectedValidators = useCallback((nominations: string[]) => {
    const validatorList = validatorInfoMap[transactionContext.chain];

    if (!validatorList) {
      return [];
    }

    const result: ValidatorInfo[] = [];

    validatorList.forEach((validator) => {
      if (nominations.includes(validator.address)) {
        result.push(validator);
      }
    });

    return result;
  }, [transactionContext.chain, validatorInfoMap]);

  const getSelectedPool = useCallback((poolId: number) => {
    const nominationPoolList = nominationPoolInfoMap[transactionContext.chain];

    for (const pool of nominationPoolList) {
      if (pool.id === poolId) {
        return pool;
      }
    }

    // eslint-disable-next-line
    return;
  }, [nominationPoolInfoMap, transactionContext.chain]);

  const submitTransaction = useCallback(() => {
    form.validateFields()
      .then((values) => {
        setLoading(true);
        const { from, nominate, pool, value } = values;
        let bondingPromise: Promise<SWTransactionResponse>;

        if (pool) {
          const selectedPool = getSelectedPool(pool);

          bondingPromise = submitPoolBonding({
            amount: value,
            chain: transactionContext.chain,
            nominatorMetadata: _nominatorMetadata,
            selectedPool: selectedPool as NominationPoolInfo,
            address: from
          });
        } else {
          const selectedValidators = getSelectedValidators(parseNominations(nominate));

          bondingPromise = submitBonding({
            amount: value,
            chain: transactionContext.chain,
            nominatorMetadata: _nominatorMetadata,
            selectedValidators,
            type: StakingType.NOMINATED
          });
        }

        bondingPromise
          .then((response) => {
            const { errors, extrinsicHash, warnings } = response;

            if (errors.length || warnings.length) {
              console.log('failed', errors, warnings);
              setLoading(false);
              // setErrors(errors.map((e) => e.message));
              // setWarnings(warnings.map((w) => w.message));
            } else if (extrinsicHash) {
              transactionContext.onDone(extrinsicHash);
            }
          })
          .catch((error) => {
            setLoading(false);
            console.log(error);
          });
      })
      .catch((error: Error) => {
        console.log(error);
        setLoading(false);
      });
  }, [_nominatorMetadata, form, getSelectedPool, getSelectedValidators, transactionContext]);

  const getMetaInfo = useCallback(() => {
    if (_chainStakingMetadata) {
      return (
        <MetaInfo
          className={'meta-info'}
          labelColorScheme={'gray'}
          spaceSize={'xs'}
          valueColorScheme={'light'}
        >
          {_chainStakingMetadata.expectedReturn && <MetaInfo.Number
            label={t('Estimated earnings:')}
            suffix={'% / year'}
            value={_chainStakingMetadata.expectedReturn}
          />}

          {_chainStakingMetadata.minStake && <MetaInfo.Number
            decimals={decimals}
            label={t('Minimum active:')}
            suffix={symbol}
            value={_chainStakingMetadata.minStake}
            valueColorSchema={'success'}
          />}
        </MetaInfo>
      );
    }

    return null;
  }, [_chainStakingMetadata, decimals, symbol, t]);

  const onCloseInfoModal = () => {
    inactiveModal(StakingNetworkDetailModalId);
  };

  const onSelectTab = useCallback((index: number) => {
    setStakingType(index === 0 ? StakingType.POOLED : StakingType.NOMINATED);
  }, []);

  const onActiveValidatorSelector = useCallback(() => {
    activeModal('multi-validator-selector');
  }, [activeModal]);

  const isDisabledStakeBtn = useMemo(() => {
    const isDisabled = !currentTokenSlug || currentValue === '0' || !currentValue || currentFrom === ALL_ACCOUNT_KEY;

    if (stakingType === StakingType.POOLED) {
      return isDisabled || !currentPool;
    } else {
      return isDisabled || !currentNominator;
    }
  }, [currentFrom, currentNominator, currentPool, currentTokenSlug, currentValue, stakingType]);

  return (
    <>
      <ScreenTab
        className={className}
        defaultIndex={defaultTab}
        hideTabList={hideTabList}
        onSelectTab={onSelectTab}
      >
        <ScreenTab.SwTabPanel label={t('Pools')}>
          <TransactionContent>
            <Form
              className={'form-container form-space-sm'}
              form={form}
              initialValues={formDefault}
              onValuesChange={onFieldsChange}
            >
              <Form.Item
                hidden={!isAllAccount}
                name={'from'}
              >
                <AccountSelector />
              </Form.Item>

              {!isAllAccount && <Form.Item name={'token'}>
                <TokenSelector
                  disabled={!!chainStakingMetadata}
                  items={tokenList}
                  prefixShape='circle'
                />
              </Form.Item>
              }

              <FreeBalance
                className={'account-free-balance'}
                label={t('Available balance:')}
              />

              <div className={'form-row'}>
                {isAllAccount && <Form.Item name={'token'}>
                  <TokenSelector
                    disabled={!!chainStakingMetadata}
                    items={tokenList}
                    prefixShape='circle'
                  />
                </Form.Item>}

                <Form.Item
                  hideError
                  name={'value'}
                  rules={[{ required: true }]}
                >
                  <AmountInput
                    decimals={10}
                    maxValue={'10000'}
                  />
                </Form.Item>
              </div>

              <Form.Item name={'pool'}>
                <PoolSelector
                  disabled={!currentTokenSlug || !!chainStakingMetadata}
                  chain={transactionContext.chain}
                  label={t('Select pool')}
                  nominationPoolList={_nominatorMetadata ? _nominatorMetadata.nominations : undefined}
                />
              </Form.Item>

              {!!currentTokenSlug && _chainStakingMetadata && <>
                <Divider />
                {getMetaInfo()}
              </>}
            </Form>
          </TransactionContent>
        </ScreenTab.SwTabPanel>

        <ScreenTab.SwTabPanel label={t('Nominate')}>
          <TransactionContent>
            <Form
              className={'form-container form-space-sm'}
              form={form}
              initialValues={formDefault}
              onValuesChange={onFieldsChange}
            >
              <Form.Item
                hidden={!isAllAccount}
                name={'from'}
              >
                <AccountSelector />
              </Form.Item>

              {!isAllAccount && <Form.Item name={'token'}>
                <TokenSelector
                  disabled={!!chainStakingMetadata}
                  items={tokenList}
                  prefixShape='circle'
                />
              </Form.Item>
              }

              <FreeBalance
                className={'account-free-balance'}
                label={t('Available balance:')}
              />

              <div className={'form-row'}>
                {isAllAccount && <Form.Item name={'token'}>
                  <TokenSelector
                    disabled={!!chainStakingMetadata}
                    items={tokenList}
                    prefixShape='circle'
                  />
                </Form.Item>}

                <Form.Item name={'value'}>
                  <AmountInput
                    decimals={10}
                    maxValue={'10000'}
                  />
                </Form.Item>
              </div>
              <SelectValidatorInput
                label={t('Select validator')}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={onActiveValidatorSelector}
                value={currentNominator}
                disabled={!currentTokenSlug}
              />

              <Form.Item name={'nominate'}>
                <MultiValidatorSelector
                  chain={transactionContext.chain}
                  id={'multi-validator-selector'}
                  nominations={_nominatorMetadata ? _nominatorMetadata.nominations : undefined}
                />
              </Form.Item>

              {!!form.getFieldsValue().token && _chainStakingMetadata && <>
                <Divider />
                {getMetaInfo()}
              </>}
            </Form>
          </TransactionContent>
        </ScreenTab.SwTabPanel>
      </ScreenTab>
      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <Button
          disabled={isDisabledStakeBtn}
          icon={<Icon
            phosphorIcon={PlusCircle}
            weight={'fill'}
          />}
          loading={loading}
          onClick={submitTransaction}
        >
          {t('Stake')}
        </Button>
      </TransactionFooter>

      {_chainStakingMetadata && <StakingNetworkDetailModal
        estimatedEarning={_chainStakingMetadata.expectedReturn}
        inflation={_chainStakingMetadata.inflation}
        maxValidatorPerNominator={_chainStakingMetadata.maxValidatorPerNominator}
        minimumActive={{ decimals, value: _chainStakingMetadata.minStake, symbol }}
        unstakingPeriod={_chainStakingMetadata.unstakingPeriod}
        // eslint-disable-next-line react/jsx-no-bind
        onCancel={onCloseInfoModal}
      />}
    </>
  );
};

const Stake = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    paddingTop: token.paddingXS,

    '.account-free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    }
  };
});

export default Stake;
