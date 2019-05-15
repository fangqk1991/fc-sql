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
}

module.exports = DBProtocol
