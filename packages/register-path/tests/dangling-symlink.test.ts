import { readdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('dangling-symlink', () => {
  const fixture = useUnixHome()

  it('rejects dangling symlinks rather than creating their targets', async () => {
    await symlink(join(fixture.home, 'missing'), join(fixture.home, '.profile'))
    await expect(registerPath('/opt/bin', { name: 'example' })).rejects.toThrow('Cannot resolve')
    expect(await readdir(fixture.home)).toEqual(['.profile'])
  })
})
