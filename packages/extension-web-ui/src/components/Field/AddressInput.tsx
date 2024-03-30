// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AbstractAddressJson } from '@subwallet/extension-base/background/types';
import { CHAINS_SUPPORTED_DOMAIN, isAzeroDomain } from '@subwallet/extension-base/koni/api/dotsama/domain';
import { reformatAddress } from '@subwallet/extension-base/utils';
import { AddressBookModal } from '@subwallet/extension-web-ui/components';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useForwardInputRef, useOpenQrScanner, useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { resolveAddressToDomain, resolveDomainToAddress, saveRecentAccount } from '@subwallet/extension-web-ui/messaging';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ScannerResult } from '@subwallet/extension-web-ui/types/scanner';
import { findContactByAddress, toShort } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, Input, InputRef, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import { Book, Scan } from 'phosphor-react';
import React, { ChangeEventHandler, ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { decodeAddress, isAddress, isEthereumAddress } from '@polkadot/util-crypto';

import { Avatar } from '../Avatar';
import { QrScannerErrorNotice } from '../Qr';
import { BasicInputWrapper } from './Base';

interface Props extends BasicInputWrapper, ThemeProps {
  showAddressBook?: boolean;
  showScanner?: boolean;
  addressPrefix?: number;
  saveAddress?: boolean;
  networkGenesisHash?: string;
  chain?: string;
  allowDomain?: boolean;
  prefix?: React.ReactNode;
  showPlainAddressOnly?: boolean;
  showDisplayOverlay?: boolean; // default: true
  showLabel?: boolean; // default: true
  fitNetwork?: boolean;
}

const defaultScannerModalId = 'input-account-address-scanner-modal';
const defaultAddressBookModalId = 'input-account-address-book-modal';

const addressLength = 9;

function Component (props: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { addressPrefix, allowDomain, chain,
    className = '', disabled, fitNetwork, id, label, networkGenesisHash, onBlur, onChange,
    onFocus, placeholder, prefix, readOnly, saveAddress, showAddressBook, showDisplayOverlay = true, showLabel = true,
    showPlainAddressOnly, showScanner, status, statusHelp, value } = props;
  const valueRef = useRef<string | undefined>(undefined);
  const chainRef = useRef<string | undefined>(undefined);
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);

  const [domainName, setDomainName] = useState<string | undefined>(undefined);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { accounts, contacts } = useSelector((root) => root.accountState);

  const scannerId = useMemo(() => id ? `${id}-scanner-modal` : defaultScannerModalId, [id]);
  const addressBookId = useMemo(() => id ? `${id}-address-book-modal` : defaultAddressBookModalId, [id]);

  const inputRef = useForwardInputRef(ref);
  const [scanError, setScanError] = useState('');

  const _contacts = useMemo((): AbstractAddressJson[] => [...accounts, ...(showAddressBook ? contacts : [])], [accounts, contacts, showAddressBook]);

  const accountName = useMemo(() => {
    const account = findContactByAddress(_contacts, value);

    if (account?.name) {
      return account?.name;
    } else {
      if (allowDomain && domainName) {
        return domainName;
      }
    }

    return undefined;
  }, [_contacts, allowDomain, domainName, value]);

  const formattedAddress = useMemo((): string => {
    const _value = value || '';

    if (addressPrefix === undefined) {
      return _value;
    }

    try {
      return reformatAddress(_value, addressPrefix);
    } catch (e) {
      return _value;
    }
  }, [addressPrefix, value]);

  const parseAndChangeValue = useCallback((value: string, skipClearDomainName?: boolean) => {
    const val = value.trim();

    onChange && onChange({ target: { value: val } });
    !skipClearDomainName && setDomainName(undefined);

    if (isAddress(val) && saveAddress) {
      if (isEthereumAddress(val)) {
        saveRecentAccount(val, chain).catch(console.error);
      } else {
        try {
          if (decodeAddress(val, true, addressPrefix)) {
            saveRecentAccount(val, chain).catch(console.error);
          }
        } catch (e) {}
      }
    }
  }, [addressPrefix, chain, onChange, saveAddress]);

  const _onChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    parseAndChangeValue(event.target.value);
  }, [parseAndChangeValue]);

  const openScanner = useOpenQrScanner(scannerId);

  const onOpenScanner = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    openScanner();
  }, [openScanner]);

  const onScanError = useCallback((error: string) => {
    setScanError(error);
  }, []);

  const onSuccess = useCallback((result: ScannerResult) => {
    setScanError('');
    inactiveModal(scannerId);
    parseAndChangeValue(result.text);
    // @ts-ignore
    onBlur?.({});
  }, [inactiveModal, scannerId, parseAndChangeValue, onBlur]);

  const onCloseScan = useCallback(() => {
    setScanError('');
    // @ts-ignore
    onBlur?.({});
  }, [onBlur]);

  const onOpenAddressBook = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    activeModal(addressBookId);
  }, [activeModal, addressBookId]);

  const onSelectAddressBook = useCallback((value: string) => {
    parseAndChangeValue(value);
    // @ts-ignore
    onBlur?.({});
  }, [onBlur, parseAndChangeValue]);

  useEffect(() => {
    if (allowDomain && chain && value && CHAINS_SUPPORTED_DOMAIN.includes(chain)) {
      if (isAzeroDomain(value)) {
        resolveDomainToAddress({
          chain,
          domain: value
        })
          .then((result) => {
            if (result) {
              setDomainName(value);
              parseAndChangeValue(result, true);
              inputRef?.current?.focus();
              inputRef?.current?.blur();
            }
          })
          .catch(console.error);
      } else if (isAddress(value)) {
        resolveAddressToDomain({
          chain,
          address: value
        })
          .then((result) => {
            if (result) {
              setDomainName(result);
            }
          })
          .catch(console.error);
      }
    } else {
      setDomainName(undefined);
    }
  }, [allowDomain, chain, inputRef, parseAndChangeValue, value]);

  useEffect(() => {
    if (value && (value !== valueRef.current || chain !== chainRef.current)) {
      const account = findContactByAddress(_contacts, value);

      chainRef.current = chain;

      if (account) {
        if (!isEthereumAddress(account.address) && !!account.isHardware) {
          const availableGens: string[] = (account.availableGenesisHashes as string[]) || [];

          if (!availableGens.includes(networkGenesisHash || '')) {
            return;
          }
        }

        const address = reformatAddress(account.address, addressPrefix);

        valueRef.current = value.trim();
        parseAndChangeValue(address);
        inputRef?.current?.focus();
        inputRef?.current?.blur();
      } else {
        if (isAddress(value)) {
          valueRef.current = value.trim();
          parseAndChangeValue(value);
        }
      }
    }
  }, [_contacts, addressPrefix, chain, inputRef, networkGenesisHash, parseAndChangeValue, value]);

  // todo: Will work with "Manage address book" feature later
  return (
    <>
      <Input
        className={CN('address-input', className, {
          '-is-valid-address': isAddress(value)
        })}
        disabled={disabled}
        id={id}
        label={showLabel ? (label || t('Account address')) : undefined}
        onBlur={onBlur}
        onChange={_onChange}
        onFocus={onFocus}
        placeholder={placeholder || t('Please type or paste an address')}
        prefix={
          <>
            {
              showDisplayOverlay && value && isAddress(value) && (
                <div className={'__overlay'}>
                  {showPlainAddressOnly
                    ? (
                      <div className={'__name common-text'}>
                        {accountName || toShort(value, addressLength, addressLength)}
                      </div>
                    )
                    : (
                      <>
                        <div className={CN('__name common-text', { 'limit-width': !!accountName })}>
                          {accountName || toShort(value, 9, 9)}
                        </div>
                        {(fitNetwork ? accountName : (accountName || addressPrefix !== undefined)) &&
                        (
                          <div className={'__address common-text'}>
                            ({toShort(formattedAddress, 4, 4)})
                          </div>
                        )
                        }
                      </>
                    )}
                </div>
              )
            }
            {
              prefix || (
                <Avatar
                  size={20}
                  theme={value ? isEthereumAddress(value) ? 'ethereum' : 'polkadot' : undefined}
                  value={value}
                />
              )
            }
          </>
        }
        readOnly={readOnly}
        ref={inputRef}
        status={status}
        statusHelp={statusHelp}
        suffix={(
          <>
            {
              showAddressBook &&
              (
                <Button
                  icon={(
                    <Icon
                      phosphorIcon={Book}
                      size='sm'
                    />
                  )}
                  onClick={onOpenAddressBook}
                  size='xs'
                  type='ghost'
                />
              )
            }
            {
              showScanner &&
              (
                <Button
                  disabled={disabled}
                  icon={(
                    <Icon
                      phosphorIcon={Scan}
                      size='sm'
                    />
                  )}
                  onClick={onOpenScanner}
                  size='xs'
                  type='ghost'
                />
              )
            }
          </>
        )}
        value={value}
      />

      {
        showScanner &&
        (
          <SwQrScanner
            className={className}
            id={scannerId}
            isError={!!scanError}
            onClose={onCloseScan}
            onError={onScanError}
            onSuccess={onSuccess}
            overlay={scanError && <QrScannerErrorNotice message={scanError} />}
            selectCameraMotion={isWebUI ? 'move-right' : undefined}
          />
        )
      }
      {
        showAddressBook &&
        (
          <AddressBookModal
            addressPrefix={addressPrefix}
            id={addressBookId}
            networkGenesisHash={networkGenesisHash}
            onSelect={onSelectAddressBook}
            value={value}
          />
        )
      }
    </>
  );
}

export const AddressInput = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__overlay': {
      position: 'absolute',
      backgroundColor: token.colorBgSecondary,
      top: 0,
      left: 2,
      bottom: 2,
      right: 2,
      borderRadius: token.borderRadiusLG,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 40,
      paddingRight: 84,
      whiteSpace: 'nowrap'
    },

    '.__name': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: token.colorTextLight1,

      '&.limit-width': {
        maxWidth: 136
      }
    },

    '.__address': {
      paddingLeft: token.sizeXXS
    },

    '.ant-input-prefix': {
      pointerEvents: 'none'
    },

    '&.-status-error': {
      '.__overlay': {
        pointerEvents: 'none',
        opacity: 0
      }
    },

    // Not support firefox
    '&:has(input:focus)': {
      '.__overlay': {
        pointerEvents: 'none',
        opacity: 0
      }
    },

    // Support firefox
    '.ant-input-affix-wrapper-focused': {
      '.__overlay': {
        pointerEvents: 'none',
        opacity: 0
      }
    }
  });
});
