import { FCDatabase } from './FCDatabase'
import * as assert from 'assert'
import { TransactionOperation } from './DBTransaction'
import { FCTransaction } from './FCTransaction'

export abstract class SQLBuilderBase implements TransactionOperation {
  database: FCDatabase
  conditionColumns: string[] = []
  conditionValues: (string | number)[] = []
  table: string = ''

  public transaction!: FCTransaction
  public abstract async execute(): Promise<any>

  constructor(database: FCDatabase) {
    this.database = database
  }

  /**
   * @description Set sql-table
   * @param table
   */
  setTable(table: string) {
    this.table = table
    return this
  }

  checkPrimaryKey(params: { [key: string]: (string | number) }, key: string) {
    assert.ok(key in params, `${this.constructor.name}: primary key missing.`)
    this.addConditionKV(key, params[key])
    return this
  }

  /**
   * @description Add (column = value) condition, for instance, passing ('name', 'fang') means (name = 'fang')
   * @param key {string}
   * @param value {string | number}
   */
  addConditionKV(key: string, value: string | number) {
    this.conditionColumns.push(`(${key} = ?)`)
    this.conditionValues.push(value)
    return this
  }

  /**
   * @description Add special condition, for instance, passing ('age > ?', 10) means (age > 10)
   * @param condition {string}
   * @param args
   */
  addSpecialCondition(condition: string, ...args: (string | number)[]) {
    assert.ok((condition.match(/\?/g) || []).length === args.length, `${this.constructor.name}: addSpecialCondition: Incorrect number of arguments.`)
    this.conditionColumns.push(`(${condition})`)
    this.conditionValues.push(...args)
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
