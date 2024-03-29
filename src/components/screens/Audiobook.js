import React, { useEffect, useCallback } from "react"
import { StyleSheet, View, Platform, AppState, Alert } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import { i18n } from "inline-i18n"
import { Image } from 'expo-image'

import { refreshUserData } from "../../utils/syncUserData"
import { removeEpub } from "../../utils/removeEpub"
import { setStatusBarHidden, showConsent, getBooksDir } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useWideMode from "../../hooks/useWideMode"
import useBookCookies from "../../hooks/useBookCookies"
import useDimensions from "../../hooks/useDimensions"
import useCoverHref from "../../hooks/useCoverHref"
import { setLatestLocation, startRecordReading, endRecordReading, setConsentShown,
         setTocAndSpines, setBookCookies, setDownloadStatus, pushToBookDownloadQueue,
         removeFromBookDownloadQueue, clearUserDataExceptProgress } from "../../redux/actions"
import { logEvent } from "../../utils/analytics"
import { getDataOrigin, getIDPOrigin } from '../../utils/toolbox'

import SafeLayout from "../basic/SafeLayout"
import BackFunction from '../basic/BackFunction'
import CoverAndSpin from '../basic/CoverAndSpin'
import AudiobookHeader from "../major/AudiobookHeader"
import AudiobookPlayer from "../major/AudiobookPlayer"


const styles = StyleSheet.create({
  content: {
    ...StyleSheet.absoluteFillObject,
    top: 56,
    maxHeight: 750,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  image: {
    backgroundColor: 'rgba(0, 0, 0, .1)',
  },
})

const Audiobook = React.memo(({

  idps,
  accounts,
  books,
  userDataByBookId,
  downloadProgressByBookId,

  setLatestLocation,
  startRecordReading,
  endRecordReading,
  setConsentShown,
  setBookCookies,
  setDownloadStatus,
  pushToBookDownloadQueue,
  removeFromBookDownloadQueue,
  clearUserDataExceptProgress,

}) => {

  // const [ currentAppState, setCurrentAppState ] = useState('active')

  const { historyGoBackToLibrary } = useRouterState()

  const idpId = Object.keys(accounts)[0].split(':')[0]
  const { bookId } = useParams()
  const book = (books || {})[bookId]
  const latest_location = (userDataByBookId[bookId] || {}).latest_location
  const wideMode = useWideMode()
  const bookCookies = useBookCookies({ books, accounts, idp: idps[idpId], setBookCookies, bookId })
  const downloadOrigin = __DEV__ ? getDataOrigin(idps[idpId]) : getIDPOrigin(idps[idpId])
  const { width, height } = useDimensions().window
  const imageSize = Math.min(400, width - 70, height - 56 - 200)
  const coverHref = useCoverHref({ bookInfo: book, bookId })

  let latestLocation = {}
  try {
    latestLocation = JSON.parse(latest_location)
  } catch(e) {}

  const toggleDownloaded = useCallback(
    () => {

      if(book.downloadStatus !== 0) {

        Alert.alert(
          i18n("Remove from device"),
          i18n("Are you sure you want to remove “{{book_title}}” from this device?", {
            book_title: book.title,
          }),
          [
            {
              text: i18n("Cancel"),
              style: 'cancel',
            },
            {
              text: i18n("Remove"),
              onPress: async () => {
                await removeEpub({
                  bookId,
                  removeFromBookDownloadQueue,
                  setDownloadStatus,
                  clearUserDataExceptProgress,
                })

                logEvent({
                  eventName: `Remove book`,
                  properties: {
                    title: book.title || `Book id: ${bookId}`,
                    type: `audiobook`,
                  },
                })
              },
              // style: 'destructive',
            },
          ],
          { cancelable: false }
        )

      } else {

        setDownloadStatus({ bookId, downloadStatus: 1 })
        pushToBookDownloadQueue({ bookId })

        logEvent({
          eventName: `Download book`,
          properties: {
            title: book.title || `Book id: ${bookId}`,
            type: `audiobook`,
          },
        })

      }

    },
    [ setDownloadStatus, pushToBookDownloadQueue, removeFromBookDownloadQueue, clearUserDataExceptProgress, bookId, book ],
  )

  const updateLatestLocation = useCallback(
    latestLocation => {
      setLatestLocation({
        bookId,
        latestLocation,
      })
    },
    [ bookId, setLatestLocation ],
  )

  const goStartRecordReading = useCallback(
    ({ currentSpineIndex }) => {
      startRecordReading({
        bookId,
        currentSpineIndex,
      })
    },
    [ startRecordReading, bookId ],
  )

  useEffect(
    () => {
      if(!book) return

      // get fresh user data
      Object.keys(book.accounts).forEach(accountId => {
        refreshUserData({
          accountId,
          bookId,
        })
      })
    },
    [],
  )

  useEffect(
    () => showConsent({ idps, setConsentShown }),
    [],
  )

  useEffect(
    () => {
      setStatusBarHidden(!wideMode || Platform.OS === 'ios')
      return () => setStatusBarHidden(false)
    },
    [ wideMode ],
  )

  if(Platform.OS === 'web' && !bookCookies) {
    return (
      <SafeLayout>
        <CoverAndSpin />
      </SafeLayout>
    )
  }

  return (
    <SafeLayout>
      <BackFunction func={historyGoBackToLibrary} />

      <AudiobookHeader
        {...book}
      />

      <View style={styles.content}>

        <View />

        <Image
          source={`${downloadOrigin}/${coverHref}`}
          style={[
            styles.image,
            {
              width: imageSize,
              height: imageSize,
            },
          ]}
          contentFit="cover"
        />

        <AudiobookPlayer
          uriBase={`${downloadOrigin}/epub_content/book_${bookId}/`}
          cookie={bookCookies}
          localSourceBase={`${getBooksDir()}${bookId}/`}
          latestLocation={latestLocation}
          downloadProgressByFilename={downloadProgressByBookId[bookId] || {}}
          toggleDownloaded={toggleDownloaded}
          updateLatestLocation={updateLatestLocation}
          goStartRecordReading={goStartRecordReading}
          endRecordReading={endRecordReading}
          {...book}
        />

      </View>

    </SafeLayout>
  )
})

const mapStateToProps = ({ idps, accounts, books, userDataByBookId, downloadProgressByBookId }) => ({
  idps,
  accounts,
  books,
  userDataByBookId,
  downloadProgressByBookId,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  setLatestLocation,
  startRecordReading,
  endRecordReading,
  setConsentShown,
  setTocAndSpines,
  setBookCookies,
  setDownloadStatus,
  pushToBookDownloadQueue,
  removeFromBookDownloadQueue,
  clearUserDataExceptProgress,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Audiobook)