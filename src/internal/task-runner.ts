/**
 * Creates a task runner that limits concurrent async task execution.
 * Based on https://github.com/wakujs/waku/blob/main/packages/waku/src/lib/utils/task-runner.ts
 */
export function create(limit: create.Limit): create.ReturnType {
  let running = 0
  const waiting: (() => void)[] = []
  const tasks: Promise<void>[] = []

  const schedule = async (task: () => Promise<void>): Promise<void> => {
    while (running >= limit) {
      await new Promise<void>((resolve) => waiting.push(resolve))
    }
    running++
    try {
      await task()
    } finally {
      running--
      waiting.shift()?.()
    }
  }

  const run = (task: () => Promise<void>): void => {
    tasks.push(schedule(task))
  }

  const wait = async (): Promise<void> => {
    await Promise.all(tasks)
  }

  return { run, wait }
}

export declare namespace create {
  type Limit = number
  type ReturnType = {
    run: (task: () => Promise<void>) => void
    wait: () => Promise<void>
  }
}
