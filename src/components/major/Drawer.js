import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Image, StyleSheet } from "react-native"
import { Container, Content, Text, List, ListItem, Left, Icon, Body, Separator, ActionSheet, Toast, View } from "native-base"
import i18n from "../../utils/i18n.js"

import removeEpub from "../../utils/removeEpub.js"

import { setDownloadStatus } from "../../redux/actions.js"

const styles = StyleSheet.create({
  imageContainer: {
    paddingBottom: '50%',
    position: 'relative',
  },
  image: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#eeeef3',
  },
})

class Drawer extends React.Component {

  render() {

    const { accounts, idps, books, setDownloadStatus } = this.props
    const accountIdpIds = []
    const hasMultipleAccountsForSingleIdp = Object.keys(accounts).some(accountId => {
      const idpId = accountId.split(':')[0]
      if(accountIdpIds.includes(idpId)) return true
      accountIdpIds.push(idpId)
    })

    return (
      <Container>
        <Content>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: "https://s3-us-west-2.amazonaws.com/biblemesh-readium/tenant_assets/drawer-2.png"
              }}
              style={styles.image}
            />
          </View>
          <List>
            <ListItem icon
              button
              onPress={() => this.props.navigation.navigate("Library", { scope: "all" })}
            >
              <Left>
                <Icon name="book" />
              </Left>
              <Body>
                <Text>{i18n("Library")}</Text> 
              </Body>
            </ListItem>
            {Object.keys(accounts).length > 1 && Object.keys(accounts).map(id => (
              <ListItem icon
                key={id}
                button
                onPress={() => this.props.navigation.navigate("Library", { scope: id })}
              >
                <Left>
                  <Icon name="book" />
                </Left>
                <Body>
                  <Text>{i18n("{{tenant}} only", { tenant: idps[id.split(':')[0]].idpName })}</Text>
                  {hasMultipleAccountsForSingleIdp &&
                    <Text>{accounts[id].email}</Text>
                  }
                </Body>
              </ListItem>
            ))}
            <ListItem icon
              button
              onPress={() => this.props.navigation.navigate("Library", { scope: "device" })}
            >
              <Left>
                <Icon name="checkmark" />
              </Left>
              <Body>
                <Text>{i18n("On device only")}</Text>
              </Body>
            </ListItem>
            <Separator bordered />
            <ListItem icon
              button
              onPress={() => this.props.navigation.navigate("Accounts")}
            >
              <Left>
                <Icon name="person" />
              </Left>
              <Body>
                <Text>{i18n("Accounts")}</Text> 
              </Body>
            </ListItem>
            <ListItem icon
              button
              onPress={() => ActionSheet.show(
                {
                  options: [
                    { text: i18n("Remove all books"), icon: "remove-circle", iconColor: "#fa213b" },
                    { text: i18n("Cancel"), icon: "close" }
                  ],
                  destructiveButtonIndex: 0,
                  cancelButtonIndex: 1,
                  title: i18n("Are you sure you want to remove all books from this device?"),
                },
                buttonIndex => {
                  if(buttonIndex == 0) {
                    Object.keys(books).forEach(bookId => {
                      setDownloadStatus({ bookId, downloadStatus: 0 })
                      removeEpub({ bookId })
                    })
                    Toast.show({
                      text: i18n("All books removed."),
                      buttonText: i18n("Okay"),
                      duration: 5000,
                    })
                  }
                }
              )}
            >
              <Left>
                <Icon name="remove-circle" />
              </Left>
              <Body>
                <Text>{i18n("Remove all books")}</Text>
              </Body>
            </ListItem>
          </List>
        </Content>
      </Container>
    )
  }
}

const mapStateToProps = (state) => ({
  accounts: state.accounts,
  idps: state.idps,
  books: state.books,
})

const  matchDispatchToProps = (dispatch, x) => bindActionCreators({
  setDownloadStatus,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Drawer)
