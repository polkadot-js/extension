// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from "@subwallet-webapp/components";
import CloseIcon from "@subwallet-webapp/components/Icon/CloseIcon";
import { EVM_ACCOUNT_TYPE } from "@subwallet-webapp/constants/account";
import { IMPORT_ACCOUNT_MODAL } from "@subwallet-webapp/constants/modal";
import useCompleteCreateAccount from "@subwallet-webapp/hooks/account/useCompleteCreateAccount";
import useGetDefaultAccountName from "@subwallet-webapp/hooks/account/useGetDefaultAccountName";
import useGoBackFromCreateAccount from "@subwallet-webapp/hooks/account/useGoBackFromCreateAccount";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useFocusFormItem from "@subwallet-webapp/hooks/form/useFocusFormItem";
import useAutoNavigateToCreatePassword from "@subwallet-webapp/hooks/router/useAutoNavigateToCreatePassword";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import {
  createAccountSuriV2,
  validateMetamaskPrivateKeyV2,
} from "@subwallet-webapp/messaging";
import { ThemeProps } from "@subwallet-webapp/types";
import { ValidateState } from "@subwallet-webapp/types/validator";
import { Form, Icon, Input } from "@subwallet/react-ui";
import CN from "classnames";
import { FileArrowDown } from "phosphor-react";
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

type Props = ThemeProps;

const FooterIcon = <Icon phosphorIcon={FileArrowDown} weight="fill" />;

const formName = "import-private-key-form";
const fieldName = "private-key";

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);

  const timeOutRef = useRef<NodeJS.Timer>();

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [autoCorrect, setAutoCorrect] = useState("");
  const [form] = Form.useForm();

  const accountName = useGetDefaultAccountName();

  // Auto focus field
  useFocusFormItem(form, fieldName);

  const onChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      setChanged(true);
      setAutoCorrect("");
      const val = event.target.value;

      setPrivateKey(val);
    },
    []
  );

  const onSubmit = useCallback(() => {
    if (privateKey) {
      setLoading(true);
      createAccountSuriV2({
        name: accountName,
        suri: privateKey,
        isAllowed: true,
        types: [EVM_ACCOUNT_TYPE],
      })
        .then(() => {
          onComplete();
        })
        .catch((error: Error): void => {
          setValidateState({
            status: "error",
            message: error.message,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [privateKey, accountName, onComplete]);

  useEffect(() => {
    let amount = true;

    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
    }

    if (amount) {
      if (privateKey) {
        setValidating(true);
        setValidateState({
          status: "validating",
          message: "",
        });

        timeOutRef.current = setTimeout(() => {
          validateMetamaskPrivateKeyV2(privateKey, [EVM_ACCOUNT_TYPE])
            .then(({ addressMap, autoAddPrefix }) => {
              if (amount) {
                if (autoAddPrefix) {
                  setAutoCorrect(`0x${privateKey}`);
                }

                setValidateState({});
              }
            })
            .catch((e: Error) => {
              if (amount) {
                setValidateState({
                  status: "error",
                  message: e.message,
                });
              }
            })
            .finally(() => {
              if (amount) {
                setValidating(false);
              }
            });
        }, 300);
      } else {
        if (changed) {
          setValidateState({
            status: "error",
            message: "Seed phrase is required",
          });
        }
      }
    }

    return () => {
      amount = false;
    };
  }, [privateKey, changed]);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: validating ? t("Validating") : t("Import account"),
          icon: FooterIcon,
          onClick: onSubmit,
          disabled: !privateKey || !!validateState.status,
          loading: validating || loading,
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome,
          },
        ]}
        title={t<string>("Import via Private Key")}
      >
        <div className="container">
          <div className="description">
            {t(
              "To import an existing wallet, please enter the private key here"
            )}
          </div>
          <Form className="form-container" form={form} name={formName}>
            <Form.Item
              help={validateState.message}
              name={fieldName}
              validateStatus={validateState.status}
            >
              <Input.TextArea
                className="private-key-input"
                onChange={onChange}
                placeholder={t("Enter or paste private key")}
                value={autoCorrect || privateKey || ""}
              />
            </Form.Item>
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ImportPrivateKey = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".container": {
        padding: token.padding,
      },

      ".description": {
        padding: `0 ${token.padding}px`,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6,
        color: token.colorTextDescription,
        textAlign: "center",
      },

      ".form-container": {
        marginTop: token.margin,
      },

      ".private-key-input": {
        textarea: {
          resize: "none",
          height: `${token.sizeLG * 6}px !important`,
        },
      },
    };
  }
);

export default ImportPrivateKey;
