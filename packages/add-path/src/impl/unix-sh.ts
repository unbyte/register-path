import { homedir } from 'node:os'
import { join } from 'node:path'
import { absoluteConfigPath } from '../file'
import type { AddPathOptions } from '../types'
import { addPosixPath } from './unix-posix'

export function addShPath(directory: string, options: AddPathOptions) {
  const path = process.env.ENV ? absoluteConfigPath(process.env.ENV) : join(homedir(), '.profile')
  return addPosixPath(path, directory, options)
}
