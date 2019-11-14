import React, { useState, useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { withRouter } from "react-router"
// import { StyleSheet } from "react-native"

import Dialog from "./Dialog"
import DialogInput from "../basic/DialogInput"
import i18n from "../../utils/i18n"
import { refreshUserData } from "../../utils/syncUserData"
import { getDataOrigin, getReqOptionsWithAdditions } from '../../utils/toolbox'

import BackFunction from '../basic/BackFunction'
import useRouterState from "../../hooks/useRouterState"

import { updateAccount, setUserData, setCurrentClassroom } from "../../redux/actions"

// const styles = StyleSheet.create({
// })

const ConnectToAClassroom = React.memo(({
  open,
  requestHide,
  bookId,

  idps,
  accounts,
  books,
  userDataByBookId,

  updateAccount,
  setUserData,
  setCurrentClassroom,

  history,
}) => {

  const [ code, setCode ] = useState("")
  const [ connecting, setConnecting ] = useState(false)

  const { historyPush } = useRouterState({ history })

  const book = books[bookId] || {}
  const accountId = Object.keys(book.accounts)[1] || ""
  const idpId = accountId.split(':')[0]
  const idp = idps[idpId]

  const connectToAClassroom = useCallback(
    async () => {

      setConnecting(true)

      const path = `${getDataOrigin(idp)}/connect_to_classroom`

      const response = await fetch(path, getReqOptionsWithAdditions({
        method: 'POST',
        headers: {
          "Content-Type": 'application/x-www-form-urlencoded;charset=UTF-8',
          "x-cookie-override": accounts[accountId].cookie,
        },
        body: JSON_to_URLEncoded({ code }),
      }))
  
      if(response.status >= 400) {
        historyPush("/error", {
          message: i18n("Failed to connect to the classroom. Check the code and try again."),
        })
        setConnecting(false)
        return
      }

      const { uid } = response.json()

      const { success } = await refreshUserData({
        accountId,
        bookId,
        info: {
          idps,
          accounts,
          books,
          userDataByBookId,
          updateAccount,
          setUserData,
        },
      }) || {}

      if(!success) {
        historyPush("/error", {
          message: i18n("You successfully connected to the classroom. However, we are unable to load the classroom data."),
        })
        setConnecting(false)
        return
      }

      setCurrentClassroom({
        bookId,
        uid,
      })
      setConnecting(false)
      requestHide({ hideAll: true })

    },
    [ idp, accounts, books, userDataByBookId, idpId, accountId, bookId, code ],
  )

  const onChangeText = useCallback(code => setCode(code), [])

  return (
    <>
      {!!open && <BackFunction func={requestHide} />}
      <Dialog
        open={!!open}
        type="confirm"
        title={i18n("Connect to a classroom")}
        message={
          <DialogInput
            value={code}
            onChangeText={onChangeText}
            label={i18n("Code")}
            placeholder={i18n("Eg. U76RE9")}
          />
        }
        confirmButtonText={i18n("Connect")}
        confirmButtonStatus="primary"
        onCancel={requestHide}
        onConfirm={connectToAClassroom}
        submitting={connecting}
      />
    </>
  )
})

const mapStateToProps = ({ idps, accounts, books, userDataByBookId }) => ({
  idps,
  accounts,
  books,
  userDataByBookId,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  updateAccount,
  setUserData,
  setCurrentClassroom,
}, dispatch)

export default withRouter(connect(mapStateToProps, matchDispatchToProps)(ConnectToAClassroom))