import React from "react"

export enum Screens {
  DESKTOP = "desktop",
  TABLET_HORIZONTAL = "tablet_horizontal",
  TABLET_VERTICAL = "tablet_vertical",
  MOBILE = "mobile",
}

const ScreenBreakpoint: Record<Screens, [number, number?]> = {
  [Screens.DESKTOP]: [1024],
  [Screens.TABLET_HORIZONTAL]: [992, 1024],
  [Screens.TABLET_VERTICAL]: [768, 992],
  [Screens.MOBILE]: [0, 768],
}

interface ScreenContexProviderProps {
  children?: React.ReactElement
}

type ScreenContextType = {
  screenType: `${Screens}`
}

export const ScreenContext = React.createContext({} as ScreenContextType)

export const ScreenContextProvider = ({
  children,
}: ScreenContexProviderProps) => {
  const [screenType, setScreenType] = React.useState<`${Screens}`>(
    Screens.DESKTOP
  )

  const handleWindowResize = React.useCallback(() => {
    Object.keys(ScreenBreakpoint).map((breakpoint: string) => {
      const breakpointKey = breakpoint as `${Screens}`
      const [lower, upper] = ScreenBreakpoint[breakpointKey]
      if (!upper) {
        if (lower <= window.innerWidth && screenType !== breakpoint) {
          setScreenType(breakpointKey)
        }
        return
      }

      if (
        lower <= window.innerWidth &&
        upper >= window.innerWidth &&
        screenType !== breakpoint
      )
        setScreenType(breakpointKey)
    })
  }, [screenType])

  React.useEffect(() => {
    handleWindowResize()
    window.addEventListener("resize", handleWindowResize)
    ;() => {
      window.removeEventListener("resize", handleWindowResize)
    }
  }, [handleWindowResize])

  return (
    <ScreenContext.Provider
      value={{
        screenType,
      }}
    >
      {children}
    </ScreenContext.Provider>
  )
}
