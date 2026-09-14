import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach } from 'vitest'
import { runPowerShell } from '../../src/impl/windows'

export function useRegistry() {
  let key: string
  beforeEach(() => {
    key = `Software\\add-path-tests\\${randomUUID()}`
  })
  afterEach(async () => {
    await runPowerShell(
      `[Microsoft.Win32.Registry]::CurrentUser.DeleteSubKeyTree('${key}', $false)`,
    )
  })
  async function seed(value: string, kind = 'ExpandString') {
    const encoded = Buffer.from(value, 'utf8').toString('base64')
    await runPowerShell(
      `$key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('${key}'); try { $key.SetValue('Path', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}')), [Microsoft.Win32.RegistryValueKind]::${kind}) } finally { $key.Dispose() }`,
    )
  }
  async function read() {
    return JSON.parse(
      await runPowerShell(
        `$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('${key}'); try { @{ value = $key.GetValue('Path', $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames); kind = $key.GetValueKind('Path').ToString() } | ConvertTo-Json -Compress } finally { $key.Dispose() }`,
      ),
    )
  }
  return {
    get key() {
      return key
    },
    seed,
    read,
  }
}
