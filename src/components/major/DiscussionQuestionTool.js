import React, { useState, useCallback, useRef } from "react"
import { StyleSheet, KeyboardAvoidingView, View, ScrollView, Text, Platform, Alert } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"

import { submitToolEngagement } from "../../redux/actions"
import useClassroomInfo from '../../hooks/useClassroomInfo'
import useInstanceValue from '../../hooks/useInstanceValue'
import useWebSocket from '../../hooks/useWebSocket'
import useScroll from '../../hooks/useScroll'
import { getDateLine, getTimeLine, bottomSpace } from "../../utils/toolbox"

import TextInput from "../basic/TextInput"
import Icon from "../basic/Icon"
import Button from "../basic/Button"
import CoverAndSpin from "../basic/CoverAndSpin"

const response = {
  backgroundColor: 'rgb(228, 233, 242)',
  paddingVertical: 13,
  paddingHorizontal: 15,
  borderRadius: 4,
  marginVertical: 5,
}

const styles = StyleSheet.create({
  error: {
    marginVertical: 20,
    marginHorizontal: 30,
    textAlign: 'center',
    paddingTop: 50,
    color: 'red',
    fontSize: 17,
  },
  container: {
    flex: 1,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 20,
    marginHorizontal: 30,
  },
  discussionContainer: {
    flex: 1,
  },
  discussion: {
    paddingHorizontal: 30,
    marginVertical: 20,
    maxWidth: 600,
  },
  responseDate: {
    marginVertical: 4,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  myResponse: {
    ...response,
    backgroundColor: 'rgb(247, 249, 252)',
  },
  response: {
    ...response,
  },
  responseText: {
  },
  responseInfo: {
    flexDirection: 'row',
    marginTop: 10,
  },
  responseAuthor: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 11,
  },
  responseTime: {
    fontWeight: '100',
    fontSize: 11,
  },
  newResponse: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,.1)',
    paddingHorizontal: 5,
    paddingBottom: bottomSpace,
  },
  newResponseInput: {
    flex: 1,
    ...(Platform.OS !== 'web' ? {} : { outlineWidth: 0 }),
    marginLeft: 10,
    marginVertical: 10,
    paddingVertical: 8,
    maxHeight: 150,
    lineHeight: 19,
  },
  sendButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  sendIcon: {
    height: 22,
    transform: [
      {
        translateX: 3,
      },
    ],
  },
})

const DiscussionQuestionTool = React.memo(({
  bookId,
  toolUid,
  viewingPreview,

  question,

  idps,
  accounts,
  books,

  submitToolEngagement,
}) => {

  const { classroomUid, idpId, userId } = useClassroomInfo({ books, bookId })

  const [ until, setUntil ] = useState('now')
  const [ fromAtLeast, setFromAtLeast ] = useState(Date.now() - (1000*60*60*24))
  const [ inputHeight, setInputHeight ] = useState(0)
  const [ responses, setResponses ] = useState([])
  const [ newResponseValue, setNewResponseValue ] = useState("")

  const { scrolledToEnd, onScroll } = useScroll({ scrolledToEndGraceY: 50 })
  const scrollViewRef = useRef()

  const getResponses = useInstanceValue(responses)
  const getNewResponseValue = useInstanceValue(newResponseValue)

  const { wsSend, connecting, error } = useWebSocket({
    idp: idps[idpId],
    accounts,
    socketName: 'discussion',
    appendToPathItems: [
      classroomUid,
      toolUid,
    ],
    onOpen: ({ wsSend }) => {
      wsSend({
        action: 'getResponses',
        data: {
          until,
          fromAtLeast,
        },
      })
    },
    onMessage: ({ message: { responses } }) => {
      const wasScrolledToEnd = scrolledToEnd.current

      const existingResponses = getResponses()

      let newResponses = [
        ...responses,
        ...existingResponses,
      ]

      newResponses.sort((a, b) => a.submitted_at - b.submitted_at)

      const uids = {}
      newResponses = newResponses.filter(({ uid }) => {
        if(!uids[uid]) {
          uids[uid] = true
          return true
        }
      })

      setResponses(newResponses)

      if(wasScrolledToEnd || (responses[0] || {}).user_id === userId) {
        scrollViewRef.current.scrollToEnd({ animated: existingResponses.length > 0 })
      }
    },
  })

  const handleInputTextChange = useCallback(
    value => {
      if(value.length === 0) {
        setInputHeight(0)
      }
      setNewResponseValue(value)
    },
    [],
  )

  const handleInputHeightChange = useCallback(({ nativeEvent }) => setInputHeight(nativeEvent.contentSize.height + bottomSpace), [])

  const sendNewResponse = useCallback(
    event => {

      const text = getNewResponseValue().trim()

      if(text) {

        if(viewingPreview) {
          const message = i18n("In the live discussion, this would add your response to the bottom of the feed.")

          if(Platform.OS === 'web') {
            alert(message)
          } else {
            Alert.alert(
              i18n("Note"),
              message,
            )
          }

          setNewResponseValue("")
          setInputHeight(0)

          return
        }

        wsSend({
          action: 'addResponse',
          data: {
            text,
          },
        })

      }

      setNewResponseValue("")
      setInputHeight(0)

    },
    [ viewingPreview, wsSend ],
  )

  const SendIcon = useCallback(style => <Icon name='md-send' style={styles.sendIcon} />, [])

  if(error) {
    return (
      <Text style={styles.error}>
        Error: {error} 
      </Text>
    )
  }

  let lastDate

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={80}
      enabled={Platform.OS === 'ios'}
    >
      <Text style={styles.question}>
        {question}
      </Text>
      <ScrollView
        style={styles.discussionContainer}
        onScroll={onScroll}
        ref={scrollViewRef}
      >
        <View style={styles.discussion}>
          {connecting && <CoverAndSpin />}
          {!connecting && responses.map(({ uid, text, user_id, fullname, submitted_at }) => {

            const newDate = new Date(submitted_at).toDateString()
            const displayDate = newDate !== lastDate
            lastDate = newDate

            return (
              <View key={uid}>
                {displayDate &&
                  <Text style={styles.responseDate}>
                    {getDateLine({ timestamp: submitted_at, short: false, relative: true })}
                  </Text>
                }
                <View style={user_id == userId ? styles.myResponse : styles.response}>
                  <Text style={styles.responseText}>
                    {text}
                  </Text>
                  <View style={styles.responseInfo}>
                    <Text style={styles.responseAuthor}>
                      {fullname}
                    </Text>
                    <Text style={styles.responseTime}>
                      {getTimeLine({ timestamp: submitted_at, short: true })}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
      <View style={styles.newResponse}>
        <TextInput
          placeholder={i18n("Type a response (seen by entire classroom)", "", "enhanced")}
          multiline
          value={newResponseValue}
          onChangeText={handleInputTextChange}
          onContentSizeChange={handleInputHeightChange}
          style={[
            styles.newResponseInput,
            {
              height: Math.max(35, inputHeight),
            },
          ]}
          returnKeyType="send"
          returnKeyLabel={!newResponseValue.trim() ? i18n("Cancel", "", "enhanced") : null}
          enablesReturnKeyAutomatically={true}
          blurOnSubmit={Platform.OS !== 'web'}
          onSubmitEditing={sendNewResponse}
        />
        {Platform.OS === 'web' &&
          <Button
            style={styles.sendButton}
            appearance="ghost"
            icon={SendIcon}
            onPress={sendNewResponse}
            disabled={!newResponseValue.trim()}
          />
        }
      </View>
    </KeyboardAvoidingView>
  )
})

const mapStateToProps = ({ idps, accounts, books }) => ({
  idps,
  accounts,
  books,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  submitToolEngagement,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(DiscussionQuestionTool)