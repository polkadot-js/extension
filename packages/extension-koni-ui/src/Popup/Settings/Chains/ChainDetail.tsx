// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _NetworkUpsertParams } from '@subwallet/extension-base/services/chain-service/types';
import { _getBlockExplorerFromChain, _getChainNativeTokenBasicInfo, _getChainSubstrateAddressPrefix, _getCrowdloanUrlFromChain, _getEvmChainId, _getSubstrateParaId, _isChainEvmCompatible, _isCustomChain, _isPureEvmChain, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import { isUrl } from '@subwallet/extension-base/utils';
import { ProviderSelector } from '@subwallet/extension-koni-ui/components/Field/ProviderSelector';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainInfo';
import useFetchChainState from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainState';
import useConfirmModal from '@subwallet/extension-koni-ui/hooks/useConfirmModal';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { removeChain, upsertChain } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Col, Field, Form, Input, Row, Tooltip } from '@subwallet/react-ui';
import { useForm } from '@subwallet/react-ui/es/form/Form';
import Icon from '@subwallet/react-ui/es/icon';
import { FloppyDiskBack, Globe, Plus, ShareNetwork, Trash } from 'phosphor-react';
import { FieldData, RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

interface ChainDetailForm {
  currentProvider: string,
  blockExplorer: string,
  crowdloanUrl: string
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const location = useLocation();
  const showNotification = useNotification();
  const [form] = useForm<ChainDetailForm>();
  const { handleSimpleConfirmModal } = useConfirmModal({
    title: t<string>('Delete chain'),
    maskClosable: true,
    closable: true,
    type: 'error',
    subTitle: t<string>('You are about to delete this chain'),
    content: t<string>('Confirm delete this chain'),
    okText: t<string>('Remove')
  });

  const [isChanged, setIsChanged] = useState(false);
  const [isValueValid, setIsValueValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const chainSlug = useMemo(() => {
    return location.state as string;
  }, [location.state]);

  const chainInfo = useFetchChainInfo(chainSlug);
  const chainState = useFetchChainState(chainSlug);

  const isPureEvmChain = useMemo(() => {
    return _isPureEvmChain(chainInfo);
  }, [chainInfo]);

  const { decimals, symbol } = useMemo(() => {
    return _getChainNativeTokenBasicInfo(chainInfo);
  }, [chainInfo]);

  const currentProviderUrl = useMemo(() => {
    return chainInfo.providers[chainState.currentProvider];
  }, [chainInfo.providers, chainState.currentProvider]);

  const paraId = useMemo(() => {
    return _getSubstrateParaId(chainInfo);
  }, [chainInfo]);

  const chainId = useMemo(() => {
    return _getEvmChainId(chainInfo);
  }, [chainInfo]);

  const addressPrefix = useMemo(() => {
    return _getChainSubstrateAddressPrefix(chainInfo);
  }, [chainInfo]);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleDeleteCustomChain = useCallback(() => {
    handleSimpleConfirmModal()
      .then(() => {
        setIsDeleting(true);
        removeChain(chainInfo.slug)
          .then((result) => {
            if (result) {
              navigate(-1);
              showNotification({
                message: t('Deleted chain successfully')
              });
            } else {
              showNotification({
                message: t('Error. Please try again')
              });
              setIsDeleting(false);
            }
          })
          .catch(() => {
            showNotification({
              message: t('Error. Please try again')
            });
            setIsDeleting(false);
          });
      })
      .catch(console.log);
  }, [chainInfo.slug, handleSimpleConfirmModal, navigate, showNotification, t]);

  const chainTypeString = useCallback(() => {
    let result = '';
    const types: string[] = [];

    if (_isSubstrateChain(chainInfo)) {
      types.push('Substrate');
    }

    if (_isChainEvmCompatible(chainInfo)) {
      types.push('EVM');
    }

    for (let i = 0; i < types.length; i++) {
      result = result.concat(types[i]);

      if (i !== types.length - 1) {
        result = result.concat(', ');
      }
    }

    return result;
  }, [chainInfo]);

  const formInitValues = useMemo(() => {
    return {
      currentProvider: chainState.currentProvider,
      blockExplorer: _getBlockExplorerFromChain(chainInfo),
      crowdloanUrl: _getCrowdloanUrlFromChain(chainInfo)
    } as ChainDetailForm;
  }, [chainInfo, chainState.currentProvider]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: <Icon
        customSize={`${token.fontSizeHeading3}px`}
        phosphorIcon={Trash}
        type='phosphor'
        weight={'light'}
      />,
      onClick: handleDeleteCustomChain,
      disabled: !(_isCustomChain(chainInfo.slug) && !chainState.active)
    }
  ];

  const handleClickProviderSuffix = useCallback(() => {
    navigate('/settings/chains/add-provider', { state: chainInfo.slug });
  }, [chainInfo.slug, navigate]);

  const isSubmitDisabled = useCallback(() => {
    return !isChanged || !isValueValid || isDeleting;
  }, [isChanged, isDeleting, isValueValid]);

  const onSubmit = useCallback(() => {
    setLoading(true);

    const blockExplorer = form.getFieldValue('blockExplorer') as string;
    const crowdloanUrl = form.getFieldValue('crowdloanUrl') as string;
    const currentProvider = form.getFieldValue('currentProvider') as string;

    const params: _NetworkUpsertParams = {
      mode: 'update',
      chainEditInfo: {
        slug: chainInfo.slug,
        currentProvider: currentProvider,
        providers: chainInfo.providers,
        blockExplorer,
        crowdloanUrl
      }
    };

    upsertChain(params)
      .then((result) => {
        setLoading(false);

        if (result) {
          showNotification({
            message: t('Updated chain successfully')
          });
          navigate(-1);
        } else {
          showNotification({
            message: t('An error occurred, please try again')
          });
        }
      })
      .catch(() => {
        setLoading(false);
        showNotification({
          message: t('An error occurred, please try again')
        });
      });
  }, [chainInfo.providers, chainInfo.slug, form, navigate, showNotification, t]);

  const providerFieldSuffix = useCallback(() => {
    return (
      <Button
        className={'chain_detail__provider_suffix_btn'}
        icon={<Icon
          customSize={'20px'}
          phosphorIcon={Plus}
          type={'phosphor'}
          weight={'bold'}
        />}
        onClick={handleClickProviderSuffix}
        size={'xs'}
        type={'ghost'}
      />
    );
  }, [handleClickProviderSuffix]);

  const onFormValuesChange = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    let isFieldsValid = true;

    for (const changedField of allFields) {
      if (changedField.errors && changedField.errors.length > 0) {
        isFieldsValid = false;
      }
    }

    setIsChanged(true);
    setIsValueValid(isFieldsValid);
  }, []);

  const crowdloanUrlValidator = useCallback((rule: RuleObject, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (value.length === 0 || isUrl(value)) {
        resolve();
      } else {
        reject(new Error(t('Crowdloan URL must be a valid URL')));
      }
    });
  }, [t]);

  const blockExplorerValidator = useCallback((rule: RuleObject, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (value.length === 0 || isUrl(value)) {
        resolve();
      } else {
        reject(new Error(t('Block explorer must be a valid URL')));
      }
    });
  }, [t]);

  return (
    <PageWrapper
      className={`chain_detail ${className}`}
      resolve={dataContext.awaitStores(['chainStore'])}
    >
      <Layout.Base
        onBack={onBack}
        rightFooterButton={{
          block: true,
          disabled: isSubmitDisabled(),
          icon: (
            <Icon
              phosphorIcon={FloppyDiskBack}
              type='phosphor'
              weight={'fill'}
            />
          ),
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
        title={t<string>('Chain detail')}
      >
        <div className={'chain_detail__container'}>
          <Form
            disabled={isDeleting}
            form={form}
            initialValues={formInitValues}
            onFieldsChange={onFormValuesChange}
          >
            <div className={'chain_detail__attributes_container'}>
              {
                Object.keys(chainInfo.providers).length > 1
                  ? <Form.Item
                    name={'currentProvider'}
                  >
                    <ProviderSelector
                      chainInfo={chainInfo}
                      disabled={isDeleting}
                      value={chainState.currentProvider}
                    />
                  </Form.Item>
                  : <Field
                    className={'chain_detail__provider_url'}
                    content={currentProviderUrl}
                    placeholder={t('Provider URL')}
                    prefix={<Icon
                      customSize={'24px'}
                      iconColor={token['gray-4']}
                      phosphorIcon={ShareNetwork}
                      type={'phosphor'}
                      weight={'bold'}
                    />}
                    suffix={providerFieldSuffix()}
                  />
              }

              <Row gutter={token.paddingSM}>
                <Col span={16}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Chain name')}
                  >
                    <div>
                      <Field
                        content={chainInfo.name}
                        placeholder={t('Chain name')}
                        prefix={<Icon
                          customSize={'24px'}
                          iconColor={token['gray-4']}
                          phosphorIcon={Globe}
                          type={'phosphor'}
                          weight={'bold'}
                        />}
                      />
                    </div>
                  </Tooltip>
                </Col>
                <Col span={8}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Symbol')}
                  >
                    <div>
                      <Field
                        content={symbol}
                        placeholder={t('Symbol')}
                      />
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Row gutter={token.paddingSM}>
                <Col span={12}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Decimals')}
                  >
                    <div>
                      <Field
                        content={decimals}
                        placeholder={t('Decimals')}
                      />
                    </div>
                  </Tooltip>
                </Col>
                <Col span={12}>
                  {
                    !isPureEvmChain
                      ? <Tooltip
                        placement={'topLeft'}
                        title={t('ParaId')}
                      >
                        <div>
                          <Field
                            content={paraId > -1 ? paraId : undefined}
                            placeholder={t('ParaId')}
                          />
                        </div>
                      </Tooltip>
                      : <Tooltip
                        placement={'topLeft'}
                        title={t('Chain ID')}
                      >
                        <div>
                          <Field
                            content={chainId > -1 ? chainId : 'None'}
                            placeholder={t('Chain ID')}
                          />
                        </div>
                      </Tooltip>
                  }
                </Col>
              </Row>

              <Row gutter={token.paddingSM}>
                {
                  !isPureEvmChain &&
                  <Col span={12}>
                    <Tooltip
                      placement={'topLeft'}
                      title={t('Address prefix')}
                    >
                      <div>
                        <Field
                          content={addressPrefix.toString()}
                          placeholder={t('Address prefix')}
                        />
                      </div>
                    </Tooltip>
                  </Col>
                }

                <Col span={!isPureEvmChain ? 12 : 24}>
                  <Tooltip
                    placement={'topLeft'}
                    title={t('Chain type')}
                  >
                    <div>
                      <Field
                        content={chainTypeString()}
                        placeholder={t('Chain type')}
                      />
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Tooltip
                placement={'topLeft'}
                title={t('Block explorer')}
              >
                <div>
                  <Form.Item
                    name={'blockExplorer'}
                    rules={[{ validator: blockExplorerValidator }]}
                  >
                    <Input placeholder={t('Block explorer')} />
                  </Form.Item>
                </div>
              </Tooltip>

              <Tooltip
                placement={'topLeft'}
                title={t('Crowdloan URL')}
              >
                <div>
                  <Form.Item
                    name={'crowdloanUrl'}
                    rules={[{ validator: crowdloanUrlValidator }]}
                  >
                    <Input placeholder={t('Crowdloan URL')} />
                  </Form.Item>
                </div>
              </Tooltip>
            </div>
          </Form>
        </div>
      </Layout.Base>
    </PageWrapper>
  );
}

const ChainDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.chain_detail__container': {
      marginTop: 22,
      marginRight: token.margin,
      marginLeft: token.margin
    },

    '.chain_detail__attributes_container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginSM
    },

    '.chain_detail__provider_suffix_btn': {
      height: 'auto'
    },

    '.ant-btn.-size-xs.-icon-only': {
      minWidth: 0
    },

    '.ant-form-item': {
      marginBottom: 0
    },

    '.ant-field-container .ant-field-wrapper .ant-field-content-wrapper .ant-field-content': {
      color: token.colorTextLight5
    },

    '.chain_detail__provider_url .ant-field-wrapper .ant-field-content-wrapper .ant-field-content': {
      color: token.colorTextLight1
    }
  });
});

export default ChainDetail;