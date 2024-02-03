// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { EarningStatus, SpecialYieldPositionInfo, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { Avatar, CollapsiblePanel, MetaInfo } from '@subwallet/extension-web-ui/components';
import { InfoItemBase } from '@subwallet/extension-web-ui/components/MetaInfo/parts';
import { EarningNominationModal } from '@subwallet/extension-web-ui/components/Modal/Earning';
import { EARNING_NOMINATION_MODAL, StakingStatusUi } from '@subwallet/extension-web-ui/constants';
import { useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { EarningTagType, ThemeProps } from '@subwallet/extension-web-ui/types';
import { createEarningTypeTags, findAccountByAddress, isAccountAll, toShort } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowSquareOut } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  list: YieldPositionInfo[];
  inputAsset: _ChainAsset;
  poolInfo: YieldPoolInfo;
};

function Component ({ className, compound, inputAsset, list, poolInfo }: Props) {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { type } = compound;

  const { assetRegistry } = useSelector((state) => state.assetRegistry);
  const { accounts } = useSelector((state) => state.accountState);

  const deriveAsset = useMemo(() => {
    if ('derivativeToken' in compound) {
      const position = compound as SpecialYieldPositionInfo;

      return assetRegistry[position.derivativeToken];
    } else {
      return undefined;
    }
  }, [assetRegistry, compound]);

  const earningTagType: EarningTagType = useMemo(() => {
    return createEarningTypeTags(compound.chain)[compound.type];
  }, [compound.chain, compound.type]);

  const isAllAccount = useMemo(() => isAccountAll(compound.address), [compound.address]);
  const isSpecial = useMemo(() => [YieldPoolType.LENDING, YieldPoolType.LIQUID_STAKING].includes(type), [type]);
  const haveNomination = useMemo(() => {
    return [YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(poolInfo.type);
  }, [poolInfo.type]);
  const noNomination = useMemo(
    () => !haveNomination || isAllAccount || !compound.nominations.length,
    [compound.nominations.length, haveNomination, isAllAccount]
  );

  const [selectedAddress, setSelectedAddress] = useState('');

  const selectedItem = useMemo((): YieldPositionInfo | undefined => {
    return list.find((item) => isSameAddress(item.address, selectedAddress));
  }, [list, selectedAddress]);

  const getEarningStatus = useCallback((item: YieldPositionInfo) => {
    const stakingStatusUi = StakingStatusUi;
    const status = item.status;

    if (status === EarningStatus.EARNING_REWARD) {
      return stakingStatusUi.active;
    }

    if (status === EarningStatus.PARTIALLY_EARNING) {
      return stakingStatusUi.partialEarning;
    }

    if (status === EarningStatus.WAITING) {
      return stakingStatusUi.waiting;
    }

    return stakingStatusUi.inactive;
  }, []);

  const renderAccount = useCallback(
    (item: YieldPositionInfo) => {
      const account = findAccountByAddress(accounts, item.address);

      return (
        <>
          <Avatar
            size={24}
            value={item.address}
          />
          <div className={'__account-name'}>
            {account?.name || toShort(item.address)}
          </div>
        </>
      );
    },
    [accounts]
  );

  const onCloseNominationModal = useCallback(() => {
    inactiveModal(EARNING_NOMINATION_MODAL);
  }, [inactiveModal]);

  const createOpenNomination = useCallback((item: YieldPositionInfo) => {
    return () => {
      setSelectedAddress(item.address);
      activeModal(EARNING_NOMINATION_MODAL);
    };
  }, [activeModal]);

  return (
    <>
      <CollapsiblePanel
        className={CN(className, {
          '-no-nomination': noNomination,
          '-horizontal-mode': isAllAccount
        })}
        title={t('Account info')}
      >
        {list.map((item) => {
          const earningStatus = getEarningStatus(item);
          const disableButton = !item.nominations.length;

          return (
            <MetaInfo
              className={CN('__account-info-item', {
                '-box-mode': isAllAccount
              })}
              hasBackgroundWrapper={isAllAccount}
              key={item.address}
              labelColorScheme='gray'
              labelFontWeight='regular'
              spaceSize='sm'
              valueColorScheme='light'
            >
              {!isAllAccount
                ? (
                  <MetaInfo.Account
                    address={item.address}
                    label={t('Account')}
                  />
                )
                : (
                  <MetaInfo.Status
                    className={'__meta-earning-status-item'}
                    label={renderAccount(item)}
                    statusIcon={earningStatus.icon}
                    statusName={earningStatus.name}
                    valueColorSchema={earningStatus.schema}
                  />
                )}

              <MetaInfo.Default
                label={t('Staking type')}
                valueColorSchema={earningTagType.color as InfoItemBase['valueColorSchema']}
              >
                {earningTagType.label}
              </MetaInfo.Default>

              {!isSpecial
                ? (
                  <>
                    <MetaInfo.Number
                      decimals={inputAsset?.decimals || 0}
                      label={t('Total stake')}
                      suffix={inputAsset?.symbol}
                      value={new BigN(item.totalStake)}
                      valueColorSchema='even-odd'
                    />
                    <MetaInfo.Number
                      decimals={inputAsset?.decimals || 0}
                      label={t('Active staked')}
                      suffix={inputAsset?.symbol}
                      value={item.activeStake}
                      valueColorSchema='even-odd'
                    />
                    <MetaInfo.Number
                      decimals={inputAsset?.decimals || 0}
                      label={t('Unstaked')}
                      suffix={inputAsset?.symbol}
                      value={item.unstakeBalance}
                      valueColorSchema='even-odd'
                    />
                  </>
                )
                : (
                  <>
                    <MetaInfo.Number
                      decimals={inputAsset?.decimals || 0}
                      label={t('Total stake')}
                      suffix={inputAsset?.symbol}
                      value={new BigN(item.totalStake)}
                      valueColorSchema='even-odd'
                    />
                    <MetaInfo.Number
                      decimals={deriveAsset?.decimals || 0}
                      label={t('Derivative token balance')}
                      suffix={deriveAsset?.symbol}
                      value={item.activeStake}
                      valueColorSchema='even-odd'
                    />
                  </>
                )}
              {isAllAccount && haveNomination && (
                <>
                  <div className='__separator'></div>

                  <div className={'__nomination-button-wrapper'}>
                    <Button
                      block={true}
                      className={'__nomination-button'}
                      disabled={disableButton}
                      onClick={createOpenNomination(item)}
                      size={'xs'}
                      type={'ghost'}
                    >
                      <div className={'__nomination-button-label'}>
                        {t('Nomination info')}
                      </div>

                      <Icon
                        phosphorIcon={ArrowSquareOut}
                        size={'sm'}
                      />
                    </Button>
                  </div>
                </>
              )}
            </MetaInfo>
          );
        })}
      </CollapsiblePanel>

      <EarningNominationModal
        inputAsset={inputAsset}
        item={selectedItem}
        onCancel={onCloseNominationModal}
      />
    </>
  );
}

export const AccountInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '&.-horizontal-mode': {
    '.__panel-body': {
      overflowX: 'auto',
      display: 'flex',
      gap: token.sizeSM
    }
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)'
  },

  '.meta-info-block + .meta-info-block': {
    marginTop: 0
  },

  '.__account-info-item': {
    '.__separator': {
      marginTop: token.marginSM
    }
  },

  '.__account-info-item.-box-mode': {
    backgroundColor: token.colorBgDefault,
    minWidth: 300
  },

  '.__meta-earning-status-item': {
    '.__label': {
      'white-space': 'nowrap',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.sizeXS,
      overflow: 'hidden'
    },

    '.__value-col': {
      flex: '0 1 auto'
    },

    '.__account-name': {
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    }
  },

  '.__nomination-button-wrapper': {
    marginLeft: -token.marginSM,
    marginRight: -token.marginSM
  },

  '.__nomination-button': {
    paddingLeft: token.paddingSM,
    paddingRight: token.paddingSM,
    justifyContent: 'space-between',
    gap: token.sizeSM
  },

  '.__nomination-button-label': {
    color: token.colorTextLight4
  },

  '.__nomination-button:hover': {
    '.__nomination-button-label': {
      color: 'inherit'
    }
  }
}));
