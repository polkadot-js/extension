// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountSelector, AmountInput, TokenItemType, TokenSelector } from '@subwallet/extension-web-ui/components';
import { AllSwapQuotes } from '@subwallet/extension-web-ui/components/Modal/Swap';
import ChooseFeeTokenModal from '@subwallet/extension-web-ui/components/Modal/Swap/ChooseFeeTokenModal';
import SwapRoute from '@subwallet/extension-web-ui/components/Swap/SwapRoute';
import { TransactionFeeQuotes } from '@subwallet/extension-web-ui/components/Swap/TransactionFeeQuote';
import { SWAP_ALL_QUOTES_MODAL, SWAP_CHOOSE_FEE_TOKEN_MODAL, SWAP_MORE_BALANCE_MODAL, SWAP_SLIPPAGE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import { useTransactionContext } from '@subwallet/extension-web-ui/hooks';
import { FreeBalance, TransactionContent } from '@subwallet/extension-web-ui/Popup/Transaction/parts';
import { ThemeProps, TransferParams } from '@subwallet/extension-web-ui/types';
import { Button, Form, Icon, ModalContext, Number, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowsDownUp, CaretRight, Info, PencilSimpleLine } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import MetaInfo from '../../../components/MetaInfo/MetaInfo';
import AddMoreBalanceModal from '../../../components/Modal/Swap/AddMoreBalanceModal';
import SlippageModal from '../../../components/Modal/Swap/SlippageModal';

type Props = ThemeProps;

const fakeTokenItems: TokenItemType[] = [
  {
    name: 'Polkadot',
    slug: 'polkadot-NATIVE-DOT',
    symbol: 'DOT',
    originChain: 'polkadot'
  },
  {
    name: 'Kusama',
    slug: 'kusama-NATIVE-KSM',
    symbol: 'KSM',
    originChain: 'kusama'
  },
  {
    name: 'Aleph Zero',
    slug: 'aleph-NATIVE-AZERO',
    symbol: 'AZERO',
    originChain: 'aleph'
  }
];
const fakeTokenDest: TokenItemType[] = [
  {
    name: 'Ethereum',
    slug: 'ethereum-NATIVE-ETH',
    symbol: 'ETH',
    originChain: 'ethereum'
  },
  {
    name: 'Moonbeam',
    slug: 'moonbeam-NATIVE-GLMR',
    symbol: 'GLMR',
    originChain: 'moonbeam'
  }
];

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { setTitle } = useContext(WebUIContext);
  const location = useLocation();
  const { isWebUI } = useContext(ScreenContext);
  const { activeModal } = useContext(ModalContext);
  const { defaultData } = useTransactionContext<TransferParams>();
  const [form] = Form.useForm<TransferParams>();

  const formDefault = useMemo((): TransferParams => {
    return {
      ...defaultData
    };
  }, [defaultData]);

  useEffect(() => {
    if (location.pathname === '/home/swap-test') {
      setTitle(t('Swap for Testing Purposes'));
    }
  }, [location.pathname, setTitle, t]);

  const onOpenSlippageModal = useCallback(() => {
    activeModal(SWAP_SLIPPAGE_MODAL);
  }, [activeModal]);

  const openAddMoreBalanceModal = useCallback(() => {
    activeModal(SWAP_MORE_BALANCE_MODAL);
  }, [activeModal]);

  const openAllquotesModal = useCallback(() => {
    activeModal(SWAP_ALL_QUOTES_MODAL);
  }, [activeModal]);

  const onClickSwapButton = useCallback(() => {
    alert('Swap button Clicked!');
  }, []);

  const onClickSwapIcon = useCallback(() => {
    alert('Swap Icon Clicked');
  }, []);

  const openChooFeeToken = useCallback(() => {
    activeModal(SWAP_CHOOSE_FEE_TOKEN_MODAL);
  }, [activeModal]);

  return (
    <div className={className}>
      {
        !isWebUI && (
          <SwSubHeader
            background={'transparent'}
            className={'__header-area'}
            paddingVertical
            showBackButton={false}
            title={t('Swap')}
          />)
      }
      <TransactionContent>
        <div className={'__swap-container'}>
          <div className={'__left-part'}>
            <Form
              form={form}
              initialValues={formDefault}
            >
              <Form.Item
                className={'from'}
              >
                <AccountSelector
                  disabled={false}
                  label={t('Swap from account')}
                />
              </Form.Item>
              <Form.Item name={'asset'}>
                {/* <TokenSelector
                // disabled={!tokenItems.length}
                  items={tokenItems}
                  placeholder={t('Select token')}
                  showChainInSelected
                  tooltip={isWebUI ? t('Select token') : undefined}
                /> */}
              </Form.Item>
              <FreeBalance
                address={'5CMe6ie6hYEXbL35egagvkdR3Jq9MdSzKeKLhMz5hcByN6do'}
                chain={'polkadot'}
                className={'free-balance'}
                label={t('Available balance:')}
              />
              <div className='__token-from'>
                <Form.Item
                  className='__form-item-token-from'
                  key={'token-from'}
                  name={'token-from'}
                >
                  <TokenSelector
                    // disabled={!tokenItems.length}
                    className='__token-from'
                    items={fakeTokenItems}
                    key={'token-from'}
                    label='From'
                    placeholder={t('Select token')}
                    showChainInSelected
                    tooltip={isWebUI ? t('Select token') : undefined}
                  />
                </Form.Item>
                <Form.Item
                  name={'__amount-input-fro'}
                >
                  <AmountInput
                    decimals={1}
                    key={'__amount-input-from'}
                    maxValue={'1234'}
                    placeholder='0'
                    showMaxButton={true}
                  />
                </Form.Item>
                <div className='__arrow-down-up-button'>
                  <Button
                    color=''
                    icon={(
                      <Icon
                        customSize={'20px'}
                        phosphorIcon={ArrowsDownUp}
                        weight='fill'
                      />
                    )}
                    onClick={onClickSwapIcon}
                    shape='circle'
                    size='xs'
                  >
                  </Button>
                </div>
              </div>
              <div className='__form-to'>
                <Form.Item
                  className='__form-item-token-to'
                  key={'token-to'}
                  name={'token-to'}
                >
                  <TokenSelector
                    // disabled={!tokenItems.length}
                    className='__token-to'
                    items={fakeTokenDest}
                    key={'token-to'}
                    label='To'
                    placeholder={t('Select token')}
                    showChainInSelected
                    tooltip={isWebUI ? t('Select token') : undefined}
                  />
                </Form.Item>
                <Form.Item name={'__amount-input-too'}>
                  <AmountInput
                    decimals={1}
                    key={'__amount-input-to'}
                    maxValue={'1234'}
                    placeholder='0'
                    showMaxButton={false}
                  />
                </Form.Item>
              </div>
            </Form>
            <div className={'__item-slippage'}>
              <span>Slippage:</span>
                &nbsp;<span>2%</span>
              <div onClick={onOpenSlippageModal}>
                <Icon
                  className={'__item-slippage-icon'}
                  phosphorIcon={PencilSimpleLine}
                  size='sm'
                />
              </div>

            </div>
            <Button
              block={true}
              className={'__footer-left-button'}
              onClick={onClickSwapButton}
            >
              {'Swap'}
            </Button>
          </div>
          <div className={'__right-part'}>
            <div className={'__item-quote-header'}>
              <div className={'__item-left-part'}>
                <div className={'__info'}>
                  <Button
                    icon={(
                      <Icon
                        customSize={'24px'}
                        phosphorIcon={Info}
                        weight='fill'
                      />
                    )}
                    onClick={openAllquotesModal}
                    shape={'circle'}
                    size='xs'
                  ></Button>
                </div>
                <div className={'__text'}> Swap quote</div>
              </div>
              <div className={'__item-right-part'}>
                <div className={'__item-right-part-text'}>View quote</div>
                <div className={'__item-right-part-button'}>
                  <Button
                    icon={(
                      <Icon
                        customSize={'28px'}
                        phosphorIcon={CaretRight}
                      />
                    )}
                    onClick={openAllquotesModal}
                    size='xs'
                    type='ghost'
                  >
                  </Button>
                </div>
              </div>
            </div>
            <MetaInfo
              className={CN('__swap-quote')}
              labelColorScheme={'gray'}
              spaceSize={'sm'}
              valueColorScheme={'gray'}
            >
              <div className={'__quote-area-1'}>
                <MetaInfo.Default
                  className={'__quote-rate'}
                  label={t('Quote rate')}
                  valueColorSchema={'gray'}
                >
                  <div className={'__estimate-swap-value'}>
                    <Number
                      decimal={0}
                      suffix={'DOT'}
                      value={1}
                    />
                    &nbsp;~&nbsp;
                    <Number
                      decimal={0}
                      suffix={'USDT'}
                      value={6}
                    />
                  </div>
                </MetaInfo.Default>
                <MetaInfo.Chain
                  chain={'polkadot'}
                  label={t('Swap provider')}
                />
                <SwapRoute />
              </div>
            </MetaInfo>
            <div className={'__item-footer-time'}>
              Quote reset in: 2s
            </div>
            <MetaInfo
              className={CN('__swap-quote')}
              labelColorScheme={'gray'}
              spaceSize={'sm'}
              valueColorScheme={'gray'}
            >
              <TransactionFeeQuotes />
              <div className={'__separator'}></div>
              <MetaInfo.Chain
                chain={'kusama'}
                className='__item-fee-paid'
                label={t('Fee paid in')}
                suffixNode={
                  <Button
                    icon={(
                      <Icon
                        customSize={'20px'}
                        phosphorIcon={PencilSimpleLine}
                      />
                    )}
                    onClick={openChooFeeToken}
                    size='xs'
                    type='ghost'
                  >
                  </Button>
                }
              />
            </MetaInfo>
          </div>
        </div>
      </TransactionContent>
      <ChooseFeeTokenModal
        modalId={SWAP_CHOOSE_FEE_TOKEN_MODAL}
      />
      <SlippageModal
        modalId={SWAP_SLIPPAGE_MODAL}
      />
      <AddMoreBalanceModal
        modalId={SWAP_MORE_BALANCE_MODAL}
      />
      <AllSwapQuotes
        modalId={SWAP_ALL_QUOTES_MODAL}
      />
    </div>
  );
};

const Swap = styled(Component)<Props>(({ theme: { token } }: Props) => {
  console.log(token);

  return {
    '.__swap-container': {
      display: 'flex',
      gap: 16,
      justifyContent: 'center'
    },
    '.__item-slippage': {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      color: token.colorSuccess,
      cursor: 'pointer',
      marginBottom: 24
    },
    '.__left-part': {
      flex: 1,
      maxWidth: 384
    },
    '.__right-part': {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      maxWidth: 384,
      gap: 4
    },
    '.__estimate-swap-value': {
      display: 'flex'
    },
    '.__swap-quote': {
      backgroundColor: token.colorBgSecondary,
      padding: 12,
      borderRadius: 8
    },
    '.__quote-rate .__label': {
      fontWeight: token.bodyFontWeight
    },
    '.__item-quote-header': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    '.__item-left-part': {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    },
    '.__item-right-part': {
      display: 'flex',
      alignItems: 'center'
    },
    '.__quote-area-1': {
      paddingLeft: 12,
      paddingRight: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    },
    '.__item-right-part-text': {
      fontSize: 14,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeight
    },
    '.__separator': {
      height: 2,
      backgroundColor: 'rgba(33, 33, 33, 0.80)',
      marginTop: 12,
      marginBottom: 16
    },
    '.__item-footer-time': {
      color: token.colorWarningText,
      display: 'flex',
      justifyContent: 'flex-end',
      paddingLeft: 8,
      paddingRight: 8,
      marginBottom: 12
    },
    '.__item-fee-paid .__chain-name': {
      color: token.colorWhite
    },
    '.__item-max-slippage .-to-right': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center'
    },
    '.__item-max-slippage .ant-btn': {
      minWidth: 20,
      maxHeight: 20,
      paddingLeft: 4
    },
    '.__item-recipient .-to-right': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center'
    },
    '.__item-recipient .ant-btn': {
      minWidth: 20,
      maxHeight: 20,
      paddingLeft: 4
    },
    '.__token-from': {
      display: 'flex',
      marginBottom: 4,
      position: 'relative'
    },
    '.__form-to': {
      display: 'flex'
    },
    '.__token-from .ant-input-container': {
      minHeight: 72,
      display: 'flex',
      alignItems: 'end',
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0
    },
    '.__token-from .ant-input-wrapper': {
      flex: 1
    },
    '.__form-to .ant-input-container': {
      minHeight: 72,
      display: 'flex',
      alignItems: 'end',
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0
    },
    '.__form-to .ant-form-item-row': {
      display: 'flex',
      flex: 1
    },
    '.__form-to .ant-form-item': {
      flex: 1
    },
    '.__form-to .ant-input-wrapper': {
      flex: 1
    },
    '.__form-to .__form-item-token-to': {
      flex: '0 1 auto'
    },
    '.__token-from .ant-form-item': {
      marginBottom: 0,
      flex: 1
    },
    '.__token-from .ant-form-item-row': {
      flex: 1
    },
    '.__token-from .__form-item-token-from': {
      flex: '0 1 auto'
    },
    '.__form-item-token-from .ant-form-item-control-input-content': {
      display: 'flex'
    },
    '.__form-item-token-to .ant-form-item-control-input-content': {
      display: 'flex'
    },
    '.__form-item-token-from .ant-select-modal-input-border-default': {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    },
    '.__form-item-token-from .ant-input-container': {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      display: 'flex',
      alignItems: 'end'
    },
    '.__form-item-token-to .ant-select-modal-input-border-default': {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    },
    '.__form-item-token-to .ant-input-container': {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      display: 'flex',
      alignItems: 'end'
    },
    '.__arrow-down-up-button': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 0,
      bottom: -72,
      opacity: 1,
      zIndex: 2,
      left: 173
    }
  };
});

export default Swap;
