import {SQLBuilderBase} from './SQLBuilderBase'
import * as assert from 'assert'

export class SQLModifier extends SQLBuilderBase {
  _updateColumns: string[] = []
  _updateValues: (string | number | null)[] = []

  updateKV(key: string, value: string | number | null): void {
    this._updateColumns.push(`${key} = ?`)
    this._updateValues.push(value)
  }

  async execute(): Promise<void> {
    this.checkTableValid()
    assert.ok(this._updateColumns.length > 0, `${this.constructor.name}: updateColumns missing.`)
    assert.ok(this.conditionColumns.length > 0, `${this.constructor.name}: conditionColumns missing.`)

    const query = `UPDATE ${this.table} SET ${this._updateColumns.join(', ')} WHERE (${this.conditions().join(' AND ')})`
    await this.database.update(query, this.stmtValues())
  }

  stmtValues(): (string | number | null)[] {
    return this._updateValues.concat(this.conditionValues)
  }
}
