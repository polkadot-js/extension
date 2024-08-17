// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _MANTA_ZK_CHAIN_GROUP, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { RECEIVE_QR_MODAL, RECEIVE_TOKEN_SELECTOR_MODAL, WARNING_LEDGER_RECEIVE_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useConfirmModal, useGetAccountByAddress, useGetZkAddress, useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ledgerMustCheckNetwork } from '@subwallet/extension-koni-ui/utils';
import { ModalContext, SwList, SwModal, SwModalFuncProps } from '@subwallet/react-ui';
import { SwListSectionRef } from '@subwallet/react-ui/es/sw-list';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { TokenEmptyList } from '../../EmptyList';
import { TokenSelectionItem } from '../../TokenItem';

interface Props extends ThemeProps {
  onSelectItem?: (item: _ChainAsset) => void,
  address?: string,
  items: _ChainAsset[]
}

const modalId = RECEIVE_TOKEN_SELECTOR_MODAL;

const renderEmpty = () => <TokenEmptyList modalId={modalId} />;

function Component ({ address, className = '', items, onSelectItem }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);

  const { chainInfoMap, ledgerGenericAllowNetworks } = useSelector((state) => state.chainStore);

  const zkAddress = useGetZkAddress(address);
  const account = useGetAccountByAddress(address);

  const ledgerCheck = useMemo(() => ledgerMustCheckNetwork(account), [account]);

  const confirmModalProps = useMemo((): SwModalFuncProps => ({
    id: WARNING_LEDGER_RECEIVE_MODAL,
    title: t<string>('Unsupported network'),
    maskClosable: true,
    closable: true,
    subTitle: t<string>('Do you still want to get the address?'),
    okText: t<string>('Get address'),
    okCancel: true,
    type: 'warn',
    cancelButtonProps: {
      children: t<string>('Cancel'),
      schema: 'secondary'
    },
    className: 'ledger-warning-modal'
  }), [t]);

  const { handleSimpleConfirmModal } = useConfirmModal(confirmModalProps);

  const isActive = checkActive(modalId);

  const sectionRef = useRef<SwListSectionRef>(null);

  const searchFunction = useCallback((item: _ChainAsset, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();
    const chainName = chainInfoMap[item.originChain]?.name?.toLowerCase();
    const symbol = item.symbol.toLowerCase();

    return (
      symbol.includes(searchTextLowerCase) ||
      chainName.includes(searchTextLowerCase)
    );
  }, [chainInfoMap]);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onClickQrBtn = useCallback((item: _ChainAsset) => {
    return () => {
      if (ledgerCheck !== 'unnecessary' && !ledgerGenericAllowNetworks.includes(item.originChain)) {
        handleSimpleConfirmModal({
          content: t<string>(
            'Ledger {{ledgerApp}} accounts are NOT compatible with {{networkName}} network. Tokens will get stuck (i.e., can’t be transferred out or staked) when sent to this account type.',
            {
              replace: {
                ledgerApp: ledgerCheck === 'polkadot' ? 'Polkadot' : 'Migration',
                networkName: chainInfoMap[item.originChain]?.name
              }
            }
          )
        })
          .then(() => {
            onSelectItem && onSelectItem(item);
            // checkAsset(item.slug);
            inactiveModal(modalId);
            activeModal(RECEIVE_QR_MODAL);
          })
          .catch(console.error);

        return;
      }

      onSelectItem && onSelectItem(item);
      // checkAsset(item.slug);
      inactiveModal(modalId);
      activeModal(RECEIVE_QR_MODAL);
    };
  }, [ledgerCheck, ledgerGenericAllowNetworks, onSelectItem, inactiveModal, activeModal, handleSimpleConfirmModal, t, chainInfoMap]);

  const onPreCopy = useCallback((item: _ChainAsset, ledgerCheck: string) => {
    return () => {
      return handleSimpleConfirmModal({
        content: t<string>(
          'Ledger {{ledgerApp}} accounts are NOT compatible with {{networkName}} network. Tokens will get stuck (i.e., can’t be transferred out or staked) when sent to this account type.',
          {
            replace: {
              ledgerApp: ledgerCheck === 'polkadot' ? 'Polkadot' : 'Migration',
              networkName: chainInfoMap[item.originChain]?.name
            }
          }
        )
      });
    };
  }, [chainInfoMap, handleSimpleConfirmModal, t]);

  const renderItem = useCallback((item: _ChainAsset) => {
    const isMantaZkAsset = _MANTA_ZK_CHAIN_GROUP.includes(item.originChain) && item.symbol.startsWith(_ZK_ASSET_PREFIX);
    const needConfirm = ledgerCheck !== 'unnecessary' && !ledgerGenericAllowNetworks.includes(item.originChain);

    return (
      <TokenSelectionItem
        address={isMantaZkAsset ? zkAddress : address}
        className={'token-selector-item'}
        item={item}
        key={item.slug}
        onClickQrBtn={onClickQrBtn(item)}
        onPreCopy={needConfirm ? onPreCopy(item, ledgerCheck) : undefined}
        onPressItem={onClickQrBtn(item)}
      />
    );
  }, [address, ledgerGenericAllowNetworks, ledgerCheck, onClickQrBtn, onPreCopy, zkAddress]);

  useEffect(() => {
    if (!isActive) {
      setTimeout(() => {
        sectionRef.current?.setSearchValue('');
      }, 100);
    }
  }, [isActive]);

  return (
    <SwModal
      className={`${className} chain-selector-modal`}
      id={modalId}
      onCancel={onCancel}
      title={t('Select token')}
    >
      <SwList.Section
        enableSearchInput={true}
        list={items}
        ref={sectionRef}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search token')}
      />
    </SwModal>
  );
}

export const TokensSelectorModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-content': {
      minHeight: 474
    },

    '.ant-sw-list-search-input': {
      paddingBottom: token.paddingXS
    },

    '.ant-sw-modal-body': {
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: token.padding,
      marginBottom: 0,
      display: 'flex'
    },

    '.ant-sw-list-section': {
      flex: 1
    },

    '.ant-sw-list-section .ant-sw-list': {
      paddingBottom: 0
    },

    '.token-selector-item + .token-selector-item': {
      marginTop: token.marginXS
    }
  });
});
