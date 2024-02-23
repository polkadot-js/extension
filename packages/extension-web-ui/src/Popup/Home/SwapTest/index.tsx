// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _isAssetFungibleToken, _isChainEvmCompatible, _isMantaZkAsset } from '@subwallet/extension-base/services/chain-service/utils';
import { AccountSelector, TokenItemType, TokenSelector } from '@subwallet/extension-web-ui/components';
import { AllSwapQuotes } from '@subwallet/extension-web-ui/components/Modal/Swap';
import { TransactionFeeQuotes } from '@subwallet/extension-web-ui/components/Swap/TransactionFeeQuote';
import { SWAP_ALL_QUOTES_MODAL, SWAP_MORE_BALANCE_MODAL, SWAP_SLIPPAGE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import { useIsMantaPayEnabled, useSelector, useTransactionContext, useWatchTransaction } from '@subwallet/extension-web-ui/hooks';
import { FreeBalance, TransactionContent } from '@subwallet/extension-web-ui/Popup/Transaction/parts';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps, TransferParams } from '@subwallet/extension-web-ui/types';
import { findAccountByAddress, findNetworkJsonByGenesisHash } from '@subwallet/extension-web-ui/utils';
import { Button, Form, Icon, ModalContext, Number, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { Book, CaretRight, Info, PencilSimpleLine } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import MetaInfo from '../../../components/MetaInfo/MetaInfo';
import AddMoreBalance from '../../../components/Modal/Swap/AddMoreBalance';
import SlippageModal from '../../../components/Modal/Swap/SlippageModal';

type Props = ThemeProps;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { setTitle } = useContext(WebUIContext);
  const location = useLocation();
  const { isWebUI } = useContext(ScreenContext);
  const { activeModal } = useContext(ModalContext);
  const { accounts, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const { defaultData, persistData } = useTransactionContext<TransferParams>();
  const [form] = Form.useForm<TransferParams>();

  const formDefault = useMemo((): TransferParams => {
    return {
      ...defaultData
    };
  }, [defaultData]);

  const { defaultSlug: sendFundSlug } = defaultData;

  const { chainInfoMap, chainStateMap } = useSelector((root) => root.chainStore);
  const { assetRegistry, assetSettingMap, multiChainAssetMap, xcmRefMap } = useSelector((root) => root.assetRegistry);
  const chain = useWatchTransaction('chain', form, defaultData);
  const from = useWatchTransaction('from', form, defaultData);
  const asset = useWatchTransaction('asset', form, defaultData);
  const isZKModeEnabled = useIsMantaPayEnabled(from);

  useEffect(() => {
    if (location.pathname === '/home/swap-test') {
      setTitle(t('Swap for Testing Purposes'));
    }
  }, [location.pathname, setTitle, t]);

  function isAssetTypeValid (
    chainAsset: _ChainAsset,
    chainInfoMap: Record<string, _ChainInfo>,
    isAccountEthereum: boolean
  ) {
    return _isChainEvmCompatible(chainInfoMap[chainAsset.originChain]) === isAccountEthereum;
  }

  function getTokenItems (
    address: string,
    accounts: AccountJson[],
    chainInfoMap: Record<string, _ChainInfo>,
    assetRegistry: Record<string, _ChainAsset>,
    assetSettingMap: Record<string, AssetSetting>,
    multiChainAssetMap: Record<string, _MultiChainAsset>,
    tokenGroupSlug?: string, // is ether a token slug or a multiChainAsset slug
    isZkModeEnabled?: boolean
  ): TokenItemType[] {
    const account = findAccountByAddress(accounts, address);

    if (!account) {
      return [];
    }

    const isLedger = !!account.isHardware;
    const validGen: string[] = account.availableGenesisHashes || [];
    const validLedgerNetwork = validGen.map((genesisHash) => findNetworkJsonByGenesisHash(chainInfoMap, genesisHash)?.slug);
    const isAccountEthereum = isEthereumAddress(address);
    const isSetTokenSlug = !!tokenGroupSlug && !!assetRegistry[tokenGroupSlug];
    const isSetMultiChainAssetSlug = !!tokenGroupSlug && !!multiChainAssetMap[tokenGroupSlug];

    if (tokenGroupSlug) {
      if (!(isSetTokenSlug || isSetMultiChainAssetSlug)) {
        return [];
      }

      const chainAsset = assetRegistry[tokenGroupSlug];
      const isValidLedger = isLedger ? (isAccountEthereum || validLedgerNetwork.includes(chainAsset?.originChain)) : true;

      if (isSetTokenSlug) {
        if (isAssetTypeValid(chainAsset, chainInfoMap, isAccountEthereum) && isValidLedger) {
          const { name, originChain, slug, symbol } = assetRegistry[tokenGroupSlug];

          return [
            {
              name,
              slug,
              symbol,
              originChain
            }
          ];
        } else {
          return [];
        }
      }
    }

    const items: TokenItemType[] = [];

    Object.values(assetRegistry).forEach((chainAsset) => {
      const isValidLedger = isLedger ? (isAccountEthereum || validLedgerNetwork.includes(chainAsset?.originChain)) : true;
      const isTokenFungible = _isAssetFungibleToken(chainAsset);

      if (!(isTokenFungible && isAssetTypeValid(chainAsset, chainInfoMap, isAccountEthereum) && isValidLedger)) {
        return;
      }

      if (!isZkModeEnabled && _isMantaZkAsset(chainAsset)) {
        return;
      }

      if (isSetMultiChainAssetSlug) {
        if (chainAsset.multiChainAsset === tokenGroupSlug) {
          items.push({
            name: chainAsset.name,
            slug: chainAsset.slug,
            symbol: chainAsset.symbol,
            originChain: chainAsset.originChain
          });
        }
      } else {
        items.push({
          name: chainAsset.name,
          slug: chainAsset.slug,
          symbol: chainAsset.symbol,
          originChain: chainAsset.originChain
        });
      }
    });

    return items;
  }

  const tokenItems = useMemo<TokenItemType[]>(() => {
    return getTokenItems(
      from,
      accounts,
      chainInfoMap,
      assetRegistry,
      assetSettingMap,
      multiChainAssetMap,
      sendFundSlug,
      isZKModeEnabled
    );
  }, [accounts, assetRegistry, assetSettingMap, chainInfoMap, from, isZKModeEnabled, multiChainAssetMap, sendFundSlug]);

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
                className={'swap-form-container'}
              >
                <AccountSelector
                  disabled={false}
                  label={t('Swap from account')}
                />
              </Form.Item>
              <Form.Item name={'asset'}>
                <TokenSelector
                // disabled={!tokenItems.length}
                  items={tokenItems}
                  placeholder={t('Select token')}
                  showChainInSelected
                  tooltip={isWebUI ? t('Select token') : undefined}
                />
              </Form.Item>
              <FreeBalance
                address={'5CMe6ie6hYEXbL35egagvkdR3Jq9MdSzKeKLhMz5hcByN6do'}
                chain={'polkadot'}
                className={'free-balance'}
                label={t('Available balance:')}
              />
            </Form>
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
                <div className={'__text'}>Swap quote</div>
              </div>
              <div className={'__item-right-part'}>
                <div className={'__item-right-part-text'}>All quote</div>
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
                  label={t('Quote rate')}
                  valueColorSchema={'gray'}
                >
                  <div className={'__estimate-swap-value'}>
                    <Number
                      decimal={0}
                      suffix={'DOT'}
                      value={1}
                    />
                    &nbsp;=&nbsp;
                    <Number
                      decimal={0}
                      suffix={'USDT'}
                      value={6}
                    />
                  </div>
                </MetaInfo.Default>
                <MetaInfo.Number
                  className={'__item-max-slippage'}
                  decimals={0}
                  label={t('Max slippage')}
                  suffix={'%'}
                  suffixNode={
                    <Button
                      icon={(
                        <Icon
                          customSize={'20px'}
                          phosphorIcon={PencilSimpleLine}
                        />
                      )}
                      onClick={onOpenSlippageModal}
                      size='xs'
                      type='ghost'
                    >
                    </Button>}
                  value={2}
                />
                <MetaInfo.Account
                  address={'5GBw5o91TwwLwpj24ucJimWZhpg9bc5W9mBTMERjiaYYsENd'}
                  className={'__item-recipient'}
                  label={t('Recipient')}
                  name={'Dung Nguyen wallet 01'}
                  suffixNode={
                    <Button
                      icon={(
                        <Icon
                          customSize={'20px'}
                          phosphorIcon={Book}
                        />
                      )}
                      onClick={onOpenSlippageModal}
                      size='xs'
                      type='ghost'
                    >
                    </Button>
                  }
                />
                <MetaInfo.Default
                  label={t('Service provider')}
                  valueColorSchema={'gray'}
                >
                ABBC
                </MetaInfo.Default>
              </div>
              <TransactionFeeQuotes />
              <div className={'__separator'}></div>
              <MetaInfo.Number
                className={'__item-min-receivable'}
                decimals={0}
                label={t('Min receivable')}
                suffix={'USDT'}
                value={200}
              />
            </MetaInfo>
            <div className={'__item-footer-time'}>
              Quote reset in: 2s
            </div>
          </div>
        </div>
      </TransactionContent>
      <Button
        onClick={onOpenSlippageModal}
      >
        {'SlippageModal'}
      </Button>
      <Button
        onClick={openAddMoreBalanceModal}
      >
        {'AddMoreBalance'}
      </Button>
      <Button
        onClick={openAllquotesModal}
      >
        {'SlippageModal'}
      </Button>
      <SlippageModal
        modalId={SWAP_SLIPPAGE_MODAL}
      />
      <AddMoreBalance
        modalId={SWAP_MORE_BALANCE_MODAL}
      />
      <AllSwapQuotes
        modalId={SWAP_ALL_QUOTES_MODAL}
      />
    </div>
  );
};

const Swap = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__swap-container': {
      display: 'flex',
      gap: 16,
      justifyContent: 'center'
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
      gap: 12
    },
    '.__estimate-swap-value': {
      display: 'flex'
    },
    '.__swap-quote': {
      backgroundColor: token.colorBgSecondary,
      padding: 12,
      borderRadius: 8
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
      gap: 8,
      alignItems: 'center'
    },
    '.__quote-area-1': {
      paddingLeft: 12,
      paddingRight: 12
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
      justifyContent: 'center'
    },
    '.__item-max-slippage .-to-right': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center'
    },
    '.__item-max-slippage .ant-btn': {
      minWidth: 20,
      maxWidth: 20,
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
      maxWidth: 20,
      paddingLeft: 4
    }
  };
});

export default Swap;
