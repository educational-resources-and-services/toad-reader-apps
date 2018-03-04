import { NetInfo, AppState } from 'react-native'

import { JSON_to_URLEncoded } from './toolbox.js'

// I record the last time I successfully sent a user data patch for a particular book/account
// Then, whenever I patch, I filter down to objects which are newer than the last successful patch.

let latestInfo = {}
const currentlyPatchingBookAccountCombo = {}
const currentlyRefreshingBookAccountCombo = {}

const setAndGetLatestInfo = info => {
  if(info) latestInfo = info
  return latestInfo
}

const getAccountInfo = ({ idps, accountId }) => {
  const [ idpId, userId ] = accountId.split(':')
  const idp = idps[idpId]
  const { serverTimeOffset=0 } = latestInfo.accounts[accountId]

  return {
    idpId,
    idp,
    userId,
    serverTimeOffset,
  }
}

const reportResponseError = ({ message, response, error, retry }) => {
  console.error(message, error)
  if(response) {
    console.error(response.status)
    console.error(response.statusText)
    console.error(response.body)
    console.error('Will rerun in 30 seconds.')
  }
  retry && setTimeout(() => retry(), 30000)
}

export const patch = info => setTimeout(() => {
  // the setTimeout ensures this is async

  const { idps, accounts, books, userDataByBookId, updateAccount, updateBookAccount } = setAndGetLatestInfo(info)

  if(!idps || !accounts || !books || !userDataByBookId || !updateAccount || !updateBookAccount) return

  NetInfo.getConnectionInfo().then(connectionInfo => {
    if(connectionInfo.type === 'none') return

    Object.keys(accounts).forEach(accountId => {

      const { idpId, idp, userId, serverTimeOffset } = getAccountInfo({ idps, accountId })
      const patchTime = Date.now()
      const newUserData = {}
      let somethingToPatch = false

      if(!idp || !userId) return

      // filter down the userData object to only new items
      for(let bookId in userDataByBookId) {
        if(!books[bookId]) continue;   // should not ever happen
        if(!books[bookId].accounts[accountId]) continue

        const bookUserData = userDataByBookId[bookId]
        const lastSuccessfulPatch = books[bookId].accounts[accountId].lastSuccessfulPatch || 0

        newUserData[bookId] = { highlights: [] };

        if(bookUserData.updated_at > lastSuccessfulPatch) {
          newUserData[bookId].latest_location = bookUserData.latest_location
          newUserData[bookId].updated_at = bookUserData.updated_at
          somethingToPatch = true
        }

        (bookUserData.highlights || []).forEach(highlight => {
          if(highlight.updated_at > lastSuccessfulPatch) {
            newUserData[bookId].highlights.push({ ...highlight })
            somethingToPatch = true
          }
        })
      }

      if(somethingToPatch) {

        // send necessary patch requests
        Object.keys(newUserData).forEach(bookId => {
          const bookUserData = newUserData[bookId]

          if(currentlyPatchingBookAccountCombo[`${accountId} ${bookId}`]) return

          const updateLastSuccessfulPatch = () => {
            // save it in redux
            updateBookAccount({
              bookId,
              accountId, 
              accountInfo: {
                lastSuccessfulPatch: patchTime,
              },
            })

            // save it here too in case patch gets called again before I have a fresh books var
            books[bookId].accounts[accountId].lastSuccessfulPatch = patchTime
          }

          if(bookUserData.latest_location || bookUserData.highlights.length > 0) {

            // convert user data updated_at times to server time per server time offset
            if(bookUserData.updated_at) {
              bookUserData.updated_at = bookUserData.updated_at + serverTimeOffset
            }
            bookUserData.highlights.forEach(highlight => highlight.updated_at = highlight.updated_at + serverTimeOffset)

            console.log("Time-filtered userData object for patch request:", bookUserData);

            const path = `https://${idp.domain}/users/${userId}/books/${bookId}.json`

            currentlyPatchingBookAccountCombo[`${accountId} ${bookId}`] = true

            fetch(path, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
              },
              body: JSON_to_URLEncoded(bookUserData),
            })
              .then(response => {

                currentlyPatchingBookAccountCombo[`${accountId} ${bookId}`] = false

                if(response.status < 400) {
                  console.log(`Patch successful (bookId: ${bookId}, userId: ${userId}, domain: ${idp.domain}).`)
    
                  // update lastSuccessfulPatch
                  updateLastSuccessfulPatch()
    
                  // run again in case something has changed since the patch was sent
                  patch()
    
                } else if(response.status === 403) {
                  // they need to login
                  updateAccount({
                    accountId,
                    accountInfo: {
                      needToLogInAgain: true
                    },
                  })
    
                } else if(response.status === 412) {
                  console.log(`User data is stale (bookId: ${bookId}, userId: ${userId}, domain: ${idp.domain}).`)
    
                  // still, the new stuff was saved and so update lastSuccessfulPatch
                  updateLastSuccessfulPatch()
    
                  // update the userData for this book
                  refreshUserData({ accountId, bookId })
    
                } else {
                  reportResponseError({
                    message: `Patch error to ${path}`,
                    response,
                    retry: patch,
                  })
                }

              })
              .catch(error => {
              
                currentlyPatchingBookAccountCombo[`${accountId} ${bookId}`] = false

                reportResponseError({
                  message: `Fetch error when trying to patch to ${path}`,
                  error,
                  retry: patch,
                })
              
              })
          }
        })
      }
    })
  })
})

export const refreshUserData = ({ accountId, bookId, info }) => setTimeout(() => {
  // the setTimeout ensures this is async

  const { idps, books, userDataByBookId, updateAccount, setUserData } = setAndGetLatestInfo(info)
  
  if(!accountId || !bookId || !idps || !books || !userDataByBookId || !updateAccount || !setUserData) return
  if(currentlyRefreshingBookAccountCombo[`${accountId} ${bookId}`]) return
  if(!books[bookId].accounts[accountId]) return

  const { idpId, idp, userId, serverTimeOffset } = getAccountInfo({ idps, accountId })
  const lastSuccessfulPatch = books[bookId].accounts[accountId].lastSuccessfulPatch || 0

  NetInfo.getConnectionInfo().then(connectionInfo => {
    if(connectionInfo.type === 'none') return

    const path = `https://${idp.domain}/users/${userId}/books/${bookId}.json`

    currentlyRefreshingBookAccountCombo[`${accountId} ${bookId}`] = true
    
    fetch(path)
      .then(response => {

        currentlyRefreshingBookAccountCombo[`${accountId} ${bookId}`] = false

        if(response.status < 400) {  // success

          if(response._bodyText === "") {
            // there has not yet been any user data set for this book
            patch()
            return
          }

          response.json()
            .then(userData => {
              // put into redux
              if(!userData.latest_location || !userData.updated_at || !userData.highlights) {
                reportResponseError({
                  message: `Incomplete response to user data fetch (${path}).`,
                  response,
                  retry: () => refreshUserData({ accountId, bookId }),
                })
                return
              }

              // convert user data updated_at times to local device per server time offset
              userData.updated_at = userData.updated_at - serverTimeOffset
              userData.highlights.forEach(highlight => highlight.updated_at = highlight.updated_at - serverTimeOffset)
              
              setUserData({ bookId, userData, lastSuccessfulPatch })

              console.log(`User data refresh successful (bookId: ${bookId}, userId: ${userId}, domain: ${idp.domain}).`)

              patch()
              
            })
            .catch(error => {
              reportResponseError({
                message: `Non-JSON response to user data fetch (${path}).`,
                response,
                retry: () => refreshUserData({ accountId, bookId }),
              })
            })

        } else if(response.status === 403) {
          // they need to login
          updateAccount({
            accountId,
            accountInfo: {
              needToLogInAgain: true
            },
          })

        } else {
          reportResponseError({
            message: `User data fetch error (${path}).`,
            response,
            retry: () => refreshUserData({ accountId, bookId }),
          })
        }

        })
      .catch(error => {
      
        currentlyRefreshingBookAccountCombo[`${accountId} ${bookId}`] = false

        reportResponseError({
          message: `Fetch error when trying to refresh user data ${path}`,
          error,
          retry: () => refreshUserData({ accountId, bookId }),
        })

      })
  })
})

NetInfo.addEventListener('connectionChange', () => patch())
AppState.addEventListener('change', () => patch())
