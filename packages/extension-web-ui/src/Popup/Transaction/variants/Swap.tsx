// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountSelector, HiddenInput } from '@subwallet/extension-web-ui/components';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useSelector, useTransactionContext, useWatchTransaction } from '@subwallet/extension-web-ui/hooks';
import { FreeBalance, TransactionContent, TransactionFooter } from '@subwallet/extension-web-ui/Popup/Transaction/parts';
import { FormCallbacks, SwapParams, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Form, Icon } from '@subwallet/react-ui';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const hideFields: Array<keyof SwapParams> = ['fromAmount', 'fromTokenSlug', 'toTokenSlug'];

const Component = ({ className }: Props) => {
  const { t } = useTranslation();
  const { defaultData, setCustomScreenTitle } = useTransactionContext<SwapParams>();
  const { isWebUI } = useContext(ScreenContext);

  const { isAllAccount } = useSelector((state) => state.accountState);

  const [form] = Form.useForm<SwapParams>();
  const formDefault = useMemo((): SwapParams => ({ ...defaultData }), [defaultData]);

  const fromValue = useWatchTransaction('from', form, defaultData);
  const fromTokenSlugValue = useWatchTransaction('fromTokenSlug', form, defaultData);

  const onSubmit: FormCallbacks<SwapParams>['onFinish'] = useCallback((values: SwapParams) => {
    //
  }, []);

  useEffect(() => {
    setCustomScreenTitle(t('Swap'));

    return () => {
      setCustomScreenTitle(undefined);
    };
  }, [setCustomScreenTitle, t]);

  return (
    <>
      <div className={className}>
        <>
          <div className={'__transaction-form-block'}>
            <TransactionContent>
              <Form
                className={'form-container form-space-sm'}
                form={form}
                initialValues={formDefault}
                onFinish={onSubmit}
              >
                <HiddenInput fields={hideFields} />

                <Form.Item
                  name={'from'}
                >
                  <AccountSelector
                    disabled={!isAllAccount}
                  />
                </Form.Item>

                <div className={'__balance-display-area'}>
                  <FreeBalance
                    address={fromValue}
                    chain={''}
                    isSubscribe={true}
                    label={`${t('Available balance')}:`}
                    tokenSlug={fromTokenSlugValue}
                  />
                </div>
              </Form>
            </TransactionContent>
            <TransactionFooter>
              <Button
                block={true}
                className={'__start-earning-button'}
                icon={(
                  <Icon
                    phosphorIcon={PlusCircle}
                    weight={'fill'}
                  />
                )}
                onClick={form.submit}
              >
                {t('Swap')}
              </Button>
            </TransactionFooter>
          </div>

          {isWebUI && (
            <div className={'__transaction-meta-block'}>

            </div>
          )}
        </>
      </div>
    </>
  );
};

const Swap = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: 24,
    maxWidth: 784,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    gap: token.size,

    '.web-ui-enable &': {
      '.__transaction-form-block': {
        flex: '1'
      },

      '.__transaction-meta-block': {
        flex: '1'
      }
    }
  };
});

export default Swap;
