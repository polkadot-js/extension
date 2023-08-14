// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationResult } from '@subwallet/extension-base/background/KoniTypes';
import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-base/services/chain-service/handler/types';
import { ConfirmationGeneralInfo } from '@subwallet/extension-koni-ui/components';
import { completeConfirmation } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, Button, Col, Field, Icon, Row } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, Globe, ShareNetwork, WifiHigh, WifiSlash, XCircle } from 'phosphor-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  request: ConfirmationDefinitions['addNetworkRequest'][0];
}

const handleConfirm = async ({ id }: ConfirmationDefinitions['addNetworkRequest'][0]) => {
  return await completeConfirmation('addNetworkRequest', { id, isApproved: true } as ConfirmationResult<null>);
};

const handleCancel = async ({ id }: ConfirmationDefinitions['addNetworkRequest'][0]) => {
  return await completeConfirmation('addNetworkRequest', { id, isApproved: false } as ConfirmationResult<null>);
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, request } = props;
  const { payload: { chainEditInfo, chainSpec, mode, providerError, unconfirmed } } = request;

  const { t } = useTranslation();

  const { token } = useTheme() as Theme;

  const [loading, setLoading] = useState(false);

  const handleErrorMessage = useCallback((errorCode?: _CHAIN_VALIDATION_ERROR) => {
    if (!errorCode) {
      return '';
    }

    switch (errorCode) {
      case _CHAIN_VALIDATION_ERROR.CONNECTION_FAILURE:
        return t('Cannot connect to this provider');
      case _CHAIN_VALIDATION_ERROR.EXISTED_PROVIDER:
        return t('This provider has already been added');
      case _CHAIN_VALIDATION_ERROR.EXISTED_CHAIN:
        return t('This chain has already been added');
      default:
        return t('Error validating this provider');
    }
  }, [t]);

  const onCancel = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      handleCancel(request).finally(() => {
        setLoading(false);
      });
    }, 300);
  }, [request]);

  const onApprove = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      handleConfirm(request).finally(() => {
        setLoading(false);
      });
    }, 300);
  }, [request]);

  const providerSuffix = useMemo(() => {
    if (unconfirmed) {
      return <ActivityIndicator size={token.sizeMD} />;
    }

    if (providerError) {
      return (
        <Icon
          iconColor={token.colorError}
          phosphorIcon={WifiSlash}
          size='sm'
          weight='bold'
        />
      );
    }

    return (
      <Icon
        iconColor={token.colorSuccess}
        phosphorIcon={WifiHigh}
        size='sm'
        weight='bold'
      />
    );
  }, [token, providerError, unconfirmed]);

  return (
    <>
      <div className={CN(className, 'confirmation-content')}>
        <ConfirmationGeneralInfo request={request} />
        <Field
          content={chainEditInfo.providers[chainEditInfo.currentProvider]}
          placeholder={t<string>('Provider URL')}
          prefix={(
            <Icon
              customSize={'24px'}
              iconColor={token['gray-4']}
              phosphorIcon={ShareNetwork}
              type={'phosphor'}
              weight={'bold'}
            />
          )}
          status={providerError ? 'error' : ''}
          statusHelp={handleErrorMessage(providerError)}
          suffix={providerSuffix}
          tooltip={t<string>('Provider URL')}
          tooltipPlacement='topLeft'
        />
        <Row gutter={token.paddingSM}>
          <Col span={16}>
            <Field
              content={chainEditInfo.name || ''}
              placeholder={t('Network name')}
              prefix={(
                <Icon
                  customSize={'24px'}
                  iconColor={token['gray-4']}
                  phosphorIcon={Globe}
                  type={'phosphor'}
                  weight={'bold'}
                />
              )}
              tooltip={t<string>('Network name')}
              tooltipPlacement='topLeft'
            />
          </Col>
          <Col span={8}>
            <Field
              content={chainEditInfo.symbol || ''}
              placeholder={t('Symbol')}
              tooltip={t<string>('Symbol')}
              tooltipPlacement='topLeft'
            />
          </Col>
        </Row>
        <Row gutter={token.paddingSM}>
          <Col span={12}>
            <Field
              content={chainSpec?.decimals || 0}
              placeholder={t('Decimals')}
              tooltip={t<string>('Decimals')}
              tooltipPlacement='topLeft'
            />
          </Col>
          <Col span={12}>
            <Field
              content={chainSpec?.evmChainId || 0}
              placeholder={t('Chain ID')}
              tooltip={t<string>('Chain ID')}
              tooltipPlacement='topLeft'
            />
          </Col>
        </Row>
        <Field
          content={chainEditInfo.chainType}
          placeholder={t('Network type')}
          tooltip={t<string>('Network type')}
          tooltipPlacement='topLeft'
        />
        <Field
          content={chainEditInfo.blockExplorer}
          placeholder={t('Block explorer')}
          tooltip={t<string>('Block explorer')}
          tooltipPlacement='topLeft'
        />
        <Field
          content={chainEditInfo.crowdloanUrl}
          placeholder={t('Crowdloan URL')}
          tooltip={t<string>('Crowdloan URL')}
          tooltipPlacement='topLeft'
        />
      </div>
      <div className='confirmation-footer'>
        {mode === 'update' && (<div className={'warning-message'}>
          {t('The network already exists')}
        </div>)}
        <Button
          disabled={loading}
          icon={(
            <Icon
              phosphorIcon={XCircle}
              weight='fill'
            />
          )}
          onClick={onCancel}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>
        <Button
          disabled={mode === 'update' || unconfirmed || !!providerError}
          icon={(
            <Icon
              phosphorIcon={CheckCircle}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onApprove}
        >
          {t('Approve')}
        </Button>
      </div>
    </>
  );
};

const AddNetworkConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--content-gap': `${token.size}px`,

    '.ant-field-container': {
      textAlign: 'left',
      overflow: 'unset'
    }
  };
});

export default AddNetworkConfirmation;
