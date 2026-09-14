import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('declined-write', () => {
  const fixture = useUnixHome('fish')

  it('skips a declined write without creating files or directories', async () => {
    expect(await addPath('/opt/bin', { name: 'example', beforeWrite: () => false })).toEqual({
      path: join(fixture.home, '.config/fish/conf.d/add-path-example.fish'),
      status: 'skipped',
    })
    expect(await readdir(fixture.home)).toEqual([])
  })
})
