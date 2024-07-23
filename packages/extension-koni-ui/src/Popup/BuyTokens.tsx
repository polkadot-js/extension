// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, Resolver } from '@subwallet/extension-base/background/types';
import { detectTranslate, isAccountAll } from '@subwallet/extension-base/utils';
import { baseServiceItems, Layout, PageWrapper, ServiceItem } from '@subwallet/extension-koni-ui/components';
import { AccountSelector } from '@subwallet/extension-koni-ui/components/Field/AccountSelector';
import { ServiceSelector } from '@subwallet/extension-koni-ui/components/Field/BuyTokens/ServiceSelector';
import { TokenItemType, TokenSelector } from '@subwallet/extension-koni-ui/components/Field/TokenSelector';
import { useAssetChecker, useDefaultNavigate, useNotification, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountType, BuyServiceInfo, BuyTokenInfo, CreateBuyOrderFunction, SupportService, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BuyTokensParam } from '@subwallet/extension-koni-ui/types/navigation';
import { createBanxaOrder, createCoinbaseOrder, createTransakOrder, findAccountByAddress, noop, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { getAccountType } from '@subwallet/extension-koni-ui/utils/account/account';
import reformatAddress from '@subwallet/extension-koni-ui/utils/account/reformatAddress';
import { findNetworkJsonByGenesisHash } from '@subwallet/extension-koni-ui/utils/chain/getNetworkJsonByGenesisHash';
import { Button, Form, Icon, ModalContext, SwModal, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, ShoppingCartSimple, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

type BuyTokensFormProps = {
  address: string;
  tokenKey: string;
  service: SupportService;
}

interface LinkUrlProps {
  url: string;
  content: string;
}

const LinkUrl: React.FC<LinkUrlProps> = (props: LinkUrlProps) => {
  if (props.url) {
    return (
      <a
        href={props.url}
        target='__blank'
      >
        {props.content}
      </a>
    );
  } else {
    return <span>{props.content}</span>;
  }
};

const modalId = 'disclaimer-modal';

function Component ({ className }: Props) {
  const locationState = useLocation().state as BuyTokensParam;
  const [currentSymbol] = useState<string | undefined>(locationState?.symbol);

  const notify = useNotification();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { accounts, currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const { assetRegistry } = useSelector((state: RootState) => state.assetRegistry);
  const { walletReference } = useSelector((state: RootState) => state.settings);
  const { services, tokens } = useSelector((state: RootState) => state.buyService);
  const checkAsset = useAssetChecker();

  const fixedTokenKey = useMemo((): string | undefined => {
    if (currentSymbol) {
      return Object.values(tokens).filter((value) => value.slug === currentSymbol || value.symbol === currentSymbol)[0]?.slug;
    } else {
      return undefined;
    }
  }, [currentSymbol, tokens]);

  const [currentAddress] = useState<string | undefined>(currentAccount?.address);
  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const [form] = Form.useForm<BuyTokensFormProps>();
  const formDefault = useMemo((): BuyTokensFormProps => ({
    address: isAllAccount ? '' : (currentAccount?.address || ''),
    tokenKey: fixedTokenKey || '',
    service: '' as SupportService
  }), [currentAccount?.address, fixedTokenKey, isAllAccount]);

  const promiseRef = useRef<Resolver<void>>({ resolve: noop, reject: noop });

  const [loading, setLoading] = useState(false);
  const [disclaimerAgree, setDisclaimerAgree] = useState<Record<SupportService, boolean>>({
    transak: false,
    banxa: false,
    onramper: false,
    moonpay: false,
    coinbase: false
  });

  const selectedAddress = Form.useWatch('address', form);
  const selectedTokenKey = Form.useWatch('tokenKey', form);
  const selectedService = Form.useWatch('service', form);

  const { contactUrl, name: serviceName, policyUrl, termUrl, url } = useMemo((): BuyServiceInfo => {
    return services[selectedService] || { name: '', url: '', contactUrl: '', policyUrl: '', termUrl: '' };
  }, [selectedService, services]);

  const getServiceItems = useCallback((tokenSlug: string): ServiceItem[] => {
    const buyInfo = tokens[tokenSlug];
    const result: ServiceItem[] = [];

    for (const serviceItem of baseServiceItems) {
      const temp: ServiceItem = {
        ...serviceItem,
        disabled: buyInfo ? !buyInfo.services.includes(serviceItem.key) : true
      };

      result.push(temp);
    }

    return result;
  }, [tokens]);

  const onConfirm = useCallback((): Promise<void> => {
    activeModal(modalId);

    return new Promise((resolve, reject) => {
      promiseRef.current = {
        resolve: () => {
          inactiveModal(modalId);
          resolve();
        },
        reject: (e) => {
          inactiveModal(modalId);
          reject(e);
        }
      };
    });
  }, [activeModal, inactiveModal]);

  const onApprove = useCallback(() => {
    promiseRef.current.resolve();
  }, []);

  const onReject = useCallback(() => {
    promiseRef.current.reject(new Error('User reject'));
  }, []);

  const accountType = selectedAddress ? getAccountType(selectedAddress) : '';
  const ledgerNetwork = useMemo((): string | undefined => {
    const account = findAccountByAddress(accounts, selectedAddress);

    if (account?.genesisHash) {
      return findNetworkJsonByGenesisHash(chainInfoMap, account.genesisHash)?.slug;
    }

    return undefined;
  }, [accounts, chainInfoMap, selectedAddress]);

  const tokenItems = useMemo<TokenItemType[]>(() => {
    const result: TokenItemType[] = [];

    const list = [...Object.values(tokens)];

    const filtered = currentSymbol ? list.filter((value) => value.slug === currentSymbol || value.symbol === currentSymbol) : list;

    const convertToItem = (info: BuyTokenInfo): TokenItemType => {
      return {
        name: assetRegistry[info.slug]?.name || info.symbol,
        slug: info.slug,
        symbol: info.symbol,
        originChain: info.network
      };
    };

    filtered.forEach((info) => {
      const item = convertToItem(info);

      if (ledgerNetwork) {
        if (info.network === ledgerNetwork) {
          result.push(item);
        }
      } else {
        if (accountType === 'ALL' || accountType === info.support) {
          result.push(item);
        }
      }
    });

    return result;
  }, [accountType, assetRegistry, currentSymbol, ledgerNetwork, tokens]);

  const serviceItems = useMemo(() => getServiceItems(selectedTokenKey), [getServiceItems, selectedTokenKey]);

  const isSupportBuyTokens = useMemo(() => {
    if (selectedService && selectedAddress && selectedTokenKey) {
      const buyInfo = tokens[selectedTokenKey];
      const accountType = getAccountType(selectedAddress);

      return buyInfo && buyInfo.support === accountType && buyInfo.services.includes(selectedService) && tokenItems.find((item) => item.slug === selectedTokenKey);
    }

    return false;
  }, [selectedService, selectedAddress, selectedTokenKey, tokens, tokenItems]);

  const onClickNext = useCallback(() => {
    setLoading(true);

    const { address, service, tokenKey } = form.getFieldsValue();

    let urlPromise: CreateBuyOrderFunction | undefined;

    const buyInfo = tokens[tokenKey];
    const { network } = buyInfo;

    const serviceInfo = buyInfo.serviceInfo[service];
    const networkPrefix = chainInfoMap[network].substrateInfo?.addressPrefix;

    const walletAddress = reformatAddress(address, networkPrefix === undefined ? -1 : networkPrefix);

    switch (service) {
      case 'transak':
        urlPromise = createTransakOrder;
        break;
      case 'banxa':
        urlPromise = createBanxaOrder;
        break;
      case 'coinbase':
        urlPromise = createCoinbaseOrder;
        break;
    }

    if (urlPromise && serviceInfo && buyInfo.services.includes(service)) {
      const { network: serviceNetwork, symbol } = serviceInfo;

      const disclaimerPromise = new Promise<void>((resolve, reject) => {
        if (!disclaimerAgree[service]) {
          onConfirm().then(() => {
            setDisclaimerAgree((oldState) => ({ ...oldState, [service]: true }));
            resolve();
          }).catch((e) => {
            reject(e);
          });
        } else {
          resolve();
        }
      });

      disclaimerPromise.then(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return urlPromise!(symbol, walletAddress, serviceNetwork, walletReference);
      })
        .then((url) => {
          openInNewTab(url)();
        })
        .catch((e: Error) => {
          if (e.message !== 'User reject') {
            console.error(e);

            notify({
              message: t('Create buy order fail')
            });
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [form, tokens, chainInfoMap, disclaimerAgree, onConfirm, walletReference, notify, t]);

  const filterAccountType = useMemo((): AccountType => {
    if (currentSymbol) {
      let result: AccountType = '' as AccountType;

      const list = Object.values(tokens).filter((value) => value.slug === currentSymbol || value.symbol === currentSymbol);

      list.forEach((info) => {
        if (result) {
          if (result !== info.support) {
            if (result === 'SUBSTRATE' || result === 'ETHEREUM') {
              result = 'ALL';
            }
          }
        } else {
          result = info.support;
        }
      });

      return result;
    } else {
      return 'ALL';
    }
  }, [currentSymbol, tokens]);

  const accountsFilter = useCallback((account: AccountJson) => {
    if (isAccountAll(account.address)) {
      return false;
    }

    if (filterAccountType !== 'ALL') {
      if (filterAccountType === 'ETHEREUM') {
        return isEthereumAddress(account.address);
      } else {
        return !isEthereumAddress(account.address);
      }
    }

    return true;
  }, [filterAccountType]);

  useEffect(() => {
    if (currentAddress !== currentAccount?.address) {
      goBack();
    }
  }, [currentAccount?.address, currentAddress, goBack]);

  useEffect(() => {
    if (!fixedTokenKey && tokenItems.length) {
      const { tokenKey } = form.getFieldsValue();

      if (!tokenKey) {
        form.setFieldsValue({ tokenKey: tokenItems[0].slug });
      } else {
        const isSelectedTokenInList = tokenItems.some((i) => i.slug === tokenKey);

        if (!isSelectedTokenInList) {
          form.setFieldsValue({ tokenKey: tokenItems[0].slug });
        }
      }
    } else if (fixedTokenKey) {
      setTimeout(() => {
        form.setFieldsValue({ tokenKey: fixedTokenKey });
      }, 100);
    }
  }, [tokenItems, fixedTokenKey, form]);

  useEffect(() => {
    selectedTokenKey && checkAsset(selectedTokenKey);
  }, [checkAsset, selectedTokenKey]);

  useEffect(() => {
    if (selectedTokenKey) {
      const services = getServiceItems(selectedTokenKey);
      const filtered = services.filter((service) => !service.disabled);

      if (filtered.length > 1) {
        form.setFieldValue('service', '');
      } else {
        form.setFieldValue('service', filtered[0]?.key || '');
      }
    }
  }, [selectedTokenKey, form, getServiceItems]);

  return (
    <Layout.Home
      showFilterIcon
      showTabBar={false}
    >
      <PageWrapper className={CN(className, 'transaction-wrapper')}>
        <SwSubHeader
          background={'transparent'}
          center
          className={'transaction-header'}
          onBack={goBack}
          paddingVertical
          showBackButton
          title={t('Buy token')}
        />
        <div className={'__scroll-container'}>
          <div className='__buy-icon-wrapper'>
            <Icon
              className={'__buy-icon'}
              phosphorIcon={ShoppingCartSimple}
              weight={'fill'}
            />
          </div>

          <Form
            className='__form-container form-space-sm'
            form={form}
            initialValues={formDefault}
          >
            <Form.Item
              className={CN({
                hidden: !isAllAccount
              })}
              name={'address'}
            >
              <AccountSelector
                disabled={!isAllAccount}
                filter={accountsFilter}
                label={t('Select account')}
              />
            </Form.Item>

            <div className='form-row'>
              <Form.Item name={'tokenKey'}>
                <TokenSelector
                  disabled={tokenItems.length < 2}
                  items={tokenItems}
                  showChainInSelected={false}
                />
              </Form.Item>

              <Form.Item name={'service'}>
                <ServiceSelector
                  disabled={!selectedTokenKey}
                  items={serviceItems}
                  placeholder={t('Select supplier')}
                  title={t('Select supplier')}
                />
              </Form.Item>
            </div>
          </Form>

          <div className={'common-text __note'}>
            {t('You will be directed to the chosen supplier to complete this transaction')}
          </div>
        </div>

        <div className={'__layout-footer'}>
          <Button
            disabled={!isSupportBuyTokens}
            icon={ (
              <Icon
                phosphorIcon={ShoppingCartSimple}
                weight={'fill'}
              />
            )}
            loading={loading}
            onClick={onClickNext}
          >
            {t('Buy now')}
          </Button>
        </div>
        <SwModal
          className={CN(className)}
          footer={(
            <>
              <Button
                block={true}
                icon={(
                  <Icon
                    phosphorIcon={XCircle}
                    weight='fill'
                  />
                )}
                onClick={onReject}
                schema={'secondary'}
              >
                {t('Cancel')}
              </Button>
              <Button
                block={true}
                icon={(
                  <Icon
                    phosphorIcon={CheckCircle}
                    weight='fill'
                  />
                )}
                onClick={onApprove}
              >
                {t('Agree')}
              </Button>
            </>
          )}
          id={modalId}
          onCancel={onReject}
          title={t('Disclaimer')}
        >
          <Trans
            components={{
              mainUrl: (
                <LinkUrl
                  content={serviceName}
                  url={url}
                />
              ),
              termUrl: (
                <LinkUrl
                  content={t('Terms of Service')}
                  url={termUrl}
                />
              ),
              policyUrl: (
                <LinkUrl
                  content={t('Privacy Policy')}
                  url={policyUrl}
                />
              ),
              contactUrl: (
                <LinkUrl
                  content={t('support site')}
                  url={contactUrl}
                />
              )
            }}
            i18nKey={detectTranslate('You are now leaving SubWallet for <mainUrl/>. Services related to card payments are provided by {{service}}, a separate third-party platform. By proceeding and procuring services from {{service}}, you acknowledge that you have read and agreed to {{service}}\'s <termUrl/> and <policyUrl/>. For any question related to {{service}}\'s services, please visit {{service}}\'s <contactUrl/>.')}
            values={{
              service: serviceName
            }}
          />
        </SwModal>
      </PageWrapper>
    </Layout.Home>
  );
}

const BuyTokens = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    flexDirection: 'column',

    '.ant-sw-modal-footer': {
      display: 'flex'
    },

    '.ant-sw-modal-body': {
      color: token.colorTextSecondary
    },

    '.__scroll-container': {
      flex: 1,
      overflow: 'auto',
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.__buy-icon-wrapper': {
      position: 'relative',
      width: 112,
      height: 112,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: token.margin,
      marginBottom: token.marginLG,

      '&:before': {
        content: '""',
        backgroundColor: token.colorSuccess,
        inset: 0,
        position: 'absolute',
        display: 'block',
        borderRadius: '100%',
        opacity: '0.1'
      }
    },

    '.__buy-icon': {
      fontSize: 64,
      color: token.colorSuccess
    },

    '.__note': {
      paddingTop: token.paddingXXS,
      paddingBottom: token.padding,
      color: token.colorTextLight5,
      textAlign: 'center'
    },

    '.__layout-footer': {
      display: 'flex',
      padding: token.paddingMD,
      paddingBottom: token.paddingLG,
      gap: token.paddingXS,

      '.ant-btn': {
        flex: 1
      },

      '.full-width': {
        minWidth: '100%'
      }
    }
  });
});

export default BuyTokens;
