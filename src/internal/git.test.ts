import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, expect, test } from 'vitest'

import * as Git from './git.js'

const directories: string[] = []

afterEach(() => {
  Git.resetCache()
  for (const directory of directories) fs.rmSync(directory, { recursive: true, force: true })
  directories.length = 0
})

test('returns the latest commit date for each page in one history snapshot', () => {
  const { root, pages } = createRepository()
  const first = path.join(pages, 'first.mdx')
  const second = path.join(pages, 'nested', 'second page.mdx')
  fs.mkdirSync(path.dirname(second), { recursive: true })
  fs.writeFileSync(first, '# First')
  fs.writeFileSync(second, '# Second')
  commit(root, '2026-01-01T12:00:00+00:00')
  fs.writeFileSync(first, '# Updated')
  commit(root, '2026-02-01T12:00:00+00:00')

  expect(Git.getLastModified(first, pages)).toBe('2026-02-01T12:00:00+00:00')
  expect(Git.getLastModified(second, pages)).toBe('2026-01-01T12:00:00+00:00')
  expect(Git.getLastModified(path.join(pages, 'untracked.mdx'), pages)).toBeUndefined()
})

test('refreshes dates after a new commit and after a build cache reset', () => {
  const { root, pages } = createRepository()
  const page = path.join(pages, 'index.mdx')
  fs.writeFileSync(page, '# First')
  commit(root, '2026-01-01T12:00:00+00:00')
  expect(Git.getLastModified(page, pages)).toBe('2026-01-01T12:00:00+00:00')

  fs.writeFileSync(page, '# Second')
  commit(root, '2026-02-01T12:00:00+00:00')
  Git.resetCache()
  expect(Git.getLastModified(page, pages)).toBe('2026-02-01T12:00:00+00:00')
})

function createRepository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-git-'))
  directories.push(root)
  const pages = path.join(root, 'src', 'pages')
  fs.mkdirSync(pages, { recursive: true })
  git(root, ['init', '-q'])
  git(root, ['config', 'user.name', 'Vocs Test'])
  git(root, ['config', 'user.email', 'vocs@example.com'])
  return { root, pages }
}

function commit(root: string, date: string) {
  git(root, ['add', '.'])
  execFileSync('git', ['commit', '-qm', 'Update pages'], {
    cwd: root,
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  })
}

function git(root: string, args: string[]) {
  execFileSync('git', args, { cwd: root })
}
