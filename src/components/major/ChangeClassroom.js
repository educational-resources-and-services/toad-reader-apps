import React, { useState, useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Menu, Button } from "react-native-ui-kitten"
import { StyleSheet, View } from "react-native"

import Dialog from "./Dialog"
import CreateClassroom from "./CreateClassroom"
import ConnectToAClassroom from "./ConnectToAClassroom"
import i18n from "../../utils/i18n"

import BackFunction from '../basic/BackFunction'

import { setCurrentClassroom } from "../../redux/actions"

const styles = StyleSheet.create({
  menu: {
    width: '100%',
  },
  buttonRow: {
    width: '100%',
  },
  button: {
    margin: 4,
  },
})

const ChangeClassroom = React.memo(({
  open,
  requestHide,
  bookId,

  books,
  userDataByBookId,

  setCurrentClassroom,
}) => {

  const [ showCreateClassroom, setShowCreateClassroom ] = useState(false)
  const [ showConnectToAClassroom, setShowConnectToAClassroom ] = useState(false)

  const book = books[bookId] || {}
  const accountId = Object.keys(book.accounts)[0] || ""
  const idpId = accountId.split(':')[0]

  const defaultClassroomUid = `${idpId}-${bookId}`
  const currentClassroomUid = book.currentClassroomUid || defaultClassroomUid
  const classrooms = ((userDataByBookId[bookId] || {}).classrooms || [])
  const currentClassroomIndex = classrooms.map(({ uid }) => uid).indexOf(currentClassroomUid)
  const bookVersion = Object.values(book.accounts)[0].version

  const classroomData = classrooms
    .map(({ uid, name }) => ({
      title: uid === defaultClassroomUid ? i18n("Book default") : (name || ' '),
    }))

  const updateCurrentClassroom = useCallback(
    selectedIndex => {
      setCurrentClassroom({
        bookId,
        uid: classrooms[selectedIndex].uid,
      })
      requestHide()
    },
    [ bookId, classrooms, requestHide ],
  )

  const toggleShowCreateClassroom = useCallback(
    ({ hideAll }={}) => {
      setShowCreateClassroom(!showCreateClassroom)
      if(hideAll) requestHide()
    },
    [ showCreateClassroom ],
  )

  const toggleShowConnectToAClassroom = useCallback(
    ({ hideAll }={}) => {
      setShowConnectToAClassroom(!showConnectToAClassroom)
      if(hideAll) requestHide()
    },
    [ showConnectToAClassroom ],
  )

  const buttons = [
    <Button
      key="close"
      size="small"
      onPress={requestHide}
      status="basic"
      style={[
        styles.button,
      ]}
    >
      {i18n("Cancel")}
    </Button>,
    <View
      key="actions"
      style={styles.buttonRow}
    >
      {bookVersion === 'INSTRUCTOR' &&
        <Button
          key="create"
          size="small"
          onPress={toggleShowCreateClassroom}
          status="primary"
          style={[
            styles.button,
          ]}
        >
          {i18n("Create new classroom")}
        </Button>
      }
      {['INSTRUCTOR', 'ENHANCED'].includes(bookVersion) &&
        <Button
          key="connect"
          size="small"
          onPress={toggleShowConnectToAClassroom}
          status="primary"
          style={[
            styles.button,
          ]}
        >
          {i18n("Connect to a classroom")}
        </Button>
      }
    </View>,
  ]

  return (
    <>
      {!!open && <BackFunction func={requestHide} />}
      <Dialog
        open={!!open}
        title={i18n("Change classroom")}
        message={(
          <Menu
            data={classroomData}
            selectedIndex={currentClassroomIndex}
            onSelect={updateCurrentClassroom}
            style={styles.menu}
          />
        )}
        buttons={buttons}
      />
      <CreateClassroom
        open={showCreateClassroom}
        requestHide={toggleShowCreateClassroom}
        bookId={bookId}
      />
      <ConnectToAClassroom
        open={showConnectToAClassroom}
        requestHide={toggleShowConnectToAClassroom}
        bookId={bookId}
      />
    </>
  )
})

const mapStateToProps = ({ books, userDataByBookId }) => ({
  books,
  userDataByBookId,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  setCurrentClassroom,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ChangeClassroom)