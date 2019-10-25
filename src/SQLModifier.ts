import { SQLBuilderBase } from './SQLBuilderBase'
import * as assert from 'assert'

/**
 * @description Use for update-sql
 */
export class SQLModifier extends SQLBuilderBase {
  _updateColumns: string[] = []
  _updateValues: (string | number | null)[] = []

  /**
   * @description Pass the column you want to update, and the new value.
   * @param key {string}
   * @param value {string | number | null}
   */
  updateKV(key: string, value: string | number | null) {
    this._updateColumns.push(`${key} = ?`)
    this._updateValues.push(value)
    return this
  }

  stmtValues(): (string | number | null)[] {
    return this._updateValues.concat(this.conditionValues)
  }

  public async execute() {
    this.checkTableValid()
    assert.ok(this._updateColumns.length > 0, `${this.constructor.name}: updateColumns missing.`)
    assert.ok(this.conditionColumns.length > 0, `${this.constructor.name}: conditionColumns missing.`)

    const query = `UPDATE ${this.table} SET ${this._updateColumns.join(', ')} WHERE (${this.conditions().join(' AND ')})`
    await this.database.update(query, this.stmtValues(), this.transaction)
  }
}
