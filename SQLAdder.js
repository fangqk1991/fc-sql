const SQLBuilderBase = require('./SQLBuilderBase')
const assert = require('assert')

class SQLAdder extends SQLBuilderBase {
  /**
   * @param database {FCDatabase}
   */
  constructor(database) {
    super(database)
    this._insertKeys = []
    this._insertValues = []
  }

  insertKV(key, value) {
    this._insertKeys.push(key)
    this._insertValues.push(value)
  }

  /**
   * @returns {Promise<void>}
   */
  async execute() {
    this.checkTableValid()
    assert.ok(this._insertKeys.length > 0, `${this.constructor.name}: insertKeys missing.`)

    const query = `INSERT INTO ${this.table}(${this._insertKeys.join(', ')}) VALUES (${Array(this.stmtValues().length).fill('?').join(', ')})`
    await this.database.update(query, this.stmtValues())
  }

  /**
   * @returns {Array.<string|Number>}
   */
  stmtValues() {
    return this._insertValues
  }
}

module.exports = SQLAdder
