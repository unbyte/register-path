import { basename, isAbsolute } from 'node:path'
import { toRegisterPathError } from '../error'
import type { RegisterPathOptions, RegisterPathResult } from '../types'
import { registerBashPath } from './unix-bash'
import { registerFishPath } from './unix-fish'
import { registerShPath } from './unix-sh'
import { registerZshPath } from './unix-zsh'

export async function registerUnixPath(
  directory: string,
  options: RegisterPathOptions,
): Promise<RegisterPathResult> {
  if (!isAbsolute(directory)) throw new TypeError('directory must be an absolute path')
  if (directory.includes(':')) throw new TypeError('directory must not contain the PATH separator')
  const shell = basename(process.env.SHELL ?? '')
  try {
    switch (shell) {
      case 'bash':
        return await registerBashPath(directory, options)
      case 'zsh':
        return await registerZshPath(directory, options)
      case 'fish':
        return await registerFishPath(directory, options)
      case 'sh':
      case 'dash':
        return await registerShPath(directory, options)
      default:
        throw new Error(`Unsupported or unknown shell: ${shell || '(SHELL is unset)'}`)
    }
  } catch (cause) {
    throw toRegisterPathError(cause)
  }
}
