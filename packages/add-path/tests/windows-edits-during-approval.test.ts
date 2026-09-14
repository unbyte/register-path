import { describe, expect, it } from 'vitest'
import { windowsPath } from '../src/impl/windows'
import { useRegistry } from './helpers/registry'

describe.skipIf(process.platform !== 'win32')('windows-edits-during-approval', () => {
  const fixture = useRegistry()
  it('reads fresh contents when writing after an earlier inspection', async () => {
    await fixture.seed('C:\\original')
    await windowsPath('C:\\example', false, fixture.key)
    await fixture.seed('C:\\edited-during-dialog')
    await windowsPath('C:\\example', true, fixture.key)
    expect((await fixture.read()).value).toBe('C:\\edited-during-dialog;C:\\example')
  }, 30_000)
})
