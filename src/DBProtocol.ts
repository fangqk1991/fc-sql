/* eslint-disable-next-line */
import {FCDatabase} from './FCDatabase'
import * as assert from 'assert'

export class DBProtocol {
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
