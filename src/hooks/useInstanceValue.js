import { useEffect, useRef } from 'react'

const useInstanceValue = value => {

  const latestValue = useRef()
  useEffect(() => { latestValue.current = value })

  return () => latestValue.current
}

export default useInstanceValue
