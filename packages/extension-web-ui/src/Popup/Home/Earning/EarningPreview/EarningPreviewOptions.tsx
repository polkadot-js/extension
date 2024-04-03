// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _getSubstrateGenesisHash, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { isLendingPool, isLiquidPool } from '@subwallet/extension-base/services/earning-service/utils';
import { NominationPoolInfo, ValidatorInfo, YieldPoolInfo, YieldPoolTarget, YieldPoolType } from '@subwallet/extension-base/types';
import { EarningOptionDesktopItem, EarningOptionItem, EarningValidatorDetailRWModal, EmptyList, FilterModal, Layout, LoadingScreen } from '@subwallet/extension-web-ui/components';
import { ASTAR_PORTAL_URL, CREATE_RETURN, DEFAULT_EARN_PARAMS, DEFAULT_ROUTER_PATH, EARN_TRANSACTION, EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE, VALIDATOR_DETAIL_RW_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useFilterModal, useHandleChainConnection, usePreviewYieldGroupInfo, useSelector, useSetSelectedAccountTypes, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { analysisAccounts } from '@subwallet/extension-web-ui/hooks/common/useGetChainSlugsByCurrentAccount';
import { fetchPoolTarget, saveCurrentAccountAddress } from '@subwallet/extension-web-ui/messaging';
import { ChainConnectionWrapper } from '@subwallet/extension-web-ui/Popup/Home/Earning/shared/ChainConnectionWrapper';
import { Toolbar } from '@subwallet/extension-web-ui/Popup/Home/Earning/shared/desktop/Toolbar';
import { EarningPoolsParam, EarnParams, ThemeProps, YieldGroupInfo } from '@subwallet/extension-web-ui/types';
import { getValidatorKey, isAccountAll, isRelatedToAstar, openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { FadersHorizontal, Vault, XCircle } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps & {
//
};

const groupOrdinal = (group: YieldGroupInfo): number => {
  if (group.group === 'DOT-Polkadot') {
    return 2;
  } else if (group.group === 'KSM-Kusama') {
    return 1;
  } else {
    return 0;
  }
};

const testnetOrdinal = (group: YieldGroupInfo): number => {
  return group.isTestnet ? 0 : 1;
};

const balanceOrdinal = (group: YieldGroupInfo): number => {
  return group.balance.value.toNumber();
};

const apyOrdinal = (group: YieldGroupInfo): number => {
  return !group.maxApy ? -1 : group.maxApy;
};

const getPoolInfoByChainAndType = (poolInfoMap: Record<string, YieldPoolInfo>, chain: string, type: YieldPoolType): YieldPoolInfo | undefined => {
  return Object.values(poolInfoMap).find((item) => item.chain === chain && item.type === type);
};

export const getFilteredAccount = (chainInfo: _ChainInfo) => (account: AccountJson) => {
  if (isAccountAll(account.address)) {
    return false;
  }

  if (account.originGenesisHash && _getSubstrateGenesisHash(chainInfo) !== account.originGenesisHash) {
    return false;
  }

  return _isChainEvmCompatible(chainInfo) === isEthereumAddress(account.address);
};

const connectChainModalId = 'earning-options-connect-chain-modal';
const chainConnectionLoadingModalId = 'earning-options-chain-connection-loading-modalId';
const alertModalId = 'earning-options-alert-modal';

const FILTER_MODAL_ID = 'earning-options-filter-modal';

enum FilterOptionType {
  MAIN_NETWORK = 'MAIN_NETWORK',
  TEST_NETWORK = 'TEST_NETWORK',
}

const validatorModalId = VALIDATOR_DETAIL_RW_MODAL;
const earnPath = '/transaction/earn';

function Component ({ className }: Props) {
  const [searchParams] = useSearchParams();
  const [chainParam] = useState(searchParams.get('chain') || '');
  const [earningTypeParam] = useState<YieldPoolType | undefined>(searchParams.get('type') as YieldPoolType || undefined);
  const [targetParam] = useState(searchParams.get('target') || '');
  const [isAlertWarningValidator, setIsAlertWarningValidator] = useState(false);

  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const navigate = useNavigate();

  const { poolInfoMap = {} }: {
    poolInfoMap: Record<string, YieldPoolInfo>,
  } = useOutletContext();

  const data = usePreviewYieldGroupInfo(poolInfoMap);
  const assetRegistry = useSelector((state) => state.assetRegistry.assetRegistry);
  const [validator, setValidator] = useState<YieldPoolTarget>();
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { accounts, currentAccount } = useSelector((state) => state.accountState);
  const isNoAccount = useSelector((state) => state.accountState.isNoAccount);
  const [isContainOnlySubstrate] = analysisAccounts(accounts);
  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const setSelectedAccountTypes = useSetSelectedAccountTypes(false);
  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);
  const [, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);

  const [selectedPoolInfoSlug, setSelectedPoolInfoSlug] = React.useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<string>(chainParam);

  const isAutoOpenInstructionViaParamsRef = useRef(true);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID, [FilterOptionType.MAIN_NETWORK]);

  const { activeModal } = useContext(ModalContext);
  const [initLoading, setInitLoading] = useState<boolean>(true);

  const items = useMemo(() => {
    return [...data].sort((a, b) => {
      return (
        groupOrdinal(b) - groupOrdinal(a) ||
        testnetOrdinal(b) - testnetOrdinal(a) ||
        balanceOrdinal(b) - balanceOrdinal(a) ||
        apyOrdinal(b) - apyOrdinal(a)
      );
    });
  }, [data]);

  const filterOptions = useMemo(() => [
    { label: t('Mainnet'), value: FilterOptionType.MAIN_NETWORK },
    { label: t('Testnet'), value: FilterOptionType.TEST_NETWORK }
  ], [t]);

  const filterFunction = useMemo<(item: YieldGroupInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      if (selectedFilters.length === filterOptions.length) {
        return true;
      }

      if (selectedFilters.length === 1) {
        if (selectedFilters.includes(FilterOptionType.MAIN_NETWORK)) {
          return !item.isTestnet;
        }

        if (selectedFilters.includes(FilterOptionType.TEST_NETWORK)) {
          return item.isTestnet;
        }
      }

      return false;
    };
  }, [filterOptions.length, selectedFilters]);

  const checkIsAnyAccountValid = useCallback((accounts: AccountJson[], chain = '') => {
    const chainInfo = chainInfoMap[selectedChain || chain];
    let accountList: AccountJson[] = [];

    if (!chainInfo) {
      return false;
    }

    accountList = accounts.filter(getFilteredAccount(chainInfo));

    return !!accountList.length;
  }, [chainInfoMap, selectedChain]);

  const navigateToEarnTransaction = useCallback(
    (slug: string, chain: string) => {
      if (isNoAccount) {
        setReturnStorage(earnPath);
        navigate(DEFAULT_ROUTER_PATH);
      } else {
        const chainInfo = chainInfoMap[selectedChain || chain];

        const isAnyAccountValid = checkIsAnyAccountValid(accounts, chain);

        if (!isAnyAccountValid) {
          const accountType = isContainOnlySubstrate ? EVM_ACCOUNT_TYPE : SUBSTRATE_ACCOUNT_TYPE;

          setSelectedAccountTypes([accountType]);
          navigate('/home/earning', { state: { view: 'position', redirectFromPreview: true, chainName: chainInfo?.name } });
        } else {
          const accountList = accounts.filter(getFilteredAccount(chainInfo));

          if (accountList.length === 1) {
            setEarnStorage((prevState) => ({
              ...prevState,
              slug: slug || prevState.slug,
              chain: chain || prevState.chain,
              from: accountList[0].address
            }));
            saveCurrentAccountAddress(accountList[0]).then(() => navigate(earnPath, { state: { from: earnPath } })).catch(() => console.error());
          } else {
            if (currentAccount && accountList.some((acc) => acc.address === currentAccount.address)) {
              navigate(earnPath, { state: { from: earnPath } });

              return;
            }

            setEarnStorage((prevState) => ({
              ...prevState,
              slug: slug || prevState.slug,
              chain: chain || prevState.chain
            }));
            saveCurrentAccountAddress({ address: 'ALL' }).then(() => navigate(earnPath, { state: { from: earnPath } })).catch(() => console.error());
          }
        }
      }
    },
    [isNoAccount, setReturnStorage, navigate, chainInfoMap, selectedChain, checkIsAnyAccountValid, accounts, isContainOnlySubstrate, setSelectedAccountTypes, setEarnStorage, currentAccount]
  );

  const onConnectChainSuccess = useCallback(() => {
    selectedPoolInfoSlug && navigateToEarnTransaction(selectedPoolInfoSlug, selectedChain);
  }, [navigateToEarnTransaction, selectedChain, selectedPoolInfoSlug]);

  const { alertProps,
    checkChainConnected,
    closeAlert,
    closeConnectChainModal,
    connectingChain,
    onConnectChain, openAlert,
    setExtraSuccessFlag, turnOnChain } = useHandleChainConnection({
    alertModalId,
    chainConnectionLoadingModalId,
    connectChainModalId
  }, onConnectChainSuccess);

  const [currentAltChain, setCurrentAltChain] = useState<string | undefined>();

  const getAltChain = useCallback((poolInfo: YieldPoolInfo) => {
    if (isLiquidPool(poolInfo) || isLendingPool(poolInfo)) {
      const asset = assetRegistry[poolInfo.metadata.altInputAssets || ''];

      return asset ? asset.originChain : '';
    }

    return '';
  }, [assetRegistry]);

  const transactionFromValue = useMemo(() => {
    if (isNoAccount) {
      return '';
    }

    return currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';
  }, [currentAccount?.address, isNoAccount]);

  const onClickItem = useCallback((item: YieldGroupInfo) => {
    return () => {
      setCurrentAltChain(undefined);

      if (isRelatedToAstar(item.group)) {
        openAlert({
          title: t('Enter Astar portal'),
          content: t('You are navigating to Astar portal to view and manage your stake in Astar dApp staking v3. SubWallet will offer support for Astar dApp staking v3 soon.'),
          cancelButton: {
            text: t('Cancel'),
            schema: 'secondary',
            onClick: closeAlert
          },
          okButton: {
            text: t('Enter Astar portal'),
            onClick: () => {
              openInNewTab(ASTAR_PORTAL_URL)();
              closeAlert();
            }
          }
        });

        return;
      }

      if (item.poolListLength > 1) {
        navigate('/earning-preview/pools', { state: {
          poolGroup: item.group,
          symbol: item.symbol,
          from: earnPath
        } as EarningPoolsParam });
      } else if (item.poolListLength === 1) {
        const poolInfo = poolInfoMap[item.poolSlugs[0]];

        if (!poolInfo) {
          // will not happen

          return;
        }

        setSelectedChain(poolInfo.chain);
        setEarnStorage({
          ...DEFAULT_EARN_PARAMS,
          slug: poolInfo.slug,
          chain: poolInfo.chain,
          from: transactionFromValue,
          redirectFromPreview: true
        });

        setSelectedPoolInfoSlug(poolInfo.slug);

        const altChain = getAltChain(poolInfo);

        if (!checkChainConnected(item.chain)) {
          if (altChain) {
            setCurrentAltChain(altChain);
          }

          onConnectChain(item.chain);

          return;
        }

        if (altChain && !checkChainConnected(altChain)) {
          onConnectChain(altChain);

          return;
        }

        navigateToEarnTransaction(poolInfo.slug, poolInfo.chain);
      }
    };
  }, [checkChainConnected, closeAlert, getAltChain, navigate, navigateToEarnTransaction, onConnectChain, openAlert, poolInfoMap, setEarnStorage, t, transactionFromValue]);

  const _onConnectChain = useCallback((chain: string) => {
    if (currentAltChain) {
      turnOnChain(currentAltChain);
    }

    onConnectChain(chain);
  }, [currentAltChain, onConnectChain, turnOnChain]);

  useEffect(() => {
    if (currentAltChain) {
      setExtraSuccessFlag(checkChainConnected(currentAltChain));
    } else {
      setExtraSuccessFlag(true);
    }
  }, [checkChainConnected, currentAltChain, setExtraSuccessFlag]);

  const renderItem = useCallback(
    (item: YieldGroupInfo) => {
      if (isWebUI) {
        return (
          <EarningOptionDesktopItem
            chain={chainInfoMap[item.chain]}
            className={'earning-option-desktop-item'}
            displayBalanceInfo={false}
            isShowBalance={isShowBalance}
            key={item.group}
            onClick={onClickItem(item)}
            poolGroup={item}
          />
        );
      }

      return (
        <EarningOptionItem
          chain={chainInfoMap[item.chain]}
          className={'earning-option-item'}
          displayBalanceInfo={false}
          isShowBalance={isShowBalance}
          key={item.group}
          onClick={onClickItem(item)}
          poolGroup={item}
        />
      );
    },
    [chainInfoMap, isShowBalance, isWebUI, onClickItem]
  );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        className={'__empty-list-earning-options'}
        emptyMessage={t('No earning option found')}
        emptyTitle={t('Change your search and try again')}
        phosphorIcon={Vault}
      />
    );
  }, [t]);

  const searchFunction = useCallback(({ name, symbol }: YieldGroupInfo, searchText: string) => {
    return (
      name?.toLowerCase().includes(searchText.toLowerCase()) ||
      symbol?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, []);

  const onClickFilterButton = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  const onCloseInstructionModal = useCallback(() => setEarnStorage((prevState) => ({
    ...prevState,
    hasPreSelectTarget: false,
    target: ''
  })), [setEarnStorage]);

  useEffect(() => {
    let isSync = true;

    if (chainParam && earningTypeParam && isAutoOpenInstructionViaParamsRef.current) {
      const poolInfo = getPoolInfoByChainAndType(poolInfoMap, chainParam, earningTypeParam);

      if (poolInfo) {
        fetchPoolTarget({ slug: poolInfo.slug }).then((rs) => {
          if (isSync) {
            const defaultEarnParams: EarnParams = {
              ...DEFAULT_EARN_PARAMS,
              slug: poolInfo.slug,
              chain: poolInfo.chain,
              from: transactionFromValue,
              redirectFromPreview: true,
              hasPreSelectTarget: true,
              target: targetParam
            };

            if (rs && rs.targets && rs.targets.length) {
              const isValidatorSupported = rs.targets.find((item) => {
                if (earningTypeParam === YieldPoolType.NOMINATION_POOL) {
                  return (item as NominationPoolInfo).id.toString() === targetParam;
                } else if (earningTypeParam === YieldPoolType.NATIVE_STAKING) {
                  return item.address === targetParam;
                } else {
                  return false;
                }
              });

              if (!isValidatorSupported) {
                defaultEarnParams.target = 'not-support';
                setIsAlertWarningValidator(true);
              } else {
                if (earningTypeParam === YieldPoolType.NATIVE_STAKING) {
                  defaultEarnParams.target = getValidatorKey(isValidatorSupported.address, (isValidatorSupported as ValidatorInfo).identity);
                }

                setIsAlertWarningValidator(false);
                setValidator(isValidatorSupported);
              }
            }

            // if (_STAKING_CHAIN_GROUP.relay.includes(poolInfo.chain) && poolInfo.type === YieldPoolType.NATIVE_STAKING) {
            //   const validators = autoSelectValidatorOptimally(rs, poolInfo?.statistic?.maxCandidatePerFarmer, targetParam);
            //
            //   defaultEarnParams.target = validators.length ? validators.map((v) => `${v.address}___${v.identity || ''}`).join(',') : '';
            // }
            setSelectedPoolInfoSlug(poolInfo.slug);
            setEarnStorage(defaultEarnParams);
            activeModal(validatorModalId);
            setInitLoading(false);
            isAutoOpenInstructionViaParamsRef.current = false;
          }
        }).catch((e) => {
          console.log('Error when fetching poolInfo.slug file', e);

          if (isSync) {
            setInitLoading(false);
            isAutoOpenInstructionViaParamsRef.current = false;
          }
        });
      } else {
        if (isSync) {
          setInitLoading(false);
          isAutoOpenInstructionViaParamsRef.current = false;
        }
      }
    } else {
      if (isSync) {
        setInitLoading(false);
        isAutoOpenInstructionViaParamsRef.current = false;
      }
    }

    return () => {
      isSync = false;
    };
  }, [activeModal, chainParam, earningTypeParam, poolInfoMap, setEarnStorage, t, targetParam, transactionFromValue]);

  useEffect(() => {
    isAlertWarningValidator && openAlert({
      title: t('Unrecommended validator'),
      type: NotificationType.ERROR,
      content: t('Your chosen validator is not recommended by SubWallet as staking with this validator won’t accrue any rewards. Select another validator and try again.'),
      okButton: {
        text: t('Dismiss'),
        onClick: () => {
          setIsAlertWarningValidator(false);
          closeAlert();
        },
        icon: XCircle
      }
    });
  }, [closeAlert, openAlert, t, isAlertWarningValidator]);

  return (
    <ChainConnectionWrapper
      alertModalId={alertModalId}
      alertProps={alertProps}
      chainConnectionLoadingModalId={chainConnectionLoadingModalId}
      closeConnectChainModal={closeConnectChainModal}
      connectChainModalId={connectChainModalId}
      connectingChain={connectingChain}
      onConnectChain={_onConnectChain}
    >
      <Layout.Base
        className={CN(className)}
        showBackButton={false}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderPaddingVertical={true}
        title={t<string>('Earning options')}
      >
        {
          initLoading && (
            <LoadingScreen />
          )
        }
        {
          !initLoading && (
            <div className={'__body-area'}>
              {
                isWebUI
                  ? (
                    <>
                      <Toolbar
                        className={'__desktop-toolbar'}
                        inputPlaceholder={t<string>('Search token')}
                        onClickFilter={onClickFilterButton}
                        onSearch={setSearchInput}
                        searchValue={searchInput}
                      />
                      <SwList
                        className={'__desktop-list-container'}
                        displayGrid={true}
                        filterBy={filterFunction}
                        gridGap={'16px'}
                        list={items}
                        minColumnWidth={'360px'}
                        renderItem={renderItem}
                        renderWhenEmpty={emptyList}
                        searchBy={searchFunction}
                        searchMinCharactersCount={1}
                        searchTerm={searchInput}
                      />
                    </>
                  )
                  : (
                    <SwList.Section
                      actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
                      className={'__section-list-container'}
                      enableSearchInput
                      filterBy={filterFunction}
                      list={items}
                      onClickActionBtn={onClickFilterButton}
                      renderItem={renderItem}
                      renderWhenEmpty={emptyList}
                      searchFunction={searchFunction}
                      searchMinCharactersCount={1}
                      searchPlaceholder={t<string>('Search token')}
                      showActionBtn
                    />
                  )
              }
            </div>
          )
        }

        <FilterModal
          applyFilterButtonTitle={t('Apply filter')}
          id={FILTER_MODAL_ID}
          onApplyFilter={onApplyFilter}
          onCancel={onCloseFilterModal}
          onChangeOption={onChangeFilterOption}
          optionSelectionMap={filterSelectionMap}
          options={filterOptions}
          title={t('Filter')}
        />
      </Layout.Base>

      {
        selectedPoolInfoSlug && validator && (
          <EarningValidatorDetailRWModal
            assetRegistry={assetRegistry}
            bypassEarlyValidate={true}
            closeAlert={closeAlert}
            onCancel={onCloseInstructionModal}
            onStakeMore={navigateToEarnTransaction}
            openAlert={openAlert}
            poolInfo={poolInfoMap[selectedPoolInfoSlug]}
            validatorItem={validator}
          />
        )
      }
    </ChainConnectionWrapper>
  );
}

const EarningPreviewOptions = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.__body-area': {
    overflow: 'auto',
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingLeft: 166,
    paddingRight: 166,
    display: 'flex',
    flexDirection: 'column'
  },

  '@media (max-width: 1200px)': {
    '.__body-area': {
      paddingLeft: 44,
      paddingRight: 44
    }
  },

  '@media (max-width: 991px)': {
    '.__body-area': {
      paddingLeft: 0,
      paddingRight: 0,
      height: '100%'
    }
  },

  '.ant-sw-sub-header-container': {
    marginBottom: token.marginXS
  },

  '.__empty-list-earning-options': {
    height: '100%',
    marginBottom: 0,
    marginTop: 0
  },

  '.__desktop-list-container': {
    overflowY: 'auto',
    height: '100%',
    gridTemplateRows: 'min-content'
  },

  '.__section-list-container': {
    height: '100%',
    flex: 1
  },

  '.earning-option-item': {
    '+ .earning-option-item': {
      marginTop: token.marginXS
    }
  },

  // desktop

  '.__desktop-toolbar': {
    marginBottom: 20
  },

  '@media (min-width: 992px)': {
    '.__empty-list-earning-options': {
      paddingBottom: 62,
      paddingTop: 32
    }
  }
}));

export default EarningPreviewOptions;
