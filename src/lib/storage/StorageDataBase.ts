import { CUDataBase, IfCUDataBaseOptions } from './cudatabase';
import winston = require('winston');
import { ErrorCode, IFeedBack } from '../../core/error_code';
//import { subtractBN3, addBN2 } from './computer';
import * as SqlString from 'sqlstring';


export const HASH_TYPE = {
  ADDRESS: 'addr',
  TOKEN: 'token',
  TX: 'tx',
  BLOCK: 'block',
  HEIGHT: 'block',
  NONE: 'none'
};
export const SYS_TOKEN = 's';
export const SYS_TOKEN_SYMBOL = 'SYS';

export const TOKEN_TYPE = {
  NORMAL: 'normal',
  BANCOR: 'bancor',
  SYS: 'sys'
}


export class StorageDataBase extends CUDataBase {
  private hashTable: string;
  private accountTable: string;
  private blockTable: string;
  private txTable: string;
  private tokenTable: string;
  private bancorTokenTable: string;

  private hashTableSchema: string;
  private accountTableSchema: string;
  private blockTableSchema: string;
  private txTableSchema: string;
  private tokenTableSchema: string;
  private bancorTokenTableSchema: string;

  private txAddressTable: string;
  private txAddressTableSchema: string;

  constructor(logger: winston.LoggerInstance, options: IfCUDataBaseOptions) {
    super(logger, options);
    this.hashTable = 'hashtable';
    this.accountTable = 'accounttable';
    this.blockTable = 'blocktable';
    this.txTable = 'txtable';
    this.tokenTable = 'tokentable';
    this.bancorTokenTable = 'bancortokentable';
    this.txAddressTable = 'txaddresstable';

    // Token is of uppercase, hash| tokenname - type 
    this.hashTableSchema = `("hash" CHAR(64) PRIMARY KEY NOT NULL UNIQUE, "type" CHAR(64) NOT NULL, "verified" TINYINT NOT NULL);`;

    // account hash-tokenname (UpperCase), value for search purpose!
    this.accountTableSchema = `("hash" CHAR(64) NOT NULL, "token" CHAR(64) NOT NULL, "tokentype" CHAR(64) NOT NULL , "amount" TEXT NOT NULL, "value" INTEGER NOT NULL, PRIMARY KEY("hash", "token"));`;

    // block-height-txs num-address related -timestamp
    this.blockTableSchema = `("hash" CHAR(64) PRIMARY KEY NOT NULL UNIQUE,"number" INTEGER NOT NULL, "txs" INTEGER NOT NULL, "address" CHAR(64) NOT NULL, "timestamp" INTEGER NOT NULL);`;

    // txhash-block hash-blocknumber-address-timestamp- content
    this.txTableSchema = `("hash" CHAR(64) PRIMARY KEY NOT NULL UNIQUE, "blockhash" CHAR(64) NOT NULL, "blocknumber" INTEGER NOT NULL, "address" CHAR(64) NOT NULL, "timestamp" INTEGER NOT NULL, "content" BLOB NOT NULL);`;

    // name is UpperCase, tokenname-type-address-timestamp-content
    this.tokenTableSchema = `("name" CHAR(64) PRIMARY KEY NOT NULL UNIQUE, "type" CHAR(64) NOT NULL, "address" CHAR(64) NOT NULL, "timestamp" INTEGER NOT NULL, "content" BLOB NOT NULL);`;

    // This is the real-time parameter, name is UpperCase
    // for bancor token parameters, tokenname-factor-reserve-supply
    this.bancorTokenTableSchema = `("name" CHAR(64) PRIMARY KEY NOT NULL UNIQUE, "factor" INTEGER NOT NULL, "reserve" INTEGER NOT NULL,"supply" INTEGER NOT NULL);`;

    // tx-address table - address
    this.txAddressTableSchema = `("hash" CHAR(64) NOT NULL ,"address" CHAR(64) NOT NULL, "timestamp" INTEGER NOT NULL, PRIMARY KEY("hash", "address"));`;
  }

  public init(): Promise<IFeedBack> {
    return new Promise<IFeedBack>(async (resolv) => {
      let result = await this.createTable(this.hashTable, this.hashTableSchema);
      await this.createTable(this.accountTable, this.accountTableSchema);
      await this.createTable(this.blockTable, this.blockTableSchema);
      await this.createTable(this.txTable, this.txTableSchema);
      await this.createTable(this.bancorTokenTable, this.bancorTokenTableSchema);
      await this.createTable(this.txAddressTable, this.txAddressTableSchema);
      result = await this.createTable(this.tokenTable, this.tokenTableSchema);
      this.logger.info('Create storage tables:', result);
      resolv({ err: 0, data: null });
    });
  }

  // access functions
  // hash table, use regex to get hash value ,default is 5 result
  // public queryHashTable(s: string, num: number) {
  //   let sql = SqlString.format('SELECT * FROM ? WHERE hash LIKE "?%" LIMIT ?;', [this.hashTable, s, num])
  //   return this.getAllRecords(sql);
  // }
  public queryHashTableFullName(s: string, num: number) {
    let sql = SqlString.format('SELECT * FROM ? WHERE hash = ? LIMIT ?;', [this.hashTable, s, num])
    return this.getAllRecords(sql);
  }

  public insertOrReplaceHashTable(hash: string, type: string) {
    this.logger.info('into insertOrReplaceToHashTable()', hash, '\n')
    let sql = SqlString.format('INSERT OR REPLACE INTO ? (hash, type, verified) VALUES(?, ?, 0);', [this.hashTable, hash, type])
    return this.insertOrReplaceRecord(sql, {});
  }
  public insertHashTable(hash: string, type: string): Promise<IFeedBack> {
    this.logger.info('into insertHashTable()', hash, '\n')
    let sql = SqlString.format('INSERT INTO ? (hash, type, verified) VALUES(?, ?, 0);', [this.hashTable, hash, type])
    return this.insertRecord(sql, {});
  }
  public getHashTable(s: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE hash = ?;', [this.hashTable, s])
    return this.getRecord(sql);
  }

  public saveTxToHashTable(txs: any[]) {
    return new Promise<IFeedBack>(async (resolv) => {
      for (let j = 0; j < txs.length; j++) {
        this.logger.info('saveTxToHashTable()\n');
        let feedback = await this.insertOrReplaceHashTable(txs[j].hash, HASH_TYPE.TX);
        if (feedback.err) {
          resolv({ err: feedback.err, data: null })
          return;
        }
      }
      resolv({ err: ErrorCode.RESULT_OK, data: null })
    });
  }
  public async updateNamesToHashTable(names: string[], type: string) {
    return new Promise<IFeedBack>(async (resolv) => {
      for (let j = 0; j < names.length; j++) {
        let result = await this.updateNameToHashTable(names[j], type);
        if (result.err) {
          resolv(result)
          return;
        }
      }
      resolv({ err: ErrorCode.RESULT_OK, data: null });
    });
  }
  public async updateNameToHashTable(name: string, type: string) {
    return new Promise<IFeedBack>(async (resolv) => {
      this.logger.info('\n')
      this.logger.info('updateNameToHashTable()\n');
      let feedback = await this.getHashTable(name);
      console.log('\nfeedback is ->')
      console.log(feedback)
      if (feedback.err === ErrorCode.RESULT_DB_RECORD_EMPTY) {
        let result = await this.insertOrReplaceHashTable(name, type);
        resolv(result);
      } else { // failed or OK
        resolv(feedback);
      }
    });
  }

  // account
  public queryFortuneRanking(token: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE token = ? ORDER BY value DESC LIMIT 50;', [this.accountTable, token]);
    return this.getAllRecords(sql);
  }
  public queryFortuneRankingByPage(token: string, index: number, size: number) {
    let sql = SqlString.format('SELECT * FROM ? WHERE token = ?  ORDER BY value DESC LIMIT ? OFFSET ?;', [this.accountTable, token, size, index * size]);
    return this.getAllRecords(sql);
  }
  public queryAccountTotalByToken(token: string) {
    let sql = SqlString.format('SELECT COUNT(*) as count FROM ? WHERE token = ?;', [this.accountTable, token]);
    return this.getRecord(sql)
  }
  public queryAccountTableByAddress(addr: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE hash = ?;', [this.accountTable, addr]);
    return this.getAllRecords(sql);
  }
  public queryAllAccountTableByAddress(addr: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE hash = ?;', [this.accountTable, addr])
    return this.getAllRecords(sql);
  }
  public queryLatestAccountTable() {
    let sql = SqlString.format('SELECT * FROM ? LIMIT 50;', [this.accountTable])
    return this.getAllRecords(sql);
  }

  public queryAccountTableByTokenAndAddress(addr: string, token: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE hash = ? AND token = ?;', [this.accountTable, addr, token])
    return this.getRecord(sql);
  }

  public insertAccountTable(hash: string, token: string, tokentype: string, amount: string, value: number): Promise<IFeedBack> {
    let sql = SqlString.format('INSERT INTO ? (hash, token, tokentype, amount, value) VALUES(?, ?, ?, ?, ?);', [this.accountTable, hash, token, tokentype, amount, value]);
    return this.insertRecord(sql, {});
  }

  private updateAccountTableByTokenAndAddress(addr: string, token: string, amount: string, value: number) {
    let sql = SqlString.format('UPDATE ? SET amount = ? , value = ? WHERE hash=? AND token = ? ;', [this.accountTable, amount, value, addr, token])
    return this.updateRecord(sql);
  }
  public updateAccountTable(address: string, token: string, tokentype: string, amount: string, value: number) {
    return new Promise<IFeedBack>(async (resolv) => {
      // if address token is not empty, update it
      let result = await this.queryAccountTableByTokenAndAddress(address, token);
      //console.log('updateAccountTable result:', result)
      if (result.err === ErrorCode.RESULT_DB_RECORD_EMPTY) {
        // insert into it
        let result1 = await this.insertAccountTable(address, token, tokentype, amount, value);
        //console.log('updateAccountTable result1:', result1)
        resolv(result1);
      } else if (result.err === ErrorCode.RESULT_DB_TABLE_GET_FAILED) {
        resolv(result);
      } else {
        // update it
        let result2 = await this.updateAccountTableByTokenAndAddress(address, token, amount, value)
        //console.log('updateAccountTable result2: ', result2)
        resolv(result2);
      }
    })
  }


  // block table

  public insertOrReplaceBlockTable(hash: string, height: number, txno: number, address: string, datetime: number) {
    this.logger.info('into insertOrReplaceBlockTable()', hash, '\n')
    let sql = SqlString.format('INSERT OR REPLACE INTO ? (hash, number, txs, address, timestamp) VALUES(?,?, ?, ?, ?);', [this.blockTable, hash, height, txno, address, datetime])
    return this.insertOrReplaceRecord(sql, {});
  }
  public queryLatestBlockTable() {
    let sql = SqlString.format('SELECT * FROM ? ORDER BY timestamp DESC LIMIT 50;', [this.blockTable])
    return this.getAllRecords(sql)
  }

  public queryBlockTableByPage(index: number, size: number) {
    let sql = SqlString.format('SELECT * FROM ? ORDER BY timestamp DESC LIMIT ? OFFSET ?;', [this.blockTable, size, index * size])
    return this.getAllRecords(sql);
  }

  public queryBlockTotal() {
    let sql = SqlString.format('SELECT COUNT(*) as count FROM ?;', [this.blockTable]);
    return this.getRecord(sql)
  }

  // tx table
  public queryTxTable(hash: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE hash = ?;', [this.txTable, hash]);
    return this.getRecord(sql);
  }
  public queryTxTableByPage(index: number, size: number) {
    let sql = SqlString.format('SELECT * FROM ? ORDER BY timestamp DESC LIMIT ? OFFSET ?;', [this.txTable, size, index * size]);
    return this.getAllRecords(sql);
  }
  public queryTxTableByPageTotal() {
    let sql = SqlString.format('SELECT COUNT(*) as count FROM ?;', [this.txTable]);
    return this.getRecord(sql)
  }

  public queryTxTableByDatetime(from: number, to: number) {
    let sql = SqlString.format('SELECT COUNT(*) as count FROM ? WHERE  timestamp >= ? AND timestamp < ?;', [this.txTable, from, to])
    return this.getRecord(sql);
  }

  public queryTxTableByAddress(address: string, index: number, size: number) {
    let sql = SqlString.format('SELECT * FROM ? WHERE address = ?  ORDER BY timestamp DESC LIMIT ? OFFSET ?;', [this.txTable, address, size, index * size]);
    return this.getAllRecords(sql)
  }
  public queryTxTableByBlock(block: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE blockhash = ?;', [this.txTable, block]);

    return this.getAllRecords(sql)
  }
  public queryLatestTxTable() {
    let sql = SqlString.format('SELECT * FROM ? ORDER BY timestamp DESC LIMIT 15;', [this.txTable])
    return this.getAllRecords(sql)
  }
  public queryTxTableByAddressTotal(address: string) {
    let sql = SqlString.format('SELECT COUNT(*) as count FROM ? WHERE address = ? ;', [this.txTable, address]);
    return this.getRecord(sql)
  }
  public queryTxTableCount() {
    let sql = SqlString.format('SELECT COUNT(*) as count FROM ?;', [this.txTable]);
    return this.getRecord(sql)
  }
  public insertTxTable(hash: string, blockhash: string, blocknumber: number, address: string, datetime: number, content1: Buffer) {
    this.logger.info('insertOrREplaceTxTable', hash, '\n');
    let sql = SqlString.format('INSERT OR REPLACE INTO ? (hash, blockhash, blocknumber, address, timestamp, content) VALUES($hash, $blockhash, $blocknumber ,$address, $datetime, $content1);', [this.txTable]);

    return this.insertOrReplaceRecord(sql, {
      $hash: SqlString.escape(hash).replace(/\'/g, ''),
      $blockhash: SqlString.escape(blockhash).replace(/\'/g, ''),
      $blocknumber: SqlString.escape(blocknumber),
      $address: SqlString.escape(address).replace(/\'/g, ''),
      $datetime: SqlString.escape(datetime),
      $content1: content1
    });
  }


  // token table
  public queryTokenTable(name: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE name = ?;', [this.tokenTable, name])
    return this.getRecord(sql);
  }
  public insertTokenTable(tokenname: string, type: string, address: string, datetime: number, content: Buffer) {
    let sql = SqlString.format('INSERT OR REPLACE INTO ? (name, type, address, timestamp, content) VALUES(?, ?, ?, ?, $content);', [this.tokenTable, tokenname, type, address, datetime])
    return this.insertRecord(sql, { $content: content });
  }
  // public updateTokenTable(tokenname: string, type: string, address: string, datetime: number, content: Buffer) {
  //   return new Promise<IFeedBack>(async (resolv) => {
  //     let result = await this.queryTokenTable(tokenname)

  //     if (result.err === ErrorCode.RESULT_DB_RECORD_EMPTY) {
  //       // insert into it
  //       let result1 = await this.insertTokenTable(tokenname, type, address, datetime, content);
  //       //console.log('updateAccountTable result1:', result1)
  //       resolv(result1);
  //     } else if (result.err === ErrorCode.RESULT_DB_TABLE_GET_FAILED) {
  //       resolv(result);
  //     } else {
  //       console.log('ERROR: updateTokenTable result2: ', tokenname, ' already exist in db!')
  //       resolv({ err: ErrorCode.RESULT_OK, data: '' });
  //     }
  //   });
  // }

  // bancorTokenTable, for token price query 
  public queryBancorTokenTable(name: string) {
    let sql = SqlString.format('SELECT * FROM ? WHERE name = ?;', [this.bancorTokenTable, name])
    return this.getRecord(sql);
  }
  public insertBancorTokenTable(tokenname: string, factor: number, reserve: number, supply: number) {
    let sql = SqlString.format('INSERT OR REPLACE INTO ? (name, factor, reserve, supply) VALUES(?, ?, ?, ?);', [this.bancorTokenTable, tokenname, factor, reserve, supply])
    return this.insertRecord(sql, {});
  }
  public updateBancorTokenByName(tokenname: string, factor: number, reserve: number, supply: number) {
    let sql = SqlString.format('UPDATE ? SET reserve = ? , supply = ? WHERE name =?;', [this.bancorTokenTable, reserve, supply, tokenname])
    return this.updateRecord(sql);
  }
  public updateBancorTokenTable(tokenname: string, factor: number, reserve: number, supply: number) {
    return new Promise<IFeedBack>(async (resolv) => {
      let result = await this.queryBancorTokenTable(tokenname)

      if (result.err === ErrorCode.RESULT_DB_RECORD_EMPTY) {
        // insert into it
        let result1 = await this.insertBancorTokenTable(tokenname, factor, reserve, supply);
        //console.log('updateAccountTable result1:', result1)
        resolv(result1);
      } else if (result.err === ErrorCode.RESULT_DB_TABLE_GET_FAILED) {
        resolv(result);
      } else {
        console.log('ERROR: updateBancorTokenTable result2: ', tokenname, ' already exist in db!')
        let result2 = await this.updateBancorTokenByName(tokenname, factor, reserve, supply);
        resolv(result2);
      }
    });
  }
  //////////////////////
  // txaddress table
  //////////////////////
  public async queryHashTxAddressTable(addr: string): Promise<IFeedBack> {
    let sql = SqlString.format('SELECT * FROM ? WHERE address = ? ;', [this.txAddressTable, addr]);

    return this.getAllRecords(sql);
  }
  public async queryHashFromTx(hash: string, addr: string): Promise<IFeedBack> {
    let sql = SqlString.format('SELECT * FROM ? WHERE address = ? AND hash = ? ;', [this.txAddressTable, addr, hash]);

    return this.getRecord(sql);
  }
  public async insertTxAddressTable(hash: string, address: string, datetime: number) {
    this.logger.info('insertTxAddressTable');
    let sql = SqlString.format('INSERT INTO ? (hash, address, timestamp) VALUES($hash, $address, $datetime);', [this.txAddressTable]);
    return this.insertRecord(sql, {
      $hash: hash,
      $address: address,
      $datetime: datetime
    })
  }
  public async updateTxAddressTable(hash: string, address: string, datetime: number) {
    return new Promise<IFeedBack>(async (resolv) => {
      let result = await this.queryHashFromTx(hash, address);

      if (result.err === ErrorCode.RESULT_DB_RECORD_EMPTY) {

        let result1 = await this.insertTxAddressTable(hash, address, datetime);
        console.log('updateTxAddressTable result1:', result1)
        resolv(result1);
      } else if (result.err === ErrorCode.RESULT_DB_TABLE_GET_FAILED) {
        resolv(result);
      } else {
        resolv({ err: ErrorCode.RESULT_OK, data: null })
      }

    });
  }
  // Query 2 tables
  public async queryHashFromTxAddressTable(addr: string, index: number, size: number): Promise<IFeedBack> {

    this.logger.info('queryHansFromTxAddressTable:', 'size:', size, ' index:', index)
    let sql = SqlString.format('SELECT * FROM ? WHERE hash IN ( SELECT hash FROM ? WHERE address = ? ORDER BY timestamp DESC LIMIT ? OFFSET ? ) ORDER BY timestamp DESC;', [this.txTable, this.txAddressTable, addr, size, index * size]);
    // SELECT hash FROM ? WHERE address = ? ORDER BY timestamp DESC LIMIT ? OFFSET ? ;
    // "ad9d2f16ec9c0014b9036f7df3029ae783ba6a7e7cf5ba273c286eba36280c80" , "644d22c72f647fc79d02ce36e3b291154c02ad80c18713b0588cc679ba50ff7f"
    //let sql = SqlString.format('SELECT hash FROM ? WHERE address = ? ORDER BY timestamp DESC LIMIT ? OFFSET ? ;', [this.txAddressTable, addr, size, index * size]);
    return this.getAllRecords(sql);
  }

  public async queryHashFromTxAddressTableTotal(addr: string) {
    let sql = SqlString.format('SELECT COUNT(*) as count FROM ? WHERE address = ? ;', [this.txAddressTable, addr]);
    return this.getRecord(sql)
  }

  public async updateHashToTxAddressTable(strHash: string, addrs: string[], timestamp: number) {
    this.logger.info('updateHashToTxAddressTable()')
    return new Promise<IFeedBack>(async (resolv) => {
      for (let j = 0; j < addrs.length; j++) {
        let result = await this.updateTxAddressTable(strHash, addrs[j], timestamp);
        if (result.err) {
          resolv(result);
          return;
        }
      }
      resolv({ err: ErrorCode.RESULT_OK, data: null });
    });
  }
}


