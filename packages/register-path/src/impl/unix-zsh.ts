import { homedir } from 'node:os'
import { join } from 'node:path'
import { absoluteConfigPath } from '../file'
import type { RegisterPathOptions } from '../types'
import { registerPosixPath } from './unix-posix'

export function registerZshPath(directory: string, options: RegisterPathOptions) {
  const path = join(absoluteConfigPath(process.env.ZDOTDIR || homedir()), '.zshrc')
  return registerPosixPath(path, directory, options)
}
