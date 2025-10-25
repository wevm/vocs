import { useCallback, useEffect, useState } from 'react'

type SetValue<type> = (newVal: type | ((prevVal: type) => type)) => void

export function useSessionStorage<type>(
  key: string,
  defaultValue: type | undefined,
): [type | undefined, SetValue<type>] {
  const [value, setValue] = useState<type>()

  useEffect(() => {
    const initialValue = getItem(key) as type | undefined

    if (typeof initialValue === 'undefined' || initialValue === null) {
      setValue(typeof defaultValue === 'function' ? defaultValue() : defaultValue)
    } else {
      setValue(initialValue)
    }
  }, [defaultValue, key])

  const setter = useCallback(
    (updater: type | ((prevVal: type) => type)) => {
      setValue((old) => {
        let newVal: type
        if (typeof updater === 'function') newVal = (updater as any)(old)
        else newVal = updater

        try {
          sessionStorage.setItem(key, JSON.stringify(newVal))
        } catch {}

        return newVal
      })
    },
    [key],
  )

  return [value, setter]
}

function getItem(key: string): unknown {
  try {
    const itemValue = sessionStorage.getItem(key)
    if (typeof itemValue === 'string') {
      return JSON.parse(itemValue)
    }
    return undefined
  } catch {
    return undefined
  }
}
