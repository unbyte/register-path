export class RegisterPathError extends Error {
  constructor(
    message: string,
    public readonly path: string | undefined,
    cause: unknown,
  ) {
    super(message, { cause })
    this.name = 'RegisterPathError'
  }
}

export function toRegisterPathError(cause: unknown, path?: string) {
  if (cause instanceof RegisterPathError) return cause
  return new RegisterPathError(
    `Could not add directory to PATH${path ? ` in ${path}` : ''}: ${cause instanceof Error ? cause.message : String(cause)}`,
    path,
    cause,
  )
}
