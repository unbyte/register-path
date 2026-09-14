import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('marker-conflicts', () => {
  const fixture = useUnixHome()

  it.each([
    '# example start',
    '# example end',
    '# example start\nexport PATH="$PATH:/other/bin"\n# example end',
    '# example start\n# example start\n# example end',
  ])('preserves an occupied name when the directory is absent: %s', async (content) => {
    const path = join(fixture.home, '.profile')
    await writeFile(path, content)
    await expect(addPath('/opt/bin', { name: 'example' })).rejects.toThrow('already in use')
    expect(await readFile(path, 'utf8')).toBe(content)
  })
})
