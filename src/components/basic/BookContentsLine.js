import React, { useCallback } from "react"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { useLayout } from 'react-native-hooks'
import { styled } from '@ui-kitten/components'

import useThemedStates from "../../hooks/useThemedStates"
import { setSelectedToolUid } from "../../redux/actions"

import ToolChip from './ToolChip'
import GroupedToolsChip from './GroupedToolsChip'

const styles = StyleSheet.create({
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemWithTool: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexDirection: 'row',
  },
  label: {
    flexShrink: 1,
  },
})

const BookContentsLine = ({
  bookId,
  indentLevel,
  uid,
  label,
  toolType,
  isDraft,
  numToolsWithin,
  goTo,
  href,
  spineIdRef,
  reportLineHeight,
  index,
  onToolMove,
  onToolRelease,
  uiStatus,

  setSelectedToolUid,

  themedStyle,
  dispatch,
}) => {

  const themedStateEvents = useThemedStates({ dispatch, states: [ 'hover' ] })

  const onPress = useCallback(
    () => {
      if(toolType) {
        setSelectedToolUid({
          bookId,
          uid,
        })
      } else {
        setSelectedToolUid({ bookId })  // unselects any tool
        goTo({ href, spineIdRef })
      }
    },
    [ href, bookId, goTo ],
  )

  const { onLayout, height } = useLayout()

  reportLineHeight({ index, height })

  const indentStyle = { paddingLeft: 20 + indentLevel * 20 }

  const line = (
    <View
      {...themedStateEvents}
      onLayout={onLayout}
      style={[
        (toolType ? styles.listItemWithTool : styles.listItem),
        themedStyle,
        indentStyle,
      ]}
    >
      {!!toolType &&
        <ToolChip
          uid={uid}
          label={label}
          toolType={toolType}
          isDraft={isDraft}
          onPress={onPress}
          onToolMove={onToolMove}
          onToolRelease={onToolRelease}
          status={isDraft ? "draft" : "published"}
        />
      }
      {!toolType &&
        <>
          <Text
            style={styles.label}
            selectable={false}
          >
            {label}
          </Text>
          {!!numToolsWithin &&
            <GroupedToolsChip
              status={isDraft ? "draft" : "published"}
              numToolsWithin={numToolsWithin}
            />
          }
        </>
      }
      
    </View>
  )

  if(uiStatus === 'unselected') {
    return (
      <TouchableOpacity onPress={onPress}>
        {line}
      </TouchableOpacity>
    )

  } else {
    return line
  }

}

const mapStateToProps = () => ({
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  setSelectedToolUid,
}, dispatch)

BookContentsLine.styledComponentName = 'BookContentsLine'

export default connect(mapStateToProps, matchDispatchToProps)(styled(BookContentsLine))