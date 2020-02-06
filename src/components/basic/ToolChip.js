import React, { useState, useCallback } from "react"
import { StyleSheet, View } from "react-native"
import { styled, Button } from '@ui-kitten/components'

import Icon from "./Icon"
import { getToolInfo } from "../../utils/toolInfo"

const onMoveShouldSetResponderCapture = () => true

const text = {
  fontWeight: '400',
  fontSize: 12,
}

const icon = {
  tintColor: 'rgb(149, 174, 224)',
  height: 13,
  marginRight: 0,
}

const styles = StyleSheet.create({
  text: {
    ...text,
  },
  draftText: {
    ...text,
    fontStyle: 'italic',
  },
  icon: {
    ...icon,
  },
  draftIcon: {
    ...icon,
    // tintColor: '#fdf594',
  },
  button: {
    backgroundColor: 'black',
    borderColor: 'transparent',
    borderRadius: 17,
  },
  hide: {
    opacity: 0,
  },
})

const ToolChip = React.memo(({
  uid,
  label,
  toolType,
  isDraft,
  onPress,
  onToolMove,
  onToolRelease,
  style,
  iconStyle,

  themedStyle,
}) => {

  const [ hideTool, setHideTool ] = useState(false)
  const { toolInfoByType } = getToolInfo()

  const onResponderMove = useCallback(
    ({ nativeEvent }) => {
      if(onToolMove({
        nativeEvent,
        uid,
        label,
        toolType,
        isDraft,
      })) {
        setHideTool(true)
      }
    },
    [ onToolMove, uid, label, toolType, isDraft ],
  )

  const onResponderRelease = useCallback(
    () => {
      setHideTool(false)
      onToolRelease()
    },
    [ onToolRelease ],
  )

  const ButtonIcon = useCallback(
    iconStyle => (
      <Icon
        {...toolInfoByType[toolType]}
        style={[
          isDraft ? styles.draftIcon : styles.icon,
          // iconStyle,
        ]}
      />
    ),
    [ toolType, isDraft ],
  )

  return (
    <View
      {...(!onToolMove ? {} : {
        onMoveShouldSetResponderCapture: onMoveShouldSetResponderCapture,
        onResponderMove: onResponderMove,
        onResponderRelease: onResponderRelease,
        onResponderTerminate: onResponderRelease,
        style: hideTool ? styles.hide : null,
      })}
    >
      <Button
        style={[
          styles.button,
          themedStyle,
          style,
        ]}
        size='tiny'
        icon={ButtonIcon}
        iconStyle={iconStyle}
        textStyle={isDraft ? styles.draftText : styles.text}
        onPress={onPress}
      >
        {label || toolInfoByType[toolType].text}
      </Button>
    </View>
  )
})

ToolChip.styledComponentName = 'ToolChip'

export default styled(ToolChip)