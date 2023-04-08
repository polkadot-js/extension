import { REQUEST_CREATE_PASSWORD_MODAL } from "@subwallet-webapp/constants/modal"
import { DEFAULT_ROUTER_PATH } from "@subwallet-webapp/constants/router"
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation"
import useFocusFormItem from "@subwallet-webapp/hooks/form/useFocusFormItem"
import { keyringChangeMasterPassword } from "@subwallet-webapp/messaging"
import { RootState } from "@subwallet-webapp/stores"
import { ThemeProps } from "@subwallet-webapp/types"
import { isNoAccount } from "@subwallet-webapp/util/account/account"
import { simpleCheckForm } from "@subwallet-webapp/util/form/form"
import {
  renderBaseConfirmPasswordRules,
  renderBasePasswordRules,
} from "@subwallet-webapp/util/form/validators/password"
import { Form, ModalContext } from "@subwallet/react-ui"
import { Callbacks, FieldData } from "rc-field-form/lib/interface"
import { useCallback, useContext, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"

export enum FormFieldName {
  PASSWORD = "password",
  CONFIRM_PASSWORD = "confirm_password",
}

interface CreatePasswordFormState {
  [FormFieldName.PASSWORD]: string
  [FormFieldName.CONFIRM_PASSWORD]: string
}

export const passwordRules = renderBasePasswordRules("Password")
export const confirmPasswordRules = renderBaseConfirmPasswordRules(
  FormFieldName.PASSWORD
)

export const modalId = "create-password-instruction-modal"
export const formName = "create-password-form"

const useCreatePassword = () => {
  const { t } = useTranslation()
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext)
  const navigate = useNavigate()
  const previousInfo = useLocation().state as {
    prevPathname: string
    prevState: any
  }

  const { accounts } = useSelector((state: RootState) => state.accountState)

  const [noAccount] = useState(isNoAccount(accounts))

  const [form] = Form.useForm<CreatePasswordFormState>()
  const [isDisabled, setIsDisable] = useState(true)
  const [submitError, setSubmitError] = useState("")

  const [loading, setLoading] = useState(false)

  const [isDesktop, setIsDesktop] = useState<boolean>(true)

  const handleWindowResize = useCallback(() => {
    if (window.innerWidth < 1200 && isDesktop) setIsDesktop(false)
    if (window.innerWidth >= 1200 && !isDesktop) setIsDesktop(true)
  }, [isDesktop])

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize)
    ;() => {
      window.removeEventListener("resize", handleWindowResize)
    }
  }, [handleWindowResize])

  const onComplete = useCallback(() => {
    if (previousInfo?.prevPathname) {
      navigate(previousInfo.prevPathname, {
        state: previousInfo.prevState as unknown,
      })
    } else {
      navigate(DEFAULT_ROUTER_PATH)
    }
  }, [navigate, previousInfo?.prevPathname, previousInfo?.prevState])

  const onSubmit: Callbacks<CreatePasswordFormState>["onFinish"] = useCallback(
    (values: CreatePasswordFormState) => {
      const password = values[FormFieldName.PASSWORD]
      // eslint-disable-next-line no-debugger
      debugger

      if (password) {
        setLoading(true)
        keyringChangeMasterPassword({
          createNew: true,
          newPassword: password,
        })
          .then((res) => {
            if (!res.status) {
              setSubmitError(res.errors[0])
            } else {
              onComplete()
            }
          })
          .catch((e: Error) => {
            setSubmitError(e.message)
          })
          .finally(() => {
            setLoading(false)
          })
      }
    },
    [onComplete]
  )

  const onUpdate: Callbacks<CreatePasswordFormState>["onFieldsChange"] =
    useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
      const { empty, error } = simpleCheckForm(allFields)

      setSubmitError("")
      setIsDisable(error || empty)
    }, [])

  const onChangePassword = useCallback(() => {
    form.setFields([
      { name: FormFieldName.CONFIRM_PASSWORD, value: "", errors: [] },
    ])
  }, [form])

  const openModal = useCallback(() => {
    activeModal(modalId)
  }, [activeModal])

  const closeModal = useCallback(() => {
    inactiveModal(modalId)
  }, [inactiveModal])

  useEffect(() => {
    if (!noAccount) {
      activeModal(REQUEST_CREATE_PASSWORD_MODAL)
    }
  }, [activeModal, noAccount])

  useFocusFormItem(
    form,
    FormFieldName.PASSWORD,
    !checkActive(REQUEST_CREATE_PASSWORD_MODAL)
  )

  return {
    t,
    isDisabled,
    submitError,
    loading,
    onSubmit,
    onUpdate,
    onChangePassword,
    openModal,
    closeModal,
    form,
    isDesktop,
  }
}

export type PropsType = ReturnType<typeof useCreatePassword> & ThemeProps

export default useCreatePassword
