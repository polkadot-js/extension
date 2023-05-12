// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { reformatAddress } from '@subwallet/extension-base/utils';
import { AddressBookModal } from '@subwallet/extension-koni-ui/components';
import { useForwardInputRef, useOpenQrScanner, useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { saveRecentAccount } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ScannerResult } from '@subwallet/extension-koni-ui/types/scanner';
import { findContactByAddress, toShort } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Input, InputRef, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import { Book, Scan } from 'phosphor-react';
import React, { ChangeEventHandler, ForwardedRef, forwardRef, SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import { isAddress, isEthereumAddress } from '@polkadot/util-crypto';

import { Avatar } from '../Avatar';
import { QrScannerErrorNotice } from '../Qr';
import { BasicInputWrapper } from './Base';

interface Props extends BasicInputWrapper, ThemeProps {
  showAddressBook?: boolean;
  showScanner?: boolean;
  addressPrefix?: number;
  saveAddress?: boolean;
}

const defaultScannerModalId = 'input-account-address-scanner-modal';
const defaultAddressBookModalId = 'input-account-address-book-modal';

function Component (props: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { addressPrefix,
    className = '', disabled, id, label, onBlur, onChange, onFocus,
    placeholder, readOnly, saveAddress, showAddressBook, showScanner, statusHelp, value } = props;
  const { t } = useTranslation();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { accounts, contacts } = useSelector((root) => root.accountState);

  const scannerId = useMemo(() => id ? `${id}-scanner-modal` : defaultScannerModalId, [id]);
  const addressBookId = useMemo(() => id ? `${id}-address-book-modal` : defaultAddressBookModalId, [id]);

  const inputRef = useForwardInputRef(ref);
  const [scanError, setScanError] = useState('');

  const _contacts = useMemo(() => [...accounts, ...contacts], [accounts, contacts]);

  const accountName = useMemo(() => {
    const account = findContactByAddress(_contacts, value);

    return account?.name;
  }, [_contacts, value]);

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

  const parseAndChangeValue = useCallback((value: string) => {
    const val = value.trim();

    onChange && onChange({ target: { value: val } });

    if (isAddress(val) && saveAddress) {
      saveRecentAccount(val).catch(console.error);
    }
  }, [onChange, saveAddress]);

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
    inputRef?.current?.focus();
    setScanError('');
    inactiveModal(scannerId);
    parseAndChangeValue(result.text);
    inputRef?.current?.blur();
  }, [inactiveModal, scannerId, parseAndChangeValue, inputRef]);

  const onCloseScan = useCallback(() => {
    inputRef?.current?.focus();
    setScanError('');
    inputRef?.current?.blur();
  }, [inputRef]);

  const onOpenAddressBook = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    activeModal(addressBookId);
  }, [activeModal, addressBookId]);

  const onSelectAddressBook = useCallback((value: string) => {
    inputRef?.current?.focus();
    parseAndChangeValue(value);
    inputRef?.current?.blur();
  }, [inputRef, parseAndChangeValue]);

  // todo: Will work with "Manage address book" feature later
  return (
    <>
      <Input
        className={CN('address-input', className, {
          '-is-valid-address': isAddress(value)
        })}
        disabled={disabled}
        id={id}
        label={label || t('Account address')}
        onBlur={onBlur}
        onChange={_onChange}
        onFocus={onFocus}
        placeholder={placeholder || t('Please type or paste an address')}
        prefix={
          <>
            {
              value && isAddress(value) && (
                <div className={'__overlay'}>
                  <div className={CN('__name common-text', { 'limit-width': !!accountName })}>
                    {accountName || toShort(value, 9, 9)}
                  </div>
                  {(accountName || addressPrefix !== undefined) &&
                    (
                      <div className={'__address common-text'}>
                        ({toShort(formattedAddress, 4, 4)})
                      </div>
                    )
                  }
                </div>
              )
            }
            <Avatar
              size={20}
              theme={value ? isEthereumAddress(value) ? 'ethereum' : 'polkadot' : undefined}
              value={value}
            />
          </>
        }
        readOnly={readOnly}
        ref={inputRef}
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
          />
        )
      }
      {
        showAddressBook &&
        (
          <AddressBookModal
            addressPrefix={addressPrefix}
            id={addressBookId}
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

    '&:has(input:focus), &.-status-error': {
      '.__overlay': {
        pointerEvents: 'none',
        opacity: 0
      }
    }
  });
});
