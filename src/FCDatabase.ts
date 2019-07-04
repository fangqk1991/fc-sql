import { QueryTypes, Sequelize } from 'sequelize'

const _instanceMap: {[key: string]: FCDatabase} = {}

export class FCDatabase {
  __theDatabase?: Sequelize
  _options?: {}

  static instanceWithName(name: string): FCDatabase {
    let obj = null
    if (name in _instanceMap && _instanceMap[name] instanceof FCDatabase) {
      obj = _instanceMap[name]
    } else {
      obj = new FCDatabase()
      _instanceMap[name] = obj
    }

    return obj
  }

  static getInstance(): FCDatabase {
    return FCDatabase.instanceWithName('default')
  }

  init(options: {}): void {
    this._options = options
  }

  async query(query: string, replacements: (string|number)[] = []): Promise<{[key: string]: any}[]> {
    return this._db().query(query, {
      replacements: replacements,
      type: QueryTypes.SELECT
    })
  }

  async update(query: string, replacements: (string|number)[] = []): Promise<any> {
    return this._db().query(query, {
      replacements: replacements,
    })
  }

  _db(): Sequelize {
    if (!this.__theDatabase) {
      this.__theDatabase = new Sequelize(this._options)
    }
    return this.__theDatabase
  }

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
