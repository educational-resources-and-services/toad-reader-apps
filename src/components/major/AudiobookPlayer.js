import React, { useState, useEffect, useCallback, useRef } from "react"
import { StyleSheet, View, Text } from "react-native"
import { Audio } from 'expo-av'

import useDimensions from "../../hooks/useDimensions"
import useRefState from "../../hooks/useRefState"

import AudiobookPlayerChapterLine from "./AudiobookPlayerChapterLine"
import AudiobookPlayerProgressBar from "./AudiobookPlayerProgressBar"
import AudiobookPlayerButtonRow from "./AudiobookPlayerButtonRow"

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
})

const AudiobookPlayer = ({
  sourceBase,
  audiobookInfo,
  author,
  downloadStatus,
  epubSizeInMB,
  title,
  // logUsageEvent,
}) => {

  const [ loading, setLoading, getLoading ] = useRefState(true)
  const [ error, setError ] = useState()
  const [ playing, setPlaying, getPlaying ] = useRefState(false)
  const [ positionMS, setPositionMS, getPositionMS ] = useRefState(0)
  const [ durationMS, setDurationMS, getDurationMS ] = useRefState(0)
  const [ currentSpineIndex, setCurrentSpineIndex ] = useState(0)

  const { spines=[] } = audiobookInfo || {}
  const { filename } = spines[currentSpineIndex] || spines[0] || {}
  const source = `${sourceBase}${filename}`

  const soundObj = useRef()
  const totalTimePlayed = useRef(0)
  const currentPlaybackStartTime = useRef(null)

  const { width, height } = useDimensions().window

  const onPlaybackStatusUpdate = useCallback(
    ({ isLoaded, error, isPlaying, isBuffering, positionMillis, durationMillis, didJustFinish }) => {

      if(error) {
        setError(error)
        return
      }

      const isLoadingOrBuffering = !isLoaded || isBuffering
      if(isLoadingOrBuffering !== getLoading()) {
        setLoading(isLoadingOrBuffering)
      }

      if(isPlaying !== getPlaying()) {
        setPlaying(isPlaying)

        if(isPlaying) {
          currentPlaybackStartTime.current = Date.now()
        } else if(currentPlaybackStartTime.current) {
          totalTimePlayed.current += Math.round((Date.now() - currentPlaybackStartTime.current) / 1000)
          currentPlaybackStartTime.current = null
        }
      }

      const newPositionMS = didJustFinish ? 0 : positionMillis
      if(newPositionMS !== getPositionMS()) {
        setPositionMS(newPositionMS)
      }

      if(durationMillis !== getDurationMS()) {
        setDurationMS(durationMillis)
      }

    },
    [],
  )

  useEffect(
    () => {
      (async () => {

        try {

          setLoading(true)
          setError()
          setPlaying(false)
          setPositionMS(0)
          setDurationMS(0)

          const { sound, status } = await Audio.Sound.createAsync(
            source,
            {
              progressUpdateIntervalMillis: 16,
              rate: 1,
              shouldCorrectPitch: true,
              volume: 1,
            },
            onPlaybackStatusUpdate,
            true,
          )

          soundObj.current = sound

        } catch (error) {
          setError(error.message)
        }
  
      })()
    },
    [ source ],
  )

  const play = useCallback(() => soundObj.current.setStatusAsync({ shouldPlay: true }), [])
  const pause = useCallback(() => soundObj.current.setStatusAsync({ shouldPlay: false }), [])

  useEffect(() => pause, [])  // pause on unload

  // useEffect(
  //   () => (
  //     () => {
  //       if(logUsageEvent && totalTimePlayed.current) {
  //         logUsageEvent({
  //           usageType: `Audio playback`,
  //           'total playback time in seconds': totalTimePlayed.current,
  //         })
  //       }
  //     }
  //   ),
  //   [],
  // )

  const setPosition = useCallback(
    async ms => {
      await soundObj.current.setStatusAsync({
        positionMillis: Math.max(0, Math.min((durationMS || 1000*60*60) - 10, ms)),
      })
    },
    [ durationMS ],
  )

  return (

    <View
      style={[
        styles.container,
        {
          width: Math.min(400, width - 20),
        },
      ]}
    >

      <AudiobookPlayerChapterLine
        spines={spines}
        currentSpineIndex={currentSpineIndex}
        setCurrentSpineIndex={setCurrentSpineIndex}
      />

      <AudiobookPlayerProgressBar
        loading={loading}
        positionMS={positionMS}
        durationMS={durationMS}
      />

      <AudiobookPlayerButtonRow
        positionMS={positionMS}
        setPosition={setPosition}
        playing={playing}
        play={play}
        pause={pause}
        loading={loading}
        error={error}
      />

      <Text style={styles.error}>
        {error}
      </Text>

    </View>

  )
}

export default AudiobookPlayer


// TODOs
  // Move chapter progress bar handle
  // Playback speed adjustment
  // Check native
  // Download button (native only)
  //   Tapping this will download for offline listening
  //   Tapping again will open up an option to removed downloaded audio
  //   Listening library would show current download status and progress for each book
  // report to analytics