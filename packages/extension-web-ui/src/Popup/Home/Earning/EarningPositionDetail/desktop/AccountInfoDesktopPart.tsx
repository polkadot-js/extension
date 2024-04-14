// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { SpecialYieldPositionInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { Avatar, EarningNominationModal, EmptyList, MetaInfo } from '@subwallet/extension-web-ui/components';
import Table from '@subwallet/extension-web-ui/components/Table/Table';
import { EARNING_NOMINATION_MODAL, EarningStatusUi } from '@subwallet/extension-web-ui/constants';
import { useGetAccountByAddress, useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { findNetworkJsonByGenesisHash, reformatAddress, toShort } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, ModalContext, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowSquareOut, Database } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  positionItems: YieldPositionInfo[];
  inputAsset: _ChainAsset;
  compound: YieldPositionInfo;
}

type RowAccountComponentProp = {
  address: string
}

const RowAccountComponent = ({ address }: RowAccountComponentProp) => {
  const account = useGetAccountByAddress(address);

  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);

  const name = account?.name || ' ';

  const _address = useMemo(() => {
    let addPrefix = 42;

    if (account?.originGenesisHash) {
      const network = findNetworkJsonByGenesisHash(chainInfoMap, account.originGenesisHash);

      if (network) {
        addPrefix = network.substrateInfo?.addressPrefix ?? addPrefix;
      }
    }

    return reformatAddress(address, addPrefix);
  }, [account?.originGenesisHash, chainInfoMap, address]);

  return (
    <div className={'__row-account-meta-wrapper'}>
      <Avatar
        className={'__row-account-logo'}
        size={32}
        value={address}
      />
      <div className={'__row-account-meta'}>
        <div className={'__row-account-name'}>{name}</div>
        <div className={'__row-account-address'}>{toShort(_address)}</div>
      </div>
    </div>
  );
};

const Component: React.FC<Props> = ({ className, compound,
  inputAsset,
  positionItems }: Props) => {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { type } = compound;

  const { assetRegistry } = useSelector((state) => state.assetRegistry);

  const [selectedAddress, setSelectedAddress] = useState('');

  const selectedItem = useMemo((): YieldPositionInfo | undefined => {
    return positionItems.find((item) => isSameAddress(item.address, selectedAddress));
  }, [positionItems, selectedAddress]);

  const deriveAsset = useMemo(() => {
    if ('derivativeToken' in compound) {
      const position = compound as SpecialYieldPositionInfo;

      return assetRegistry[position.derivativeToken];
    } else {
      return undefined;
    }
  }, [assetRegistry, compound]);

  const isSpecial = useMemo(() => [YieldPoolType.LENDING, YieldPoolType.LIQUID_STAKING].includes(type), [type]);

  const onCloseNominationModal = useCallback(() => {
    inactiveModal(EARNING_NOMINATION_MODAL);
  }, [inactiveModal]);

  const createOpenNomination = useCallback((item: YieldPositionInfo) => {
    return () => {
      setSelectedAddress(item.address);
      activeModal(EARNING_NOMINATION_MODAL);
    };
  }, [activeModal]);

  const columns = useMemo(() => {
    const accountCol = {
      title: 'Account',
      key: 'account',
      className: '__table-token-col',
      render: (row: YieldPositionInfo) => {
        return (
          <RowAccountComponent address={row.address} />
        );
      }
    };

    const earningStatusCol = {
      title: 'Earning status',
      key: 'earning_status',
      className: '__earning-status-col',
      sortable: true,
      render: (row: YieldPositionInfo) => {
        return (
          <MetaInfo>
            <MetaInfo.Status
              statusIcon={EarningStatusUi[row.status].icon}
              statusName={EarningStatusUi[row.status].name}
              valueColorSchema={EarningStatusUi[row.status].schema}
            />
          </MetaInfo>
        );
      }
    };

    const activeStakeCol = {
      title: 'Active stake',
      key: 'active-stake',
      className: '__table-active-stake-col',
      render: (row: YieldPositionInfo) => {
        return (
          <div className={CN('__row-active-stake-wrapper', {
            '-has-derivative': isSpecial
          })}
          >
            <div className={'__active-stake'}>
              <Number
                className={'__active-stake-account-value'}
                decimal={inputAsset?.decimals || 0}
                suffix={inputAsset?.symbol}
                value={BigN(row.totalStake).minus(row.unstakeBalance)}
              />
            </div>

            {
              isSpecial && (
                <div className={'__derivative-balance'}>
                  <span className={'__derivative-title'}>{`${t('Derivative balance')}: `}</span>
                  <div className={'__derivative-balance-value'}>
                    <Number
                      decimal={deriveAsset?.decimals || 0}
                      suffix={deriveAsset?.symbol}
                      value={row.activeStake}
                    />
                  </div>
                </div>
              )
            }
          </div>
        );
      }
    };

    const unStakedCol = {
      title: 'Unstaked',
      key: 'unstaked',
      className: '__table-unstake-col',
      sortable: true,
      render: (row: YieldPositionInfo) => {
        return (
          <Number
            className={'__table-unstake-value'}
            decimal={inputAsset?.decimals || 0}
            suffix={inputAsset?.symbol}
            value={row.unstakeBalance}
          />
        );
      }
    };

    const totalStakeCol = {
      title: 'Total stake',
      key: 'total-stake',
      className: '__table-total-stake-col',
      sortable: true,
      render: (row: YieldPositionInfo) => {
        return (
          <Number
            className={'__row-total-Stake-value'}
            decimal={inputAsset?.decimals || 0}
            suffix={inputAsset?.symbol}
            value={new BigN(row.totalStake)}
          />
        );
      }
    };

    const poolCol = {
      title: 'Pool',
      key: 'pool',
      className: '__table-pool-col',
      sortable: true,
      render: (row: YieldPositionInfo) => {
        const item = row.nominations[0];

        return (
          item
            ? (<div className={'__row-pool-wrapper'}>
              <Avatar
                size={24}
                value={item.validatorAddress}
              />
              <div className={'__nomination-name'}>
                {item.validatorIdentity || toShort(item.validatorAddress)}
              </div>
            </div>)
            : (
              <div className={'__row-pool-wrapper -no-content'}></div>
            )
        );
      }
    };

    const nominationCol = {
      title: '',
      key: 'nomination',
      className: '__table-nomination-col',
      sortable: true,
      render: (row: YieldPositionInfo) => {
        const disableButton = !row.nominations.length;

        return (
          <div className={'__row-nomination-button-wrapper'}>
            <Button
              className={'__row-nomination-button'}
              disabled={disableButton}
              icon={
                <Icon
                  customSize={'24px'}
                  phosphorIcon={ArrowSquareOut}
                />
              }
              onClick={createOpenNomination(row)}
              size={'xs'}
              type={'ghost'}
            />
          </div>
        );
      }
    };

    const result = [
      accountCol,
      earningStatusCol,
      activeStakeCol,
      unStakedCol,
      totalStakeCol
    ];

    if (type === YieldPoolType.NOMINATION_POOL) {
      result.push(poolCol);
    } else if (type === YieldPoolType.NATIVE_STAKING) {
      result.push(nominationCol);
    }

    return result;
  }, [createOpenNomination, deriveAsset?.decimals, deriveAsset?.symbol, inputAsset?.decimals, inputAsset?.symbol, isSpecial, t, type]);

  const getRowKey = useCallback((item: YieldPositionInfo) => {
    return item.address;
  }, []);

  const emptyList = useMemo(() => {
    return (
      <EmptyList
        emptyMessage={'Records will appear here'}
        emptyTitle={'No record found'}
        phosphorIcon={Database}
      />
    );
  }, []);

  return (
    <>
      <div className={CN(className)}>
        <div className={'__part-title'}>Account info</div>

        <Table
          className={'__part-table'}
          columns={columns}
          emptyList={emptyList}
          getRowKey={getRowKey}
          items={positionItems}
        />
      </div>

      <EarningNominationModal
        inputAsset={inputAsset}
        item={selectedItem}
        onCancel={onCloseNominationModal}
      />
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AccountInfoDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__table-nomination-col.__table-nomination-col': {
      maxWidth: 56
    },
    '.__table-pool-col .__row-pool-wrapper': {
      maxWidth: 220,
      color: token.colorWhite
    },
    '.__table-active-stake-col, .__table-total-stake-col, .__table-unstake-col, .__table-nomination-col, .__table-pool-col': {
      display: 'flex',
      justifyContent: 'flex-end'
    },
    '.__earning-status-col': {
      display: 'flex',
      justifyContent: 'flex-start',
      flex: 0.8
    },

    ['.__earning-status-col, .__table-active-stake-col, ' +
    '.__table-total-stake-col,']: {
      textAlign: 'center'
    },

    ['th.__earning-status-col.__earning-status-col, ' +
    'th.__table-active-stake-col.__table-active-stake-col, ' +
    'th.__table-unstake-col.__table-unstake-col, ' +
    'th.__table-total-stake-col.__table-total-stake-col, ' +
    'th.__table-pool-col.__table-pool-col']: {
      textAlign: 'center'
    },
    [
    'td.__table-active-stake-col.__table-active-stake-col, ' +
    'td.__table-unstake-col.__table-unstake-col, ' +
    'td.__table-total-stake-col.__table-total-stake-col, ' +
    'td.__table-transactions-col.__table-transactions-col, ' +
    'td.__table-pool-col.__table-pool-col']: {
      textAlign: 'center'
    },

    '.__tr': {
      'white-space': 'nowrap',
      color: token.colorWhite
    },
    '.__tr:hover': {
      backgroundColor: token.colorBgSecondary
    },

    '.__part-title': {
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      fontWeight: token.fontWeightStrong,
      paddingBottom: 20,
      paddingTop: token.padding
    },

    '.__row-nomination-button': {
      color: token.colorWhite
    },

    '.__derivative-title': {
      paddingRight: token.paddingXXS
    },

    '.__derivative-balance-value': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: token.bodyFontWeight,
      color: token.colorWhite,

      '.ant-number-integer, .ant-number-suffix': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal': {
        color: `${token.colorTextLight3} !important`,
        fontSize: `${token.fontSizeSM}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeightSM
      }
    },

    '.__active-stake-account-value, .__row-total-Stake-value, .__table-unstake-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite,

      '.ant-number-integer': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal': {
        color: `${token.colorTextLight4} !important`,
        fontSize: `${token.fontSizeLG}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeightLG
      }
    },

    '.__row-account-name': {
      lineHeight: token.lineHeight,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite
    },

    '.__row-pool-wrapper': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__nomination-name': {
      paddingLeft: token.paddingXS,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.__row-account-meta-wrapper': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__row-account-logo': {
      marginRight: token.paddingXS
    },

    '.__row-account-address': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: token.bodyFontWeight,
      color: token.colorTextSecondary
    },

    '.__td': {
      overflow: 'hidden'
    },

    '.ant-number': {
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    },

    '.__row-token-name-wrapper': {
      display: 'flex',
      gap: token.sizeSM
    },

    '.__account-name': {
      display: 'flex',
      color: token.colorTextLight1,
      fontSize: token.fontSizeXL,
      lineHeight: token.lineHeightHeading4,
      'white-space': 'nowrap'
    },

    '.__token-name': {
      color: token.colorTextTertiary,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    '.__account-address': {
      fontSize: token.fontSizeSM,
      color: token.colorTextLabel,
      lineHeight: token.lineHeightSM
    },

    '.__derivative-balance': {
      display: 'flex',
      alignItems: 'baseline',
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4
    },

    '.__earning-status-col .__td-inner': {
      alignItems: 'center'
    },
    '.__row-reward-per-year': {
      color: token.colorSuccess
    },
    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 70
    },

    '.__table-pool-col': {
      color: token.colorWhite,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      justifyContent: 'flex-end'
    },
    '.__table-pool-col .__col-title': {
      color: token.colorTextSecondary
    },

    '.__row-active-stake-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: token.marginXXS,
      flexDirection: 'column',
      alignItems: 'flex-end'
    },

    '.empty-list': {
      marginTop: 0,
      marginBottom: 0
    },

    '.__loading-area, .empty-list': {
      minHeight: 376
    },

    '@media(max-width: 1430px)': {
      '.__earning-status-col.__earning-status-col': {
        display: 'none'
      }
    },

    '@media(max-width: 991px)': {
      '.__table-mint-col.__table-mint-col': {
        minWidth: 80
      }
    }
  };
});

export default AccountInfoDesktopPart;
