import React, { useState, useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Input } from "react-native-ui-kitten"
import { StyleSheet } from "react-native"

import Dialog from "./Dialog"
import i18n from "../../utils/i18n"

import BackFunction from '../basic/BackFunction'

import { createClassroom } from "../../redux/actions"

const styles = StyleSheet.create({
  menu: {
    width: '100%',
  },
  button: {
    marginHorizontal: 4,
  },
})

const CreateClassroom = React.memo(({
  open,
  requestHide,
  bookId,

  books,
  userDataByBookId,

  createClassroom,
}) => {

  const [ name, setName ] = useState("")

  const book = books[bookId] || {}
  const accountId = Object.keys(book.accounts)[0] || ""
  const userId = accountId.split(':')[1]

  const createNewClassroom = useCallback(
    () => {
      createClassroom({
        bookId,
        name,
        userId,
        patchInfo: {
          userDataByBookId,
        },
      })
      requestHide()
    },
    [ bookId, name, userId, userDataByBookId ],
  )

  const onChangeText = useCallback(name => setName(name), [])

  return (
    <>
      {!!open && <BackFunction func={requestHide} />}
      <Dialog
        open={!!open}
        type="confirm"
        title={i18n("Create new classroom")}
        message={(
          <Input
            style={styles.input}
            value={name}
            onChangeText={onChangeText}
            placeholder={i18n("Classroom name (Eg. “Fall 2020”)")}
          />
        )}
        confirmButtonText={i18n("Create")}
        confirmButtonStatus="primary"
        onCancel={requestHide}
        onConfirm={createNewClassroom}
      />
    </>
  )
})

const mapStateToProps = ({ books, userDataByBookId }) => ({
  books,
  userDataByBookId,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  createClassroom,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(CreateClassroom)