export interface BeforeWriteContext {
  path?: string
}

export interface RegisterPathOptions {
  name: string
  beforeWrite?: (context: BeforeWriteContext) => boolean | Promise<boolean>
}

export interface RegisterPathResult {
  path?: string
  status: 'added' | 'unchanged' | 'skipped'
  warning?: string
}
