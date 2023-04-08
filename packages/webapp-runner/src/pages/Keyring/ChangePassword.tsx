// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from "@subwallet-webapp/components";
import InfoIcon from "@subwallet-webapp/components/Icon/InfoIcon";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useFocusFormItem from "@subwallet-webapp/hooks/form/useFocusFormItem";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import { keyringChangeMasterPassword } from "@subwallet-webapp/messaging";
import { ThemeProps } from "@subwallet-webapp/types";
import { simpleCheckForm } from "@subwallet-webapp/util/form/form";
import {
  renderBaseConfirmPasswordRules,
  renderBasePasswordRules,
} from "@subwallet-webapp/util/form/validators/password";
import { Form, Icon, Input, PageIcon } from "@subwallet/react-ui";
import CN from "classnames";
import { FloppyDiskBack, ShieldCheck } from "phosphor-react";
import { Callbacks, FieldData } from "rc-field-form/lib/interface";
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

type Props = ThemeProps;

enum FormFieldName {
  PASSWORD = "password",
  OLD_PASSWORD = "old_password",
  CONFIRM_PASSWORD = "confirm_password",
}

interface ChangePasswordFormState {
  [FormFieldName.PASSWORD]: string;
  [FormFieldName.OLD_PASSWORD]: string;
  [FormFieldName.CONFIRM_PASSWORD]: string;
}

const newPasswordRules = renderBasePasswordRules("New password");
const confirmPasswordRules = renderBaseConfirmPasswordRules(
  FormFieldName.PASSWORD
);
const formName = "change-password-form";

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();

  const [form] = Form.useForm<ChangePasswordFormState>();
  const [isDisabled, setIsDisable] = useState(true);
  const [submitError, setSubmitError] = useState("");

  const [loading, setLoading] = useState(false);

  const goBack = useCallback(() => {
    navigate("/settings/security");
  }, [navigate]);

  const onSubmit: Callbacks<ChangePasswordFormState>["onFinish"] = useCallback(
    (values: ChangePasswordFormState) => {
      const password = values[FormFieldName.PASSWORD];
      const oldPassword = values[FormFieldName.OLD_PASSWORD];

      if (password && oldPassword) {
        setLoading(true);
        setTimeout(() => {
          keyringChangeMasterPassword({
            createNew: false,
            newPassword: password,
            oldPassword: oldPassword,
          })
            .then((res) => {
              if (!res.status) {
                setSubmitError(res.errors[0]);
              } else {
                goHome();
              }
            })
            .catch((e: Error) => {
              setSubmitError(e.message);
            })
            .finally(() => {
              setLoading(false);
            });
        }, 1000);
      }
    },
    [goHome]
  );

  const onUpdate: Callbacks<ChangePasswordFormState>["onFieldsChange"] =
    useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
      const { empty, error } = simpleCheckForm(allFields);

      setSubmitError("");
      setIsDisable(error || empty);
    }, []);

  const onChangePassword = useCallback(() => {
    form.resetFields([FormFieldName.CONFIRM_PASSWORD]);
  }, [form]);

  useFocusFormItem(form, FormFieldName.OLD_PASSWORD);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        rightFooterButton={{
          children: t("Save"),
          onClick: form.submit,
          loading: loading,
          disabled: isDisabled,
          icon: <Icon phosphorIcon={FloppyDiskBack} weight="fill" />,
        }}
        subHeaderIcons={[
          {
            icon: <InfoIcon />,
          },
        ]}
        title={t("Change password")}
      >
        <div className="body-container">
          <div className="page-icon">
            <PageIcon
              color="var(--page-icon-color)"
              iconProps={{
                weight: "fill",
                phosphorIcon: ShieldCheck,
              }}
            />
          </div>
          <div className="title">{t("Change your password")}</div>
          <Form
            form={form}
            initialValues={{
              [FormFieldName.OLD_PASSWORD]: "",
              [FormFieldName.PASSWORD]: "",
              [FormFieldName.CONFIRM_PASSWORD]: "",
            }}
            name={formName}
            onFieldsChange={onUpdate}
            onFinish={onSubmit}
          >
            <Form.Item
              name={FormFieldName.OLD_PASSWORD}
              rules={[
                {
                  message: "Password is required",
                  required: true,
                },
              ]}
              statusHelpAsTooltip={true}
            >
              <Input
                disabled={loading}
                placeholder={t("Current password")}
                type="password"
              />
            </Form.Item>
            <Form.Item
              name={FormFieldName.PASSWORD}
              rules={newPasswordRules}
              statusHelpAsTooltip={true}
            >
              <Input
                disabled={loading}
                onChange={onChangePassword}
                placeholder={t("New password")}
                type="password"
              />
            </Form.Item>
            <Form.Item
              name={FormFieldName.CONFIRM_PASSWORD}
              rules={confirmPasswordRules}
              statusHelpAsTooltip={true}
            >
              <Input
                disabled={loading}
                placeholder={t("Confirm new password")}
                type="password"
              />
            </Form.Item>
            <Form.Item
              help={submitError}
              validateStatus={submitError && "error"}
            />
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ChangePassword = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".body-container": {
        padding: `0 ${token.padding}px`,
        textAlign: "center",

        ".page-icon": {
          display: "flex",
          justifyContent: "center",
          marginTop: token.margin,
          "--page-icon-color": token.colorSecondary,
        },

        ".title": {
          marginTop: token.margin,
          marginBottom: token.margin * 2,
          fontWeight: token.fontWeightStrong,
          fontSize: token.fontSizeHeading3,
          lineHeight: token.lineHeightHeading3,
          color: token.colorTextBase,
        },
      },
    };
  }
);

export default ChangePassword;
