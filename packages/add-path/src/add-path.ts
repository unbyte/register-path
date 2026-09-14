import { addUnixPath } from './impl/unix'
import { addWindowsPath } from './impl/windows'
import type { AddPathOptions, AddPathResult } from './types'

export async function addPath(directory: string, options: AddPathOptions): Promise<AddPathResult> {
  if (typeof directory !== 'string' || !directory || /[\0\r\n]/.test(directory)) {
    throw new TypeError('directory must be a nonempty path without NUL or newlines')
  }
  if (
    !options ||
    typeof options.name !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(options.name)
  ) {
    throw new TypeError(
      'name must contain 1–64 letters, digits, dots, underscores, or hyphens and start with a letter or digit',
    )
  }
  const { beforeWrite } = options
  if ('shells' in options)
    throw new TypeError('Shell selection is automatic; shells is not supported')
  if ('position' in options) throw new TypeError('position is not supported')
  if (beforeWrite !== undefined && typeof beforeWrite !== 'function')
    throw new TypeError('beforeWrite must be a function')
  if (process.platform === 'win32') return addWindowsPath(directory, options)
  return addUnixPath(directory, options)
}
