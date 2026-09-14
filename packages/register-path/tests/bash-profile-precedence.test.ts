import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('bash-profile-precedence', () => {
  const fixture = useUnixHome('bash')

  it('honors Bash profile precedence without creating a shadowing profile', async () => {
    await writeFile(join(fixture.home, '.bash_login'), '# login\n')
    await writeFile(join(fixture.home, '.profile'), '# leave this alone\n')
    const result = await registerPath('/opt/bin', { name: 'example' })
    expect(result.path).toBe(join(fixture.home, '.bash_login'))
    expect(await readFile(join(fixture.home, '.profile'), 'utf8')).toBe('# leave this alone\n')
    expect(await readdir(fixture.home)).not.toContain('.bash_profile')
  })
})
