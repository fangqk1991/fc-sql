import {FCDatabase} from './FCDatabase'
import * as assert from 'assert'

export class SQLBuilderBase {
  database: FCDatabase
  conditionColumns: string[] = []
  conditionValues: (string | number)[] = []
  table: string = ''

  constructor(database: FCDatabase) {
    this.database = database
  }

  setTable(table: string): void {
    this.table = table
  }

  checkPrimaryKey(params: { [key: string]: (string | number) }, key: string): void {
    assert.ok(key in params, `${this.constructor.name}: primary key missing.`)
    this.addConditionKV(key, params[key])
  }

  addConditionKV(key: string, value: string | number): void {
    this.conditionColumns.push(`(${key} = ?)`)
    this.conditionValues.push(value)
  }

  addSpecialCondition(condition: string, ...args: (string | number)[]): void {
    assert.ok((condition.match(/\?/g) || []).length === args.length, `${this.constructor.name}: addSpecialCondition: Incorrect number of arguments.`)
    this.conditionColumns.push(`(${condition})`)
    this.conditionValues.push(...args)
  }

  conditions(): string[] {
    return this.conditionColumns
  }

  stmtValues(): (string | number | null)[] {
    return this.conditionValues
  }

  checkTableValid(): void {
    assert.ok(!!this.table, `${this.constructor.name}: table missing.`)
  }

  buildConditionStr(): string {
    return this.conditions().join(' AND ')
  }
}
