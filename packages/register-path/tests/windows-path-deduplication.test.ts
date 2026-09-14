import { describe, expect, it } from 'vitest'
import { windowsPath } from '../src/impl/windows'
import { useRegistry } from './helpers/registry'

describe.skipIf(process.platform !== 'win32')('windows-path-deduplication', () => {
  const fixture = useRegistry()
  it('creates a missing value and deduplicates case and trailing separators', async () => {
    expect((await windowsPath('C:\\Example\\bin', true, fixture.key)).status).toBe('added')
    expect((await windowsPath('c:/example/bin/', true, fixture.key)).status).toBe('unchanged')
    expect(await fixture.read()).toEqual({ value: 'C:\\Example\\bin', kind: 'ExpandString' })
  }, 30_000)
})
