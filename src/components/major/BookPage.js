import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { View } from "react-native"
import { StyleSheet } from "react-native"

import PageWebView from "./PageWebView"
import DisplaySettings from "./DisplaySettings"

import { postMessage } from "../../utils/postMessage.js"
import takeSnapshot from "../../utils/takeSnapshot.js"

import { incrementSpineImagesIndex, setLatestLocation } from "../../redux/actions.js"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

class BookPage extends React.Component {

  componentDidMount() {
    this.setDisplaySettings()
    // this.goToLatestLocation()
  }

  componentWillReceiveProps(nextProps) {
    const { displaySettings, spineIdRef, pageIndexInSpine } = this.props

    if(nextProps.displaySettings !== displaySettings) {
      this.setDisplaySettings(nextProps)
    }

    if(nextProps.spineIdRef !== spineIdRef || nextProps.pageIndexInSpine !== pageIndexInSpine) {
      this.goToLatestLocation(nextProps)
    }
  }

  setDisplaySettings = nextProps => {
    const { displaySettings } = nextProps || this.props

    postMessage(this.webView, 'setDisplaySettings', {
      ...displaySettings,
      columns: 'single',
    })
  }

  goToLatestLocation = nextProps => {
    const { spineIdRef, pageIndexInSpine } = nextProps || this.props

    if(spineIdRef == null || pageIndexInSpine == null) return

    postMessage(this.webView, 'goToPage', {
      spineIdRef,
      pageIndexInSpine,
    })
  }

  goToHref = params => postMessage(this.webView, 'goToHref', params)

  onMessageEvent = async data => {
    const { setLatestLocation, bookId, indicateLoaded, requestShowPages } = this.props

    switch(data.identifier) {
      case 'pageChanged':

        const { newSpineIdRef, newCfi } = data.payload

        setLatestLocation({
          bookId,
          latestLocation: {
            spineIdRef: newSpineIdRef,
            cfi: newCfi,
          },
        })

        indicateLoaded()

        // await this.doTakeSnapshot()

        return false  // i.e. still process pageChanged in the general PageWebView component

      case 'showPageListView':
        requestShowPages({
          goToHref: this.goToHref,
        })
        return true
    }
  }

  setWebViewEl = webViewEl => this.webView = webViewEl

//   setView = ref => this.view = ref
  
//   doTakeSnapshot = async () => {
//     const { bookId, incrementSpineImagesIndex } = this.props

// console.log('before')
//     await takeSnapshot({
//       view: this.view,
//       bookId: bookId,
//       fileName: `test.jpg`,
//     })

//     incrementSpineImagesIndex()

//     return true

//   }

  render() {
    const { bookId, showSettings, requestHideSettings, latest_location } = this.props

    return (
      <View style={styles.container}>
        <PageWebView
          bookId={bookId}
          setWebViewEl={this.setWebViewEl}
          onMessage={this.onMessageEvent}
          latest_location={latest_location}
          // setView={this.setView}
        />
        {showSettings && 
          <DisplaySettings
            requestHide={requestHideSettings}
          />
        }
      </View>
    )
  }
}

const mapStateToProps = (state) => ({
  displaySettings: state.displaySettings,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  incrementSpineImagesIndex,
  setLatestLocation,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(BookPage)