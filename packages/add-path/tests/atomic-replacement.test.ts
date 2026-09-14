import { open, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('atomic-replacement', () => {
  const fixture = useUnixHome()

  it('keeps the old file intact while replacing the directory entry with the complete content', async () => {
    const path = join(fixture.home, '.profile')
    const original = '# user configuration\n'
    await writeFile(path, original)
    const oldFile = await open(path, 'r')
    try {
      expect(await addPath('/opt/bin', { name: 'example' })).toEqual({ path, status: 'added' })
      expect(await oldFile.readFile('utf8')).toBe(original)
      const content = await readFile(path, 'utf8')
      expect(content.startsWith(original)).toBe(true)
      expect(content).toContain('# example start\n')
      expect(content).toContain('/opt/bin')
      expect(content.endsWith('# example end\n')).toBe(true)
      expect(await readdir(fixture.home)).toEqual(['.profile'])
    } finally {
      await oldFile.close()
    }
  })
})
