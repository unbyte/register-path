import { describe, expect, it } from 'vitest'
import { runPowerShell, windowsPath } from '../src/impl/windows'
import { useRegistry } from './helpers/registry'

describe.skipIf(process.platform !== 'win32')('windows-invalid-value', () => {
  const fixture = useRegistry()
  it('rejects non-string values without replacing them', async () => {
    await runPowerShell(
      `$key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('${fixture.key}'); try { $key.SetValue('Path', 42, [Microsoft.Win32.RegistryValueKind]::DWord) } finally { $key.Dispose() }`,
    )
    await expect(windowsPath('C:\\example', true, fixture.key)).rejects.toThrow()
    expect(await fixture.read()).toEqual({ value: 42, kind: 'DWord' })
  }, 30_000)
})
