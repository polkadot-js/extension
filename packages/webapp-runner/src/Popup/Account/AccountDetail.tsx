// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, PageWrapper } from "@subwallet-webapp/components";
import AccountAvatar from "@subwallet-webapp/components/Account/AccountAvatar";
import useDeleteAccount from "@subwallet-webapp/hooks/account/useDeleteAccount";
import useGetAccountByAddress from "@subwallet-webapp/hooks/account/useGetAccountByAddress";
import useGetAccountSignModeByAddress from "@subwallet-webapp/hooks/account/useGetAccountSignModeByAddress";
import useNotification from "@subwallet-webapp/hooks/common/useNotification";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import {
  deriveAccountV3,
  editAccount,
  forgetAccount,
} from "@subwallet-webapp/messaging";
import { PhosphorIcon, Theme, ThemeProps } from "@subwallet-webapp/types";
import { AccountSignMode } from "@subwallet-webapp/types/account";
import { FormCallbacks, FormFieldData } from "@subwallet-webapp/types/form";
import { toShort } from "@subwallet-webapp/util";
import { copyToClipboard } from "@subwallet-webapp/util/common/dom";
import { convertFieldToObject } from "@subwallet-webapp/util/form/form";
import {
  BackgroundIcon,
  Button,
  Field,
  Form,
  Icon,
  Input,
  QRCode,
} from "@subwallet/react-ui";
import CN from "classnames";
import {
  CircleNotch,
  CopySimple,
  Export,
  Eye,
  FloppyDiskBack,
  QrCode,
  ShareNetwork,
  Swatches,
  TrashSimple,
  User,
} from "phosphor-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import styled, { useTheme } from "styled-components";

type Props = ThemeProps;

enum FormFieldName {
  NAME = "name",
}

enum ActionType {
  EXPORT = "export",
  DERIVE = "derive",
  DELETE = "delete",
}

interface DetailFormState {
  [FormFieldName.NAME]: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();
  const notify = useNotification();
  const { token } = useTheme() as Theme;
  const { accountAddress } = useParams();

  const [form] = Form.useForm<DetailFormState>();

  const account = useGetAccountByAddress(accountAddress);
  const deleteAccountAction = useDeleteAccount();

  const saveTimeOutRef = useRef<NodeJS.Timer>();

  const [deleting, setDeleting] = useState(false);
  const [deriving, setDeriving] = useState(false);
  const [saving, setSaving] = useState(false);

  const signMode = useGetAccountSignModeByAddress(accountAddress);

  const canDerive = useMemo((): boolean => {
    if (account) {
      if (account.isExternal) {
        return false;
      } else {
        if (account.type === "ethereum") {
          return !!account.isMasterAccount;
        } else {
          return true;
        }
      }
    } else {
      return false;
    }
  }, [account]);

  const walletNamePrefixIcon = useMemo((): PhosphorIcon => {
    switch (signMode) {
      case AccountSignMode.LEDGER:
        return Swatches;
      case AccountSignMode.QR:
        return QrCode;
      case AccountSignMode.READ_ONLY:
        return Eye;
      default:
        return User;
    }
  }, [signMode]);

  const onDelete = useCallback(() => {
    if (account?.address) {
      deleteAccountAction()
        .then(() => {
          setDeleting(true);
          forgetAccount(account.address)
            .then(() => {
              goHome();
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
  }, [account?.address, deleteAccountAction, notify, goHome]);

  const onDerive = useCallback(() => {
    if (!account?.address) {
      return;
    }

    setDeriving(true);

    setTimeout(() => {
      deriveAccountV3({
        address: account.address,
      })
        .then(() => {
          goHome();
        })
        .catch((e: Error) => {
          notify({
            message: e.message,
            type: "error",
          });
        })
        .finally(() => {
          setDeriving(false);
        });
    }, 500);
  }, [account?.address, goHome, notify]);

  const onExport = useCallback(() => {
    if (account?.address) {
      navigate(`/accounts/export/${account.address}`);
    }
  }, [account?.address, navigate]);

  const onCopyAddress = useCallback(() => {
    copyToClipboard(account?.address || "");
    notify({
      message: "Copied",
    });
  }, [account?.address, notify]);

  const onUpdate: FormCallbacks<DetailFormState>["onFieldsChange"] =
    useCallback(
      (changedFields: FormFieldData[], allFields: FormFieldData[]) => {
        const changeMap = convertFieldToObject<DetailFormState>(changedFields);

        if (changeMap[FormFieldName.NAME]) {
          clearTimeout(saveTimeOutRef.current);
          setSaving(true);
          saveTimeOutRef.current = setTimeout(() => {
            form.submit();
          }, 1000);
        }
      },
      [form]
    );

  const onSubmit: FormCallbacks<DetailFormState>["onFinish"] = useCallback(
    (values: DetailFormState) => {
      clearTimeout(saveTimeOutRef.current);
      const name = values[FormFieldName.NAME];

      if (!account || name === account.name) {
        setSaving(false);

        return;
      }

      const address = account.address;

      if (!address) {
        setSaving(false);

        return;
      }

      editAccount(account.address, name.trim())
        .catch(console.error)
        .finally(() => {
          setSaving(false);
        });
    },
    [account]
  );

  useEffect(() => {
    if (!account) {
      goHome();
    }
  }, [account, goHome, navigate]);

  if (!account) {
    return null;
  }

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        disableBack={deriving}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome,
            disabled: deriving,
          },
        ]}
        title={t("Account detail")}
      >
        <div className="body-container">
          <div className="account-qr">
            <QRCode
              errorLevel="M"
              icon=""
              iconSize={token.sizeLG * 1.5}
              size={token.sizeXL * 3.5}
              value={account.address}
            />
          </div>
          <Form
            form={form}
            initialValues={{
              [FormFieldName.NAME]: account.name || "",
            }}
            name="account-detail-form"
            onFieldsChange={onUpdate}
            onFinish={onSubmit}
          >
            <Form.Item
              className={CN("account-field")}
              name={FormFieldName.NAME}
              rules={[
                {
                  message: "Wallet name is required",
                  transform: (value: string) => value.trim(),
                  required: true,
                },
              ]}
              statusHelpAsTooltip={true}
            >
              <Input
                className="account-name-input"
                disabled={deriving}
                label={t("Wallet name")}
                onBlur={form.submit}
                placeholder={t("Wallet name")}
                prefix={
                  <BackgroundIcon
                    backgroundColor="var(--wallet-name-icon-bg-color)"
                    iconColor="var(--wallet-name-icon-color)"
                    phosphorIcon={walletNamePrefixIcon}
                  />
                }
                suffix={
                  <Icon
                    className={CN({ loading: saving })}
                    phosphorIcon={saving ? CircleNotch : FloppyDiskBack}
                    size="sm"
                  />
                }
              />
            </Form.Item>
          </Form>
          <div className={CN("account-field", "mb-lg")}>
            <Field
              content={toShort(account.address, 11, 13)}
              label={t("Wallet address")}
              placeholder={t("Wallet address")}
              prefix={
                <AccountAvatar size={token.sizeMD} value={account.address} />
              }
              suffix={
                <Button
                  icon={<Icon phosphorIcon={CopySimple} size="sm" />}
                  onClick={onCopyAddress}
                  size="xs"
                  type="ghost"
                />
              }
            />
          </div>
          <Button
            block={true}
            className={CN("account-button", `action-type-${ActionType.DERIVE}`)}
            contentAlign="left"
            disabled={!canDerive}
            icon={
              <BackgroundIcon
                backgroundColor="var(--icon-bg-color)"
                phosphorIcon={ShareNetwork}
                size="sm"
                weight="fill"
              />
            }
            loading={deriving}
            onClick={onDerive}
            schema="secondary"
          >
            {t("Derive account")}
          </Button>
          <Button
            block={true}
            className={CN("account-button", `action-type-${ActionType.EXPORT}`)}
            contentAlign="left"
            disabled={account.isExternal || deriving}
            icon={
              <BackgroundIcon
                backgroundColor="var(--icon-bg-color)"
                phosphorIcon={Export}
                size="sm"
                weight="fill"
              />
            }
            onClick={onExport}
            schema="secondary"
          >
            {t("Export account")}
          </Button>
          <Button
            block={true}
            className={CN("account-button", `action-type-${ActionType.DELETE}`)}
            contentAlign="left"
            disabled={deriving}
            icon={
              <BackgroundIcon
                backgroundColor="var(--icon-bg-color)"
                phosphorIcon={TrashSimple}
                size="sm"
                weight="fill"
              />
            }
            loading={deleting}
            onClick={onDelete}
            schema="secondary"
          >
            {t("Remove account")}
          </Button>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const AccountDetail = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".body-container": {
        padding: `0 ${token.padding}px`,
        "--wallet-name-icon-bg-color": token["geekblue-6"],
        "--wallet-name-icon-color": token.colorWhite,

        ".ant-background-icon": {
          width: token.sizeMD,
          height: token.sizeMD,

          ".anticon": {
            height: token.sizeSM,
            width: token.sizeSM,
          },
        },

        ".account-qr": {
          marginTop: token.margin,
          marginBottom: token.marginLG,
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        },

        ".account-field": {
          marginBottom: token.marginXS,

          ".single-icon-only": {
            color: token["gray-4"],
          },

          ".ant-input-label": {
            marginBottom: token.marginXS - 2,
          },

          ".ant-input-suffix": {
            marginRight: 0,
          },

          ".ant-btn": {
            height: "auto",
            marginRight: -(token.marginSM - 2),
          },
        },

        ".mb-lg": {
          marginBottom: token.marginLG,
        },

        ".account-button": {
          marginBottom: token.marginXS,
          gap: token.sizeXS,
          color: token.colorTextLight1,

          "&:disabled": {
            color: token.colorTextLight1,
            opacity: 0.4,
          },
        },

        [`.action-type-${ActionType.DERIVE}`]: {
          "--icon-bg-color": token["magenta-7"],
        },

        [`.action-type-${ActionType.EXPORT}`]: {
          "--icon-bg-color": token["green-6"],
        },

        [`.action-type-${ActionType.DELETE}`]: {
          "--icon-bg-color": token["colorError-6"],
          color: token["colorError-6"],

          ".ant-background-icon": {
            color: token.colorTextLight1,
          },

          "&:disabled": {
            color: token["colorError-6"],

            ".ant-background-icon": {
              color: token.colorTextLight1,
            },
          },
        },
      },

      ".account-name-input": {
        ".loading": {
          color: token["gray-5"],
          animation: "spinner-loading 1s infinite linear",
        },
      },
    };
  }
);

export default AccountDetail;
