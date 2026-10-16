import { useState } from 'react'
import { flagEmoji, flagSrc } from '../domain/flags'

interface FlagMarkProps {
  cca2: string
  className?: string
}

export function FlagMark({ cca2, className }: FlagMarkProps) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className={className} aria-hidden>
        {flagEmoji(cca2)}
      </span>
    )
  }
  return (
    <img
      src={flagSrc(cca2)}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
