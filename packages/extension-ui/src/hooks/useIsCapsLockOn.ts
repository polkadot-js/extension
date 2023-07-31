import { useState } from "react";

export const useIsCapsLockOn = () => {
  const [isCapsLockOn, setIsCapsLockOn] = useState<boolean>();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "CapsLock") {
      setIsCapsLockOn(event.getModifierState('CapsLock'));
    }
  };

  return {
    isCapsLockOn,
    handleKeyDown,
  };
};