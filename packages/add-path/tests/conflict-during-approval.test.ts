import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('conflict-during-approval', () => {
  const fixture = useUnixHome()

  it('retains a conflicting edit made during authorization', async () => {
    const file = join(fixture.home, '.profile')
    const edited = '# example start\nexport PATH="$PATH:/other/bin"\n# example end'
    await expect(
      addPath('/opt/bin', {
        name: 'example',
        beforeWrite: async () => {
          await writeFile(file, edited)
          return true
        },
      }),
    ).rejects.toThrow('already in use')
    expect(await readFile(file, 'utf8')).toBe(edited)
    expect(await readdir(fixture.home)).toEqual(['.profile'])
  })
})
