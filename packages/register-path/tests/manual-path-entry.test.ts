import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('manual-path-entry', () => {
  const fixture = useUnixHome()

  it.each([
    'export PATH="$PATH:/opt/bin"\n',
    '# /opt/bin is configured elsewhere\n',
    'export OTHER=/opt/binary\n',
  ])('preserves a manual mention without requesting approval: %s', async (content) => {
    const path = join(fixture.home, '.profile')
    await writeFile(path, content)
    const beforeWrite = vi.fn(() => true)
    expect(await registerPath('/opt/bin', { name: 'example', beforeWrite })).toEqual({
      path,
      status: 'unchanged',
    })
    expect(beforeWrite).not.toHaveBeenCalled()
    expect(await readFile(path, 'utf8')).toBe(content)
    expect(await readdir(fixture.home)).toEqual(['.profile'])
  })
})
