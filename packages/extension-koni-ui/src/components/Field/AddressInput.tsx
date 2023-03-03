// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/index';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { Button, Icon, Input, InputRef, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import { ScannerResult } from '@subwallet/react-ui/es/sw-qr-scanner';
import CN from 'classnames';
import { Book, Scan } from 'phosphor-react';
import React, { ChangeEventHandler, ForwardedRef, forwardRef, useCallback, useContext } from 'react';
import styled from 'styled-components';

import { isAddress, isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends BasicInputWrapper, ThemeProps {
  showAddressBook?: boolean;
  showScanner?: boolean;
}

const MODAL_ID = 'input-address';

function Component ({ className = '', label, onChange, placeholder, showAddressBook = false, showScanner = true, value }: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { t } = useTranslation();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const _onChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const val = event.target.value;

    onChange && onChange({ target: { value: val } });
  }, [onChange]);

  const onOpenScanner = useCallback(() => {
    activeModal(MODAL_ID);
  }, [activeModal]);

  const onCloseScanner = useCallback(() => {
    inactiveModal(MODAL_ID);
  }, [inactiveModal]);

  const onScanError = useCallback(() => {
    // do something
  }, []);

  const onSuccess = useCallback((result: ScannerResult) => {
    inactiveModal(MODAL_ID);
    onChange && onChange({ target: { value: result.text } });
  }, [inactiveModal, onChange]);

  // todo: Will work with "Manage address book" feature later
  return (
    <>
      <Input
        className={CN('address-input', className, {
          '-is-valid-address': isAddress(value)
        })}
        label={label || t('Account address')}
        onChange={_onChange}
        placeholder={placeholder || t('Please type or paste an address')}
        prefix={
          <>
            {
              value && isAddress(value) && (
                <div className={'__overlay'}>
                  <div className={'__name common-text'}>
                    {toShort(value, 6, 6)}
                  </div>

                  <div className={'__address common-text'}>
                    ({toShort(value, 4, 4)})
                  </div>
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
        // status={'error'}
        suffix={(
          <>
            {showAddressBook && <Button
              icon={(
                <Icon
                  phosphorIcon={Book}
                  size='sm'
                />
              )}
              size='xs'
              type='ghost'
            />}
            {showScanner && <Button
              icon={(
                <Icon
                  phosphorIcon={Scan}
                  size='sm'
                />
              )}
              onClick={onOpenScanner}
              size='xs'
              type='ghost'
            />}
          </>
        )}
        value={value}
      />

      <SwQrScanner
        className={className}
        id={MODAL_ID}
        onClose={onCloseScanner}
        onError={onScanError}
        onSuccess={onSuccess}
      />
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
      color: token.colorTextLight1
    },

    '.__address': {
      paddingLeft: token.sizeXXS
    },

    '.ant-input-prefix': {
      pointerEvents: 'none'
    },

    '.ant-input': {
      marginLeft: -40,
      paddingLeft: 40
    },

    '&:focus-within, &.-status-error': {
      '.__overlay': {
        pointerEvents: 'none',
        opacity: 0
      }
    }
  });
});
