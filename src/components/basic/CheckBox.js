import React, { useCallback } from "react"
// import { StyleSheet } from "react-native"
import { CheckBox as UIKittenCheckBox } from "react-native-ui-kitten"

// const styles = StyleSheet.create({
// })

const CheckBox = React.memo(({
  id,
  onChange,
  onChangeInfo,
  ...otherProps
 }) => {

  const customOnChange = useCallback(
    checked => {
      onChange && onChange(checked)
      onChangeInfo && onChangeInfo({ id, checked })
    },
    [ id ],
  )

  return (
    <UIKittenCheckBox
      {...otherProps}
      onChange={customOnChange}
    />
  )
})

export default CheckBox