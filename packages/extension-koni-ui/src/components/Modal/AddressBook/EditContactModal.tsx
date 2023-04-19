// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AddressJson } from '@subwallet/extension-base/background/types';
import { Avatar } from '@subwallet/extension-koni-ui/components';
import { DELETE_ADDRESS_BOOK_MODAL, EDIT_ADDRESS_BOOK_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useCopy, useNotification } from '@subwallet/extension-koni-ui/hooks';
import { editContactAddress, removeContactAddress } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { noop, simpleCheckForm, toShort } from '@subwallet/extension-koni-ui/utils';
import { Button, Field, Form, Icon, Input, ModalContext, SwModal, SwModalFuncProps, useExcludeModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CopySimple, Trash } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useConfirmModal from '../../../hooks/modal/useConfirmModal';

interface Props extends ThemeProps {
  addressJson: AddressJson
}

enum FormFieldName {
  NAME = 'name'
}

interface AddContactFormProps {
  [FormFieldName.NAME]: string;
}

const modalId = EDIT_ADDRESS_BOOK_MODAL;

const defaultFormValues: AddContactFormProps = {
  [FormFieldName.NAME]: ''
};

const Component: React.FC<Props> = (props: Props) => {
  const { addressJson, className } = props;
  const { address, name: defaultName } = addressJson;

  const { t } = useTranslation();
  const notification = useNotification();

  const { checkActive, inactiveModal } = useContext(ModalContext);

  useExcludeModal(modalId);

  const isActive = checkActive(modalId);

  const modalProps: SwModalFuncProps = useMemo(() => {
    return {
      closable: true,
      content: t('You will no longer be able to access this account via this extension'),
      id: DELETE_ADDRESS_BOOK_MODAL,
      okText: t('Remove'),
      subTitle: t('You are about to remove the account'),
      title: t('Confirmation'),
      type: 'error',
      maskClosable: true
    };
  }, [t]);

  const { handleSimpleConfirmModal: onClickDelete } = useConfirmModal(modalProps);

  const [form] = Form.useForm<AddContactFormProps>();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDisabled, setIsDisabled] = useState(!defaultName?.trim());

  const onCopyAddress = useCopy(address);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onFieldsChange: FormCallbacks<AddContactFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setIsDisabled(empty || error);
  }, []);

  const onSubmit: FormCallbacks<AddContactFormProps>['onFinish'] = useCallback((values: AddContactFormProps) => {
    const { [FormFieldName.NAME]: name } = values;

    setLoading(true);

    setTimeout(() => {
      editContactAddress(address, name)
        .then(() => {
          inactiveModal(modalId);
        })
        .catch((e: Error) => {
          notification({
            message: e.message,
            type: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [address, inactiveModal, notification]);

  const onDelete = useCallback(() => {
    if (!address) {
      return;
    }

    onClickDelete()
      .then(() => {
        setDeleting(true);
        removeContactAddress(address).finally(() => {
          setDeleting(false);
          inactiveModal(modalId);
        });
      })
      .finally(noop);
  }, [address, onClickDelete, inactiveModal]);

  useEffect(() => {
    form.setFieldValue(FormFieldName.NAME, defaultName || '');
  }, [defaultName, form, isActive]);

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      onCancel={(!loading && !deleting) ? onCancel : undefined}
      title={t('Edit contact')}
    >
      <Form
        className='form-space-sm'
        form={form}
        initialValues={defaultFormValues}
        name='edit-contact-form'
        onFieldsChange={onFieldsChange}
        onFinish={onSubmit}
      >
        <Form.Item
          name={FormFieldName.NAME}
          rules={[
            {
              required: true,
              transform: (value: string) => value.trim(),
              message: t('Contact name is required')
            }
          ]}
          statusHelpAsTooltip={true}
        >
          <Input
            label={t('Contact name')}
            prefix={(
              <Avatar
                size={20}
                value={address}
              />
            )}
          />
        </Form.Item>
        <Form.Item>
          <Field
            className='address-input'
            content={toShort(address, 12, 12)}
            label={t('Contact address')}
            suffix={(
              <Button
                className='copy-button'
                icon={(
                  <Icon
                    phosphorIcon={CopySimple}
                    size='sm'
                  />
                )}
                onClick={onCopyAddress}
                size='xs'
                type='ghost'
              />
            )}
          />
        </Form.Item>
        <Form.Item
          className='button-container'
        >
          <Button
            disabled={loading}
            icon={(
              <Icon
                phosphorIcon={Trash}
                weight='fill'
              />
            )}
            loading={deleting}
            onClick={onDelete}
            schema='danger'
          />
          <Button
            block={true}
            disabled={loading || deleting}
            onClick={onCancel}
            schema='secondary'
          >
            {t('Cancel')}
          </Button>
          <Button
            block={true}
            disabled={isDisabled || deleting}
            htmlType='submit'
            loading={loading}
          >
            {t('Save')}
          </Button>
        </Form.Item>
      </Form>
    </SwModal>
  );
};

const EditContactModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.copy-button': {
      height: 'auto'
    },

    '.ant-form-item.button-container': {
      marginBottom: 0,

      '.ant-form-item-control-input-content': {
        display: 'flex',
        flexDirection: 'row',
        gap: token.sizeSM
      }
    }
  };
});

export default EditContactModal;
