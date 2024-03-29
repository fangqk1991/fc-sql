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
    if (/^\w+$/.test(key)) {
      key = `\`${key}\``
    }
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
    return this._addSpecialCondition(condition, args)
  }

  private _addSpecialCondition(condition: string, args: (string | number)[]) {
    assert.ok(
      (condition.match(/\?/g) || []).length === args.length,
      `${this.constructor.name}: addSpecialCondition: Incorrect number of arguments.`
    )
    this.conditionColumns.push(`(${condition})`)
    this.conditionValues = this.conditionValues.concat(args)
    return this
  }

  /**
   * @deprecated Please use addConditionKeyInArray instead.
   * @param key
   * @param values
   */
  public addConditionKeyInSet(key: string, ...values: (string | number)[]) {
    this.addConditionKeyInArray(key, values)
    return this
  }

  public addConditionKeyInArray(key: string, values: (string | number)[]) {
    if (values.length === 0) {
      this.addSpecialCondition('1 = 0')
      return this
    }
    const quotes = Array(values.length).fill('?').join(', ')
    if (/^\w+$/.test(key)) {
      key = `\`${key}\``
    }
    this._addSpecialCondition(`${key} IN (${quotes})`, values)
    return this
  }

  public addConditionKeyNotInArray(key: string, values: (string | number)[]) {
    if (values.length === 0) {
      this.addSpecialCondition('1 = 1')
      return this
    }
    const quotes = Array(values.length).fill('?').join(', ')
    if (/^\w+$/.test(key)) {
      key = `\`${key}\``
    }
    this._addSpecialCondition(`${key} NOT IN (${quotes})`, values)
    return this
  }

  public conditions(): string[] {
    return this.conditionColumns
  }

  public stmtValues(): (string | number | null)[] {
    return this.conditionValues
  }

  public checkTableValid() {
    assert.ok(!!this.table, `${this.constructor.name}: table missing.`)
    return this
  }

  public buildConditionStr() {
    return this.conditions().join(' AND ')
  }
}
