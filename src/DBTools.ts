import {DBProtocol} from './DBProtocol'
import * as assert from 'assert'
import { Transaction } from 'sequelize'

/**
 * @description When a DBProtocol is defined, you can use DBTools for quick add/update/delete/search
 */
export class DBTools {
  private readonly _protocol: DBProtocol
  public transaction!: Transaction

  constructor(protocol: DBProtocol) {
    this._protocol = protocol
  }

  async add(params: { [key: string]: (number | string) }): Promise<number> {
    const builder = this.makeAdder(params)
    return builder.execute()
  }

  async update(params: { [key: string]: (number | string) }): Promise<void> {
    const builder = this.makeModifier(params)
    await builder.execute()
  }

  async delete(params: { [key: string]: (number | string) }): Promise<void> {
    const builder = this.makeRemover(params)
    await builder.execute()
  }

  /**
   * @deprecated Please user searcher.setPageInfo.queryList / searcher.setLimitInfo.queryList instead.
   */
  async fetchList(params: { [key: string]: (number | string) } = {}, page: number = 0, length: number = 20): Promise<{ [key: string]: any }[]> {
    const builder = this.makeSearcher(params)
    builder.setPageInfo(page, length)
    return builder.queryList()
  }

  /**
   * @deprecated Please user searcher.queryCount instead.
   */
  async fetchCount(params: { [key: string]: (number | string) } = {}): Promise<number> {
    const builder = this.makeSearcher(params)
    return builder.queryCount()
  }

  /**
   * @deprecated Please user searcher.querySingle instead.
   */
  async searchSingle(params: { [key: string]: (number | string) }, checkPrimaryKey: boolean = true): Promise<null | {}> {
    const builder = this.makeSearcher(params, checkPrimaryKey)
    builder.setLimitInfo(0, 1)
    return builder.querySingle()
  }

  public makeAdder(params: { [key: string]: (number | string) }) {
    const protocol = this._protocol
    const database = protocol.database()
    const table = protocol.table()
    const cols = protocol.insertableCols()

    const builder = database.adder()
    builder.transaction = this.transaction
    builder.setTable(table)
    cols.forEach((col): void => {
      const value = (col in params) ? params[col] : null
      builder.insertKV(col, value)
    })
    return builder
  }

  public makeModifier(params: { [key: string]: (number | string) }) {
    const protocol = this._protocol
    const database = protocol.database()
    const table = protocol.table()
    const cols = protocol.modifiableCols()

    const builder = database.modifier()
    builder.transaction = this.transaction
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
    return builder
  }

  public makeRemover(params: { [key: string]: (number | string) }) {
    const protocol = this._protocol
    const database = protocol.database()
    const table = protocol.table()

    const builder = database.remover()
    builder.transaction = this.transaction
    builder.setTable(table)
    const pKey = protocol.primaryKey()
    const pKeys = Array.isArray(pKey) ? pKey : [pKey]
    pKeys.forEach((key): void => {
      builder.checkPrimaryKey(params, key)
    })
    return builder
  }

  public makeSearcher(params: { [key: string]: (number | string) }, checkPrimaryKey: boolean = false) {
    const protocol = this._protocol
    if (checkPrimaryKey) {
      const pKey = protocol.primaryKey()
      const pKeys = Array.isArray(pKey) ? pKey : [pKey]
      pKeys.forEach((key): void => {
        assert.ok(key in params, `${this.constructor.name}: primary key missing.`)
      })
    }
    const database = protocol.database()
    const table = protocol.table()
    const cols = protocol.cols()

    const builder = database.searcher()
    builder.transaction = this.transaction
    builder.setTable(table)
    cols.forEach((col): void => {
      builder.addColumn(col)
    })
    for (const key in params) {
      builder.addConditionKV(key, params[key])
    }
    return builder
  }
}
