const FCDatabase = require('../FCDatabase')
const assert = require('assert')

describe('Test SQL', () => {
  it(`Test FCDatabase`, async () => {
    const database = FCDatabase.getInstance()
    database.init({
      host: '127.0.0.1',
      port: '3306',
      dialect: 'mysql',
      database: 'demo_db',
      username: 'root',
      password: '',
      timezone: '+08:00'
    })
    {
      const data = await database.query('SHOW TABLES')
      console.log(data)
    }
    {
      const data = await database.query('SELECT * FROM demo_table')
      console.log(data)
    }
    await database.update('INSERT INTO demo_table(key1, key2) VALUES(?, ?)', ['K1-Temp', 'K2'])
    await database.update('UPDATE demo_table SET key2 = ? WHERE key1 = ?', ['K2-Changed', 'K1-Temp'])
    await database.update('DELETE FROM demo_table WHERE key1 = ?', ['K1-Temp'])
  })
})
