import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('fish-file-conflict', () => {
  const fixture = useUnixHome('fish')

  it('does not overwrite an existing fish snippet', async () => {
    await addPath('/opt/bin', { name: 'example' })
    const file = join(fixture.home, '.config/fish/conf.d/add-path-example.fish')
    await writeFile(file, '# user owned\n')
    await expect(addPath('/opt/bin', { name: 'example' })).rejects.toThrow('already in use')
    expect(await readFile(file, 'utf8')).toBe('# user owned\n')
  })
})
