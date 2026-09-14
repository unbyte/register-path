import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('fish-file-conflict', () => {
  const fixture = useUnixHome('fish')

  it('does not overwrite an existing fish snippet', async () => {
    await registerPath('/opt/bin', { name: 'example' })
    const file = join(fixture.home, '.config/fish/conf.d/register-path-example.fish')
    await writeFile(file, '# user owned\n')
    await expect(registerPath('/opt/bin', { name: 'example' })).rejects.toThrow('already in use')
    expect(await readFile(file, 'utf8')).toBe('# user owned\n')
  })
})
