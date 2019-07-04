import {SQLBuilderBase} from './SQLBuilderBase'
import * as assert from 'assert'

export class SQLSearcher extends SQLBuilderBase {
  _queryColumns = []
  _distinct = false
  _offset = -1
  _length = 1
  _optionStr = ''
  _orderRules = []

  markDistinct() {
    this._distinct = true
  }

  /**
   * @param columns {Array}
   */
  setColumns(columns) {
    this._queryColumns = columns
  }

  addColumn(column) {
    this._queryColumns.push(column)
  }

  /**
   * @param sortKey {string}
   * @param direction {string}
   */
  addOrderRule(sortKey, direction = 'ASC') {
    if (typeof direction === 'string' && direction.toUpperCase() === 'DESC') {
      direction = 'DESC'
    } else {
      direction = 'ASC'
    }
    this._orderRules.push({ sortKey: sortKey, sortDirection: direction })
  }

  /**
   * @param page {Number}
   * @param lengthPerPage {Number}
   */
  setPageInfo(page, lengthPerPage) {
    this._length = lengthPerPage
    this._offset = page * this._length
  }

  /**
   * @param offset {Number}
   * @param length {Number}
   */
  setLimitInfo(offset, length) {
    this._offset = offset
    this._length = length
  }

  /**
   * @param optionStr {string}
   */
  setOptionStr(optionStr) {
    this._optionStr = optionStr
  }

  checkColumnsValid() {
    assert.ok(this._queryColumns.length > 0, `${this.constructor.name}: _queryColumns missing.`)
  }

  _columnsDesc() {
    return this._queryColumns.map(column => {
      if (/[\(\)]/.test(column)) {
        return column
      }
      const [keyStr, ...others] = column.trim().split(' ')
      const formattedKeyStr = keyStr.split('.').map(item => `\`${item.replace(new RegExp('`', 'g'), '')}\``).join('.')
      if (others.length > 0) {
        const key = others.pop()
        others.push(`\`${key.replace(new RegExp('`', 'g'), '')}\``)
      }
      return [formattedKeyStr, ...others].join(' ')
    }).join(', ')
  }

  /**
   * @returns {{query: string, stmtValues: Array}}
   */
  exportSQL() {
    this.checkTableValid()
    this.checkColumnsValid()

    let query = `SELECT ${this._distinct ? 'DISTINCT' : ''} ${this._columnsDesc()} FROM ${this.table}`
    const conditions = this.conditions()
    if (conditions.length) {
      query = `${query} WHERE ${this.buildConditionStr()}`
    }
    return { query: query, stmtValues: this.stmtValues() }
  }

  /**
   * @returns {Promise<Array.<Object>>}
   */
  async queryList() {
    const data = this.exportSQL()
    let query = data.query
    const stmtValues = data.stmtValues

    if (this._optionStr) {
      query = `${query} ${this._optionStr}`
    }

    if (this._orderRules.length) {
      const orderItems = this._orderRules.map(rule => `${rule.sortKey} ${rule.sortDirection}`)
      query = `${query} ORDER BY ${orderItems.join(', ')}`
    }

    if (this._offset >= 0 && this._length > 0) {
      query = `${query} LIMIT ${this._offset}, ${this._length}`
    }

    return this.database.query(query, stmtValues)
  }

  /**
   * @returns {Promise<Object>}
   */
  async querySingle() {
    const items = await this.queryList()
    if (items.length > 0) {
      return items[0]
    }
    return null
  }

  /**
   * @returns {Promise<Number>}
   */
  async queryCount() {
    this.checkTableValid()

    let query
    if (this._distinct) {
      query = `SELECT COUNT(DISTINCT ${this._columnsDesc()}) AS count FROM ${this.table}`
    } else {
      query = `SELECT COUNT(*) AS count FROM ${this.table}`
    }

    const conditions = this.conditions()
    if (conditions.length > 0) {
      query = `${query} WHERE ${this.buildConditionStr()}`
    }

    const result = await this.database.query(query, this.stmtValues())
    return result[0]['count']
  }
}