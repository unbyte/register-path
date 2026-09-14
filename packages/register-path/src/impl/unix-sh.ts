import { homedir } from 'node:os'
import { join } from 'node:path'
import { absoluteConfigPath } from '../file'
import type { RegisterPathOptions } from '../types'
import { registerPosixPath } from './unix-posix'

export function registerShPath(directory: string, options: RegisterPathOptions) {
  const path = process.env.ENV ? absoluteConfigPath(process.env.ENV) : join(homedir(), '.profile')
  return registerPosixPath(path, directory, options)
}
