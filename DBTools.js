/* eslint-disable-next-line */
const FCDatabase = require('./FCDatabase')
const assert = require('assert')

class DBTools {
  /**
   * @param handler {{database: FCDatabase, modifiableCols: (function(): string[]), insertableCols: (function(): string[]), cols: (function(): string[]), table: string, primaryKey: string}}
   */
  constructor(handler) {
    this._handler = handler
  }

  /**
   * @param params {Object}
   * @returns {Promise<void>}
   */
  async add(params) {
    const handler = this._handler
    const database = handler.database
    const table = handler.table
    const cols = handler.insertableCols()

    const builder = database.adder()
    builder.setTable(table)
    cols.forEach(col => {
      const value = (col in params) ? params[col] : null
      builder.insertKV(col, value)
    })
    await builder.execute()
  }

  /**
   * @param params {Object}
   * @returns {Promise<void>}
   */
  async update(params) {
    const handler = this._handler
    const database = handler.database
    const table = handler.table
    const cols = handler.modifiableCols()

    const builder = database.modifier()
    builder.setTable(table)
    const pKey = handler.primaryKey
    const pKeys = Array.isArray(pKey) ? pKey : [pKey]
    pKeys.forEach(key => {
      builder.checkPrimaryKey(params, key)
      delete params[key]
    })
    cols.forEach(col => {
      if (col in params) {
        builder.updateKV(col, params[col])
      }
    })

    await builder.execute()
  }

  /**
   * @param params {Object}
   * @returns {Promise<void>}
   */
  async delete(params) {
    const handler = this._handler
    const database = handler.database
    const table = handler.table

    const builder = database.remover()
    builder.setTable(table)
    const pKey = handler.primaryKey
    const pKeys = Array.isArray(pKey) ? pKey : [pKey]
    pKeys.forEach(key => {
      builder.checkPrimaryKey(params, key)
    })
    await builder.execute()
  }

  /**
   * @param params {Object}
   * @param checkPrimaryKey {Boolean}
   * @returns {Promise<null|Object>}
   */
  async searchSingle(params, checkPrimaryKey = true) {
    const handler = this._handler
    if (checkPrimaryKey) {
      const pKey = handler.primaryKey
      const pKeys = Array.isArray(pKey) ? pKey : [pKey]
      pKeys.forEach(key => {
        assert.ok(key in params, `${this.constructor.name}: primary key missing.`)
      })
    }

    const items = await this.fetchList(params, 0, 1)
    if (items.length > 0) {
      return items[0]
    }
    return null
  }

  /**
   * @param params {Object}
   * @param page {Number}
   * @param length {Number}
   * @returns {Promise<Array<Object>>}
   */
  async fetchList(params = {}, page = 0, length = 20) {
    const handler = this._handler
    const database = handler.database
    const table = handler.table
    const cols = handler.cols()

    const builder = database.searcher()
    builder.setTable(table)
    builder.setPageInfo(page, length)
    cols.forEach(col => {
      builder.addColumn(col)
    })
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        builder.addConditionKV(key, params[key])
      }
    }
    return builder.queryList()
  }

  /**
   * @param params {Object}
   * @returns {Promise<Number>}
   */
  async fetchCount(params = {}) {
    const handler = this._handler
    const database = handler.database
    const table = handler.table
    const cols = handler.cols()

    const builder = database.searcher()
    builder.setTable(table)
    cols.forEach(col => {
      builder.addColumn(col)
    })
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        builder.addConditionKV(key, params[key])
      }
    }
    return builder.queryCount()
  }
}

module.exports = DBTools
