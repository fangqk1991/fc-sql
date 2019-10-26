import { TransactionProtocol } from './TransactionRunner'
import { FCDatabase } from './FCDatabase'
import { FCTransaction } from './FCTransaction'
import * as assert from "assert"

/**
 * @description Use for insert-sql
 */
export class SQLCustomer implements TransactionProtocol {
  database: FCDatabase
  public transaction!: FCTransaction
  public forQuery = false

  private constructor(database: FCDatabase) {
    this.database = database
  }

  public static searcher(database: FCDatabase) {
    const obj = new SQLCustomer(database)
    obj.forQuery = true
    return obj
  }

  public static editor(database: FCDatabase) {
    const obj = new SQLCustomer(database)
    obj.forQuery = false
    return obj
  }

  private _query!: string
  private _replacements: (string | number | null)[] = []

  public setEntity(query: string, ...replacements: (string | number | null)[]) {
    assert.ok((query.match(/\?/g) || []).length === replacements.length, `${this.constructor.name}: setEntity: Incorrect number of arguments.`)
    this._query = query
    this._replacements = replacements
  }

  public async execute() {
    assert.ok(!!this._query, `${this.constructor.name}: query missing.`)
    if (this.forQuery) {
      return this.database.query(this._query, this._replacements, this.transaction)
    }
    await this.database.update(this._query, this._replacements, this.transaction)
  }
}
