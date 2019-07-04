import {SQLBuilderBase} from './SQLBuilderBase'
import * as assert from 'assert'

export class SQLRemover extends SQLBuilderBase {
  async execute(): Promise<void> {
    this.checkTableValid()
    assert.ok(this.conditionColumns.length > 0, `${this.constructor.name}: conditionColumns missing.`)

    const query = `DELETE FROM ${this.table} WHERE (${this.conditions().join(' AND ')})`
    await this.database.update(query, this.stmtValues())
  }
}
