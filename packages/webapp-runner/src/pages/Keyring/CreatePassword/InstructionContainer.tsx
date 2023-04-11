import AlertBox from "@subwallet-webapp/components/Alert"
import { useTranslation } from "react-i18next"

type PropsType = {
  type?: "warning" | "info" | undefined
}

const InstructionContainer: React.FC<PropsType> = ({ type }: PropsType) => {
  const { t } = useTranslation()
  return (
    <div className="instruction-container">
      <AlertBox
        description={t(
          "For your wallet protection, SubWallet locks your wallet after 15 minutes of inactivity. You will need this password to unlock it."
        )}
        title={t("Why do I need to enter a password?")}
        type={type}
      />
      <AlertBox
        description={t(
          "The password is stored securely on your device. We will not be able to recover it for you, so make sure you remember it!"
        )}
        title={t("Can I recover a password?")}
        type={type}
      />
    </div>
  )
}

export default InstructionContainer
