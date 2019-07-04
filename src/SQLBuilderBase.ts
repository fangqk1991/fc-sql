/* eslint-disable-next-line */
import {FCDatabase} from './FCDatabase'
import * as assert from 'assert'

export class SQLBuilderBase {
  database = null
  conditionColumns = []
  conditionValues = []
  table = null

  /**
   * @param database {FCDatabase}
   */
  constructor(database) {
    this.database = database
  }

  /**
   * @param table {string}
   */
  setTable(table) {
    this.table = table
  }

  checkPrimaryKey(params, key) {
    assert.ok(key in params, `${this.constructor.name}: primary key missing.`)
    this.addConditionKV(key, params[key])
  }

  /**
   * @param key {string}
   * @param value {string|Number}
   */
  addConditionKV(key, value) {
    this.conditionColumns.push(`(${key} = ?)`)
    this.conditionValues.push(value)
  }

  /**
   * @param condition {string}
   * @param args
   */
  addSpecialCondition(condition, ...args) {
    assert.ok((condition.match(/\?/g) || []).length === args.length, `${this.constructor.name}: addSpecialCondition: Incorrect number of arguments.`)
    this.conditionColumns.push(`(${condition})`)
    this.conditionValues.push(...args)
  }

  /**
   * @returns {Array.<string>}
   */
  conditions() {
    return this.conditionColumns
  }

  /**
   * @returns {Array.<string|Number>}
   */
  stmtValues() {
    return this.conditionValues
  }

  checkTableValid() {
    assert.ok(!!this.table, `${this.constructor.name}: table missing.`)
  }

  /**
   * @returns {string}
   */
  buildConditionStr() {
    return this.conditions().join(' AND ')
  }
}
