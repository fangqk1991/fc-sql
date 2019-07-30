import {SQLBuilderBase} from './SQLBuilderBase'
import * as assert from 'assert'

export class SQLSearcher extends SQLBuilderBase {
  _queryColumns: string[] = []
  _distinct: boolean = false
  _offset: number = -1
  _length: number = 1
  _optionStr: string = ''
  _orderRules: { sortKey: string; sortDirection: string }[] = []
  _orderStmts: (string|number)[] = []

  public markDistinct(): void {
    this._distinct = true
  }

  public setColumns(columns: string[]) {
    this._queryColumns = columns
  }

  public addColumn(column: string): void {
    this._queryColumns.push(column)
  }

  public addOrderRule(sortKey: string, direction: string = 'ASC', ...args: (string|number)[]) {
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

  public setPageInfo(page: number, lengthPerPage: number): void {
    this._length = lengthPerPage
    this._offset = page * this._length
  }

  public setLimitInfo(offset: number, length: number): void {
    this._offset = offset
    this._length = length
  }

  public setOptionStr(optionStr: string): void {
    this._optionStr = optionStr
  }

  public checkColumnsValid(): void {
    assert.ok(this._queryColumns.length > 0, `${this.constructor.name}: _queryColumns missing.`)
  }

  private _columnsDesc(): string {
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

  public exportSQL() {
    this.checkTableValid()
    this.checkColumnsValid()

    let query = `SELECT ${this._distinct ? 'DISTINCT' : ''} ${this._columnsDesc()} FROM ${this.table}`
    const conditions = this.conditions()
    if (conditions.length) {
      query = `${query} WHERE ${this.buildConditionStr()}`
    }
    return {query: query, stmtValues: [...this.stmtValues()]}
  }

  public async queryList() {
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

    return this.database.query(query, stmtValues)
  }

  public async querySingle() {
    const items = await this.queryList()
    if (items.length > 0) {
      return items[0]
    }
    return null
  }

  public async queryCount() {
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
