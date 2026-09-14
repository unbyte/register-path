import { describe, expect, it } from 'vitest'
import { windowsPath } from '../src/impl/windows'
import { useRegistry } from './helpers/registry'

describe.skipIf(process.platform !== 'win32')('windows-expanded-entries', () => {
  const fixture = useRegistry()
  it('matches expanded entries without rewriting their stored references', async () => {
    await fixture.seed('%USERPROFILE%\\bin')
    const profile = process.env.USERPROFILE as string
    expect((await windowsPath(`${profile}\\bin`, true, fixture.key)).status).toBe('unchanged')
    expect((await fixture.read()).value).toBe('%USERPROFILE%\\bin')
  }, 30_000)
})
