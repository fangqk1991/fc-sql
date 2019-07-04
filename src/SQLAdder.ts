import {SQLBuilderBase} from './SQLBuilderBase'
import * as assert from 'assert'

export class SQLAdder extends SQLBuilderBase {
  _insertKeys = []
  _insertValues = []

  insertKV(key, value) {
    this._insertKeys.push(key)
    this._insertValues.push(value)
  }

  /**
   * @returns {Promise<void>}
   */
  async execute() {
    this.checkTableValid()

    const keys = this._insertKeys
    const values = this.stmtValues()

    assert.ok(this._insertKeys.length > 0, `${this.constructor.name}: insertKeys missing.`)
    assert.ok(keys.length === values.length, `${this.constructor.name}: the length of keys and values is not equal.`)

    const keys2 = []
    const values2 = []
    for (let i = 0; i < values.length; ++i) {
      if (values[i] !== null) {
        keys2.push(keys[i])
        values2.push(values[i])
      }
    }

    const query = `INSERT INTO ${this.table}(${keys2.join(', ')}) VALUES (${Array(values2.length).fill('?').join(', ')})`
    await this.database.update(query, values2)
  }

  /**
   * @returns {Array.<string|Number>}
   */
  stmtValues() {
    return this._insertValues
  }
}
