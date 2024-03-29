import React from "react"
import { StyleSheet, Text, Platform } from "react-native"
import { Link } from "../../hooks/useRouterState"

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    paddingTop: 5,
    paddingBottom: 5,
  },
})

const BookInfoTitle = ({ to, children }) => {
  const title = <Text style={styles.title}>{children}</Text>

  if(Platform.OS === 'web') {
    return (
      <Link to={to}>
        {title}
      </Link>
    )
  }

  return title
}

export default BookInfoTitle