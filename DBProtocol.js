/* eslint-disable-next-line */
const FCDatabase = require('./FCDatabase')
const assert = require('assert')

class DBProtocol {
  /**
   * @returns {FCDatabase}
   */
  database() {
    assert.fail(`Must override this function`)
  }

  /**
   * @returns {string}
   */
  table() {
    assert.fail(`Must override this function`)
  }

  /**
   * @returns {string|Array}
   */
  primaryKey() {
    assert.fail(`Must override this function`)
  }

  /**
   * @returns {Array.<string>}
   */
  cols() {
    assert.fail(`Must override this function`)
  }

  /**
   * @returns {Array.<string>}
   */
  insertableCols() {
    return this.cols()
  }

  /**
   * @returns {Array.<string>}
   */
  modifiableCols() {
    return []
  }

  static bindToClass(clazz) {
    clazz.dbProtocol = this
    clazz.prototype.dbProtocol = this
  }

  static checkClass(clazz) {
    return clazz.dbProtocol instanceof this
  }
}

module.exports = DBProtocol
