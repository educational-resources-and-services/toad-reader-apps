import { AsyncStorage } from "react-native"
import { FileSystem } from "expo"

import { fetchZipAndAssets } from "./zipDownloader.js"

// the READER_VERSION_TIMESTAMP needs to be updated any time any reader files are updated
const {
  READER_VERSION_TIMESTAMP,
} = Expo.Constants.manifest.extra

const updateReader = async () => {
  
  console.log(`Check reader...`)

  const versionTimestampOfCurrentReader = await AsyncStorage.getItem('readerVersionTimestamp')
  if(versionTimestampOfCurrentReader == READER_VERSION_TIMESTAMP) {
    console.log(`Reader up-to-date.`)
    return
  }

  console.log(`Download updated reader...`)
  
  const zipUrl = `https://s3-us-west-2.amazonaws.com/biblemesh-readium/cloud-reader-lite/${READER_VERSION_TIMESTAMP}/reader.zip`
  const localBaseUri = `${FileSystem.documentDirectory}reader/`

  await fetchZipAndAssets({
    zipUrl,
    localBaseUri,
  })

  await AsyncStorage.setItem('readerVersionTimestamp', READER_VERSION_TIMESTAMP)

  console.log(`Done downloading reader.`)
        
}    
        
export default updateReader