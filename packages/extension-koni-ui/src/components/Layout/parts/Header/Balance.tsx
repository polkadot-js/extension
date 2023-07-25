// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomModal, ReceiveQrModal, TokensSelectorModal } from '@subwallet/extension-koni-ui/components/Modal';
import { AccountSelectorModal } from '@subwallet/extension-koni-ui/components/Modal/AccountSelectorModal';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { useNotification, useReceiveQR, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import BuyTokens from '@subwallet/extension-koni-ui/Popup/BuyTokens';
import Transaction from '@subwallet/extension-koni-ui/Popup/Transaction/Transaction';
import SendFund from '@subwallet/extension-koni-ui/Popup/Transaction/variants/SendFund';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Divider, Icon, ModalContext, Number, Tag, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowFatLinesDown, Eye, EyeClosed, PaperPlaneTilt, ShoppingCartSimple } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';

const TRANSFER_FUND_MODAL = 'transfer-fund-modal';
const BUY_TOKEN_MODAL = 'buy-token-modal';

export type Props = ThemeProps

type Action = {
  label: string
  type: string
  icon: PhosphorIcon
  onClick?: () => void
}

const actions: Action[] = [
  {
    label: 'Receive',
    type: 'receive',
    icon: ArrowFatLinesDown
  },
  {
    label: 'Send',
    type: 'send',
    icon: PaperPlaneTilt
  },
  {
    label: 'Buy',
    type: 'buys',
    icon: ShoppingCartSimple
  }
];

function Component ({ className }: Props): React.ReactElement<Props> {
  const locationPathname = useLocation().pathname;
  const tokenGroupSlug = useParams()?.slug;

  const _tokenGroupSlug = useMemo(() => {
    if (locationPathname && tokenGroupSlug) {
      if (locationPathname.includes('/home/tokens/detail/')) {
        return tokenGroupSlug;
      }
    }

    return undefined;
  }, [locationPathname, tokenGroupSlug]);

  const [displayBalance, setDisplayBalance] = useState<boolean>(true);

  const handleDisplayBalance = useCallback(() => setDisplayBalance(!displayBalance), [displayBalance]);

  const { t } = useTranslation();
  const { accountBalance: { totalBalanceInfo } } = useContext(HomeContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { accountSelectorItems,
    onOpenReceive,
    openSelectAccount,
    openSelectToken,
    selectedAccount,
    selectedNetwork,
    tokenSelectorItems } = useReceiveQR(_tokenGroupSlug);

  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const notify = useNotification();

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';
  const totalChangePercent = totalBalanceInfo.change.percent;
  const totalChangeValue = totalBalanceInfo.change.value;
  const totalValue = totalBalanceInfo.convertedValue;

  const onOpenBuyTokens = useCallback(() => {
    activeModal(BUY_TOKEN_MODAL);
  }, [activeModal]);

  const onOpenSendFund = useCallback(() => {
    if (currentAccount && currentAccount.isReadOnly) {
      notify({
        message: t('The account you are using is read-only, you cannot send assets with it'),
        type: 'info',
        duration: 3
      });

      return;
    }

    activeModal(TRANSFER_FUND_MODAL);
  },
  [currentAccount, notify, t, activeModal]
  );

  const handleClick = useCallback((type: string) => {
    switch (type) {
      case 'buys': return onOpenBuyTokens();
      case 'send': return onOpenSendFund();
      case 'receive': return onOpenReceive();
      default:
    }
  }, [
    onOpenSendFund,
    onOpenBuyTokens,
    onOpenReceive
  ]);

  const handleCancelTransfer = useCallback(() => inactiveModal(TRANSFER_FUND_MODAL), [inactiveModal]);
  const handleCancelBuy = useCallback(() => inactiveModal(BUY_TOKEN_MODAL), [inactiveModal]);

  return (
    <div className={CN(className, 'flex-row')}>
      <div className='balance-item'>
        <div className='flex-row'>
          <Typography.Text className='balance-title'>
            Total balance
          </Typography.Text>
          <Button
            className='toggle-show-balance'
            icon={
              <Icon
                phosphorIcon={displayBalance ? Eye : EyeClosed}
                size='sm'
              />
            }
            onClick={handleDisplayBalance}
            type='ghost'
          />
        </div>
        {displayBalance
          ? (
            <>
              <Number
                className={'balance-value'}
                decimal={0}
                decimalOpacity={0.45}
                size={30}
                subFloatNumber
                suffix='$'
                value={totalValue}
              />

              <div className={'__balance-change-container'}>
                <Number
                  className={'__balance-change-value'}
                  decimal={0}
                  decimalOpacity={1}
                  prefix={isTotalBalanceDecrease ? '- $' : '+ $'}
                  size={10}
                  value={totalChangeValue}
                />
                <Tag
                  className={`__balance-change-percent ${isTotalBalanceDecrease ? '-decrease' : ''}`}
                  shape={'round'}
                >
                  <Number
                    decimal={0}
                    decimalOpacity={1}
                    prefix={isTotalBalanceDecrease ? '-' : '+'}
                    size={10}
                    suffix={'%'}
                    value={totalChangePercent}
                    weight={700}
                  />
                </Tag>
              </div>
            </>
          )
          : (
            <Typography.Text className='hidden-balance'>*******</Typography.Text>
          )}
      </div>

      <Divider
        className='divider'
        type='vertical'
      />

      <div className='balance-item'>
        <Typography.Text className='balance-title'>
          Transferable balance
        </Typography.Text>

        {
          displayBalance
            ? (
              <Number
                className='balance-value'
                decimal={0}
                decimalOpacity={0.45}
                size={30}
                subFloatNumber
                suffix='$'
                value={totalBalanceInfo.freeValue}
              />
            )
            : (
              <Typography.Text className='hidden-balance'>*******</Typography.Text>
            )
        }
      </div>

      <Divider
        className='divider'
        type='vertical'
      />

      <div className='balance-item'>
        <Typography.Text className='balance-title'>
          Locked balance
        </Typography.Text>
        {
          displayBalance
            ? (
              <Number
                className='balance-value'
                decimal={0}
                decimalOpacity={0.45}
                size={30}
                subFloatNumber
                suffix='$'
                value={totalBalanceInfo.lockedValue}
              />
            )
            : (
              <Typography.Text className='hidden-balance'>*******</Typography.Text>
            )
        }
      </div>

      <Divider
        className='divider'
        type='vertical'
      />

      <div className={CN('balance-item', 'action-wrapper')}>
        <Typography.Text className='balance-title'>Actions</Typography.Text>

        <div className='actions'>
          {actions.map((item) => (
            <div
              className='action-button'
              key={item.type}
            >
              <Button
                className={CN(`type-${item.type}`)}
                icon={(
                  <Icon
                    phosphorIcon={item.icon}
                    size='sm'
                    weight='bold'
                  />
                )}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => handleClick(item.type)}
                shape='squircle'
                size='sm'
              />
              <Typography.Text>{item.label}</Typography.Text>
            </div>
          ))}
        </div>
      </div>

      <CustomModal
        id={TRANSFER_FUND_MODAL}
        onCancel={handleCancelTransfer}
        title={t('Transfer')}
      >
        <Transaction modalContent>
          <SendFund modalContent />
        </Transaction>
      </CustomModal>

      <CustomModal
        id={BUY_TOKEN_MODAL}
        onCancel={handleCancelBuy}
        title={t('Buy token')}
      >
        <BuyTokens modalContent />
      </CustomModal>

      <AccountSelectorModal
        items={accountSelectorItems}
        onSelectItem={openSelectAccount}
      />

      <TokensSelectorModal
        address={selectedAccount}
        items={tokenSelectorItems}
        onSelectItem={openSelectToken}
      />

      <ReceiveQrModal
        address={selectedAccount}
        selectedNetwork={selectedNetwork}
      />
    </div>
  );
}

const Balance = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  marginBottom: 62,

  '.divider': {
    alignSelf: 'stretch',
    height: 'unset'
  },

  '.flex-row': {
    display: 'flex'
  },

  '.toggle-show-balance': {
    height: 'fit-content'
  },

  '.balance-item': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,

    '&:not(:first-child)': {
      alignItems: 'center'
    },

    '.balance-title': {
      marginBottom: 5
    },
    '&:not(:first-child) > .balance-title': {
      textAlign: 'center',
      display: 'block',
      width: '100%'
    },

    '.balance-value': {
      margin: '12px 0'
    }
  },

  '.__balance-change-container': {
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'flex-end',

    '.ant-typography': {
      lineHeight: 'inherit',
      // todo: may update number component to clear this !important
      color: 'inherit !important'
    }
  },

  '.__balance-change-value': {
    marginRight: token.sizeSM,
    lineHeight: token.lineHeight
  },

  '.__balance-change-percent': {
    backgroundColor: token['cyan-6'],
    color: token['green-1'],
    marginInlineEnd: 0,
    display: 'flex',

    '&.-decrease': {
      backgroundColor: token.colorError,
      color: token.colorTextLight1
    },

    '.ant-number': {
      fontSize: token.fontSizeXS
    }
  },
  '.hidden-balance': {
    margin: '20px 0'
  },

  '.action-wrapper': {
    justifyContent: 'space-between',
    '.actions': {
      display: 'flex',
      gap: 12,

      '.action-button': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        marginTop: 20
      }
    }
  }
}));

export default Balance;
