// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { BaseModal, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_UN_YIELD_PARAMS, DEFAULT_YIELD_PARAMS, EARNING_MORE_ACTION_MODAL, StakingStatusUi, UN_YIELD_TRANSACTION, YIELD_POSITION_DETAIL_MODAL, YIELD_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { usePreCheckAction, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { createEarningTagTypes, isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import { DotsThree } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

interface Props extends ThemeProps {
  positionInfo: YieldPositionInfo;
  yieldPoolInfo: YieldPoolInfo;
}

const modalId = YIELD_POSITION_DETAIL_MODAL;

const Component: React.FC<Props> = ({ className, positionInfo, yieldPoolInfo }: Props) => {
  const { currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const modalTitle = detectTranslate('Position details');

  const { token } = useTheme() as Theme;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const onClickFooterButton = usePreCheckAction(currentAccount?.address, false);

  const account = isAllAccount ? null : currentAccount;

  const yieldPositionInfoBalance = useMemo(() => {
    if (!yieldPoolInfo.derivativeAssets) {
      return positionInfo.balance[0];
    }

    const derivativeTokenBalance = positionInfo.balance[0].totalBalance;
    const inputTokenSlug = yieldPoolInfo.inputAssets[0];
    // @ts-ignore
    const exchangeRate = yieldPoolInfo?.stats?.assetEarning[0]?.exchangeRate || 1;
    const inputTokenBalance = Math.floor(parseInt(derivativeTokenBalance) * exchangeRate);

    return {
      activeBalance: inputTokenBalance.toString(),
      slug: inputTokenSlug,
      totalBalance: inputTokenBalance.toString()
    };
  }, [positionInfo.balance, yieldPoolInfo.derivativeAssets, yieldPoolInfo.inputAssets, yieldPoolInfo?.stats?.assetEarning]);

  const derivativeTokenState = useMemo(() => {
    if (!yieldPoolInfo.derivativeAssets) {
      return;
    }

    const derivativeTokenSlug = yieldPoolInfo.derivativeAssets[0];

    const derivativeTokenInfo = assetRegistry[derivativeTokenSlug];

    return {
      symbol: _getAssetSymbol(derivativeTokenInfo),
      decimals: _getAssetDecimals(derivativeTokenInfo),
      amount: positionInfo.balance[0].totalBalance
    };
  }, [assetRegistry, positionInfo.balance, yieldPoolInfo.derivativeAssets]);
  const inputTokenInfo = useMemo(() => assetRegistry[yieldPositionInfoBalance.slug], [assetRegistry, yieldPositionInfoBalance]);

  const [, setYieldStorage] = useLocalStorage(YIELD_TRANSACTION, DEFAULT_YIELD_PARAMS);
  const [, setUnStakeStorage] = useLocalStorage(UN_YIELD_TRANSACTION, DEFAULT_UN_YIELD_PARAMS);

  const tagTypes = useMemo(() => createEarningTagTypes(t, token), [t, token]);

  const onClickStakeMoreBtn = useCallback(() => {
    inactiveModal(modalId);
    setTimeout(() => {
      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setYieldStorage({
        ...DEFAULT_YIELD_PARAMS,
        method: yieldPoolInfo.slug,
        from: address,
        chain: yieldPoolInfo.chain,
        asset: yieldPoolInfo.inputAssets[0]
      });
      navigate('/transaction/earn');
    }, 300);
  }, [currentAccount, inactiveModal, navigate, setYieldStorage, yieldPoolInfo]);

  const onClickUnstakeBtn = useCallback(() => {
    inactiveModal(modalId);
    setTimeout(() => {
      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setUnStakeStorage({
        ...DEFAULT_UN_YIELD_PARAMS,
        from: address,
        chain: yieldPoolInfo.chain,
        method: yieldPoolInfo.slug,
        asset: yieldPoolInfo.inputAssets[0]
      });
      navigate('/transaction/un-yield');
    }, 300);
  }, [currentAccount, inactiveModal, navigate, setUnStakeStorage, yieldPoolInfo]);

  const onClickMoreAction = useCallback(() => {
    inactiveModal(modalId);
    activeModal(EARNING_MORE_ACTION_MODAL);
  }, [activeModal, inactiveModal]);

  const footer = () => {
    return (
      <div className='staking-detail-modal-footer'>
        <Button
          icon={<Icon phosphorIcon={DotsThree} />}
          onClick={onClickMoreAction}
          schema='secondary'
        />
        <Button
          className='__action-btn'
          disabled
          onClick={onClickFooterButton(
            onClickUnstakeBtn,
            yieldPoolInfo.type === YieldPoolType.NOMINATION_POOL ? ExtrinsicType.STAKING_LEAVE_POOL : ExtrinsicType.STAKING_UNBOND
          )}
          schema='secondary'
        >{t('Withdraw')}</Button>
        <Button
          className='__action-btn'
          onClick={onClickFooterButton(
            onClickStakeMoreBtn,
            yieldPoolInfo.type === YieldPoolType.NOMINATION_POOL ? ExtrinsicType.STAKING_BOND : ExtrinsicType.STAKING_JOIN_POOL
          )}
        >{t('Earn more')}</Button>
      </div>
    );
  };

  const onCloseModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <BaseModal
      className={className}
      closable={true}
      footer={footer()}
      id={modalId}
      maskClosable={true}
      onCancel={onCloseModal}
      title={t(modalTitle)}
    >
      <MetaInfo>
        <MetaInfo.Account
          accounts={isAccountAll(positionInfo.address) ? [] : undefined}
          address={positionInfo.address}
          label={t('Account')}
          name={account?.name}
        />

        {/* change this when all account data is full */}
        {/* <MetaInfo.AccountGroup label={'Account'} accounts={accounts} content={`${accounts.length} accounts staking`} /> */}

        <MetaInfo.DisplayType
          label={t('Earning type')}
          typeName={tagTypes[yieldPoolInfo.type].label}
        />
        <MetaInfo.Status
          label={t('Earning status')}
          statusIcon={StakingStatusUi.active.icon}
          statusName={t(StakingStatusUi.active.name)}
          valueColorSchema={StakingStatusUi.active.schema}
        />

        <MetaInfo.Number
          decimals={_getAssetDecimals(inputTokenInfo)}

          label={t('Total balance')}
          suffix={_getAssetSymbol(inputTokenInfo)}
          value={yieldPositionInfoBalance.totalBalance}
        />

        {
          derivativeTokenState && <MetaInfo.Number
            decimals={derivativeTokenState.decimals}
            label={t('Derivative token balance')}
            suffix={derivativeTokenState.symbol}
            value={derivativeTokenState.amount}
          />
        }

        <MetaInfo.Chain
          chain={yieldPoolInfo.chain}
          label={t('Network')}
        />
      </MetaInfo>

      <>
        <MetaInfo
          hasBackgroundWrapper
          spaceSize={'xs'}
          valueColorScheme={'light'}
        >
          <MetaInfo.Number
            decimals={_getAssetDecimals(inputTokenInfo)}
            label={t('Minimum active')}
            suffix={_getAssetSymbol(inputTokenInfo)}
            value={yieldPoolInfo.stats?.minJoinPool || '0'}
            valueColorSchema={'gray'}
          />
        </MetaInfo>
      </>
    </BaseModal>
  );
};

const YieldPositionDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.expected-return div:first-child': {
      flex: 2
    },

    '.staking-detail-modal-footer': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__action-btn': {
      flex: 1
    },

    '.__slash': {
      marginLeft: token.marginXXS,
      marginRight: token.marginXXS
    },

    '.__inflation-text': {
      marginLeft: token.marginXXS,
      color: token.colorTextLight4
    },

    '.__expected-return, .__inflation': {
      display: 'inline-flex'
    },

    '.__inflation': {
      color: token.colorTextLight4
    },

    '.__nomination-field': {
      '> .__col': {
        overflow: 'hidden'
      },

      '&.stand-alone': {
        '.__col.-to-right': {
          flexGrow: 0
        }
      }
    },

    '.__nomination-label > .__col.-to-right': {
      flex: 'initial',
      overflow: 'hidden',
      alignItems: 'flex-start',

      '.__account-item': {
        width: '100%'
      },

      '.__account-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    },

    '.see-more-btn': {
      marginTop: token.margin
    },

    '.ant-sw-modal-body': {
      paddingBottom: 0
    },

    '.ant-sw-modal-footer': {
      border: 'none'
    }
  };
});

export default YieldPositionDetailModal;
