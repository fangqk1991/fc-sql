const SQLBuilderBase = require('./SQLBuilderBase')
const assert = require('assert')

class SQLModifier extends SQLBuilderBase {
  /**
   * @param database {FCDatabase}
   */
  constructor(database) {
    super(database)
    this._updateColumns = []
    this._updateValues = []
  }

  updateKV(key, value) {
    this._updateColumns.push(`${key} = ?`)
    this._updateValues.push(value)
  }

  /**
   * @returns {Promise<void>}
   */
  async execute() {
    this.checkTableValid()
    assert.ok(this._updateColumns.length > 0, `${this.constructor.name}: updateColumns missing.`)
    assert.ok(this.conditionColumns.length > 0, `${this.constructor.name}: conditionColumns missing.`)

    const query = `UPDATE ${this.table} SET ${this._updateColumns.join(', ')} WHERE (${this.conditions().join(' AND ')})`
    await this.database.update(query, this.stmtValues())
  }

  /**
   * @returns {Array.<string|Number>}
   */
  stmtValues() {
    return this._updateValues.concat(this.conditionValues)
  }
}

module.exports = SQLModifier
