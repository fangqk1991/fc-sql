import {DBProtocol} from './DBProtocol'
import * as assert from 'assert'

export class DBTools {
  _protocol: DBProtocol

  constructor(protocol: DBProtocol) {
    this._protocol = protocol
  }

  async add(params: {[key: string]: (number | string)}): Promise<void> {
    const protocol = this._protocol
    const database = protocol.database()
    const table = protocol.table()
    const cols = protocol.insertableCols()

    const builder = database.adder()
    builder.setTable(table)
    cols.forEach((col): void => {
      const value = (col in params) ? params[col] : null
      builder.insertKV(col, value)
    })
    await builder.execute()
  }

  async update(params: {[key: string]: (number | string)}): Promise<void> {
    const protocol = this._protocol
    const database = protocol.database()
    const table = protocol.table()
    const cols = protocol.modifiableCols()

    const builder = database.modifier()
    builder.setTable(table)
    const pKey = protocol.primaryKey()
    const pKeys = Array.isArray(pKey) ? pKey : [pKey]
    pKeys.forEach((key): void => {
      builder.checkPrimaryKey(params, key)
      delete params[key]
    })
    cols.forEach((col): void => {
      if (col in params) {
        builder.updateKV(col, params[col])
      }
    })

    await builder.execute()
  }

  async delete(params: {[key: string]: (number | string)}): Promise<void> {
    const protocol = this._protocol
    const database = protocol.database()
    const table = protocol.table()

    const builder = database.remover()
    builder.setTable(table)
    const pKey = protocol.primaryKey()
    const pKeys = Array.isArray(pKey) ? pKey : [pKey]
    pKeys.forEach((key): void => {
      builder.checkPrimaryKey(params, key)
    })
    await builder.execute()
  }

  async searchSingle(params: {[key: string]: (number | string)}, checkPrimaryKey: boolean = true): Promise<null|{}> {
    const protocol = this._protocol
    if (checkPrimaryKey) {
      const pKey = protocol.primaryKey()
      const pKeys = Array.isArray(pKey) ? pKey : [pKey]
      pKeys.forEach((key): void => {
        assert.ok(key in params, `${this.constructor.name}: primary key missing.`)
      })
    }

    const items = await this.fetchList(params, 0, 1)
    if (items.length > 0) {
      return items[0]
    }
    return null
  }

  async fetchList(params: {[key: string]: (number | string)} = {}, page: number = 0, length: number = 20): Promise<{[key: string]: any}[]> {
    const protocol = this._protocol
    const database = protocol.database()
    const table = protocol.table()
    const cols = protocol.cols()

    const builder = database.searcher()
    builder.setTable(table)
    builder.setPageInfo(page, length)
    cols.forEach((col): void => {
      builder.addColumn(col)
    })
    for (const key in params) {
      builder.addConditionKV(key, params[key])
    }
    return builder.queryList()
  }

  async fetchCount(params: {[key: string]: (number | string)} = {}): Promise<number> {
    const protocol = this._protocol
    const database = protocol.database()
    const table = protocol.table()
    const cols = protocol.cols()

    const builder = database.searcher()
    builder.setTable(table)
    cols.forEach((col): void => {
      builder.addColumn(col)
    })
    for (const key in params) {
      builder.addConditionKV(key, params[key])
    }
    return builder.queryCount()
  }
}
