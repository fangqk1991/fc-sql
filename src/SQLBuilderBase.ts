import { FCDatabase } from './FCDatabase'
import * as assert from 'assert'
import { Transaction } from 'sequelize'

export abstract class SQLBuilderBase {
  database: FCDatabase
  conditionColumns: string[] = []
  conditionValues: (string | number)[] = []
  table: string = ''

  public transaction!: Transaction
  public abstract async execute(): Promise<any>

  constructor(database: FCDatabase) {
    this.database = database
  }

  /**
   * @description Set sql-table
   * @param table
   */
  public setTable(table: string) {
    this.table = table
    return this
  }

  public checkPrimaryKey(params: { [key: string]: string | number }, key: string) {
    assert.ok(key in params, `${this.constructor.name}: primary key missing.`)
    this.addConditionKV(key, params[key])
    return this
  }

  /**
   * @description Add (column = value) condition, for instance, passing ('name', 'fang') means (name = 'fang')
   * @param key {string}
   * @param value {string | number}
   */
  public addConditionKV(key: string, value: string | number) {
    this.conditionColumns.push(`(${key} = ?)`)
    this.conditionValues.push(value)
    return this
  }

  /**
   * @description Add special condition, for instance, passing ('age > ?', 10) means (age > 10)
   * @param condition {string}
   * @param args
   */
  public addSpecialCondition(condition: string, ...args: (string | number)[]) {
    assert.ok(
      (condition.match(/\?/g) || []).length === args.length,
      `${this.constructor.name}: addSpecialCondition: Incorrect number of arguments.`
    )
    this.conditionColumns.push(`(${condition})`)
    this.conditionValues.push(...args)
    return this
  }

  public addConditionKeyInSet(key: string, ...values: string[]) {
    if (values.length === 0) {
      this.addSpecialCondition('1 = 0')
      return this
    }
    const quotes = Array(values.length)
      .fill('?')
      .join(', ')
    if (/^\w+$/.test(key)) {
      key = `\`${key}\``
    }
    this.addSpecialCondition(`${key} IN (${quotes})`, ...values)
    return this
  }

  conditions(): string[] {
    return this.conditionColumns
  }

  stmtValues(): (string | number | null)[] {
    return this.conditionValues
  }

  checkTableValid() {
    assert.ok(!!this.table, `${this.constructor.name}: table missing.`)
    return this
  }

  buildConditionStr(): string {
    return this.conditions().join(' AND ')
  }
}
