export const addBooks = ({ books, accountId }) => ({
  type: "ADD_BOOKS",
  books,
  accountId,
})

export const setDownloadStatus = ({ bookId, downloadStatus }) => ({
  type: "SET_DOWNLOADED_STATUS",
  bookId,
  downloadStatus,
})

export const setTocAndSpines = ({ bookId, toc, spines }) => ({
  type: "SET_TOC_AND_SPINES",
  bookId,
  toc,
  spines,
})

export const setSpines = ({ bookId, spines }) => ({
  type: "SET_SPINES",
  bookId,
  spines,
})

export const setSort = ({ sort }) => ({
  type: "SET_SORT",
  sort,
})

export const reSort = () => ({
  type: "SET_SORT",
})

export const setFetchingBooks = ({ value }) => ({
  type: "SET_FETCHING_BOOKS",
  value,
})

export const setErrorMessage = ({ message }) => ({
  type: "SET_ERROR_MESSAGE",
  message,
})

export const toggleView = () => ({
  type: "TOGGLE_VIEW",
})

