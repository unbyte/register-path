import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('manual-path-during-approval', () => {
  const fixture = useUnixHome()

  it('leaves an unmarked path entry added during approval untouched', async () => {
    const path = join(fixture.home, '.profile')
    const content = 'export PATH="$PATH:/opt/bin"\n'
    expect(
      await registerPath('/opt/bin', {
        name: 'example',
        beforeWrite: async () => {
          await writeFile(path, content)
          return true
        },
      }),
    ).toEqual({ path, status: 'unchanged' })
    expect(await readFile(path, 'utf8')).toBe(content)
    expect(await readdir(fixture.home)).toEqual(['.profile'])
  })
})
