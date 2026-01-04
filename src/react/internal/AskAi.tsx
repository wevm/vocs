import { DialogTrigger } from './DialogTrigger.js'

export function AskAi(props: AskAi.Props) {
  const { className } = props

  return (
    <DialogTrigger className={className} triggerKey="I">
      Ask AI...
    </DialogTrigger>
  )
}

export namespace AskAi {
  export type Props = {
    className?: string | undefined
  }
}
