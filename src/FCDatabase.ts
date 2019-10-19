import { QueryTypes, Sequelize } from 'sequelize'
import { SQLSearcher } from "./SQLSearcher"
import { SQLAdder } from "./SQLAdder"
import { SQLModifier } from './SQLModifier'
import { SQLRemover } from "./SQLRemover"
import { Options } from 'sequelize'
import * as moment from 'moment'

const _instanceMap: { [key: string]: FCDatabase } = {}

export class FCDatabase {
  __theDatabase?: Sequelize
  _options!: Options

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

  init(options: Options): void {
    this._options = options
  }

  async query(query: string, replacements: (string | number | null)[] = []): Promise<{ [key: string]: any }[]> {
    const items = (await this._db().query(query, {
      replacements: replacements,
      type: QueryTypes.SELECT,
      raw: true
    })) as any[]
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

  async update(query: string, replacements: (string | number | null)[] = []): Promise<any> {
    return this._db().query(query, {
      replacements: replacements
    })
  }

  _db(): Sequelize {
    if (!this.__theDatabase) {
      this.__theDatabase = new Sequelize(this._options)
    }
    return this.__theDatabase
  }

  searcher(): SQLSearcher {
    return new SQLSearcher(this)
  }

  adder(): SQLAdder {
    return new SQLAdder(this)
  }

  modifier(): SQLModifier {
    return new SQLModifier(this)
  }

  remover(): SQLRemover {
    return new SQLRemover(this)
  }

  async timezone() {
    const result = await this.query(`SHOW VARIABLES LIKE "time_zone"`)
    return result[0]['Value']
  }
}
