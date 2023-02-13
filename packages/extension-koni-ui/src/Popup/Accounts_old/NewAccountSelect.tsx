// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCodeFork, faEye, faFileUpload, faKey, faPlusCircle, faQrcode, faShareNodes, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { Link, MediaContext } from '@subwallet/extension-koni-ui/components';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/useIsPopup';
import { useLedger } from '@subwallet/extension-koni-ui/hooks/useLedger';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

interface LinkItem {
  label: string;
  icon: IconDefinition;
  to?: string;
  onClick?: () => void;
  disable: boolean;
  title?: string;
  key: string;
  iconProps?: Omit<FontAwesomeIconProps, 'icon'>;
}

interface GroupItems {
  items: LinkItem[];
  label: string;
  key: string;
}

const createAccountPath = '/account/create';
const jsonPath = '/account/restore-json';
const ledgerPath = '/account/import-ledger';

const NewAccountSelect = ({ className }: Props) => {
  const { t } = useTranslation();

  const { isLedgerCapable, isLedgerEnabled } = useLedger();

  const isPopup = useIsPopup();
  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';

  const _openCreateAccount = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', createAccountPath);
      windowOpen(createAccountPath).catch((e) => console.log('error', e));
    }, []
  );

  const mediaAllowed = useContext(MediaContext);

  const _openJson = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', jsonPath);
      windowOpen(jsonPath).catch((e) => console.log('error', e));
    }, []
  );

  const _onOpenLedgerConnect = useCallback(
    (): void => {
      window.localStorage.setItem('popupNavigation', ledgerPath);
      windowOpen(ledgerPath).catch(console.error);
    }, []
  );

  const groups = useMemo((): GroupItems[] => {
    const result: GroupItems[] = [];

    // New account
    const newAccountGroup: GroupItems = {
      items: [],
      label: t<string>('Create new account'),
      key: 'new-account'
    };

    const createNewSeed: LinkItem = {
      disable: false,
      onClick: isPopup && (isFirefox || isLinux) ? _openCreateAccount : undefined,
      to: isPopup && (isFirefox || isLinux) ? undefined : createAccountPath,
      label: t<string>('Create with new seed phrase'),
      icon: faPlusCircle,
      key: 'new-seed'
    };

    const createDeriveAccount: LinkItem = {
      disable: false,
      to: '/account/derive',
      label: t<string>('Derive from another account'),
      icon: faShareNodes,
      key: 'derive-account'
    };

    newAccountGroup.items.push(createNewSeed, createDeriveAccount);

    result.push(newAccountGroup);

    // Import account
    const importAccountGroup: GroupItems = {
      items: [],
      label: t<string>('Import account'),
      key: 'import-account'
    };

    const importFromSeed: LinkItem = {
      disable: false,
      to: '/account/import-seed',
      label: t<string>('Import account from Seed Phrase'),
      icon: faPlusCircle,
      key: 'import-seed'
    };

    const importFromMetamask: LinkItem = {
      disable: false,
      to: '/account/import-metamask-private-key',
      label: t<string>('Import account from MetaMask'),
      icon: faKey,
      key: 'import-metamask'
    };

    const importByQR: LinkItem = {
      disable: !mediaAllowed,
      title: !mediaAllowed ? t<string>('Camera access must be first enabled in the settings') : '',
      to: '/account/import-secret-qr',
      label: t<string>('Import account by QR code'),
      icon: faQrcode,
      key: 'import-qr'
    };

    const importJson: LinkItem = {
      disable: false,
      onClick: isPopup && (isFirefox || isLinux) ? _openJson : undefined,
      to: isPopup && (isFirefox || isLinux) ? undefined : jsonPath,
      label: t<string>('Restore account from Polkadot{.js}'),
      icon: faFileUpload,
      key: 'import-json'
    };

    importAccountGroup.items.push(importFromSeed, importFromMetamask, importByQR, importJson);

    result.push(importAccountGroup);

    // Attach account
    const attachAccountGroup: GroupItems = {
      items: [],
      label: t<string>('Attach account'),
      key: 'attach-account'
    };

    const attachQRSigner: LinkItem = {
      disable: !mediaAllowed,
      title: !mediaAllowed ? t<string>('Camera access must be first enabled in the settings') : '',
      to: '/account/attach-qr-signer',
      label: t<string>('Attach QR - signer (Parity Signer, Keystone)'),
      icon: faQrcode,
      key: 'attach-qr-signer'
    };

    const attachLedger: LinkItem = {
      disable: isLedgerEnabled && !isLedgerCapable,
      title: isLedgerEnabled ? (!isLedgerCapable && t<string>('Ledger devices can only be connected with Chrome browser')) || '' : undefined,
      onClick: !isLedgerEnabled ? _onOpenLedgerConnect : undefined,
      to: isLedgerEnabled ? ledgerPath : undefined,
      label: t<string>('Connect Ledger device'),
      icon: faCodeFork,
      iconProps: { rotation: 270 },
      key: 'attach-ledger'
    };

    const attachReadonly: LinkItem = {
      disable: false,
      to: '/account/attach-read-only',
      label: t<string>('Attach readonly account'),
      icon: faEye,
      key: 'attach-read-only'
    };

    attachAccountGroup.items.push(attachQRSigner, attachLedger, attachReadonly);

    result.push(attachAccountGroup);

    return result;
  }, [_onOpenLedgerConnect, _openCreateAccount, _openJson, isFirefox, isLedgerCapable, isLedgerEnabled, isLinux, isPopup, mediaAllowed, t]);

  return (
    <div className={CN(className)}>
      <Header
        showBackArrow={true}
        showSubHeader={true}
        subHeaderName={t<string>('Add account')}
      />
      <div className='body-container'>
        {
          groups.map(({ items, key: groupKey, label: groupLabel }) => {
            return (
              <div
                className='group-item-container'
                key={groupKey}
              >
                <div className='group-item-label'>{groupLabel}</div>
                <div className='group-item-content-container'>
                  {
                    items.map(({ disable,
                      icon,
                      iconProps,
                      key: itemKey,
                      label: itemLabel,
                      onClick,
                      title,
                      to }) => {
                      return (
                        <Link
                          className={CN('item-container')}
                          isDisabled={disable}
                          key={itemKey}
                          onClick={onClick}
                          title={title}
                          to={to}
                        >
                          <FontAwesomeIcon
                            {...iconProps}
                            className='item-icon'
                            icon={icon}
                            size={'1x'}
                          />
                          <div className='item-label'>{itemLabel}</div>
                        </Link>
                      );
                    })
                  }
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default React.memo(styled(NewAccountSelect)(({ theme }: Props) => `
  .body-container {
    padding: 20px 22px;

    .group-item-container {
      margin-bottom: 16px;

      .group-item-label {
        font-style: normal;
        font-weight: 600;
        font-size: 16px;
        line-height: 26px;
        color: ${theme.textColor};
      }

      .group-item-content-container {
        margin: 8px 16px 0;

        .item-container {
          .item-icon {
            margin-right: 8px;
            width: 16px;
          }

          &.isDisabled:hover {
            .item-icon {
              color: ${theme.textColor2};
            }
          }

          &:hover {
            .item-icon {
              color: ${theme.iconHoverColor};
            }
          }

          .item-label {
            font-style: normal;
            font-weight: 400;
            font-size: 15px;
            line-height: 26px;
            color: ${theme.textColor2};
          }
        }
      }
    }
  }
`));
