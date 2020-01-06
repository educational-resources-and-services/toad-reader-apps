const initialState = {}

export default function(state = initialState, action) {
  const newState = {...state}

  const removeAccount = (exceptBookIds = []) => {
    for(let bookId in newState) {
      if(exceptBookIds.includes(bookId)) continue
      const accounts = {...newState[bookId].accounts}
      delete accounts[action.accountId]
      const newNumAccounts = Object.keys(accounts).length
      if(newNumAccounts === 0) {
        delete newState[bookId]
      } else if(Object.keys(state[bookId].accounts).length !== newNumAccounts) {
        newState[bookId] = {
          ...newState[bookId],
          accounts,
        }
      }
    }
  }

  switch (action.type) {

    case "ADD_BOOKS":
      removeAccount(action.books.map(book => book.id))
      action.books.forEach(book => {
        newState[book.id] = {
          title: book.title,
          author: book.author,
          epubSizeInMB: book.epubSizeInMB,
          isbn: book.isbn,
          version: book.version,
          totalCharacterCount: book.totalCharacterCount,
          coverHref: book.coverHref,
          subscriptions: book.subscriptions,
          downloadStatus: (state[book.id] && state[book.id].downloadStatus) || 0,
          toc: (state[book.id] && state[book.id].toc) || undefined,
          spines: (state[book.id] && state[book.id].spines) || undefined,
          accounts: {
            ...((state[book.id] && state[book.id].accounts) || {}),
            [action.accountId]: {
              ...!((book.link_href && book.link_label) ? {} : {
                link: {
                  href: book.link_href,
                  label: book.link_label,
                },
              }),
              version: book.version || 'BASE',
              ...(!book.expires_at ? {} : { expires_at: book.expires_at }),
              ...(!book.enhanced_tools_expire_at ? {} : { enhanced_tools_expire_at: book.enhanced_tools_expire_at }),
              lastSuccessfulPatch: (((state[book.id] && state[book.id].accounts) || {})[action.accountId] || {}).lastSuccessfulPatch || Date.now(),
            },
          },
        }
      })
      return newState

    case "DELETE_BOOK":
      delete newState[action.bookId]
      return newState

    case "SET_COVER_FILENAME":
      if(newState[action.bookId]) {
        newState[action.bookId] = {
          ...state[action.bookId],
          coverFilename: action.coverFilename,
        }
        return newState
      }
      return state

    case "REMOVE_ACCOUNT":
      removeAccount()
      return newState

    case "UPDATE_BOOK_ACCOUNT":
      if(newState[action.bookId]) {
        newState[action.bookId] = {
          ...state[action.bookId],
          accounts: {
            ...state[action.bookId].accounts,
            [action.accountId]: {
              ...state[action.bookId].accounts[action.accountId],
              ...action.accountInfo,
            },
          },
        }
        return newState
      }
      return state

    case "SET_DOWNLOADED_STATUS":
      if(newState[action.bookId]) {
        if(action.downloadStatus == 0) {
          delete newState[action.bookId].toc
          delete newState[action.bookId].spines
        }
        newState[action.bookId] = {
          ...newState[action.bookId],
          downloadStatus: action.downloadStatus,
        }
        return newState
      }
      return state

    case "SET_CURRENT_CLASSROOM":
      if(newState[action.bookId]) {
        newState[action.bookId] = {
          ...newState[action.bookId],
          currentClassroomUid: action.uid,
        }
        return newState
      }
      return state

    case "SET_SELECTED_TOOL_UID": {
      if(newState[action.bookId]) {
        newState[action.bookId] = {
          ...newState[action.bookId],
          selectedToolUid: action.uid,
        }
        return newState
      }
      return state
    }

    case "SET_TOC_AND_SPINES":
      if(newState[action.bookId]) {
        newState[action.bookId] = {
          ...newState[action.bookId],
          toc: action.toc,
          spines: action.spines,
        }
        return newState
      }
      return state

    case "CLEAR_TOC_AND_SPINES":
      if(newState[action.bookId]) {
        newState[action.bookId] = {
          ...newState[action.bookId],
        }
        delete newState[action.bookId].toc
        delete newState[action.bookId].spines
        return newState
      }
      return state

    case "ADD_SPINE_PAGE_CFIS":
      const objToInsert = { [action.key]: action.pageCfis }
      if(newState[action.bookId]) {
        newState[action.bookId] = { ...newState[action.bookId] }
        if(newState[action.bookId].spines) {
          newState[action.bookId].spines = newState[action.bookId].spines.map(spine => (
            spine.idref == action.idref
              ?
                {
                  ...spine,
                  pageCfis: {
                    ...(spine.pageCfis || {}),
                    ...objToInsert,
                  },
                }
              : spine
          ))
        }
        return newState
      }
      return state

    case "CLEAR_ALL_SPINE_PAGE_CFIS":
      if(newState[action.bookId] && newState[action.bookId].spines) {
        newState[action.bookId] = {
          ...newState[action.bookId],
          spines: newState[action.bookId].spines.map(spine => {
            const newSpine = {...spine}
            delete newSpine.pageCfis
            return newSpine
          }),
        }
        return newState
      }
      return state

      case "SET_SUBSCRIPTIONS": {
        if(newState[action.bookId]) {
          newState[action.bookId] = {
            ...newState[action.bookId],
            subscriptions: action.subscriptions,
          }
          return newState
        }
        return state
      }
  
  }

  return state
}