import React, { useState, useCallback, useEffect } from "react"
import { StyleSheet, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Select } from "react-native-ui-kitten"

import Input from "../basic/Input"

import { i18n } from "inline-i18n"
import { getIdsFromAccountId, getToolbarHeight } from '../../utils/toolbox'
import { getToolInfo } from '../../utils/toolInfo'
import StatusAndActions from "./StatusAndActions"

import useWideMode from "../../hooks/useWideMode"
import useInstanceValue from '../../hooks/useInstanceValue'
import useSetTimeout from '../../hooks/useSetTimeout'

import { updateTool } from "../../redux/actions"
import EditToolData from "./EditToolData"

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    zIndex: 5,
  },
  constainerWideMode: {
    top: getToolbarHeight(),
  },
  topSection: {
    padding: 20,
    paddingBottom: 10,
  },
  topSectionWideMode: {
    flexDirection: 'row',
  },
  basicDetails: {
    flex: 1,
  },
  basicDetailLine: {
    width: 350,
    marginBottom: 10,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,.1)',
  },
  bottomSectionWideMode: {
  },
})

const EditTool = React.memo(({
  bookId,
  toolUidInEdit,

  books,
  userDataByBookId,

  updateTool,
}) => {

  const { toolTypes, toolInfoByType } = getToolInfo()

  const book = books[bookId] || {}
  const { accounts, currentClassroomUid } = book
  const accountId = Object.keys(accounts)[0] || ""
  const { idpId } = getIdsFromAccountId(accountId)

  const classrooms = ((userDataByBookId[bookId] || {}).classrooms || [])
  const defaultClassroomUid = `${idpId}-${bookId}`
  const classroomUid = currentClassroomUid || defaultClassroomUid
  const classroom = classrooms.filter(({ uid }) => uid === classroomUid)[0]
  const { tools=[] } = classroom || {}
  const toolInEdit = tools.filter(({ uid }) => uid === toolUidInEdit)[0]

  const wideMode = useWideMode()

  const [ setToolNameSaveTimeout ] = useSetTimeout()

  const [ nameInEdit, setNameInEdit ] = useState()

  useEffect(
    () => {
      setNameInEdit((toolInEdit || {}).name || '')
    },
    [ toolUidInEdit ],
  )

  const getUserDataByBookId = useInstanceValue(userDataByBookId)

  const goUpdateTool = useCallback(
    updates => {
      updateTool({
        bookId,
        classroomUid,
        uid: toolUidInEdit,
        ...updates,
        patchInfo: {
          userDataByBookId: getUserDataByBookId(),
        },
      })
    },
    [ updateTool, bookId, classroomUid, toolUidInEdit ],
  )

  const onToolNameChange = useCallback(
    name => {
      setNameInEdit(name)
      setToolNameSaveTimeout(
        () => goUpdateTool({ name }),
        300,
      )
    },
    [ goUpdateTool ],
  )

  const onSelectToolType = useCallback(
    ({ toolType }) => goUpdateTool({ toolType, data: {} }),
    [ goUpdateTool ],
  )

  if(!toolInEdit) return null

  return (
    <View
      style={[
        styles.container,
        wideMode ? styles.constainerWideMode : null,
      ]}
    >
      <View
        style={[
          styles.topSection,
          wideMode ? styles.topSectionWideMode : null,
        ]}
      >
        <View style={styles.basicDetails}>
          <View style={styles.basicDetailLine}>
            <Input
              placeholder={i18n("Unnamed")}
              label={i18n("Tool name")}
              value={nameInEdit}
              onChangeText={onToolNameChange}
            />
          </View>
          <View style={styles.basicDetailLine}>
            <Select
              key={toolUidInEdit}
              label={i18n("Tool type")}
              data={toolTypes}
              selectedOption={toolTypes.filter(({ toolType }) => toolType === toolInEdit.toolType)[0]}
              onSelect={onSelectToolType}
            />
          </View>
        </View>
        <StatusAndActions
          bookId={bookId}
          toolUidInEdit={toolUidInEdit}
        />
      </View>
      <View
        style={[
          styles.bottomSection,
          wideMode ? styles.bottomSectionWideMode : null,
        ]}
      >
        <EditToolData
          classroomUid={classroomUid}
          toolUidInEdit={toolUidInEdit}
          accountId={accountId}
          dataStructure={toolInfoByType[toolInEdit.toolType].dataStructure}
          data={toolInEdit.data}
          goUpdateTool={goUpdateTool}
        />
      </View>
    </View>
  )
})

const mapStateToProps = ({ books, userDataByBookId }) => ({
  books,
  userDataByBookId,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  updateTool,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(EditTool)