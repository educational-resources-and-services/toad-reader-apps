import React, { useMemo } from "react"
import { StyleSheet, View, Text, ScrollView } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"

import { getDateLine, getTimeLine, orderSpineIdRefKeyedObj, orderCfiKeyedObj } from '../../utils/toolbox'
import dummyStudents from '../../utils/dummyStudents'
import dummyAnalytics from '../../utils/dummyAnalytics'
import useClassroomInfo from '../../hooks/useClassroomInfo'
import useWideMode from "../../hooks/useWideMode"
import useAdjustedDimensions from "../../hooks/useAdjustedDimensions"
import useDashboardData from "../../hooks/useDashboardData"

import CoverAndSpin from '../basic/CoverAndSpin'
import NoStudentsBox from '../basic/NoStudentsBox'
import EnhancedAnalyticsTotalReading from './EnhancedAnalyticsTotalReading'
import EnhancedAnalyticsReadingBySpine from './EnhancedAnalyticsReadingBySpine'
import EnhancedAnalyticsReadingOverTime from './EnhancedAnalyticsReadingOverTime'
import EnhancedAnalyticsStatusesByDueDate from './EnhancedAnalyticsStatusesByDueDate'
import EnhancedAnalyticsQuizCompletions from './EnhancedAnalyticsQuizCompletions'
import EnhancedAnalyticsQuizScores from './EnhancedAnalyticsQuizScores'

const chartMarginHorizontal = 20
const chartMarginHorizontalWideMode = 30

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
    flex: 1,
  },
  contentContainer: {
  },
  chart: {
    marginVertical: 20,
    marginHorizontal: chartMarginHorizontal,
  },
  chartWideMode: {
    marginVertical: 20,
    marginBottom: 40,
    marginHorizontal: chartMarginHorizontalWideMode,
  },
  chartName: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 20,
  },
  chartExpl: {
    fontWeight: '100',
    fontSize: 13,
    marginTop: -14,
    marginBottom: 20,
  },
})

const EnhancedAnalytics = React.memo(({
  bookId,

  idps,
  accounts,
  books,
  userDataByBookId,
  sidePanelSettings,
}) => {

  const { classroomUid, idpId, classroom, students, spines } = useClassroomInfo({ books, bookId, userDataByBookId })

  const { fullPageWidth } = useAdjustedDimensions({ sidePanelSettings })
  const wideMode = useWideMode()
  const chartWidth = fullPageWidth - (wideMode ? chartMarginHorizontalWideMode : chartMarginHorizontal) * 2

  const { data, error } = useDashboardData({
    classroomUid,
    idp: idps[idpId],
    accounts,
    query: "getanalytics",
  })

  const { isDummy=false, ...orderedData } = useMemo(
    () => {
      if(!data || students.length === 0) return dummyAnalytics

      const spineLabels = {}
      spines.forEach(({ idref, label }) => {
        spineLabels[idref] = label
      })

      Object.keys(data.readingBySpine).forEach(spineIdRef => {
        data.readingBySpine[spineIdRef] = {
          minutes: data.readingBySpine[spineIdRef],
          spine: spineLabels[spineIdRef]
        }
      })

      const readingBySpine = orderSpineIdRefKeyedObj({ obj: data.readingBySpine, spines })

      const { readingOverTime } = data

      const readingScheduleStatuses = data.readingScheduleStatuses.map(({ due_at, ontime, late }) => ({
        dueAtText: `${getDateLine({ timestamp: due_at, short: true })}\n${getTimeLine({ timestamp: due_at, short: true })}`,
        ontime,
        late,
      }))

      const completionsByQuiz = []
      const averageScoresByQuiz = []

      orderSpineIdRefKeyedObj({ obj: data.quizStatsByLoc, spines }).forEach(quizzesByCfi => {
        orderCfiKeyedObj({ obj: quizzesByCfi }).forEach(quizzes => {
          quizzes.forEach(({ name, data: [ completions, avgFirstScore, avgBestScore ] }) => {
            completionsByQuiz.push({
              name,
              completions,
            })
            averageScoresByQuiz.push({
              name,
              avgFirstScore,
              avgBestScore,
            })
          })
        })
      })

      return {
        readingBySpine,
        readingOverTime,
        readingScheduleStatuses,
        completionsByQuiz,
        averageScoresByQuiz,
      }
      
    },
    [ data, students ],
  )

  if(!classroomUid) return null

  if(error && !classroom.isNew) {
    return (
      <Text style={styles.error}>
        Error: {error}
      </Text>
    )
  }

  if(!data && !(error && classroom.isNew)) {
    return (
      <View style={styles.genericContainer}>
        <CoverAndSpin />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >

      {isDummy && <NoStudentsBox />}

      <View style={wideMode ? styles.chartWideMode : styles.chart}>
        <Text style={styles.chartName}>
          {i18n("Total reading", "", "enhanced")}
        </Text>
        <EnhancedAnalyticsTotalReading
          readingBySpine={orderedData.readingBySpine}
          numStudents={(isDummy ? dummyStudents : students).length}
        />
      </View>

      <View style={wideMode ? styles.chartWideMode : styles.chart}>
        <Text style={styles.chartName}>
          {i18n("Reading time by chapter", "", "enhanced")}
        </Text>
        <EnhancedAnalyticsReadingBySpine
          readingBySpine={orderedData.readingBySpine}
          width={chartWidth}
        />
      </View>

      <View style={wideMode ? styles.chartWideMode : styles.chart}>
        <Text style={styles.chartName}>
          {i18n("Reading over time", "", "enhanced")}
        </Text>
        <EnhancedAnalyticsReadingOverTime
          readingOverTime={orderedData.readingOverTime}
          width={chartWidth}
        />
      </View>

      <View style={wideMode ? styles.chartWideMode : styles.chart}>
        <Text style={styles.chartName}>
          {i18n("Reading schedule statuses", "", "enhanced")}
        </Text>
        <Text style={styles.chartExpl}>
          {i18n("A chapter is considered complete when a student has spent at least 5 minutes reading it.", "", "enhanced")}
        </Text>
        <EnhancedAnalyticsStatusesByDueDate
          readingScheduleStatuses={orderedData.readingScheduleStatuses}
          width={chartWidth}
          numStudents={(isDummy ? dummyStudents : students).length}
        />
      </View>

      <View style={wideMode ? styles.chartWideMode : styles.chart}>
        <Text style={styles.chartName}>
          {i18n("Quizzes taken", "", "enhanced")}
        </Text>
        <EnhancedAnalyticsQuizCompletions
          completionsByQuiz={orderedData.completionsByQuiz}
          width={chartWidth}
          numStudents={(isDummy ? dummyStudents : students).length}
        />
      </View>

      <View style={wideMode ? styles.chartWideMode : styles.chart}>
        <Text style={styles.chartName}>
          {i18n("Quiz scores", "", "enhanced")}
        </Text>
        <EnhancedAnalyticsQuizScores
          averageScoresByQuiz={orderedData.averageScoresByQuiz}
          width={chartWidth}
        />
      </View>

    </ScrollView>
  )
})

const mapStateToProps = ({ idps, accounts, books, userDataByBookId, sidePanelSettings }) => ({
  idps,
  accounts,
  books,
  userDataByBookId,
  sidePanelSettings,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(EnhancedAnalytics)