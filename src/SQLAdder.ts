import { SQLBuilderBase } from './SQLBuilderBase'
import * as assert from 'assert'

/**
 * @description Use for insert-sql
 */
export class SQLAdder extends SQLBuilderBase {
  _insertKeys: string[] = []
  _insertValues: (string | number | null)[] = []
  _updateWhenDuplicate = false
  _keepOldDataWhenDuplicate = false
  _fixedKey: string = ''

  /**
   * @description Pass the column you want to insert, and the new value.
   * @param key {string}
   * @param value {string | number | null}
   */
  public insertKV(key: string, value: string | number | null) {
    this._insertKeys.push(key)
    this._insertValues.push(value)
    return this
  }

  public useUpdateWhenDuplicate() {
    this._updateWhenDuplicate = true
    return this
  }

  public setFixedKey(fixedKey: string) {
    this._fixedKey = fixedKey
    return this
  }

  public keepOldDataWhenDuplicate() {
    assert.ok(!!this._fixedKey, `${this.constructor.name}: _fixedKey can not be empty.`)
    this._keepOldDataWhenDuplicate = true
    return this
  }

  public stmtValues(): (string | number | null)[] {
    return this._insertValues
  }

  public async execute() {
    this.checkTableValid()

    const keys = this._insertKeys
    const values = this.stmtValues()

    assert.ok(this._insertKeys.length > 0, `${this.constructor.name}: insertKeys missing.`)
    assert.ok(keys.length === values.length, `${this.constructor.name}: the length of keys and values is not equal.`)

    const keys2 = []
    const values2 = []
    for (let i = 0; i < values.length; ++i) {
      if (values[i] !== null && values[i] !== undefined) {
        keys2.push(`\`${keys[i]}\``)
        values2.push(values[i])
      }
    }

    if (this.transaction) {
      let query = `INSERT INTO ${this.table}(${keys2.join(', ')}) VALUES (${Array(values2.length)
        .fill('?')
        .join(', ')})`
      if (this._updateWhenDuplicate) {
        const additionItems = keys2.map((key) => `${key} = VALUES(${key})`)
        query = `${query} ON DUPLICATE KEY UPDATE ${additionItems.join(', ')}`
      } else if (this._keepOldDataWhenDuplicate) {
        const key = this._fixedKey
        query = `${query} ON DUPLICATE KEY UPDATE ${key} = VALUES(${key})`
      }
      await this.database.update(query, values2, this.transaction)
      if (this._updateWhenDuplicate || this._keepOldDataWhenDuplicate) {
        return 0
      }
      const data = (await this.database.query('SELECT LAST_INSERT_ID() AS lastInsertId', [], this.transaction)) as any
      return data[0]['lastInsertId'] as number
    }

    let lastInsertId = 0
    const transactionRunner = this.database.createTransactionRunner()
    await transactionRunner.commit(async (transaction) => {
      this.transaction = transaction
      lastInsertId = (await this.execute()) as number
    })
    return lastInsertId
  }
}
