import { describe, expect, it, vi } from 'vitest'
import { registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('temporary-process-path', () => {
  const _fixture = useUnixHome()

  it('does not infer persistence from process.env.PATH', async () => {
    vi.stubEnv('PATH', '/opt/bin:/usr/bin')
    expect((await registerPath('/opt/bin', { name: 'example' })).status).toBe('added')
    expect(process.env.PATH).toBe('/opt/bin:/usr/bin')
  })
})
