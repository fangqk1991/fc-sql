import { SQLBuilderBase } from './SQLBuilderBase'
import * as assert from 'assert'

type Value = string | number | null

interface InsertObject {
  [p: string]: Value;
}

/**
 * @description Use for insert-sql
 */
export class SQLBulkAdder extends SQLBuilderBase {
  _insertKeys: string[] = []
  _insertObjects: InsertObject[] = []
  _updateWhenDuplicate = false
  _keepOldDataWhenDuplicate = false
  _fixedKey: string = ''

  public setInsertKeys(keys: string[]) {
    this._insertKeys = keys
    return this
  }

  public putObject(obj: InsertObject) {
    assert.ok(this._insertKeys.length > 0, `${this.constructor.name}: insertKeys missing.`)
    this._insertKeys.forEach((key) => {
      assert.ok(key in obj, `${this.constructor.name}: ${key} missing.`)
    })
    this._insertObjects.push(obj)
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

  public stmtValues(): Value[] {
    const values: Value[] = []
    this._insertObjects.forEach((obj) => {
      this._insertKeys.forEach((key) => {
        values.push(obj[key])
      })
    })
    return values
  }

  public async execute() {
    this.checkTableValid()
    assert.ok(this._insertObjects.length > 0, `${this.constructor.name}: insertObjects missing.`)

    const keys = this._insertKeys
    const values = this.stmtValues()

    const valuesDesc = `(${Array(keys.length)
      .fill('?')
      .join(', ')})`
    let query = `INSERT INTO ${this.table}(${keys.join(', ')}) VALUES ${Array(this._insertObjects.length)
      .fill(valuesDesc)
      .join(', ')}`
    if (this._updateWhenDuplicate) {
      const additionItems = this._insertKeys.map((key) => `${key} = VALUES(${key})`)
      query = `${query} ON DUPLICATE KEY UPDATE ${additionItems.join(', ')}`
    } else if (this._keepOldDataWhenDuplicate) {
      const key = this._fixedKey
      query = `${query} ON DUPLICATE KEY UPDATE ${key} = VALUES(${key})`
    }
    await this.database.update(query, values, this.transaction)
  }
}
