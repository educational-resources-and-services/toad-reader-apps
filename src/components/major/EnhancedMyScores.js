import React, { useState, useEffect, useMemo } from "react"
import { StyleSheet, View, ScrollView, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import { CSVLink } from "react-csv"

import { getDataOrigin, getReqOptionsWithAdditions, safeFetch, getDateLine,
         getTimeLine, combineItems } from '../../utils/toolbox'
import useClassroomInfo from '../../hooks/useClassroomInfo'

import CoverAndSpin from '../basic/CoverAndSpin'
import FAB from '../basic/FAB'

const height = 35
const margin = 10
const paddingVertical = 10

const cell = {
  height,
  minHeight: height,
  maxHeight: height,
  margin,
}

const cellText = {
  fontWeight: '300',
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
  genericContainer: {
    marginVertical: 20,
    marginHorizontal: 30,
    flex: 1,
  },
  container: {
    marginLeft: 30,
    flex: 1,
    flexDirection: 'row',
  },
  quizNames: {
    backgroundColor: 'rgb(247, 249, 252)',
    flexDirection: 'column',
    paddingVertical,
    minHeight: '100%',
  },
  scrollView: {
    flex: 1,
    minHeight: '100%',
  },
  scrollViewContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingLeft: 10,
    paddingVertical: 10,
    paddingRight: 30,
    flex: 'none',
  },
  none: {
    textAlign: 'center',
    paddingTop: 50,
    fontSize: 16,
    fontWeight: '100',
  },
  cell: {
    ...cell,
    ...cellText,
  },
  quizNameCell: {
    ...cell,
    ...cellText,
    maxWidth: 150,
  },
  previousAttempts: {
    fontWeight: 100,
    marginLeft: 20,
  },
})

const EnhancedMyScores = React.memo(({
  bookId,

  idps,
  accounts,
  books,
  userDataByBookId,
}) => {

  const { classroomUid, idpId, isDefaultClassroom, classroom } = useClassroomInfo({ books, bookId, userDataByBookId })

  const [ data, setData ] = useState()
  const [ error, setError ] = useState()

  const accountId = Object.keys(accounts)[0] || ""

  useEffect(
    () => {

      (async () => {

        setData()

        const path = `${getDataOrigin(idps[idpId])}/getmyscores/${classroomUid}`
        let response = {}

        try {
          response = await safeFetch(path, getReqOptionsWithAdditions({
            headers: {
              "x-cookie-override": accounts[accountId].cookie,
            },
          }))
        } catch(err) {
          response.statusText = err.message || 'Internet connection error'
          response.status = 500
        }

        const json = response.json ? await response.json() : {}

        if(response.status >= 400) {
          setError(json.error || response.statusText || 'Unknown error')
          return
        }

        setData(json)

      })()

    },
    [ classroomUid ],
  )

  const { dataRows, csvData } = useMemo(
    () => {
      if(!data) return {}

      const dataRows = []
      const csvData = [
        [
          i18n("Quiz name", "", "enhanced"),
          i18n("Most recent score", "", "enhanced"),
          i18n("Most recent attempt date", "", "enhanced"),
          i18n("Most recent attempt time", "", "enhanced"),
          i18n("Most recent attempt raw date and time", "", "enhanced"),
          i18n("Previous attempts", "", "enhanced"),
        ],
      ]

      // TODO: sort spines
      Object.values(data.quizzesByLoc).forEach(quizzesByCfi => {
        // TODO: sort cfis
        Object.values(quizzesByCfi).forEach(quizzes => {
          quizzes.forEach(({ name, scores }) => {
            const formattedScores = scores.map(({ score, submitted_at }, idx) => (
              score == undefined
                ? ``
                : i18n("{{percent}}% ({{date}})", "", "enhanced", {
                    percent: Math.round(score * 100),
                    date: getDateLine({ timestamp: submitted_at, short: true }),
                  })
            ))

            dataRows.push({
              name: name || i18n("Quiz", "", "enhanced"),
              scores: formattedScores,
            })

            csvData.push([
              name || i18n("Quiz", "", "enhanced"),
              scores[0].score || ``,
              scores[1].submitted_at ? getDateLine({ timestamp: scores[1].submitted_at }) : ``,
              scores[1].submitted_at ? getTimeLine({ timestamp: scores[1].submitted_at }) : ``,
              scores[1].submitted_at ? new Date(scores[1].submitted_at).toString() : ``,
              formattedScores.slice(1).join("\n"),
            ])
          })
        })
      })

      return { dataRows, csvData }
    },
    [ data ],
  )

  if(!classroomUid) return null

  if(error) {
    return (
      <Text style={styles.error}>
        Error: {error}
      </Text>
    )
  }

  if(!data) {
    return (
      <View style={styles.genericContainer}>
        <CoverAndSpin />
      </View>
    )
  }

  if(dataRows.length === 0) {
    return (
      <View style={styles.genericContainer}>
        <Text style={styles.none}>
          {i18n("This classroom does not contain any quizzes.", "", "enhanced")}
        </Text>
      </View>
    )
  }

  const columnHeightStyle = {
    height: (height + margin*2) * dataRows.length + paddingVertical*2,
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.quizNames,
          columnHeightStyle,
        ]}
      >
        {dataRows.map(({ name }) => (
          <Text
            style={styles.quizNameCell}
            numberOfLines={2}
          >
            {name}
          </Text>
        ))}
      </View>
      <ScrollView
        style={[
          styles.scrollView,
          columnHeightStyle,
        ]}
        contentContainerStyle={styles.scrollViewContent}
        horizontal={true}
      >
        {dataRows.map(({ scores }) => (
          <Text
            style={styles.cell}
            numberOfLines={2}
          >
            {scores[0]}
            {scores.length > 1 &&
              <Text style={styles.previousAttempts}>
                {i18n("Previous attempts: {{scores}}", "", "enhanced", { scores: combineItems(...scores.slice(1)) })}
              </Text>
            }
          </Text>
        ))}
      </ScrollView>
      <CSVLink
        data={csvData}
        filename={
          i18n("My scores")
          + " - "
          + (isDefaultClassroom
            ? i18n("Enhanced book", "", "enhanced")
            : (classroom || "").name
          )
          + " - "
          + new Date().toDateString()
        }
        target="_blank"
      >
        <FAB
          iconName="md-cloud-download"
          status="primary"
        />
      </CSVLink>

    </View>
  )
})

const mapStateToProps = ({ idps, accounts, books, userDataByBookId }) => ({
  idps,
  accounts,
  books,
  userDataByBookId,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(EnhancedMyScores)