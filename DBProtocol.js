/* eslint-disable-next-line */
const FCDatabase = require('./FCDatabase')
const assert = require('assert')

class DBProtocol {
  /**
   * @returns {FCDatabase}
   */
  static database() {
    assert.fail(`Must override this function`)
  }

  /**
   * @returns {string}
   */
  static table() {
    assert.fail(`Must override this function`)
  }

  /**
   * @returns {string|Array}
   */
  static primaryKey() {
    assert.fail(`Must override this function`)
  }

  /**
   * @returns {Array.<string>}
   */
  static cols() {
    assert.fail(`Must override this function`)
  }

  /**
   * @returns {Array.<string>}
   */
  static insertableCols() {
    return this.cols()
  }

  /**
   * @returns {Array.<string>}
   */
  static modifiableCols() {
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
