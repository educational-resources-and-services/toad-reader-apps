import React from "react"
import { AppState, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Container, Content, Text, View } from "native-base"
import { FileSystem } from "expo"
import i18n from "../../utils/i18n.js"
import downloadAsync from "../../utils/downloadAsync.js"

import LibraryHeader from "../major/LibraryHeader"
import LibraryCovers from "../major/LibraryCovers"
import LibraryList from "../major/LibraryList"
import Options from "../major/Options"
import Spin from "../basic/Spin"
import PageCaptureManager from "../major/PageCaptureManager"

import { addBooks, reSort, setSort, setFetchingBooks, setErrorMessage, setDownloadStatus } from "../../redux/actions.js"

const {
  APP_BACKGROUND_COLOR,
} = Expo.Constants.manifest.extra

const styles = StyleSheet.create({
  noBooks: {
    marginTop: 50,
    textAlign: 'center',
  },
  spinnerContainer: {
    padding: 40,
  },
  content: {
    zIndex: 1,
    backgroundColor: APP_BACKGROUND_COLOR,
  },
})

class Library extends React.Component {

  state = {
    showOptions: false,
  }

  async fetchAll(nextProps) {
    const { setFetchingBooks, accounts, idps, addBooks, reSort, setErrorMessage, navigation } = nextProps || this.props

    if(Object.keys(accounts).length === 0) {
      // when I move to multiple accounts, this will instead need to go to the Accounts screen
      navigation.navigate("Login", {
        idpId: Object.keys(idps)[0],
      })
      return
    }

    // TODO: presently it gets the account libraries just one at a time; could get these in parallel to be quicker
    this.setState({ lastFetchAll: Date.now() })
    setFetchingBooks({ value: true })
    for(accountId in accounts) {
      try {

        // update books
        const [ idpId, userId ] = accountId.split(':')
// I AM HERE
//   - I would think the next line should be /logout/callback, but that doesn't work
//   - also, the hard logout from BibleMesh is not working either (I cannot understand why)
        // await fetch(`https://${idps[idpId].domain}/logout`)  // this forces a refresh on the library
        console.log('fetch', await fetch(`https://${idps[idpId].domain}/logout`))  // this forces a refresh on the library
        const libraryUrl = `https://${idps[idpId].domain}/epub_content/epub_library.json`
        let response = await fetch(libraryUrl)
        if(response.status == 403) {
          await fetch(`https://${idps[idpId].domain}`)  // gets the cookie situated on the demo acct
          response = await fetch(libraryUrl)
        }
        if(response.status != 200) {
          throw new Error('Unable to fetch library')
          // TODO: force a login
        }
        const books = await response.json()
        // TODO: needs to call function to remove books that are no longer in the account
        addBooks({
          books,
          accountId,
        })
        reSort()
        
        // get covers
        books.forEach(async book => {
          if(book.coverHref) {
            await downloadAsync(
              `https://${idps[idpId].domain}/${book.coverHref}`,
              `${FileSystem.documentDirectory}covers/${book.id}/${book.coverHref.split('/').pop()}`,
              { skipIfExists: true }
            )
          }
        })

      } catch(error) {
        console.log('error', error)
        setErrorMessage({ message: error.message || error || "Unknown error." })
      }
    }
    setFetchingBooks({ value: false })
  }
  
  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange)
    this.fetchAll()
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange)
  }

  componentWillReceiveProps(nextProps) {
    const { accounts } = this.props

    if(nextProps.accounts !== accounts) {
      this.fetchAll(nextProps)
    }
  }

  _handleAppStateChange = () => {
    const { accounts } = this.props
    
    if(Object.keys(accounts).length === 0 || Date.now() - this.state.lastFetchAll > 60*60*1000) {  // an hour or more later
      this.fetchAll()
    }
  }

  toggleShowOptions = () => {
    const { showOptions } = this.state

    this.setState({ showOptions: !showOptions })
  }
  
  hideOptions = () => this.setState({ showOptions: false })

  render() {

    const { library, books, fetchingBooks, navigation, setSort } = this.props
    const { showOptions } = this.state

    let { scope } = navigation.state.params || {}
    scope = scope || "all"

    const LibraryViewer = library.view == "covers" ? LibraryCovers : LibraryList
    const bookList = scope == 'all'
      ? library.bookList
      : (scope == 'device'
        ? library.bookList.filter(bookId => books[bookId].downloadStatus == 2)
        : library.bookList.filter(bookId => (
          books[bookId].accountIds.some(accountId => accountId.split(':')[0] == scope.split(':')[0])
        ))
      )

    return (
      <Container>
        <LibraryHeader
          scope={scope}
          navigation={navigation}
          toggleShowOptions={this.toggleShowOptions}
          hideOptions={this.hideOptions}
        />
        {fetchingBooks && bookList.length == 0
          ? (
            <View style={styles.spinnerContainer}>
              <Spin />
            </View>
          )
          : (
            bookList.length == 0
              ? (
                <Text style={styles.noBooks}>{i18n("No books found.")}</Text>
              )
              : (
                <Content style={styles.content}>
                  <LibraryViewer
                    bookList={bookList}
                    navigation={navigation}
                  />
                </Content>
              )
          )
        }
        {showOptions && 
          <Options
            requestHide={this.hideOptions}
            headerText={i18n("Sort by...")}
            options={[
              {
                text: i18n("Title"),
                selected: library.sort == 'title',
                onPress: () => setSort({ sort: 'title' }),
              },
              {
                text: i18n("Author"),
                selected: library.sort == 'author',
                onPress: () => setSort({ sort: 'author' }),
              },
            ]}
          />
        }

        <PageCaptureManager />

        {/* TODO: Add modal for error message */}
      </Container>
    )
  }
}

const mapStateToProps = (state) => ({
  accounts: state.accounts,
  idps: state.idps,
  books: state.books,
  library: state.library,
  fetchingBooks: state.fetchingBooks,
  errorMessage: state.errorMessage,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  addBooks,
  reSort,
  setSort,
  setFetchingBooks,
  setErrorMessage,
  setDownloadStatus,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Library)
