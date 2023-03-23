// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, ExtrinsicType, NominationPoolInfo, NominatorMetadata, StakingType, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { _getChainNativeTokenBasicInfo, _getChainNativeTokenSlug, _getOriginChainOfAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import MultiValidatorSelector from '@subwallet/extension-koni-ui/components/Field/MultiValidatorSelector';
import PoolSelector from '@subwallet/extension-koni-ui/components/Field/PoolSelector';
import { TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { StakingNetworkDetailModal, StakingNetworkDetailModalId } from '@subwallet/extension-koni-ui/components/Modal/Staking/StakingNetworkDetailModal';
import ScreenTab from '@subwallet/extension-koni-ui/components/ScreenTab';
import SelectValidatorInput from '@subwallet/extension-koni-ui/components/SelectValidatorInput';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants/commont';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetChainStakingMetadata from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetChainStakingMetadata';
import useGetNominatorInfo from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetNominatorInfo';
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
import { useParams } from 'react-router';
import styled from 'styled-components';

type Props = ThemeProps

interface StakeFromProps extends TransactionFormBaseProps {
  token: string
  value: string
  nominate: string,
  pool: number
}

const parseNominations = (nomination: string) => {
  const infoList = nomination.split(',');

  const result: string[] = [];

  infoList.forEach((info) => {
    result.push(info.split('___')[0]);
  });

  return result;
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const { chain: stakingChain, type: _stakingType } = useParams();

  const dataContext = useContext(DataContext);
  const { chain, from, onDone, setChain, setDisabledRightBtn, setFrom, setShowRightBtn, setTransactionType } = useContext(TransactionContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const defaultTab = useMemo(() => {
    switch (_stakingType) {
      case StakingType.POOLED:
        return 0;
      case StakingType.NOMINATED:
        return 1;
      default:
        return 0;
    }
  }, [_stakingType]);

  const [stakingType, setStakingType] = useState<StakingType>(defaultTab === 0 ? StakingType.POOLED : StakingType.NOMINATED);

  const [form] = useForm<StakeFromProps>();

  const currentValue = Form.useWatch('value', form);
  const currentFrom = Form.useWatch('from', form);
  const currentTokenSlug = Form.useWatch('token', form);
  const currentPool = Form.useWatch('pool', form);
  const currentNominator = Form.useWatch('nominate', form);

  const currentChain = (stakingChain === ALL_KEY ? _getOriginChainOfAsset(currentTokenSlug) : stakingChain);

  const chainStakingMetadata = useGetChainStakingMetadata(currentChain);
  const nominatorMetadata = useGetNominatorInfo(currentChain, stakingType, currentFrom);

  const tokenList = useGetSupportedStakingTokens(currentFrom, stakingChain);
  const [loading, setLoading] = useState(false);

  // TODO: should do better to get validators info
  const { nominationPoolInfoMap, validatorInfoMap } = useSelector((state: RootState) => state.bonding);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const { currentAccount } = useSelector((state: RootState) => state.accountState);

  const [{ decimals, symbol }, setNativeTokenBasicInfo] = useState<{ decimals: number, symbol: string }>({
    decimals: 0,
    symbol: 'Unit'
  });

  const isAllAccount = isAccountAll(currentAccount?.address || '');

  // TODO: chainStakingMetadata is sometimes null
  const { _chainStakingMetadata, _nominatorMetadata } = useGetStakeData(currentAccount?.address || '', stakingType, chainStakingMetadata, nominatorMetadata[0], form.getFieldsValue().token);

  const defaultSlug = useMemo(() => {
    if (chainStakingMetadata) {
      const chainInfo = chainInfoMap[chainStakingMetadata.chain];

      return _getChainNativeTokenSlug(chainInfo);
    }

    return '';
  }, [chainInfoMap, chainStakingMetadata]);

  const formDefault = useMemo(() => {
    return {
      from: from,
      token: defaultSlug,
      value: '0'
    };
  }, [defaultSlug, from]);

  useEffect(() => {
    if (_chainStakingMetadata) {
      const chainInfo = chainInfoMap[_chainStakingMetadata.chain];

      setNativeTokenBasicInfo(_getChainNativeTokenBasicInfo(chainInfo));
    }
  }, [chainInfoMap, _chainStakingMetadata]);

  useEffect(() => {
    setTransactionType(ExtrinsicType.STAKING_JOIN_POOL);
    setShowRightBtn(true);
    setChain(chainStakingMetadata ? chainStakingMetadata.chain : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setDisabledRightBtn(!_chainStakingMetadata);
  }, [_chainStakingMetadata, setDisabledRightBtn]);

  useEffect(() => { // fetch validators when change stakingType
    if (chain !== '') {
      fetchChainValidators(chain, stakingType);
    }
  }, [stakingType, chain]);

  const onValuesChange = useCallback(({ from, nominate, token, value }: Partial<StakeFromProps>, values: StakeFromProps) => {
    // TODO: field change

    if (from) {
      setFrom(from);
    }

    if (token) {
      const chain = _getOriginChainOfAsset(token);

      setChain(chain);
      form.setFieldValue('token', token);
    }

    if (nominate) {
      form.setFieldValue('nominate', nominate);
    }
  }, [form, setChain, setFrom]);

  const getSelectedValidators = useCallback((nominations: string[]) => {
    const validatorList = validatorInfoMap[chain];

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
  }, [chain, validatorInfoMap]);

  const getSelectedPool = useCallback((poolId: number | undefined) => {
    const nominationPoolList = nominationPoolInfoMap[chain];

    for (const pool of nominationPoolList) {
      if (pool.id === poolId) {
        return pool;
      }
    }

    return undefined;
  }, [nominationPoolInfoMap, chain]);

  const submitTransaction = useCallback(() => {
    form.validateFields()
      .then((values) => {
        setLoading(true);
        const { from, nominate, pool, value } = values;
        let bondingPromise: Promise<SWTransactionResponse>;

        if (pool) {
          const selectedPool = getSelectedPool(pool);

          bondingPromise = submitPoolBonding({
            amount: value, // TODO: value is wrong
            chain: chain,
            nominatorMetadata: _nominatorMetadata,
            selectedPool: selectedPool as NominationPoolInfo,
            address: from
          });
        } else {
          const selectedValidators = getSelectedValidators(parseNominations(nominate));

          bondingPromise = submitBonding({
            amount: value,
            chain: chain,
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
              onDone(extrinsicHash);
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
  }, [_nominatorMetadata, chain, form, getSelectedPool, getSelectedValidators, onDone]);

  const getMetaInfo = useCallback(() => {
    if (chainStakingMetadata) {
      return (
        <MetaInfo
          className={'meta-info'}
          labelColorScheme={'gray'}
          spaceSize={'xs'}
          valueColorScheme={'light'}
        >
          {chainStakingMetadata.expectedReturn && <MetaInfo.Number
            label={t('Estimated earnings:')}
            suffix={'% / year'}
            value={chainStakingMetadata.expectedReturn}
          />}

          {chainStakingMetadata.minStake && <MetaInfo.Number
            decimals={decimals}
            label={t('Minimum active:')}
            suffix={symbol}
            value={chainStakingMetadata.minStake}
            valueColorSchema={'success'}
          />}
        </MetaInfo>
      );
    }

    return null;
  }, [chainStakingMetadata, decimals, symbol, t]);

  const onCloseInfoModal = useCallback(() => {
    inactiveModal(StakingNetworkDetailModalId);
  }, [inactiveModal]);

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
      <TransactionContent>
        <PageWrapper
          resolve={dataContext.awaitStores(['staking'])}
        >
          <Form
            className={'form-container form-space-sm'}
            form={form}
            initialValues={formDefault}
            onValuesChange={onValuesChange}
          >
            <ScreenTab
              className={className}
              defaultIndex={defaultTab}
              hideTabList={_stakingType !== ALL_KEY}
              onSelectTab={onSelectTab}
            >
              {/*<ScreenTab.SwTabExtra>*/}
              {/*  <AccountSelector />*/}
              {/*</ScreenTab.SwTabExtra>*/}
              <ScreenTab.SwTabPanel label={t('Pools')}>
                <>
                  <Form.Item
                    hidden={!isAllAccount}
                    name={'from'}
                  >
                    <AccountSelector />
                  </Form.Item>

                  {
                    !isAllAccount &&
                    (
                      <Form.Item name={'token'}>
                        <TokenSelector
                          disabled={!!chainStakingMetadata}
                          items={tokenList}
                          prefixShape='circle'
                        />
                      </Form.Item>
                    )
                  }

                  <FreeBalance
                    address={from}
                    chain={chain}
                    className={'account-free-balance'}
                    label={t('Available balance:')}
                  />

                  <div className={'form-row'}>
                    {isAllAccount && <Form.Item name={'token'}>
                      <TokenSelector
                        disabled={stakingChain !== ALL_KEY}
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
                        decimals={decimals}
                        maxValue={'10000'} // TODO
                      />
                    </Form.Item>
                  </div>

                  <Form.Item name={'pool'}>
                    <PoolSelector
                      chain={chain}
                      // disabled={!currentTokenSlug || !!chainStakingMetadata}
                      label={t('Select pool')}
                      nominationPoolList={undefined}
                    />
                  </Form.Item>
                </>
              </ScreenTab.SwTabPanel>
              <ScreenTab.SwTabPanel label={t('Nominate')}>
                <>
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
                    address={from}
                    chain={chain}
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
                        decimals={decimals}
                        maxValue={'10000'} // TODO
                      />
                    </Form.Item>
                  </div>
                  <SelectValidatorInput
                    disabled={!currentTokenSlug}
                    label={t('Select validator')}
                    onClick={onActiveValidatorSelector}
                    value={currentNominator}
                  />

                  <Form.Item name={'nominate'}>
                    <MultiValidatorSelector
                      chain={chain}
                      id={'multi-validator-selector'}
                      nominations={_nominatorMetadata ? _nominatorMetadata.nominations : undefined}
                    />
                  </Form.Item>
                </>
              </ScreenTab.SwTabPanel>
            </ScreenTab>
            {
              chainStakingMetadata && (
                <>
                  <Divider />
                  {getMetaInfo()}
                </>
              )
            }
          </Form>
        </PageWrapper>
      </TransactionContent>

      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <Button
          disabled={isDisabledStakeBtn}
          icon={(
            <Icon
              phosphorIcon={PlusCircle}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={submitTransaction}
        >
          {t('Stake')}
        </Button>
      </TransactionFooter>

      {
        chainStakingMetadata &&
        (
          <StakingNetworkDetailModal
            estimatedEarning={chainStakingMetadata.expectedReturn}
            inflation={chainStakingMetadata.inflation}
            maxValidatorPerNominator={chainStakingMetadata.maxValidatorPerNominator}
            minimumActive={{ decimals, value: chainStakingMetadata.minStake, symbol }}
            onCancel={onCloseInfoModal}
            unstakingPeriod={chainStakingMetadata.unstakingPeriod}
          />
        )
      }
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
    },

    '.react-tabs__tab-list': {
      marginLeft: 0,
      marginRight: 0
    }
  };
});

export default Stake;
