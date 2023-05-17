import { ThemeProps } from "@subwallet/extension-koni-ui/types"
import { Button, Input, Icon } from "@subwallet/react-ui"
import CN from 'classnames'
import { DownloadSimple, MagnifyingGlass } from "phosphor-react"
import { ChangeEventHandler, useMemo } from "react"
import styled from "styled-components"

type Props = ThemeProps & {
  placeholder: string
  className?: string
  searchValue: string,
  onSearch: (value: string) => void;
  onClickActionBtn?: () => void;
  actionBtnIcon?: JSX.Element;
  showActionBtn?: boolean;
  extraButton?: JSX.Element
  showExtraButton?: boolean
}

const Component: React.FC<Props> = ({
  className,
  placeholder,
  searchValue,
  onSearch,
  onClickActionBtn,
  actionBtnIcon,
  showActionBtn,
  extraButton,
  showExtraButton = false
}) => {
  // CONTROLLED STATE
  // const [value, setValue] = useState<string>(searchValue)

  // const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback((e) => {
  //   if (e.key === 'Enter' && value) {
  //     onSearch(value)
  //   }
// }, [value])

  // const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
  //   const value = e?.target?.value;
  //   setValue(value)
  // }

  // UNCONTROLLED STATE
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e?.target?.value;
    onSearch(value)
  }

  const button = useMemo(() => extraButton ? extraButton : (
    <Button
      type="ghost"
      icon={<Icon phosphorIcon={DownloadSimple} size="sm" />}
    />
  ), [])

  return (
    <div className={CN('container', className)}>
      <div className="right-section">
        {showExtraButton && button}
        <Input.Search
          className="search-input"
          size="md"
          placeholder={placeholder}
          prefix={<Icon phosphorIcon={MagnifyingGlass} />}
          value={searchValue}
          onChange={handleInputChange}
           suffix={
              showActionBtn && (
                <Button
                  onClick={onClickActionBtn}
                  size="xs"
                  type="ghost"
                  icon={actionBtnIcon}
                />
              )
            }
          // onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  )
}

const Search = styled(Component)<Props>(({ }: Props) => {
  return {
    display: 'grid',
    width: '100%',

    '.right-section': {
      justifySelf: 'end',
      display: 'flex',
      '.search-input': {
        width: 360,
        height: 50
      }
    }
  }
})

export default Search;
