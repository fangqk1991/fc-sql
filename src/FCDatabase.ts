import { QueryTypes, Sequelize, Transaction } from 'sequelize'
import { SQLSearcher } from './SQLSearcher'
import { SQLAdder } from './SQLAdder'
import { SQLModifier } from './SQLModifier'
import { SQLRemover } from './SQLRemover'
import { Options } from 'sequelize'
import * as moment from 'moment'
import { TransactionRunner } from './TransactionRunner'
import { DBTableHandler } from './DBTableHandler'

const _instanceMap: { [key: string]: FCDatabase } = {}

export class FCDatabase {
  __theDatabase?: Sequelize
  _options!: Options

  public static instanceWithName(name: string): FCDatabase {
    let obj = null
    if (name in _instanceMap && _instanceMap[name] instanceof FCDatabase) {
      obj = _instanceMap[name]
    } else {
      obj = new FCDatabase()
      _instanceMap[name] = obj
    }

    return obj
  }

  public static getInstance(): FCDatabase {
    return FCDatabase.instanceWithName('default')
  }

  public init(options: Options): void {
    this._options = options
  }

  public dbName() {
    return this._options.database as string
  }

  public async query(
    query: string,
    replacements: (string | number | null)[] = [],
    transaction: Transaction | null = null
  ): Promise<{ [key: string]: any }[]> {
    const options: any = {
      replacements: replacements,
      type: QueryTypes.SELECT,
      raw: true,
    }
    if (transaction) {
      options['transaction'] = transaction
    }
    const items = (await this._db().query(query, options)) as any[]
    if (items.length > 0) {
      const remainKeyMap = Object.keys(items[0]).reduce((result: any, cur: string) => {
        result[cur] = true
        return result
      }, {})
      for (const item of items) {
        const keys = Object.keys(remainKeyMap)
        for (const key of keys) {
          if (Object.prototype.toString.call(item[key]) === '[object Date]') {
            // console.log(`Convert "${key}"`)
            item[key] = moment(item[key]).format()
          } else {
            if (item[key] !== null && item[key] !== undefined) {
              delete remainKeyMap[key]
            }
          }
        }
      }
    }
    return items as { [p: string]: number | string }[]
  }

  public async update(
    query: string,
    replacements: (string | number | null)[] = [],
    transaction: Transaction | null = null
  ): Promise<any> {
    const options: any = {
      replacements: replacements,
    }
    if (transaction) {
      options['transaction'] = transaction
    }
    return this._db().query(query, options)
  }

  private _db() {
    if (!this.__theDatabase) {
      this.__theDatabase = new Sequelize(this._options)
    }
    return this.__theDatabase
  }

  public searcher() {
    return new SQLSearcher(this)
  }

  public adder() {
    return new SQLAdder(this)
  }

  public modifier() {
    return new SQLModifier(this)
  }

  public remover() {
    return new SQLRemover(this)
  }

  public tableHandler(tableName: string) {
    return new DBTableHandler(this, tableName)
  }

  public createTransactionRunner() {
    return new TransactionRunner(this)
  }

  public async timezone() {
    const result = await this.query(`SHOW VARIABLES LIKE "time_zone"`)
    return result[0]['Value']
  }

  public async ping() {
    await this.query('SELECT 1')
    return 'PONG'
  }
}
