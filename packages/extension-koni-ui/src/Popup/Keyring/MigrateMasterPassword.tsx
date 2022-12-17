// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import { ActionContext, Button, Checkbox, InputWithLabel, ValidatedInput, Warning } from '@subwallet/extension-koni-ui/components';
import { AccountContext } from '@subwallet/extension-koni-ui/contexts';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringMigrateMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isNotShorterThan } from '@subwallet/extension-koni-ui/util/validators';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

interface MigrateItem {
  address: string;
  name?: string;
  selected: boolean;
  password: string | null;
  errors: string[];
}

interface ItemProps {
  data: string;
}

const MIN_LENGTH = 6;

let timout: undefined | NodeJS.Timeout;

const MigrateMasterPassword = ({ className }: Props) => {
  const { t } = useTranslation();
  const { show } = useToast();

  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const [items, setItems] = useState<MigrateItem[]>([]);
  const [updates, setUpdates] = useState<MigrateItem[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const selectedAll = useMemo((): boolean => (items.length ? items.every((i) => i.selected) : false), [items]);

  const isPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);

  const onCancel = useCallback(() => {
    window.localStorage.setItem('popupNavigation', '/');
    onAction('/');
  }, [onAction]);

  const onChangeSelectedItem = useCallback((address: string): (val: boolean) => void => {
    return (val: boolean) => {
      setItems((items) => {
        const result = [...items];
        const exist = result.find((acc) => acc.address === address);

        if (exist) {
          exist.selected = val;
          exist.password = null;
          exist.errors = [];
        }

        return result;
      });
    };
  }, []);

  const onChangePassword = useCallback((address: string): (val: string | null) => void => {
    return (val: string | null) => {
      setItems((items) => {
        const result = [...items];
        const exist = result.find((acc) => acc.address === address);

        if (exist && exist.password !== val) {
          exist.password = val;
          exist.errors = [];
        }

        return result;
      });
    };
  }, []);

  const Item = useMemo(() => {
    const Component = ({ data }: ItemProps) => {
      const { address, errors, name, selected } = JSON.parse(data) as Omit<MigrateItem, 'password'>;

      return (
        <div
          className={CN(
            'item-container pb-16',
            {
              'no-border': !selected
            }
          )}
          id={`address-${address}`}
        >
          <Checkbox
            checked={selected}
            className='checkbox'
            label={name || address}
            onChange={onChangeSelectedItem(address)}
          />
          {
            selected && (
              <>
                <ValidatedInput
                  className='input-container'
                  component={InputWithLabel}
                  data-input-password
                  label={t('Old Password')}
                  labelQuestionIcon={true}
                  labelTooltip={t('Your old password is the password you used before creating the master password. Please enter your old password to confirm your application of the master password.')}
                  onValidatedChange={onChangePassword(address)}
                  type='password'
                  validator={isPasswordValid}
                />
                {
                  errors.map((err, index) =>
                    (
                      <Warning
                        className='item-error'
                        isDanger
                        key={index}
                      >
                        {t(err)}
                      </Warning>
                    )
                  )
                }
              </>
            )
          }
        </div>
      );
    };

    return React.memo(Component);
  }, [isPasswordValid, onChangePassword, onChangeSelectedItem, t]);

  const onSelectAll = useCallback((val: boolean) => {
    const result = [...items];

    if (val) {
      for (const item of result) {
        if (!item.selected) {
          item.selected = true;
        }
      }
    } else {
      for (const item of result) {
        if (item.selected) {
          item.selected = false;
          item.password = null;
          item.errors = [];
        }
      }
    }

    setItems(result);
  }, [items]);

  const onSubmit = useCallback(async () => {
    const filtered = items.filter((i) => i.selected && i.password);

    if (filtered.length) {
      await new Promise<void>((resolve) => {
        setIsBusy(true);
        setTimeout(() => {
          resolve();
        }, 200);
      });

      clearTimeout(timout);
      const result: MigrateItem[] = [];

      for (const item of filtered) {
        const res = await keyringMigrateMasterPassword({
          address: item.address,
          password: item.password || ''
        });

        if (!res.status) {
          result.push({ ...item, errors: res.errors });
        }
      }

      if (result.length !== filtered.length) {
        show(`${t('Master password applied successfully:')} ${filtered.length - result.length}/${filtered.length}`);
      } else {
        show(t('Failed to apply master password'));
      }

      setUpdates(result);

      timout = setTimeout(() => {
        setUpdates([]);
        setIsBusy(false);
      }, 500);
    }
  }, [items, show, t]);

  useEffect(() => {
    const filtered = accounts.filter((acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.isMasterPassword && !acc.isExternal);
    const selectedAddress = window.localStorage.getItem('migrateAddress');

    setItems((items) => {
      const already = [...updates, ...items];
      const result: MigrateItem[] = [];

      for (const account of filtered) {
        const exist = already.find((acc) => acc.address === account.address);

        if (exist) {
          result.push(exist);
        } else {
          result.push({
            address: account.address,
            selected: selectedAddress ? account.address.toLowerCase() === selectedAddress.toLowerCase() : false,
            name: account.name,
            password: null,
            errors: []
          });
        }
      }

      return result;
    });

    window.localStorage.setItem('migrateAddress', '');
  }, [accounts, updates]);

  const selectedItems = items.filter((i) => i.selected);
  const disableButton = !selectedItems.length || selectedItems.some((i) => !i.password || !!i.errors.length);

  return (
    <div className={CN(className)}>
      <Header
        showBackArrow={true}
        showSubHeader={true}
        subHeaderName={t<string>('Apply Master Password')}
      />
      <div className='body-container'>
        <div className={CN('item-container')}>
          <Checkbox
            checked={selectedAll}
            className='checkbox'
            label={t<string>('All Account')}
            onChange={onSelectAll}
          />
        </div>
        {
          items.map((item) => {
            const data: Omit<MigrateItem, 'password'> = {
              address: item.address,
              name: item.name,
              selected: item.selected,
              errors: item.errors
            };

            return (
              <Item
                data={JSON.stringify(data)}
                key={item.address}
              />
            );
          })
        }
      </div>
      <div className='footer-container'>
        <Button
          className={CN('cancel-btn btn')}
          isDisabled={isBusy}
          onClick={onCancel}
        >
          <span>{t<string>('Cancel')}</span>
        </Button>
        <Button
          className={CN('btn')}
          isBusy={isBusy}
          isDisabled={disableButton}
          onClick={onSubmit}
        >
          {t<string>('Apply')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(MigrateMasterPassword)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  flex: 1;

  .body-container {
    padding: 4px 22px;
    flex: 1;

    .item-container {
      margin-top: 4px;
      border-bottom: 1px solid ${theme.borderColor2};
      &.pb-16 {
        padding-bottom: 16px;
      }

      &.no-border {
        border: none;
        padding-bottom: 0;
      }

      .checkbox {
        label {
          font-style: normal;
          font-weight: 500;
          font-size: 16px;
          line-height: 24px;
          color: ${theme.textColor};
        }
      }

      .validated-input__warning, .item-error {
        background: transparent;
        margin-top: 8px;
        padding: 0;

        .warning-image {
          width: 20px;
          margin-right: 8px;
          transform: translateY(2px);
        }

        .warning-message {
          color: ${theme.crowdloanFailStatus};
        }
      }
    }
  }

  .footer-container {
    padding: 22px 12px;
    display: flex;
    flex-direction: row;
    border-top: 1px solid ${theme.borderColor2};

    .cancel-btn {
      background-color: ${theme.buttonBackground1};

      span {
        color: ${theme.buttonTextColor2};
      }
    }

    .btn {
      margin: 0 8px;
    }
  }
`));
