// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainInfo';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Col, Form, Input, Row, Tooltip } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import Icon from '@subwallet/react-ui/es/icon';
import { Globe, Info, ShareNetwork, WifiHigh } from 'phosphor-react';
import { FieldData } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

interface AddProviderForm {
  provider: string,
  name: string,
  chainType: string,
  symbol: string
}

const formInitValues: AddProviderForm = {
  provider: '',
  name: '',
  chainType: '',
  symbol: ''
};

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const location = useLocation();

  const chainSlug = useMemo(() => {
    return location.state as string;
  }, [location.state]);

  const chainInfo = useFetchChainInfo(chainSlug);

  console.log('chainInfo', chainInfo);

  const [form] = useForm<AddProviderForm>();
  const [loading] = useState(false);
  const [isValidProvider, setIsValidProvider] = useState(false);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isSubmitDisabled = useCallback(() => {
    return !isValidProvider;
  }, [isValidProvider]);

  const onSubmit = useCallback(() => {
    console.log('submit');
  }, []);

  const onCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isCancelDisabled = useCallback(() => {
    return false;
  }, []);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: <Icon
        customSize={`${token.fontSizeHeading3}px`}
        phosphorIcon={Info}
        type='phosphor'
        weight={'light'}
      />
    }
  ];

  const onFormValuesChange = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    let isFieldsValid = true;

    for (const changedField of allFields) {
      if (changedField.errors && changedField.errors.length > 0) {
        isFieldsValid = false;
        break;
      }
    }

    setIsValidProvider(isFieldsValid);
  }, []);

  const providerSuffix = useCallback(() => {
    return (
      <Icon
        customSize={'20px'}
        iconColor={token.colorSuccess}
        phosphorIcon={WifiHigh}
        type={'phosphor'}
        weight={'bold'}
      />
    );
  }, [token.colorSuccess]);

  return (
    <PageWrapper
      className={`add_provider ${className}`}
      resolve={dataContext.awaitStores(['chainStore'])}
    >
      <Layout.Base
        leftFooterButton={{
          disabled: isCancelDisabled(),
          onClick: onCancel,
          children: 'Cancel'
        }}
        onBack={onBack}
        rightFooterButton={{
          block: true,
          disabled: isSubmitDisabled(),
          loading: loading,
          onClick: onSubmit,
          children: 'Save'
        }}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Add new provider')}
      >
        <div className={'add_provider__container'}>
          <Form
            form={form}
            initialValues={formInitValues}
            onFieldsChange={onFormValuesChange}
          >
            <div className={'add_provider__attributes_container'}>
              <Form.Item
                name={'provider'}
              >
                <Input
                  placeholder={t('Provider URL')}
                  prefix={<Icon
                    customSize={'24px'}
                    iconColor={token['gray-4']}
                    phosphorIcon={ShareNetwork}
                    type={'phosphor'}
                    weight={'bold'}
                  />}
                  suffix={providerSuffix()}
                />
              </Form.Item>

              <Row gutter={token.paddingSM}>
                <Col span={16}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Chain name')}
                  >
                    <div>
                      <Form.Item name={'name'}>
                        <Input
                          disabled={true}
                          placeholder={t('Chain name')}
                          prefix={<Icon
                            customSize={'24px'}
                            iconColor={token['gray-4']}
                            phosphorIcon={Globe}
                            type={'phosphor'}
                            weight={'bold'}
                          />}
                          value={chainInfo.name}
                        />
                      </Form.Item>
                    </div>
                  </Tooltip>
                </Col>

                <Col span={8}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Symbol')}
                  >
                    <div>
                      <Form.Item
                        name={'symbol'}
                      >
                        <Input
                          disabled={true}
                          placeholder={t('Symbol')}
                          value={chainInfo.slug}
                        />
                      </Form.Item>
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Form.Item name={'chainType'}>
                <Input
                  disabled={true}
                  placeholder={t('Chain type')}
                  value={chainInfo.slug}
                />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Layout.Base>
    </PageWrapper>
  );
}

const AddProvider = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.add_provider__container': {
      marginTop: 22,
      marginRight: token.margin,
      marginLeft: token.margin
    },

    '.ant-btn >span': {
      fontSize: token.fontSizeLG
    },

    '.add_provider__attributes_container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginSM
    },

    '.ant-input-container .ant-input-suffix': {
      marginRight: 0
    },

    '.ant-form-item': {
      marginBottom: 0
    },

    '.ant-input-container .ant-input-affix-wrapper': {
      overflow: 'hidden'
    }
  });
});

export default AddProvider;
