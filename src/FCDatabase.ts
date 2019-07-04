import { QueryTypes, Sequelize } from 'sequelize'

const _instanceMap = {}

export class FCDatabase {
  __theDatabase = null
  _options = null

  /**
   * @returns {FCDatabase}
   */
  static instanceWithName(name) {
    let obj = null
    if (name in _instanceMap && _instanceMap[name] instanceof FCDatabase) {
      obj = _instanceMap[name]
    } else {
      obj = new FCDatabase()
      _instanceMap[name] = obj
    }

    return obj
  }

  /**
   * @returns {FCDatabase}
   */
  static getInstance() {
    return FCDatabase.instanceWithName('default')
  }

  init(options) {
    this._options = options
  }

  async query(query, replacements = []) {
    return this._db().query(query, {
      replacements: replacements,
      type: QueryTypes.SELECT
    })
  }

  async update(query, replacements = []) {
    return this._db().query(query, {
      replacements: replacements,
    })
  }

  /**
   * @returns {Sequelize}
   * @private
   */
  _db() {
    if (!this.__theDatabase) {
      this.__theDatabase = new Sequelize(this._options)
    }
    return this.__theDatabase
  }

  /**
   * @returns {SQLSearcher}
   */
  searcher() {
    const SQLSearcher = require('./SQLSearcher').SQLSearcher
    return new SQLSearcher(this)
  }

  /**
   * @returns {SQLAdder}
   */
  adder() {
    const SQLAdder = require('./SQLAdder').SQLAdder
    return new SQLAdder(this)
  }

  /**
   * @returns {SQLModifier}
   */
  modifier() {
    const SQLModifier = require('./SQLModifier').SQLModifier
    return new SQLModifier(this)
  }

  /**
   * @returns {SQLRemover}
   */
  remover() {
    const SQLRemover = require('./SQLRemover').SQLRemover
    return new SQLRemover(this)
  }
}
