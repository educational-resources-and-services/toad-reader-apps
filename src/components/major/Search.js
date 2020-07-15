import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import useToggle from "react-use/lib/useToggle"

// import {  } from "../../utils/toolbox"
import { searchBook, getAutoSuggest, getResultLineInJSX } from "../../utils/indexEpub"
import useClassroomInfo from '../../hooks/useClassroomInfo'
import useSetTimeout from '../../hooks/useSetTimeout'
import { loadIndex } from "../../utils/indexEpub"

import Input from "../basic/Input"

import { addRecentSearch } from "../../redux/actions"

const styles = StyleSheet.create({
  header: {
    padding: 14,
    paddingTop: 4,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  flatListContent: {
    paddingVertical: 10,
  },
  suggestion: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  result: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultText: {
  },
  resultSpine: {
    opacity: .35,
    fontSize: 12,
    marginBottom: 5,
  },
  term: {
    fontWeight: 'bold',
  },
})

const Search = ({
  bookId,
  goTo,

  idp,
  accounts,
  books,
  recentSearchesByBookId,

  addRecentSearch,
}) => {

  const [ showResults, toggleShowResults ] = useToggle(false)
  const [ searchStr, setSearchStr ] = useState("")
  const normalizedSearchStr = searchStr.trim()
  const [ suggestions, setSuggestions ] = useState([])
  const [ results, setResults ] = useState([])

  const [ setSearchTimeout ] = useSetTimeout()

  const inputRef = useRef()

  const { spines, accountId } = useClassroomInfo({ books, bookId })

  const { cookie } = accounts[accountId] || {}

  useEffect(
    () => {
      loadIndex({ idp, bookId, cookie })
    },
    [ idp, bookId, cookie ],
  )

  useEffect(
    () => {
      setSearchTimeout(
        () => {
          if(showResults) {
            setResults(searchBook(normalizedSearchStr))
          } else if(normalizedSearchStr) {
            setSuggestions(
              getAutoSuggest(normalizedSearchStr)
                .slice(0, 100)
                .filter(({ terms }) => terms.length === 1)
                .slice(0, 10)
            )
          }
        }
      )
    },
    [ normalizedSearchStr, showResults ],
  )

  useEffect(
    () => {
      if(showResults) {
        addRecentSearch({
          bookId,
          info: {
            str: normalizedSearchStr,
          },
        })
      }
    },
    [ showResults ],
  )

  const blurInput = useCallback(() => inputRef.current.blur(), [])

  const spineLabelsByIdRef = useMemo(
    () => {
      const labelsByIdRef = {}

      spines.forEach(({ idref, label }) => {
        labelsByIdRef[idref] = label
      })

      return labelsByIdRef
    },
    [ spines ],
  )

  const renderSuggestion = useCallback(
    ({ item: { suggestion, str } }) => (
      <TouchableOpacity
        key={suggestion || str}
        onPress={() => {
          setSearchStr(suggestion || str)
          toggleShowResults(true)
          blurInput()
        }}
      >
        <Text style={styles.suggestion}>
          {suggestion || str}
        </Text>
      </TouchableOpacity>
    ),
    [],
  )

  const renderResult = useCallback(
    ({ item: { spineIdRef, terms, text, hitIndex } }) => {
      const jsx = getResultLineInJSX({ text, terms, termStyle: styles.term })

      let charsBeforeFirstHit = 0
      for(let i=0; typeof jsx[i] === 'string'; i++) {
        charsBeforeFirstHit += jsx[i].length
      }

      return (
        <TouchableOpacity
          onPress={() => {
            goTo({
              spineIdRef,
              textNodeInfo: {
                content: text,
                hitIndex,
                startOffset: charsBeforeFirstHit,
                endOffset: charsBeforeFirstHit + 1,
              },
            })
          }}
        >
          <View style={styles.result}>
            <Text style={styles.resultSpine}>
              {spineLabelsByIdRef[spineIdRef] || spineIdRef}
            </Text>
            <Text style={styles.resultText}>
              {jsx}
            </Text>
          </View>
        </TouchableOpacity>
      )
    },
    [ goTo ],
  )

  if(!books[bookId]) return null

  const { title } = books[bookId]

  return (
    <View
      onStartShouldSetResponder={blurInput}
      style={styles.container}
    >
      {/* <BackFunction func={historyGoBack} /> */}
      <View style={styles.header}>
        <Input
          placeholder={i18n("Search {{title}}", {
            title,
          })}
          value={searchStr}
          onChangeText={setSearchStr}
          returnKeyType="search"
          returnKeyLabel={!normalizedSearchStr ? i18n("Search", "", "enhanced") : null}
          enablesReturnKeyAutomatically={true}
          blurOnSubmit={Platform.OS !== 'web'}
          onSubmitEditing={toggleShowResults}
          autoFocus={true}
          onFocus={() => toggleShowResults(false)}
          forwardRef={inputRef}
        />
      </View>
      {!showResults &&
        <>
          <FlatList
            contentContainerStyle={styles.flatListContent}
            data={normalizedSearchStr ? suggestions : (recentSearchesByBookId[bookId] || [])}
            renderItem={renderSuggestion}
            keyExtractor={({ suggestion, str }) => suggestion || `recent search\n${str}`}
            keyboardShouldPersistTaps='handled'
          />
          {suggestions.length === 0 &&
            <Text>
              Term not found
            </Text>
          }
        </>
      }
      {showResults &&
        <>
          <FlatList
            contentContainerStyle={styles.flatListContent}
            data={results}
            renderItem={renderResult}
            keyExtractor={({ spineIdRef, id }) => `${spineIdRef}\n${id}`}
          />
          {results.length === 0 &&
            <Text>
              No results
            </Text>
          }
        </>
      }
    </View>
  )
}

const mapStateToProps = ({ idp, accounts, books, recentSearchesByBookId }) => ({
  idp,
  accounts,
  books,
  recentSearchesByBookId,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  addRecentSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Search)
