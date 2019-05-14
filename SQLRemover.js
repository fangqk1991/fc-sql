const SQLBuilderBase = require('./SQLBuilderBase')
const assert = require('assert')

class SQLRemover extends SQLBuilderBase {
  /**
   * @param database {FCDatabase}
   */
  constructor(database) {
    super(database)
  }

  /**
   * @returns {Promise<void>}
   */
  async execute() {
    this.checkTableValid()
    assert.ok(this.conditionColumns.length > 0, `${this.constructor.name}: conditionColumns missing.`)

    const query = `DELETE FROM ${this.table} WHERE (${this.conditions().join(' AND ')})`
    await this.database.update(query, this.stmtValues())
  }
}

module.exports = SQLRemover
