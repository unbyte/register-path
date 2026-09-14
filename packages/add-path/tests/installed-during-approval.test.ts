import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('installed-during-approval', () => {
  const fixture = useUnixHome()

  it('rechecks ownership after approval if another installer added the block', async () => {
    const beforeWrite = vi.fn(async ({ path }: { path?: string }) => {
      await writeFile(
        path as string,
        '# example start\nexport PATH="$PATH:/opt/bin"\n# example end\n',
      )
      return true
    })
    const result = await addPath('/opt/bin', { name: 'example', beforeWrite })
    expect(result.status).toBe('unchanged')
    expect(
      (await readFile(join(fixture.home, '.profile'), 'utf8')).match(/# example start/g),
    ).toHaveLength(1)
  })
})
