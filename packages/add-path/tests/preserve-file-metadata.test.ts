import { lstat, readFile, stat, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('preserve-file-metadata', () => {
  const fixture = useUnixHome()

  it('preserves symlinks, existing bytes, permissions, and CRLF', async () => {
    const target = join(fixture.home, 'dot-profile')
    await writeFile(target, '# user config\r\nexport EDITED=yes', { mode: 0o640 })
    await symlink(target, join(fixture.home, '.profile'))
    await addPath('/opt/bin', { name: 'example' })
    expect((await lstat(join(fixture.home, '.profile'))).isSymbolicLink()).toBe(true)
    expect((await stat(target)).mode & 0o777).toBe(0o640)
    const content = await readFile(target, 'utf8')
    expect(content.startsWith('# user config\r\nexport EDITED=yes')).toBe(true)
    expect(content.replaceAll('\r\n', '')).not.toContain('\n')
    expect((await addPath('/opt/bin', { name: 'example' })).status).toBe('unchanged')
  })
})
