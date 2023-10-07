// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { CrowdloanParaState, ParaChainInfoMap } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getAssetPriceId, _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { CrowdloanContributionItem } from '@subwallet/extension-base/services/subscan-service/types';
import { AddressInput, Layout, TokenBalance } from '@subwallet/extension-koni-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import { CREATE_RETURN, DEFAULT_ROUTER_PATH, NEW_SEED_MODAL } from '@subwallet/extension-koni-ui/constants';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { getCrowdloanContributions, getParaChainInfoMap } from '@subwallet/extension-koni-ui/messaging';
import NoteBox from '@subwallet/extension-koni-ui/Popup/CrowdloanUnlockCampaign/components/NoteBox';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PriceStore } from '@subwallet/extension-koni-ui/stores/types';
import { CrowdloanContributionsResultParam, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { customFormatDate } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon, Logo, ModalContext, Table, Tag } from '@subwallet/react-ui';
import { Rule } from '@subwallet/react-ui/es/form';
import BigN from 'bignumber.js';
import { ArrowCounterClockwise, PlusCircle, RocketLaunch, Vault, Wallet } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isAddress } from '@polkadot/util-crypto';

import EmptyList from '../../components/EmptyList/EmptyList';

type Props = ThemeProps;

type TableItem = {
  id: string;
  chainSlug: string;
  chainName: string;
  relayChainSlug: string;
  relayChainName: string;
  contribution: {
    symbol: string;
    value: BigN;
    convertedValue: BigN;
  };
  paraState?: CrowdloanParaState,
  unlockTime: string
};

type CrowdloanContributionsMap = {
  polkadot: CrowdloanContributionItem[],
  kusama: CrowdloanContributionItem[]
}

interface FormParams {
  address: string;
}

const fetchContributionsMap = async (address: string): Promise<CrowdloanContributionsMap> => {
  const polkadotResponse = await getCrowdloanContributions('polkadot', address);
  const kusamaResponse = await getCrowdloanContributions('kusama', address);

  return {
    polkadot: polkadotResponse.list || [],
    kusama: kusamaResponse.list || []
  };
};

function getTagColor (paraState?: CrowdloanParaState) {
  if (!paraState) {
    return 'default';
  }

  if (paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
    return 'success';
  }

  if (paraState === CrowdloanParaState.FAILED.valueOf()) {
    return 'error';
  }

  if (paraState === CrowdloanParaState.ONGOING.valueOf()) {
    return 'warning';
  }

  return 'default';
}

enum FilterValue {
  ALL = 'all',
  POLKADOT_PARACHAIN = 'Polkadot parachain',
  KUSAMA_PARACHAIN = 'Kusama parachain',
  WINNER = 'completed',
  FAIL = 'failed',
  ACTIVE = 'active'
}

const acceptFundStatus: number[] = [1, 2];

const getTableItems = (
  relayChainSlug: 'polkadot' | 'kusama',
  contributionsMap: CrowdloanContributionsMap,
  paraChainInfoMap: ParaChainInfoMap,
  chainInfoMap: Record<string, _ChainInfo>,
  assetRegistryMap: Record<string, _ChainAsset>,
  priceMap: PriceStore['priceMap']
) => {
  const result: TableItem[] = [];

  const relayChainInfo = chainInfoMap[relayChainSlug];
  const relayChainNativeTokenSlug = _getChainNativeTokenSlug(relayChainInfo);
  const relayChainAsset = assetRegistryMap[relayChainNativeTokenSlug];
  const decimals = _getAssetDecimals(relayChainAsset);
  const priceId = _getAssetPriceId(assetRegistryMap[relayChainNativeTokenSlug]);
  const price = priceMap[priceId] || 0;

  contributionsMap[relayChainSlug].forEach((c) => {
    if (!acceptFundStatus.includes(c.fund_status)) {
      return;
    }

    if (!paraChainInfoMap[relayChainSlug]?.[`${c.para_id}`]) {
      return;
    }

    const paraChainInfo = paraChainInfoMap[relayChainSlug][`${c.para_id}`];

    const contributedValue = getBalanceValue(c.contributed || '0', decimals);
    const convertedContributedValue = getConvertedBalanceValue(contributedValue, price);

    const unlockTime = ((c.unlocking_block - c.block_num) * 6 + c.block_timestamp) * 1000;

    result.push({
      id: `${paraChainInfo.slug}-${relayChainSlug}`,
      chainSlug: paraChainInfo.slug,
      chainName: paraChainInfo.name,
      relayChainSlug: relayChainSlug,
      relayChainName: relayChainInfo.name,
      contribution: {
        symbol: relayChainAsset.symbol,
        value: contributedValue,
        convertedValue: convertedContributedValue
      },
      paraState: paraChainInfo.paraState,
      unlockTime: customFormatDate(unlockTime, '#YYYY#-#MM#-#DD#')
    });
  });

  return result;
};

const Component: React.FC<Props> = ({ className = '' }: Props) => {
  const locationState = useLocation().state as CrowdloanContributionsResultParam;
  const [propAddress] = useState<string | undefined>(locationState?.address);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paraChainInfoMap, setParaChainInfoMap] = useState<ParaChainInfoMap>({});
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const assetRegistryMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(FilterValue.ALL);
  const { isNoAccount } = useSelector((state: RootState) => state.accountState);
  const [, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);
  const { setOnBack, setWebBaseClassName } = useContext(WebUIContext);
  const { activeModal } = useContext(ModalContext);

  const [contributionsMap, setContributionsMap] = useState<CrowdloanContributionsMap>({
    polkadot: [],
    kusama: []
  });

  const [form] = Form.useForm<FormParams>();
  const addressValue = Form.useWatch('address', form);
  const [loading, setLoading] = useState<boolean>(false);

  const formDefault = useMemo((): FormParams => {
    return {
      address: propAddress || ''
    };
  }, [propAddress]);

  const goEarningDemo = useCallback(() => {
    navigate('/earning-demo');
  }, [navigate]);

  const onBack = useCallback(() => {
    navigate('/crowdloan-unlock-campaign/check-contributions');
  }, [navigate]);

  const getParaStateLabel = useCallback((paraState?: CrowdloanParaState) => {
    if (!paraState) {
      return '';
    }

    if (paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
      return t('Winner');
    }

    if (paraState === CrowdloanParaState.FAILED.valueOf()) {
      return t('Fail');
    }

    if (paraState === CrowdloanParaState.ONGOING.valueOf()) {
      return t('Active');
    }

    return '';
  }, [t]);

  const tableItems = useMemo<TableItem[]>(() => {
    if (!contributionsMap.polkadot.length && !contributionsMap.kusama.length) {
      return [];
    }

    return [
      ...getTableItems('polkadot', contributionsMap, paraChainInfoMap, chainInfoMap, assetRegistryMap, priceMap),
      ...getTableItems('kusama', contributionsMap, paraChainInfoMap, chainInfoMap, assetRegistryMap, priceMap)
    ];
  }, [assetRegistryMap, chainInfoMap, contributionsMap, paraChainInfoMap, priceMap]);

  const filteredtableItems = useMemo(() => {
    const filterTabFunction = (item: TableItem) => {
      if (selectedFilterTab === FilterValue.ALL) {
        return true;
      }

      if (selectedFilterTab === FilterValue.WINNER) {
        return item.paraState === CrowdloanParaState.COMPLETED;
      }

      if (selectedFilterTab === FilterValue.ACTIVE) {
        return item.paraState === CrowdloanParaState.ONGOING;
      }

      return false;
    };

    return tableItems.filter(filterTabFunction);
  }, [selectedFilterTab, tableItems]);

  const columns = useMemo(() => {
    const getUnlockTexts = (paraState?: CrowdloanParaState): [string, string] => {
      if (!paraState || paraState === CrowdloanParaState.COMPLETED) {
        return [t('Locked'), t('Until')];
      }

      if (paraState === CrowdloanParaState.ONGOING) {
        return [t('Crowdloan'), t('Ends on')];
      }

      return [t('Refunded'), t('On')];
    };

    return [
      {
        title: t('Project name'),
        dataIndex: 'name',
        key: 'name',
        render: (_: any, row: TableItem) => {
          return <div className='project-container'>
            <Logo
              isShowSubLogo={true}
              network={row.chainSlug}
              shape={'squircle'}
              size={40}
              subLogoShape={'circle'}
              subNetwork={row.relayChainSlug}
            />
            <div className='project-information'>
              <div className={'project-name'}>{row.chainName}</div>
              <div className={'project-parachain'}>{`${row.relayChainName} ${t('parachain')}`}</div>
            </div>
          </div>;
        }
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        render: (_: any, item: TableItem) => {
          return <Tag color={getTagColor(item.paraState)}>{getParaStateLabel(item.paraState)}</Tag>;
        }
      },
      {
        title: t('Details'),
        dataIndex: 'details',
        key: 'details',
        render: (_: any, row: TableItem) => {
          const [text1, text2] = getUnlockTexts(row.paraState);

          return <div className={'fund-unlock-detail'}>
            <div className={'fund-unlock-detail-line-1'}>{text1}</div>
            <div className={'fund-unlock-detail-line-2'}>{`${text2} ${row.unlockTime}`}</div>
          </div>;
        }
      },
      {
        title: t('Contribution'),
        dataIndex: 'contribution',
        key: 'contribution',
        render: (_: any, row: TableItem) => {
          return (
            <TokenBalance
              autoHideBalance={false}
              convertedValue={row.contribution.convertedValue}
              symbol={row.contribution.symbol}
              value={row.contribution.value}
            />
          );
        }
      }
    ];
  }, [getParaStateLabel, t]);

  const filterTabItems = useMemo<FilterTabItemType[]>(() => {
    return [
      {
        label: t('All'),
        value: FilterValue.ALL
      },
      {
        label: t('Active'),
        value: FilterValue.ACTIVE
      },
      {
        label: t('Winner'),
        value: FilterValue.WINNER
      }
    ];
  }, [t]);

  const onSelectFilterTab = useCallback((value: string) => {
    setSelectedFilterTab(value);
  }, []);

  useEffect(() => {
    setWebBaseClassName(`${className}-web-base-container`);

    return () => {
      setWebBaseClassName('');
    };
  }, [className, setWebBaseClassName]);

  useEffect(() => {
    getParaChainInfoMap().then((rs) => {
      setParaChainInfoMap(rs);
    }).catch((e) => {
      console.log('getParaChainInfoMap Error', e);
    });
  }, []);

  const fetchTableData = useCallback((address: string) => {
    setLoading(true);
    fetchContributionsMap(address).then((rs) => {
      setContributionsMap(rs);
    }).catch((e) => {
      console.log('fetchContributionsMap Error', e);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (propAddress) {
      fetchTableData(propAddress);
    }
  }, [fetchTableData, propAddress]);

  const onClickCheckAgain = useCallback(() => {
    fetchTableData(addressValue);
  }, [addressValue, fetchTableData]);

  const validateAddress = useCallback((rule: Rule, address: string): Promise<void> => {
    if (!address) {
      return Promise.reject(t('Address is required.'));
    }

    if (!isAddress(address)) {
      return Promise.reject(t('Invalid address. Check again or create a new account to get started.'));
    }

    fetchTableData(address);

    return Promise.resolve();
  }, [fetchTableData, t]);

  const isCheckAgainDisabled = loading || !addressValue || !isAddress(addressValue);

  const onClickCreateNewWallet = useCallback(() => {
    if (isNoAccount) {
      setReturnStorage('/home/earning');
      navigate('/welcome');
    } else {
      activeModal(NEW_SEED_MODAL);
    }
  }, [activeModal, isNoAccount, navigate, setReturnStorage]);

  useEffect(() => {
    setOnBack(onBack);

    return () => {
      setOnBack(undefined);
    };
  }, [onBack, setOnBack]);

  return (
    <Layout.Base
      className={className}
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={true}
      subHeaderPaddingVertical={true}
      title={t<string>('Your crowdloan contributions')}
    >
      <div className={'__tag-area'}>
        <div className={'__tag-item'}>
          <Logo
            className={'__tag-item-logo'}
            network={'polkadot'}
            size={16}
          />
          <div className={'__tag-item-label'}>
            DOT
          </div>
        </div>
        <div className={'__tag-item -secondary'}>
          <Logo
            className={'__tag-item-logo'}
            network={'kusama'}
            size={16}
          />
          <div className={'__tag-item-label'}>
            KSM
          </div>
        </div>
      </div>

      <div className='__tool-area'>
        <FilterTabs
          className={'__filter-tabs-container'}
          items={filterTabItems}
          onSelect={onSelectFilterTab}
          selectedItem={selectedFilterTab}
        />

        <div className={'__form-area'}>
          <Form
            className={'__form-container'}
            form={form}
            initialValues={formDefault}
          >
            <Form.Item
              className={'__form-item'}
              name={'address'}
              rules={[
                {
                  validator: validateAddress
                }
              ]}
              statusHelpAsTooltip
              validateTrigger='onBlur'
            >
              <AddressInput
                placeholder={t('Enter your Polkadot wallet address')}
                prefix={(
                  <Icon
                    className={'address-input-icon'}
                    phosphorIcon={Wallet}
                    size='md'
                  />
                )}
                showLabel={false}
                showPlainAddressOnly
                showScanner
              />
            </Form.Item>
          </Form>
        </div>
      </div>

      <div className={'__table-area'}>
        {!!filteredtableItems.length && (
          <Table
            className={'__table'}
            columns={columns}
            dataSource={filteredtableItems}
            pagination={false}
            rowKey={'id'}
          />
        )}
        {!filteredtableItems.length && (
          <div className={'__empty-list-wrapper'}>
            <EmptyList
              className={'__empty-list'}
              emptyMessage={t('Check again or create a new account.')}
              emptyTitle={t('We can\'t find any crowdloan contributions from this address.')}
              phosphorIcon={RocketLaunch}
            />

            <div className='__buttons-block'>
              <Button
                block
                className='__check-again-button'
                disabled={isCheckAgainDisabled}
                icon={
                  <Icon
                    customSize={'28px'}
                    phosphorIcon={ArrowCounterClockwise}
                    weight='fill'
                  />
                }
                onClick={onClickCheckAgain}
                schema='secondary'
              >
                {t('Check again')}
              </Button>

              <Button
                block
                className='__create-a-wallet-button'
                icon={
                  <Icon
                    customSize={'28px'}
                    phosphorIcon={PlusCircle}
                    weight='fill'
                  />
                }
                onClick={onClickCreateNewWallet}
                schema='primary'
              >
                {t('Create a new account')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className={'__footer-area'}>
        <NoteBox
          className={'__note-box'}
          content={t('There\'re multiple ways you can play with your unlocked DOT, such as native staking, liquid staking, or lending. Check out SubWallet Dashboard for curated options with competitive APY to earn yield on your DOT.')}
          title={t('Crowdloan unlock, then what?')}
        />

        <Button
          className={'__footer-button'}
          contentAlign={'left'}
          icon={
            <Icon
              className='__footer-button-icon'
              phosphorIcon={Vault}
              size='md'
              weight='fill'
            />
          }
          onClick={goEarningDemo}
        >
          <div className={'__footer-button-content'}>
            <div className={'__footer-button-title'}>{t('Rewards: 18% - 24%')}</div>

            <div className={'__footer-button-subtitle'}>{t('Earning with SubWallet Dashboard')}</div>
          </div>
        </Button>
      </div>
    </Layout.Base>
  );
};

const CrowdloanContributionsResult = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    maxWidth: 1216,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: token.padding,
    paddingRight: token.padding,

    '&-web-base-container': {
      '.web-layout-header-simple': {
        paddingBottom: token.sizeLG
      }
    },

    '.__tag-area': {
      display: 'flex',
      justifyContent: 'center',
      gap: token.sizeXS,
      marginBottom: 28
    },

    '.__tag-item': {
      display: 'flex',
      gap: token.sizeXXS,
      position: 'relative',
      alignItems: 'center',
      paddingLeft: token.paddingSM,
      paddingRight: token.paddingSM,
      height: 30,
      backgroundColor: token.colorBgSecondary,
      borderRadius: 50,

      '&:before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        border: '2px solid',
        borderColor: token.colorBorderBg,
        borderRadius: 50,
        opacity: 0
      },

      '&.-secondary': {
        backgroundColor: 'transparent',

        '&:before': {
          opacity: 1
        }
      }
    },

    '.__tag-item-label': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight4
    },

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column'
    },

    '.project-container': {
      display: 'flex',
      gap: token.sizeXS,

      '.project-information': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingRight: token.paddingXS
      },

      '.project-name': {
        fontSize: token.fontSizeLG,
        lineHeight: token.lineHeightLG,
        fontWeight: token.headingFontWeight,
        color: token.colorTextLight1,
        paddingRight: token.sizeXS,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },

      '.project-parachain': {
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        color: token.colorTextLight4
      }
    },

    '.fund-unlock-detail-line-1': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1
    },

    '.fund-unlock-detail-line-2': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorSuccess
    },

    '.address-input-icon': {
      zIndex: 10
    },

    '.__tool-area': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: token.size,
      flexWrap: 'wrap'
    },

    '.__form-area': {
      maxWidth: 358,
      flex: 1
    },

    '.__form-item': {
      marginBottom: 0
    },

    '.__table-area': {
      flex: 1,
      paddingTop: token.padding,
      paddingBottom: token.paddingLG
    },

    '.__empty-list-wrapper': {
      paddingTop: 70,
      paddingBottom: 100
    },

    '.__buttons-block': {
      display: 'flex',
      gap: token.size,
      maxWidth: 584,
      marginLeft: 'auto',
      marginRight: 'auto'
    },

    '.__check-again-button, .__create-a-wallet-button': {
      flex: 1
    },

    '.__footer-area': {
      borderTop: `2px solid ${token.colorBgDivider}`,
      display: 'flex',
      gap: token.size,
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: token.sizeLG,
      paddingBottom: 42
    },

    '.__note-box': {
      maxWidth: 684,
      flex: '1 0 300px'
    },

    '.__footer-button': {
      height: 72,
      flex: 1,
      paddingRight: token.paddingSM,
      paddingLeft: token.paddingSM,
      gap: token.size,
      maxWidth: 384
    },

    '.__footer-button-icon': {
      width: 40,
      height: 40,
      justifyContent: 'center'
    },

    '.__footer-button-content': {
      textAlign: 'left'
    },

    '.__footer-button-title': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      marginBottom: token.marginXXS
    },

    '.__footer-button-subtitle': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight3
    }
  };
});

export default CrowdloanContributionsResult;
