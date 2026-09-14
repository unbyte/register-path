import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('edits-during-approval', () => {
  const fixture = useUnixHome()

  it('preserves writes made during authorization', async () => {
    const file = join(fixture.home, '.profile')
    await writeFile(file, '# original\n')
    const result = await addPath('/opt/bin', {
      name: 'example',
      beforeWrite: async ({ path }) => {
        expect(path).toBe(file)
        await writeFile(file, '# changed while dialog was open\nexport EDITED=yes\n')
        return true
      },
    })
    expect(result).toEqual({ path: file, status: 'added' })
    expect(await readFile(file, 'utf8')).toMatch(
      /^# changed while dialog was open\nexport EDITED=yes\n/,
    )
    expect(await readdir(fixture.home)).toEqual(['.profile'])
  })
})
