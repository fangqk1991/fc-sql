import { FCDatabase } from './FCDatabase'

/**
 * @deprecated Use DBProtocolV2 instead
 */
export interface DBProtocol {
  /**
   * @description Database instance
   */
  database(): FCDatabase

  /**
   * @description A simple table name, such as 'student', or the union big table such as 'table_a INNER JOIN table_b'
   */
  table(): string

  /**
   * @description Table's primary key, use a string for single-primary-key, use a map for multiple-primary-keys.
   */
  primaryKey(): string | string[]

  /**
   * @description Table's columns, pass the column name list which you show.
   */
  cols(): string[]

  /**
   * @description When an insert-sql execute, only columns in insertableCols() will be used.
   */
  insertableCols(): string[]

  /**
   * @description When an update-sql execute, only columns in modifiableCols() will be used.
   */
  modifiableCols(): string[]
}

export interface DBProtocolV2 {
  /**
   * @description Database instance
   */
  database: FCDatabase | (() => FCDatabase)

  /**
   * @description A simple table name, such as 'student', or the union big table such as 'table_a INNER JOIN table_b'
   */
  table: string | (() => string)

  /**
   * @description Table's primary key, use a string for single-primary-key, use a map for multiple-primary-keys.
   */
  primaryKey: string | string[] | (() => string | string[])

  /**
   * @description Table's columns, pass the column name list which you show.
   */
  cols: string[] | (() => string[])

  /**
   * @description When an insert-sql execute, only columns in insertableCols() will be used.
   */
  insertableCols?: string[] | (() => string[])

  /**
   * @description When an update-sql execute, only columns in modifiableCols() will be used.
   */
  modifiableCols?: string[] | (() => string[])
}

export class DBSpec implements DBProtocolV2 {
  public readonly database!: FCDatabase
  public readonly table!: string
  public readonly primaryKey!: string
  public readonly primaryKeys!: string[]
  public readonly cols!: string[]
  public readonly insertableCols!: string[]
  public readonly modifiableCols!: string[]

  constructor(protocol: DBProtocol | DBProtocolV2) {
    this.database = protocol.database instanceof Function ? protocol.database() : protocol.database
    this.table = protocol.table instanceof Function ? protocol.table() : protocol.table
    const primaryKey = protocol.primaryKey instanceof Function ? protocol.primaryKey() : protocol.primaryKey
    this.primaryKeys = Array.isArray(primaryKey) ? primaryKey : [primaryKey]
    this.primaryKey = this.primaryKeys[0]
    this.cols = protocol.cols instanceof Function ? protocol.cols() : protocol.cols
    const insertableCols =
      protocol.insertableCols instanceof Function ? protocol.insertableCols() : protocol.insertableCols
    this.insertableCols = insertableCols || []
    const modifiableCols =
      protocol.modifiableCols instanceof Function ? protocol.modifiableCols() : protocol.modifiableCols
    this.modifiableCols = modifiableCols || []
  }
}
