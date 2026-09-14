import { describe, expect, it } from 'vitest'
import { windowsPath } from '../src/impl/windows'
import { useRegistry } from './helpers/registry'

describe.skipIf(process.platform !== 'win32')('windows-raw-values', () => {
  const fixture = useRegistry()
  it.each(['String', 'ExpandString'])(
    'preserves %s and raw references in a long PATH',
    async (kind) => {
      const original = `%USERPROFILE%\\bin;${Array.from({ length: 150 }, (_, index) => `C:\\entry-${index}`).join(';')}`
      await fixture.seed(original, kind)
      await windowsPath("C:\\space\\it's-$literal-工具", true, fixture.key)
      expect(await fixture.read()).toEqual({
        value: `${original};C:\\space\\it's-$literal-工具`,
        kind,
      })
    },
    30_000,
  )
})
