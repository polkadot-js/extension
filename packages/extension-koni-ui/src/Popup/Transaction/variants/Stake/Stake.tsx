// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, NominationPoolInfo, NominatorMetadata, StakingType, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _getOriginChainOfAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, AmountInput, HiddenInput, MetaInfo, MultiValidatorSelector, PageWrapper, PoolSelector, RadioGroup, StakingNetworkDetailModal, TokenSelector } from '@subwallet/extension-koni-ui/components';
import NetworkInformation from '@subwallet/extension-koni-ui/components/NetworkInformation';
import { ALL_KEY } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFetchChainState, useGetBalance, useGetChainStakingMetadata, useGetNativeTokenBasicInfo, useGetNativeTokenSlug, useGetNominatorInfo, useGetSupportedStakingTokens, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useSetCurrentPage, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import useFetchChainAssetInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainAssetInfo';
import { submitBonding, submitPoolBonding } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, StakeParams, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, parseNominations, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Divider, Form, Icon } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

import { accountFilterFunc, fetchChainValidators } from '../../helper';
import { FreeBalance, TransactionContent, TransactionFooter } from '../../parts';

type Props = ThemeProps;

const hiddenFields: Array<keyof StakeParams> = ['chain', 'defaultChain', 'defaultType'];
const validateFields: Array<keyof StakeParams> = ['value'];

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);

  useSetCurrentPage('/transaction/stake');
  const dataContext = useContext(DataContext);
  const { defaultData, onDone, persistData, setDisabledRightBtn, setShowRightBtn } = useTransactionContext<StakeParams>();
  const { defaultChain: stakingChain, defaultType: _stakingType } = defaultData;

  const currentAccount = useSelector((state) => state.accountState.currentAccount);
  const isEthAdr = isEthereumAddress(currentAccount?.address);

  const defaultPoolTokenList = useGetSupportedStakingTokens(StakingType.POOLED, currentAccount?.address || '', stakingChain);

  const disablePool = useMemo(() => {
    if (isEthAdr) {
      return true;
    } else {
      if (currentAccount?.address) {
        return !defaultPoolTokenList.length;
      } else {
        return false;
      }
    }
  }, [currentAccount?.address, defaultPoolTokenList.length, isEthAdr]);

  const defaultStakingType: StakingType = useMemo(() => {
    if (disablePool) {
      return StakingType.NOMINATED;
    }

    if (defaultData.type) {
      return defaultData.type;
    }

    switch (_stakingType) {
      case StakingType.POOLED:
        return StakingType.POOLED;
      case StakingType.NOMINATED:
        return StakingType.NOMINATED;
      default:
        return StakingType.POOLED;
    }
  }, [_stakingType, disablePool, defaultData.type]);

  const [form] = Form.useForm<StakeParams>();

  const from = useWatchTransaction('from', form, defaultData);
  const chain = useWatchTransaction('chain', form, defaultData);
  const asset = useWatchTransaction('asset', form, defaultData);
  const stakingType = useWatchTransaction('type', form, defaultData);
  const nominate = useWatchTransaction('nominate', form, defaultData);

  // TODO: should do better to get validators info
  const { nominationPoolInfoMap, validatorInfoMap } = useSelector((state) => state.bonding);

  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const chainState = useFetchChainState(chain);
  const assetInfo = useFetchChainAssetInfo(asset);

  const [isDisable, setIsDisable] = useState(true);

  const chainStakingMetadata = useGetChainStakingMetadata(chain);
  const nominatorMetadataList = useGetNominatorInfo(chain, stakingType, from);

  const nominatorMetadata: NominatorMetadata | undefined = useMemo(() => nominatorMetadataList[0], [nominatorMetadataList]);

  const { nativeTokenBalance } = useGetBalance(chain, from);
  const tokenList = useGetSupportedStakingTokens(stakingType, from, stakingChain);

  const isRelayChain = useMemo(() => _STAKING_CHAIN_GROUP.relay.includes(chain), [chain]);

  const [loading, setLoading] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);
  const [validatorLoading, setValidatorLoading] = useState(false);
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [valueChange, setValueChange] = useState(false);
  const [, update] = useState({});
  const [forceFetchValidator, setForceFetchValidator] = useState(false);

  const existentialDeposit = useMemo(() => {
    if (assetInfo) {
      return assetInfo.minAmount || '0';
    }

    return '0';
  }, [assetInfo]);

  const maxValue = useMemo(() => {
    const balance = new BigN(nativeTokenBalance.value);
    const ed = new BigN(existentialDeposit);

    if (ed.gte(balance)) {
      return '0';
    } else {
      return balance.minus(ed).toString();
    }
  }, [existentialDeposit, nativeTokenBalance.value]);

  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const isAllAccount = isAccountAll(currentAccount?.address || '');

  const defaultSlug = useGetNativeTokenSlug(stakingChain || '');

  const formDefault: StakeParams = useMemo(() => {
    return {
      ...defaultData,
      type: defaultStakingType,
      asset: defaultData.asset || defaultSlug
    };
  }, [defaultData, defaultStakingType, defaultSlug]);

  const [isChangeData, setIsChangeData] = useState(false);

  const getSelectedValidators = useCallback((nominations: string[]) => {
    const validatorList = validatorInfoMap[chain];

    if (!validatorList) {
      return [];
    }

    const result: ValidatorInfo[] = [];

    validatorList.forEach((validator) => {
      if (nominations.some((nomination) => isSameAddress(nomination, validator.address))) { // remember the format of the address
        result.push(validator);
      }
    });

    return result;
  }, [chain, validatorInfoMap]);

  const getValidatorMinStake = useCallback((validatorInfos: ValidatorInfo[]) => {
    let minStake = BN_ZERO;

    validatorInfos.forEach((validatorInfo) => {
      const bnMinBond = new BN(validatorInfo?.minBond);

      if (bnMinBond.gt(minStake)) {
        minStake = bnMinBond;
      }
    });

    return minStake.toString();
  }, []);

  const minStake = useMemo(() => {
    if (stakingType === StakingType.NOMINATED) {
      const validatorInfos = getSelectedValidators(parseNominations(nominate));
      const validatorMinStake = getValidatorMinStake(validatorInfos);

      const nominatedMinStake = BN.max(new BN(validatorMinStake), new BN(chainStakingMetadata?.minStake || '0'));

      return nominatedMinStake.toString();
    }

    return chainStakingMetadata?.minJoinNominationPool || '0';
  }, [chainStakingMetadata?.minJoinNominationPool, chainStakingMetadata?.minStake, getSelectedValidators, getValidatorMinStake, nominate, stakingType]);

  const chainMinStake = useMemo(() => {
    return stakingType === StakingType.NOMINATED ? (chainStakingMetadata?.minStake || '0') : (chainStakingMetadata?.minJoinNominationPool || '0');
  }, [chainStakingMetadata?.minJoinNominationPool, chainStakingMetadata?.minStake, stakingType]);

  const persistValidator = useMemo(() => {
    if (chain === defaultData.chain && from === defaultData.from && !isChangeData) {
      return defaultData.nominate;
    } else {
      return '';
    }
  }, [chain, defaultData.chain, defaultData.from, defaultData.nominate, from, isChangeData]);

  const persistPool = useMemo(() => {
    if (chain === defaultData.chain && from === defaultData.from && !isChangeData) {
      return defaultData.pool;
    } else {
      return '';
    }
  }, [chain, defaultData.chain, defaultData.from, defaultData.pool, from, isChangeData]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onFieldsChange: FormCallbacks<StakeParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { error } = simpleCheckForm(allFields);

    const allMap = convertFieldToObject<StakeParams>(allFields);
    const changesMap = convertFieldToObject<StakeParams>(changedFields);

    const { asset, from, value } = changesMap;

    if (value) {
      setValueChange(true);
    }

    if (asset || from) {
      setIsChangeData(true);
    }

    if (asset) {
      const chain = _getOriginChainOfAsset(asset);

      form.setFieldValue('chain', chain);
      form.resetFields(['nominate', 'pool']);
    }

    const checkEmpty: Record<string, boolean> = {};

    const { type: stakingType } = allMap;

    for (const [key, value] of Object.entries(allMap)) {
      checkEmpty[key] = !!value;
    }

    if (stakingType === StakingType.NOMINATED) {
      checkEmpty.pool = true;
    } else if (stakingType === StakingType.POOLED) {
      checkEmpty.nominate = true;
    }

    setIsDisable(error || Object.values(checkEmpty).some((value) => !value));
    persistData(form.getFieldsValue());
  }, [form, persistData]);

  const getSelectedPool = useCallback((poolId?: string) => {
    const nominationPoolList = nominationPoolInfoMap[chain];

    for (const pool of nominationPoolList) {
      if (String(pool.id) === poolId) {
        return pool;
      }
    }

    return undefined;
  }, [nominationPoolInfoMap, chain]);

  const onSubmit: FormCallbacks<StakeParams>['onFinish'] = useCallback((values: StakeParams) => {
    setLoading(true);
    const { chain, from, nominate, pool, type, value } = values;
    let bondingPromise: Promise<SWTransactionResponse>;

    if (pool && type === StakingType.POOLED) {
      const selectedPool = getSelectedPool(pool);

      bondingPromise = submitPoolBonding({
        amount: value,
        chain: chain,
        nominatorMetadata: nominatorMetadata,
        selectedPool: selectedPool as NominationPoolInfo,
        address: from
      });
    } else {
      const selectedValidators = getSelectedValidators(parseNominations(nominate));

      bondingPromise = submitBonding({
        amount: value,
        chain: chain,
        nominatorMetadata: nominatorMetadata,
        selectedValidators,
        address: from,
        type: StakingType.NOMINATED
      });
    }

    setTimeout(() => {
      bondingPromise
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [getSelectedPool, nominatorMetadata, getSelectedValidators, onSuccess, onError]);

  const getMetaInfo = useCallback(() => {
    if (chainStakingMetadata) {
      return (
        <MetaInfo
          className={'meta-info'}
          labelColorScheme={'gray'}
          spaceSize={'xs'}
          valueColorScheme={'light'}
        >
          {
            chainStakingMetadata.expectedReturn &&
            (
              <MetaInfo.Number
                label={t('Estimated earnings:')}
                suffix={'% / year'}
                value={chainStakingMetadata.expectedReturn}
              />
            )
          }

          {
            chainStakingMetadata.minStake &&
            (
              <MetaInfo.Number
                decimals={decimals}
                label={t('Minimum active:')}
                suffix={symbol}
                value={minStake}
                valueColorSchema={'success'}
              />
            )
          }
        </MetaInfo>
      );
    }

    return null;
  }, [chainStakingMetadata, decimals, symbol, t, minStake]);

  const checkAction = usePreCheckAction(from);

  useEffect(() => {
    setShowRightBtn(true);
  }, [setShowRightBtn]);

  useEffect(() => {
    setDisabledRightBtn(!chainStakingMetadata);
  }, [chainStakingMetadata, setDisabledRightBtn]);

  useEffect(() => {
    let unmount = false;

    // fetch validators when change chain
    // _stakingType is predefined form start
    if ((!!chain && !!from && chainState?.active) || forceFetchValidator) {
      fetchChainValidators(chain, _stakingType || ALL_KEY, unmount, setPoolLoading, setValidatorLoading, setForceFetchValidator);
    }

    return () => {
      unmount = true;
    };
  }, [from, _stakingType, chain, chainState?.active, forceFetchValidator]);

  useEffect(() => {
    let cancel = false;

    if (valueChange) {
      if (!cancel) {
        setTimeout(() => {
          form.validateFields(['value']).finally(() => update({}));
        }, 100);
      }
    }

    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, nativeTokenBalance.value]);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  return (
    <>
      <div className={className}>
        <div className={'__transaction-block'}>
          <TransactionContent>
            <PageWrapper resolve={dataContext.awaitStores(['staking'])}>
              <Form
                className={'form-container form-space-sm'}
                form={form}
                initialValues={formDefault}
                onFieldsChange={onFieldsChange}
                onFinish={onSubmit}
              >
                <HiddenInput fields={hiddenFields} />
                <Form.Item
                  className='staking-type'
                  hidden={_stakingType !== ALL_KEY}
                  name={'type'}
                >
                  <RadioGroup
                    optionType='button'
                    options={[
                      {
                        label: t('Pools'),
                        value: StakingType.POOLED,
                        disabled: disablePool
                      },
                      {
                        label: t('Nominate'),
                        value: StakingType.NOMINATED
                      }
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  hidden={!isAllAccount}
                  name={'from'}
                >
                  <AccountSelector filter={accountFilterFunc(chainInfoMap, stakingType, stakingChain)} />
                </Form.Item>

                {
                  !isAllAccount &&
                  (
                    <Form.Item name={'asset'}>
                      <TokenSelector
                        disabled={stakingChain !== ALL_KEY || !from}
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
                  onBalanceReady={setIsBalanceReady}
                />

                <div className={'form-row'}>
                  {
                    isAllAccount &&
                    (
                      <Form.Item name={'asset'}>
                        <TokenSelector
                          disabled={stakingChain !== ALL_KEY || !from}
                          items={tokenList}
                          prefixShape='circle'
                        />
                      </Form.Item>
                    )
                  }

                  <Form.Item
                    name={'value'}
                    rules={[
                      { required: true, message: t('Amount is required') },
                      ({ getFieldValue }) => ({
                        validator: (_, value: string) => {
                          const type = getFieldValue('type') as StakingType;
                          const val = new BigN(value);

                          if (type === StakingType.POOLED) {
                            if (val.lte(0)) {
                              return Promise.reject(new Error(t('Amount must be greater than 0')));
                            }
                          } else {
                            if (!nominatorMetadata?.isBondedBefore || !isRelayChain) {
                              if (val.lte(0)) {
                                return Promise.reject(new Error(t('Amount must be greater than 0')));
                              }
                            }
                          }

                          if (val.gt(nativeTokenBalance.value)) {
                            return Promise.reject(t('Amount cannot exceed your balance'));
                          }

                          return Promise.resolve();
                        }
                      })
                    ]}
                    statusHelpAsTooltip={isWebUI}
                  >
                    <AmountInput
                      decimals={(chain && from) ? decimals : -1}
                      maxValue={maxValue}
                      showMaxButton={false}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  hidden={stakingType !== StakingType.POOLED}
                  name={'pool'}
                >
                  <PoolSelector
                    chain={chain}// Not use initialValues of Form, because some state changes by hook, it will be delayed
                    defaultValue={persistPool}
                    from={from}
                    label={t('Select pool')}
                    loading={poolLoading}
                    setForceFetchValidator={setForceFetchValidator}
                  />
                </Form.Item>

                <Form.Item
                  hidden={stakingType !== StakingType.NOMINATED}
                  name={'nominate'}
                >
                  <MultiValidatorSelector
                    chain={asset ? chain : ''}// Not use initialValues of Form, because some state changes by hook, it will be delayed
                    defaultValue={persistValidator}
                    from={asset ? from : ''}
                    loading={validatorLoading}
                    setForceFetchValidator={setForceFetchValidator}
                  />
                </Form.Item>
              </Form>
              {
                chainStakingMetadata && (
                  <>
                    <Divider className='staking-divider' />
                    {getMetaInfo()}
                  </>
                )
              }
            </PageWrapper>
          </TransactionContent>

          <TransactionFooter
            errors={[]}
            warnings={[]}
          >
            <Button
              disabled={isDisable || !isBalanceReady}
              icon={(
                <Icon
                  phosphorIcon={PlusCircle}
                  weight={'fill'}
                />
              )}
              loading={loading}
              onClick={checkAction(form.submit, stakingType === StakingType.POOLED ? ExtrinsicType.STAKING_JOIN_POOL : ExtrinsicType.STAKING_BOND)}
            >
              {t('Stake')}
            </Button>
          </TransactionFooter>
        </div>

        {isWebUI && (
          <NetworkInformation
            className={'__network-information-block'}
            stakingType={stakingType}
          />
        )}
      </div>

      {
        chainStakingMetadata &&
        (
          <StakingNetworkDetailModal
            activeNominators={chainStakingMetadata.nominatorCount}
            estimatedEarning={chainStakingMetadata.expectedReturn}
            inflation={chainStakingMetadata.inflation}
            maxValidatorPerNominator={chainStakingMetadata.maxValidatorPerNominator}
            minimumActive={{ decimals, value: chainMinStake, symbol }}
            stakingType={stakingType}
            unstakingPeriod={chainStakingMetadata.unstakingPeriod}
          />
        )
      }
    </>
  );
}

const Stake = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flex: 1,

    '.__transaction-block': {
      display: 'flex',
      flexDirection: 'column',
      flex: 1
    },

    '.__network-information-block': {
      flex: 1
    },

    '.staking-type': {
      marginBottom: token.margin
    },

    '.account-free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    },

    '.react-tabs__tab-list': {
      marginLeft: 0,
      marginRight: 0
    },

    '.staking-divider': {
      marginTop: token.margin + 2,
      marginBottom: token.marginSM
    },

    '.web-ui-enable &': {
      maxWidth: 784,
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      gap: token.size,

      '.__transaction-block': {
        display: 'block',
        maxWidth: 384,
        flex: 1
      },

      '.transaction-content': {
        paddingLeft: 0,
        paddingRight: 0
      },

      '.transaction-footer': {
        paddingTop: 4,
        paddingLeft: 0,
        paddingRight: 0,
        marginBottom: 0
      },

      '.meta-info': {
        marginBottom: token.marginSM
      }
    }
  };
});

export default Stake;
