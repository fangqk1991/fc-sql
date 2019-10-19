import {SQLBuilderBase} from './SQLBuilderBase'
import * as assert from 'assert'

/**
 * @description Use for insert-sql
 */
export class SQLAdder extends SQLBuilderBase {
  _insertKeys: string[] = []
  _insertValues: (string | number | null)[] = []

  /**
   * @description Pass the column you want to insert, and the new value.
   * @param key {string}
   * @param value {string | number | null}
   */
  public insertKV(key: string, value: (string | number | null)) {
    this._insertKeys.push(key)
    this._insertValues.push(value)
    return this
  }

  public async execute(): Promise<number> {
    this.checkTableValid()

    const keys = this._insertKeys
    const values = this.stmtValues()

    assert.ok(this._insertKeys.length > 0, `${this.constructor.name}: insertKeys missing.`)
    assert.ok(keys.length === values.length, `${this.constructor.name}: the length of keys and values is not equal.`)

    const keys2 = []
    const values2 = []
    for (let i = 0; i < values.length; ++i) {
      if (values[i] !== null && values[i] !== undefined) {
        keys2.push(keys[i])
        values2.push(values[i])
      }
    }

    const query = `INSERT INTO ${this.table}(${keys2.join(', ')}) VALUES (${Array(values2.length).fill('?').join(', ')})`
    await this.database.update(query, values2)
    const data = (await this.database.query('SELECT LAST_INSERT_ID() AS lastInsertId')) as any
    return data[0]['lastInsertId'] as number
  }

  public stmtValues(): (string | number | null)[] {
    return this._insertValues
  }
}
