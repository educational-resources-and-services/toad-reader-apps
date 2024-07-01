import React, { useEffect, useRef, useState } from "react"
import { Platform, StyleSheet, KeyboardAvoidingView as RNKeyboardAvoidingView } from "react-native"
import * as ScreenOrientation from 'expo-screen-orientation'
import useCounter from 'react-use/lib/useCounter'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import useWideMode from "../../hooks/useWideMode"
// import useKeyboardSize from "../../hooks/useKeyboardSize"
import { getStatusBarCurrentHeight } from "../../utils/toolbox"

const styles = StyleSheet.create({
  view: {
    ...StyleSheet.absoluteFillObject,
  },
})

const KeyboardAvoidingView = ({
  children,
  style,
  ...otherProps
}) => {

  const ref = useRef()
  const [ yOffset, setYOffset ] = useState(0)
  const [ orientationChangeIdx, { inc: incrementOrientationChangeIdx } ] = useCounter(0)
  const wideModeWithEitherOrientation = useWideMode(true)
  // const { keyboardOpen } = useKeyboardSize()

  const safeAreaInsets = useSafeAreaInsets()

  useEffect(
    () => {
      // Note: This works on the assumption that this elements y position will not change after it is constructed.
      setTimeout(() => {
        try {
          ref.current.viewRef.current.measure(
            (x, y, w, h, pageX, pageY) => {
              setYOffset(pageY - safeAreaInsets.bottom + getStatusBarCurrentHeight())
            }
          )
        } catch(e) {}
      })
    },
    [],
  )

  // This is a hacky fix to a bug whereby changing the orientation lock to portrait and then back
  // causes the keyboard avoiding view height to be messed up for android.
  useEffect(
    () => {
      if(Platform.OS === 'android' && !wideModeWithEitherOrientation) {

        const orientationChangeSubscription = ScreenOrientation.addOrientationChangeListener(({ orientationLock }) => {
          if(orientationLock === ScreenOrientation.OrientationLock.PORTRAIT_UP) {
            incrementOrientationChangeIdx()
          }
        })

        return () => {
          ScreenOrientation.removeOrientationChangeListener(orientationChangeSubscription)
        }

      }
    },
    [ wideModeWithEitherOrientation ],
  )

  return (
    <RNKeyboardAvoidingView
      key={orientationChangeIdx}
      ref={ref}
      style={[
        styles.view,
        style,
      ]}
      behavior={Platform.select({ android: 'height', ios: 'padding' })}
      keyboardVerticalOffset={
        // (Platform.OS === 'android' && keyboardOpen)
        //   ? 0  // this is an android hack due to a buck in KeyboardAvoidingView (https://stackoverflow.com/questions/41616457/keyboardavoidingview-reset-height-when-keyboard-is-hidden)
        //   : yOffset

        // After updating to Expo 50, a space was being created at the bottom of some Android devices after the keyboard was shown. The change below (as compared to above) fixes that.
        Platform.OS === 'android'
          ? 0
          : yOffset
      }
      {...otherProps}
    >
      {children}
    </RNKeyboardAvoidingView>
  )
}

export default KeyboardAvoidingView