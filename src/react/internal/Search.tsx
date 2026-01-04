import LucideSearch from '~icons/lucide/search'
import { DialogTrigger } from './DialogTrigger.js'

export function Search() {
  return (
    <DialogTrigger icon={LucideSearch} triggerKey="K">
      Search...
    </DialogTrigger>
  )
}
