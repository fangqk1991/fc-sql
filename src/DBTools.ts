import {DBProtocol} from './DBProtocol'
import * as assert from 'assert'
import { Transaction } from 'sequelize'

interface Params {
  [key: string]: number | string
}

/**
 * @description When a DBProtocol is defined, you can use DBTools for quick add/update/delete/search
 */
export class DBTools {
  private readonly _protocol: DBProtocol
  public transaction!: Transaction

  constructor(protocol: DBProtocol, transaction?: Transaction) {
    this._protocol = protocol
    if (transaction) {
      this.transaction = transaction
    }
  }

  async add(params: Params): Promise<number> {
    const performer = this.makeAdder(params)
    return performer.execute()
  }

  async update(params: Params): Promise<void> {
    const performer = this.makeModifier(params)
    await performer.execute()
  }

  async delete(params: Params): Promise<void> {
    const performer = this.makeRemover(params)
    await performer.execute()
  }

  /**
   * @deprecated Please user searcher.setPageInfo.queryList / searcher.setLimitInfo.queryList instead.
   */
  async fetchList(params: Params = {}, page: number = 0, length: number = 20): Promise<{ [key: string]: any }[]> {
    const builder = this.makeSearcher(params)
    builder.setPageInfo(page, length)
    return builder.queryList()
  }

  /**
   * @deprecated Please user searcher.queryCount instead.
   */
  async fetchCount(params: Params = {}): Promise<number> {
    const builder = this.makeSearcher(params)
    return builder.queryCount()
  }

  /**
   * @deprecated Please user searcher.querySingle instead.
   */
  async searchSingle(params: Params): Promise<null | {}> {
    const builder = this.makeSearcher(params)
    builder.setLimitInfo(0, 1)
    return builder.querySingle()
  }

  public makeAdder(params: Params) {
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

  public makeModifier(params: Params) {
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

  public makeRemover(params: Params) {
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

  public makeSearcher(params: Params = {}) {
    const protocol = this._protocol
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
