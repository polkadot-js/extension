// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { balanceNoPrefixFormater, formatNumber } from '@subwallet/extension-base/utils';
import { ReceiveQrModal, TokensSelectorModal } from '@subwallet/extension-web-ui/components/Modal';
import { AccountSelectorModal } from '@subwallet/extension-web-ui/components/Modal/AccountSelectorModal';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { BUY_TOKEN_MODAL, DEFAULT_TRANSFER_PARAMS, TRANSACTION_TRANSFER_MODAL, TRANSFER_TRANSACTION } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-web-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { BackgroundColorMap, WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import { useNotification, useReceiveQR, useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { reloadCron, saveShowBalance } from '@subwallet/extension-web-ui/messaging';
import BuyTokens from '@subwallet/extension-web-ui/Popup/BuyTokens';
import Transaction from '@subwallet/extension-web-ui/Popup/Transaction/Transaction';
import SendFund from '@subwallet/extension-web-ui/Popup/Transaction/variants/SendFund';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { BuyTokenInfo, PhosphorIcon, ThemeProps } from '@subwallet/extension-web-ui/types';
import { getAccountType, isAccountAll } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, ModalContext, Number, Tag, Tooltip, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowFatLinesDown, ArrowsClockwise, Eye, EyeSlash, PaperPlaneTilt, ShoppingCartSimple } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

export type Props = ThemeProps

type Action = {
  label: string
  type: string
  icon: PhosphorIcon
  onClick?: () => void
  disabled?: boolean
}

function Component ({ className }: Props): React.ReactElement<Props> {
  const dataContext = useContext(DataContext);
  const { isWebUI } = useContext(ScreenContext);
  const { setBackground } = useContext(WebUIContext);
  const locationPathname = useLocation().pathname;
  const tokenGroupSlug = useParams()?.slug;
  const isShowBalance = useSelector((state: RootState) => state.settings.isShowBalance);
  const { currencyData } = useSelector((state: RootState) => state.price);
  const [reloading, setReloading] = useState(false);

  const onChangeShowBalance = useCallback(() => {
    saveShowBalance(!isShowBalance).catch(console.error);
  }, [isShowBalance]);

  const _tokenGroupSlug = useMemo(() => {
    if (locationPathname && tokenGroupSlug) {
      if (locationPathname.includes('/home/tokens/detail/')) {
        return tokenGroupSlug;
      }
    }

    return undefined;
  }, [locationPathname, tokenGroupSlug]);

  const { t } = useTranslation();
  const { accountBalance: { totalBalanceInfo }, tokenGroupStructure: { tokenGroupMap } } = useContext(HomeContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { accountSelectorItems,
    onOpenReceive,
    openSelectAccount,
    openSelectToken,
    selectedAccount,
    selectedNetwork,
    tokenSelectorItems } = useReceiveQR(_tokenGroupSlug);

  const currentAccount = useSelector((state) => state.accountState.currentAccount);
  const { tokens } = useSelector((state) => state.buyService);
  const [sendFundKey, setSendFundKey] = useState<string>('sendFundKey');
  const [buyTokensKey, setBuyTokensKey] = useState<string>('buyTokensKey');
  const [buyTokenSymbol, setBuyTokenSymbol] = useState<string>('');
  const notify = useNotification();

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';
  const totalChangePercent = totalBalanceInfo.change.percent;
  const totalChangeValue = totalBalanceInfo.change.value;
  const totalValue = totalBalanceInfo.convertedValue;

  const accounts = useSelector((state) => state.accountState.accounts);
  const [, setStorage] = useLocalStorage(TRANSFER_TRANSACTION, DEFAULT_TRANSFER_PARAMS);

  const buyInfos = useMemo(() => {
    if (!locationPathname.includes('/home/tokens/detail/')) {
      return [];
    }

    const slug = tokenGroupSlug || '';
    const slugs = tokenGroupMap[slug] ? tokenGroupMap[slug] : [slug];
    const result: BuyTokenInfo[] = [];

    for (const [slug, buyInfo] of Object.entries(tokens)) {
      if (slugs.includes(slug)) {
        const supportType = buyInfo.support;

        if (isAccountAll(currentAccount?.address || '')) {
          const support = accounts.some((account) => supportType === getAccountType(account.address));

          if (support) {
            result.push(buyInfo);
          }
        } else {
          if (currentAccount?.address && (supportType === getAccountType(currentAccount?.address))) {
            result.push(buyInfo);
          }
        }
      }
    }

    return result;
  }, [accounts, currentAccount?.address, locationPathname, tokenGroupMap, tokenGroupSlug, tokens]);

  const onOpenBuyTokens = useCallback(() => {
    let symbol = '';

    if (buyInfos.length) {
      if (buyInfos.length === 1) {
        symbol = buyInfos[0].slug;
      } else {
        symbol = buyInfos[0].symbol;
      }
    }

    setBuyTokenSymbol(symbol);

    activeModal(BUY_TOKEN_MODAL);
  }, [activeModal, buyInfos]);

  useEffect(() => {
    dataContext.awaitStores(['price', 'chainStore', 'assetRegistry', 'balance']).catch(console.error);
  }, [dataContext]);

  const onOpenSendFund = useCallback(() => {
    if (currentAccount && currentAccount.isReadOnly) {
      notify({
        message: t('The account you are using is read-only, you cannot send assets with it'),
        type: 'info',
        duration: 3
      });

      return;
    }

    const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

    setStorage({
      ...DEFAULT_TRANSFER_PARAMS,
      from: address,
      defaultSlug: tokenGroupSlug || ''
    });
    activeModal(TRANSACTION_TRANSFER_MODAL);
  },
  [currentAccount, setStorage, tokenGroupSlug, activeModal, notify, t]
  );

  useEffect(() => {
    setSendFundKey(`sendFundKey-${Date.now()}`);
    setBuyTokensKey(`buyTokensKey-${Date.now()}`);
  }, [locationPathname]);

  useEffect(() => {
    const backgroundColor = isTotalBalanceDecrease ? BackgroundColorMap.DECREASE : BackgroundColorMap.INCREASE;

    setBackground(backgroundColor);
  }, [isTotalBalanceDecrease, setBackground]);

  const handleCancelTransfer = useCallback(() => {
    inactiveModal(TRANSACTION_TRANSFER_MODAL);
    setSendFundKey(`sendFundKey-${Date.now()}`);
  }, [inactiveModal]);

  const handleCancelBuy = useCallback(() => {
    inactiveModal(BUY_TOKEN_MODAL);
    setBuyTokensKey(`buyTokensKey-${Date.now()}`);
  }, [inactiveModal]);

  const isSupportBuyTokens = useMemo(() => {
    if (!locationPathname.includes('/home/tokens/detail/')) {
      return true;
    }

    return !!buyInfos.length;
  }, [buyInfos.length, locationPathname]);

  const reloadBalance = useCallback(() => {
    setReloading(true);
    reloadCron({ data: 'balance' })
      .catch(console.error)
      .finally(() => {
        setReloading(false);
      });
  }, []);

  const actions: Action[] = [
    {
      label: 'Receive',
      type: 'receive',
      icon: ArrowFatLinesDown,
      onClick: onOpenReceive
    },
    {
      label: 'Send',
      type: 'send',
      icon: PaperPlaneTilt,
      onClick: onOpenSendFund
    },
    {
      label: 'Buy',
      type: 'buys',
      icon: ShoppingCartSimple,
      onClick: onOpenBuyTokens,
      disabled: !isSupportBuyTokens
    }
  ];

  return (
    <div className={CN(className, 'flex-row')}>
      <div className={CN('__block-item', '__total-balance-block')}>
        <div className={'__block-title-wrapper'}>
          <div className={'__block-title'}>{t('Total balance')}</div>
          <Button
            className='__balance-visibility-toggle'
            icon={
              <Icon
                phosphorIcon={!isShowBalance ? Eye : EyeSlash}
              />
            }
            onClick={onChangeShowBalance}
            size={'xs'}
            tooltip={isShowBalance ? t('Hide balance') : t('Show balance')}
            type='ghost'
          />
          <Button
            className='__balance-reload-toggle'
            icon={
              <Icon
                phosphorIcon={ArrowsClockwise}
              />
            }
            loading={reloading}
            onClick={reloadBalance}
            size={'xs'}
            tooltip={t('Refresh Balance')}
            type='ghost'
          />
        </div>

        <div className={'__block-content'}>
          <div className={'__balance-value-wrapper'}>
            <Tooltip
              overlayClassName={CN({
                'ant-tooltip-hidden': !isShowBalance
              })}
              placement={'top'}
              title={currencyData.symbol + ' ' + formatNumber(totalValue, 0, balanceNoPrefixFormater)}
            >
              <div>
                <Number
                  className={'__balance-value'}
                  decimal={0}
                  decimalOpacity={0.45}
                  hide={!isShowBalance}
                  prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
                  subFloatNumber
                  value={totalValue}
                />
              </div>
            </Tooltip>
          </div>

          <div className={'__balance-change-container'}>
            <Number
              className={'__balance-change-value'}
              decimal={0}
              decimalOpacity={1}
              hide={!isShowBalance}
              prefix={isTotalBalanceDecrease ? `- ${currencyData?.symbol}` : `+ ${currencyData?.symbol}`}
              value={totalChangeValue}
            />
            <Tag
              className={`__balance-change-percent ${isTotalBalanceDecrease ? '-decrease' : ''}`}
              shape={'round'}
            >
              <Number
                decimal={0}
                decimalOpacity={1}
                hide={!isShowBalance}
                prefix={isTotalBalanceDecrease ? '-' : '+'}
                suffix={'%'}
                value={totalChangePercent}
                weight={700}
              />
            </Tag>
          </div>
        </div>
      </div>

      <div
        className='__block-divider'
      />

      <div className={CN('__block-item', '__balance-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Transferable balance')}</div>
        </div>
        <Tooltip
          overlayClassName={CN({
            'ant-tooltip-hidden': !isShowBalance
          })}
          placement={'top'}
          title={currencyData.symbol + ' ' + formatNumber(totalBalanceInfo.freeValue, 0, balanceNoPrefixFormater)}
        >
          <div className={'__block-content'}>
            <Number
              className='__balance-value'
              decimal={0}
              decimalOpacity={0.45}
              hide={!isShowBalance}
              prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
              subFloatNumber
              value={totalBalanceInfo.freeValue}
            />
          </div>
        </Tooltip>

      </div>

      <div
        className='__block-divider'
      />

      <div className={CN('__block-item', '__balance-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Locked balance')}</div>
        </div>
        <Tooltip
          overlayClassName={CN({
            'ant-tooltip-hidden': !isShowBalance
          })}
          placement={'top'}
          title={currencyData.symbol + ' ' + formatNumber(totalBalanceInfo.lockedValue, 0, balanceNoPrefixFormater)}
        >
          <div className={'__block-content'}>
            <Number
              className='__balance-value'
              decimal={0}
              decimalOpacity={0.45}
              hide={!isShowBalance}
              prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
              subFloatNumber
              value={totalBalanceInfo.lockedValue}
            />
          </div>
        </Tooltip>
      </div>

      <div
        className='__block-divider __divider-special'
      />

      <div className={CN('__block-item', '__action-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Actions')}</div>
        </div>

        <div className={'__block-content'}>
          {actions.map((item) => (
            <div
              className='__action-button'
              key={item.type}
            >
              <Button
                className={CN(`type-${item.type}`)}
                disabled={item.disabled}
                icon={(
                  <Icon
                    phosphorIcon={item.icon}
                    size='md'
                    weight='duotone'
                  />
                )}
                onClick={item.onClick}
                shape='squircle'
                size='sm'
              />
              <Typography.Text>{item.label}</Typography.Text>
            </div>
          ))}
        </div>
      </div>

      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={TRANSACTION_TRANSFER_MODAL}
        onCancel={handleCancelTransfer}
        title={t('Transfer')}
      >
        <Transaction
          key={sendFundKey}
          modalContent={isWebUI}
        >
          <SendFund
            modalContent={isWebUI}
            tokenGroupSlug={_tokenGroupSlug}
          />
        </Transaction>
      </BaseModal>

      <BaseModal
        className={'right-side-modal'}
        destroyOnClose={true}
        id={BUY_TOKEN_MODAL}
        onCancel={handleCancelBuy}
        title={t('Buy token')}
      >
        <BuyTokens
          key={buyTokensKey}
          modalContent={isWebUI}
          slug={buyTokenSymbol}
        />
      </BaseModal>

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
  marginBottom: 56,
  flexWrap: 'wrap',

  '.ant-number .ant-typography': {
    fontSize: 'inherit !important',
    fontWeight: 'inherit !important',
    lineHeight: 'inherit'
  },

  '.__block-title': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight
  },

  '.__balance-value': {
    fontWeight: token.headingFontWeight,
    '.ant-number-decimal': {
      fontSize: '24px !important',
      lineHeight: '32px !important'
    }
  },

  '.__balance-value-wrapper': {
    display: 'flex'
  },

  '.__block-divider': {
    height: 116,
    width: 1,
    backgroundColor: token.colorBgDivider,
    marginTop: token.marginSM
  },

  '.__divider-special': {
    display: 'block'
  },

  '.__balance-change-container': {
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'center',
    marginTop: token.marginSM
  },

  '.__balance-change-value': {
    marginRight: token.sizeXS,
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

  '.__block-item': {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 200px'
  },

  '.__block-title-wrapper': {
    display: 'flex',
    gap: token.sizeXS,
    minHeight: 40,
    marginBottom: token.marginXS,
    alignItems: 'center'
  },

  '.__total-balance-block': {
    '.__balance-value': {
      fontSize: 38,
      lineHeight: '46px'
    }
  },

  '.__balance-block': {
    alignItems: 'center',

    '.__balance-value': {
      fontSize: 30,
      lineHeight: '38px'
    }
  },

  '.__balance-reload-toggle': {
    marginLeft: -token.sizeXS / 2
  },

  '.__action-block': {
    alignItems: 'center',

    '.__block-content': {
      display: 'flex',
      gap: token.sizeSM
    }
  },

  '.__action-button': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: token.sizeSM,

    '.ant-squircle': {
      marginLeft: 6,
      marginRight: 6
    }
  },

  '@media screen and (min-width: 990px) and (max-width: 1200px)': {
    '.__divider-special': {
      display: 'none'
    }
  },

  '@media screen and (min-width: 1480px) and (max-width: 1600px)': {
    '.__balance-value': {
      fontSize: '28px !important',
      '.ant-number-decimal': {
        fontSize: '22px !important'
      }
    },
    '.__total-balance-block': {
      '.__balance-value': {
        fontSize: '35px !important'
      }
    }
  },

  '@media screen and (max-width: 1480px)': {
    '.__balance-value': {
      fontSize: '25px !important',
      '.ant-number-decimal': {
        fontSize: '20px !important'
      }
    }
  },

  '@media screen and (max-width: 1200px)': {
    '.__action-block': {
      flexBasis: '100% !important'
    }
  }

}));

export default Balance;
