// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from "@subwallet/extension-base/background/types";
import { ALL_ACCOUNT_KEY } from "@subwallet/extension-base/constants";
import { Layout, PageWrapper } from "@subwallet-webapp/components";
import InfoIcon from "@subwallet-webapp/components/Icon/InfoIcon";
import useDeleteAccount from "@subwallet-webapp/hooks/account/useDeleteAccount";
import useNotification from "@subwallet-webapp/hooks/common/useNotification";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import {
  forgetAccount,
  keyringMigrateMasterPassword,
} from "@subwallet-webapp/messaging";
import MigrateDone from "@subwallet-webapp/Popup/Keyring/ApplyMasterPassword/Done";
import IntroductionMigratePassword from "@subwallet-webapp/Popup/Keyring/ApplyMasterPassword/Introduction";
import { RootState } from "@subwallet-webapp/stores";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { toShort } from "@subwallet-webapp/util";
import { simpleCheckForm } from "@subwallet-webapp/util/form/form";
import {
  Button,
  ButtonProps,
  Field,
  Form,
  Icon,
  Input,
} from "@subwallet/react-ui";
import SwAvatar from "@subwallet/react-ui/es/sw-avatar";
import CN from "classnames";
import { ArrowCircleRight, CheckCircle, Trash } from "phosphor-react";
import { Callbacks, FieldData } from "rc-field-form/lib/interface";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";

type Props = ThemeProps;

type PageStep = "Introduction" | "Migrate" | "Done";

enum FormFieldName {
  PASSWORD = "password",
}

interface MigratePasswordFormState {
  [FormFieldName.PASSWORD]: string;
}

const nextIcon = <Icon phosphorIcon={ArrowCircleRight} weight="fill" />;

const finishIcon = <Icon phosphorIcon={CheckCircle} weight="fill" />;

const removeIcon = <Icon phosphorIcon={Trash} />;

const formName = "migrate-password-form";
const passwordInputId = `${formName}_${FormFieldName.PASSWORD}`;

const focusPassword = () => {
  setTimeout(() => {
    const element = document.getElementById(passwordInputId);

    if (element) {
      element.focus();
    }
  }, 10);
};

const selectPassword = () => {
  setTimeout(() => {
    const element = document.getElementById(passwordInputId);

    if (element) {
      (element as HTMLInputElement).select();
    }
  }, 10);
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { t } = useTranslation();
  const goHome = useDefaultNavigate().goHome;
  const notify = useNotification();
  const { token } = useTheme() as Theme;

  const deleteAccountAction = useDeleteAccount();

  const { accounts } = useSelector((state: RootState) => state.accountState);
  const [step, setStep] = useState<PageStep>("Introduction");
  const [form] = Form.useForm<MigratePasswordFormState>();
  const [currentAccount, setCurrentAccount] = useState<AccountJson | undefined>(
    undefined
  );
  const [isDisabled, setIsDisable] = useState(true);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canMigrate = useMemo(
    () =>
      accounts.filter(
        (acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal
      ),
    [accounts]
  );

  const needMigrate = useMemo(
    () => canMigrate.filter((acc) => !acc.isMasterPassword),
    [canMigrate]
  );

  const onBack = useCallback(() => {
    setStep("Introduction");
  }, []);

  const onUpdate: Callbacks<MigratePasswordFormState>["onFieldsChange"] =
    useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
      const { empty, error } = simpleCheckForm(allFields);

      setIsDisable(error || empty);
    }, []);

  const onSubmit: Callbacks<MigratePasswordFormState>["onFinish"] = useCallback(
    (values: MigratePasswordFormState) => {
      const password = values[FormFieldName.PASSWORD];

      if (currentAccount?.address && password) {
        setLoading(true);
        setTimeout(() => {
          keyringMigrateMasterPassword({
            address: currentAccount.address,
            password: password,
          })
            .then((res) => {
              if (!res.status) {
                form.setFields([
                  { name: FormFieldName.PASSWORD, errors: [res.errors[0]] },
                ]);
                selectPassword();
                setIsError(true);
              } else {
                setIsError(false);
              }
            })
            .catch((e: Error) => {
              setIsError(true);
              form.setFields([
                { name: FormFieldName.PASSWORD, errors: [e.message] },
              ]);
              selectPassword();
            })
            .finally(() => {
              setLoading(false);
            });
        }, 500);
      }
    },
    [currentAccount?.address, form]
  );

  const title = useMemo((): string => {
    const migrated = canMigrate.length - needMigrate.length;

    switch (step) {
      case "Introduction":
        return t<string>("Apply master password");
      case "Done":
        return t<string>("Successful");
      case "Migrate":
        return `${String(migrated + 1).padStart(2, "0")}/${String(
          canMigrate.length
        ).padStart(2, "0")}`;
      default:
        return "";
    }
  }, [t, step, needMigrate.length, canMigrate.length]);

  const footerButton = useMemo((): ButtonProps => {
    switch (step) {
      case "Introduction":
        return {
          children: t("Apply master password now"),
          onClick: () => {
            setStep(needMigrate.length ? "Migrate" : "Done");
          },
          icon: nextIcon,
        };
      case "Done":
        return {
          children: t("Finish"),
          onClick: () => {
            goHome();
          },
          icon: finishIcon,
        };
      case "Migrate":
        return {
          children: t("Next"),
          onClick: () => {
            form.submit();
          },
          icon: nextIcon,
        };
    }
  }, [form, goHome, needMigrate.length, step, t]);

  const onDelete = useCallback(() => {
    if (currentAccount?.address) {
      deleteAccountAction()
        .then(() => {
          setDeleting(true);
          setTimeout(() => {
            forgetAccount(currentAccount.address)
              .then(() => {
                setIsError(false);
              })
              .catch((e: Error) => {
                notify({
                  message: e.message,
                  type: "error",
                });
              })
              .finally(() => {
                setDeleting(false);
              });
          }, 500);
        })
        .catch((e: Error) => {
          if (e) {
            notify({
              message: e.message,
              type: "error",
            });
          }
        });
    }
  }, [currentAccount?.address, deleteAccountAction, notify]);

  useEffect(() => {
    setStep((prevState) => {
      if (prevState !== "Introduction") {
        return needMigrate.length ? "Migrate" : "Done";
      } else {
        return "Introduction";
      }
    });
  }, [needMigrate.length, deleting]);

  useEffect(() => {
    if (step === "Migrate") {
      setCurrentAccount((prevState) => {
        if (deleting) {
          return prevState;
        }

        if (!prevState) {
          form.resetFields();
          setIsDisable(true);

          return needMigrate[0];
        } else {
          const exists = needMigrate.find(
            (acc) => acc.address === prevState.address
          );

          form.resetFields();
          setIsDisable(true);

          if (exists) {
            return prevState;
          } else {
            return needMigrate[0];
          }
        }
      });

      focusPassword();
    } else {
      setIsError(false);
      form.resetFields();
      setIsDisable(true);
    }
  }, [form, needMigrate, deleting, step]);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        disableBack={loading}
        onBack={onBack}
        rightFooterButton={{
          ...footerButton,
          disabled: step === "Migrate" && (isDisabled || deleting),
          loading: step === "Migrate" && loading,
        }}
        showBackButton={step !== "Introduction"}
        subHeaderIcons={[
          {
            icon: <InfoIcon />,
          },
        ]}
        title={title}
      >
        {step === "Introduction" && <IntroductionMigratePassword />}
        {step === "Done" && <MigrateDone accounts={canMigrate} />}
        {step === "Migrate" && currentAccount && (
          <div className="body-container">
            <div className="account-avatar">
              <SwAvatar
                size={token.sizeLG * 4}
                theme={
                  currentAccount.type === "ethereum" ? "ethereum" : "polkadot"
                }
                value={currentAccount.address}
              />
            </div>
            <Form
              form={form}
              initialValues={{
                [FormFieldName.PASSWORD]: "",
              }}
              name={formName}
              onFieldsChange={onUpdate}
              onFinish={onSubmit}
            >
              <Form.Item>
                <Field
                  content={currentAccount.name || ""}
                  label={t("Account name")}
                  placeholder={t("Account name")}
                />
              </Form.Item>
              <Form.Item>
                <Field
                  content={toShort(currentAccount.address || "", 15, 17)}
                  label={t("Account address")}
                  placeholder={t("Account address")}
                />
              </Form.Item>
              <Form.Item
                name={FormFieldName.PASSWORD}
                rules={[
                  {
                    message: "Current password is required",
                    required: true,
                  },
                ]}
                statusHelpAsTooltip={true}
              >
                <Input label={t("Current password")} type="password" />
              </Form.Item>
              {isError && (
                <Form.Item className="form-item-button">
                  <Button
                    icon={removeIcon}
                    loading={deleting}
                    onClick={onDelete}
                    size="xs"
                    type="ghost"
                  >
                    {t("Remove this account")}
                  </Button>
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ApplyMasterPassword = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".body-container": {
        padding: `0 ${token.padding}px`,

        ".account-avatar": {
          marginTop: token.margin,
          marginBottom: token.margin * 2,
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        },

        ".ant-field-content-wrapper": {
          ".ant-field-content": {
            color: token.colorTextDescription,
          },
        },

        ".ant-form-item": {
          marginBottom: token.marginXS,
        },

        ".form-item-no-error": {
          ".ant-form-item-explain": {
            display: "none",
          },
        },

        ".form-item-button": {
          paddingTop: token.marginXXS,
          marginBottom: 0,

          ".ant-form-item-control-input-content": {
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          },
        },
      },
    };
  }
);

export default ApplyMasterPassword;
