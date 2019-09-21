import { SQLBuilderBase } from './SQLBuilderBase'
import * as assert from 'assert'

export type OrderDirection = 'ASC' | 'DESC'

/**
 * @description Use for select-sql
 */
export class SQLSearcher extends SQLBuilderBase {
  _queryColumns: string[] = []
  _distinct: boolean = false
  _offset: number = -1
  _length: number = 1
  _optionStr: string = ''
  _orderRules: { sortKey: string; sortDirection: OrderDirection }[] = []
  _orderStmts: (string | number)[] = []

  /**
   * @description As 'DISTINCT' in select-sql
   */
  public markDistinct(): void {
    this._distinct = true
  }

  /**
   * @description Set the columns you want to get
   */
  setColumns(columns: string[]) {
    this._queryColumns = columns
  }

  /**
   * @description Add the column you want to get
   */
  addColumn(column: string): void {
    this._queryColumns.push(column)
  }

  /**
   * @description Add order rule for the result
   * @param sortKey {string}
   * @param direction {string}
   * @param args
   */
  addOrderRule(sortKey: string, direction: OrderDirection = 'ASC', ...args: (string | number)[]) {
    if (direction.toUpperCase() === 'DESC') {
      direction = 'DESC'
    } else {
      direction = 'ASC'
    }
    this._orderRules.push({
      sortKey: sortKey,
      sortDirection: direction
    })
    this._orderStmts.push(...args)
  }

  /**
   * @description Pass page index and lengthPerPage to build limit info, page's first index is 0
   * @param page {number}
   * @param lengthPerPage {number}
   */
  setPageInfo(page: number, lengthPerPage: number): void {
    this._length = lengthPerPage
    this._offset = page * this._length
  }

  /**
   * @description Set limit info, pass offset and length
   * @param offset {string}
   * @param length {string}
   */
  setLimitInfo(offset: number, length: number): void {
    this._offset = offset
    this._length = length
  }

  /**
   * @description Set option statement, such as 'GROUP BY ...'
   * @param optionStr
   */
  setOptionStr(optionStr: string): void {
    this._optionStr = optionStr
  }

  checkColumnsValid(): void {
    assert.ok(this._queryColumns.length > 0, `${this.constructor.name}: _queryColumns missing.`)
  }

  _columnsDesc(): string {
    return this._queryColumns.map((column: string): string => {
      if (/[\(\)]/.test(column)) {
        return column
      }
      const [keyStr, ...others]: string[] = column.trim().split(' ')
      const formattedKeyStr = keyStr.split('.').map((item: string): string => {
        const chars = item.replace(new RegExp('`', 'g'), '')
        return /^[a-zA-Z0-9_]+$/.test(chars) ? `\`${chars}\`` : chars
      }).join('.')
      if (others.length > 0) {
        const key = others.pop() as string
        others.push(`\`${key.replace(new RegExp('`', 'g'), '')}\``)
      }
      return [formattedKeyStr, ...others].join(' ')
    }).join(', ')
  }

  exportSQL() {
    this.checkTableValid()
    this.checkColumnsValid()

    let query = `SELECT ${this._distinct ? 'DISTINCT' : ''} ${this._columnsDesc()} FROM ${this.table}`
    const conditions = this.conditions()
    if (conditions.length) {
      query = `${query} WHERE ${this.buildConditionStr()}`
    }
    return {query: query, stmtValues: [...this.stmtValues()]}
  }

  /**
   * @description Execute it after preparing table, columns, conditions, get the record-list.
   */
  async queryList() {
    const data = this.exportSQL()
    let query = data.query
    const stmtValues = data.stmtValues

    if (this._optionStr) {
      query = `${query} ${this._optionStr}`
    }

    if (this._orderRules.length) {
      const orderItems = this._orderRules.map((rule): string => `${rule.sortKey} ${rule.sortDirection}`)
      query = `${query} ORDER BY ${orderItems.join(', ')}`
    }
    if (this._orderStmts.length) {
      stmtValues.push(...this._orderStmts)
    }

    if (this._offset >= 0 && this._length > 0) {
      query = `${query} LIMIT ${this._offset}, ${this._length}`
    }

    return (await this.database.query(query, stmtValues)) as { [p: string]: any }[]
  }

  /**
   * @description Got the first element of the return of 'queryList()', if list is empty, 'querySingle()' will return null.
   */
  async querySingle() {
    const items = await this.queryList()
    if (items.length > 0) {
      return items[0]
    }
    return null
  }

  /**
   * @description Execute it after preparing table, columns, conditions, get the record-count.
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
    return result[0]['count'] as number
  }
}
