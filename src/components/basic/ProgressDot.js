import React from "react"
import { Constants } from "expo"
import { StyleSheet, Platform, Animated, Dimensions } from "react-native"
import { View } from "native-base"
import i18n from "../../utils/i18n.js"

import ProgressDotLabel from "./ProgressDotLabel"

import { getFooterHeight } from "../../utils/toolbox.js"

const {
  PROGRESS_BAR_SIDE_SPACING,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    left: 0,
    backgroundColor: Platform.OS === 'android' ? 'white' : 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

class ProgressDot extends React.Component {

  render() {
    const { size, animatedScrollPosition, maxScroll } = this.props

    const { width } = Dimensions.get('window')

    const translateX = animatedScrollPosition.interpolate({
      inputRange: [0, maxScroll],
      outputRange: [PROGRESS_BAR_SIDE_SPACING, width - PROGRESS_BAR_SIDE_SPACING],
    })

    const dotStyles = {
      top: (getFooterHeight() - size) / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      marginLeft: size / -2,
      marginRight: size / -2,
      transform: [
        {
          translateX,
        },
      ],
    }

    return (
      <Animated.View
        style={[
          styles.dot,
          dotStyles,
        ]}
      >
        <ProgressDotLabel
          animatedScrollPosition={animatedScrollPosition}
          maxScroll={maxScroll}
        />
      </Animated.View>
    )
  }
}

export default ProgressDot