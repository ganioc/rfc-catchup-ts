import { CUDataBase, IfCUDataBaseOptions } from './cudatabase';
import winston = require('winston');
import { ErrorCode, IFeedBack } from '../../core/error_code';

export const HASH_TYPE = {
  ADDRESS: 'addr',
  TOKEN: 'token',
  TX: 'tx',
  BLOCK: 'block',
  HEIGHT: 'height',
  NONE: 'none'
};
export const SYS_TOKEN = 's';


export class StorageDataBase extends CUDataBase {
  private hashTable: string;
  private accountTable: string;
  private blockTable: string;
  private txTable: string;
  private tokenTable: string;

  private hashTableSchema: string;
  private accountTableSchema: string;
  private blockTableSchema: string;
  private txTableSchema: string;
  private tokenTableSchema: string;

  constructor(logger: winston.LoggerInstance, options: IfCUDataBaseOptions) {
    super(logger, options);
    this.hashTable = 'hashtable';
    this.accountTable = 'accounttable';
    this.blockTable = 'blocktable';
    this.txTable = 'txtable';
    this.tokenTable = 'tokentable';

    this.hashTableSchema = `("hash" CHAR(64) PRIMARY KEY NOT NULL UNIQUE, "type" CHAR(64) NOT NULL, "verified" TINYINT NOT NULL);`;
    // hash-tokenname, value for search purpose!
    this.accountTableSchema = `("hash" CHAR(64) NOT NULL, "token" CHAR(64) NOT NULL, "amount" TEXT NOT NULL, "value" INTEGER NOT NULL, PRIMARY KEY("hash", "token"));`;

    this.blockTableSchema = `("hash" CHAR(64) PRIMARY KEY NOT NULL UNIQUE, "txs" INTEGER NOT NULL, "address" CHAR(64) NOT NULL, "timestamp" INTEGER NOT NULL);`;

    this.txTableSchema = `("hash" CHAR(64) PRIMARY KEY NOT NULL UNIQUE, "blockhash" CHAR(64) NOT NULL, "address" CHAR(64) NOT NULL, "timestamp" INTEGER NOT NULL, "fee" CHAR(64) NOT NULL);`;
    this.tokenTableSchema = `("name" CHAR(64) PRIMARY KEY NOT NULL UNIQUE, "type" CHAR(64) NOT NULL, "address" CHAR(64) NOT NULL, "timestamp" INTEGER NOT NULL);`;
  }

  public init(): Promise<IFeedBack> {
    return new Promise<IFeedBack>(async (resolv) => {
      let result = await this.createTable(this.hashTable, this.hashTableSchema);
      await this.createTable(this.accountTable, this.accountTableSchema);
      await this.createTable(this.blockTable, this.blockTableSchema);
      await this.createTable(this.txTable, this.txTableSchema);
      result = await this.createTable(this.tokenTable, this.tokenTableSchema);
      this.logger.info('Create storage tables:', result);
      resolv({ err: 0, data: null });
    });
  }

  // access functions
  // hash table, use regex to get hash value ,default is 5 result
  public queryHashTable(s: string, num: number) {
    return this.getAllRecords(`SELECT * FROM ${this.hashTable} WHERE hash LIKE "${s}%" LIMIT ${num};`);
  }
  public queryHashTableFullName(s: string, num: number) {
    return this.getAllRecords(`SELECT * FROM ${this.hashTable} WHERE hash LIKE "${s}" LIMIT ${num};`);
  }

  public insertOrReplaceHashTable(hash: string, type: string) {
    this.logger.info('into insertOrReplaceToHashTable()', hash, '\n')
    return this.insertOrReplaceRecord(`INSERT OR REPLACE INTO ${this.hashTable} (hash, type, verified) VALUES("${hash}", "${type}", 0);`);
  }
  public insertHashTable(hash: string, type: string): Promise<IFeedBack> {
    this.logger.info('into insertHashTable()', hash, '\n')
    return this.insertRecord(`INSERT INTO ${this.hashTable} (hash, type, verified) VALUES("${hash}", "${type}", 0);`);
  }
  public getHashTable(s: string) {
    return this.getRecord(`SELECT * FROM ${this.hashTable} WHERE hash = "${s}";`);
  }

  // public saveToHashTable(hash: string, type: string) {
  //   this.logger.info('into saveToHashTable()', hash, '\n')
  //   return new Promise<IFeedBack>(async (resolv) => {
  //     let feedback = await this.getHashTable(hash);
  //     if (feedback.err) {
  //       // insert
  //       feedback = await this.insertHashTable(hash, HASH_TYPE.BLOCK);
  //     } else {
  //       feedback = await this.insertOrReplaceHashTable(hash, HASH_TYPE.BLOCK);
  //     }

  //     this.logger.info('after insertion ', feedback);

  //     if (feedback.err) {
  //       resolv({ err: feedback.err, data: null })
  //     } else {
  //       resolv({ err: ErrorCode.RESULT_OK, data: null })
  //     }
  //   });
  // }

  public saveTxToHashTable(txs: any[]) {
    return new Promise<IFeedBack>(async (resolv) => {
      for (let j = 0; j < txs.length; j++) {
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
        await this.updateNameToHashTable(names[j], type);
      }
      resolv({ err: ErrorCode.RESULT_OK, data: null });
    });
  }
  public async updateNameToHashTable(name: string, type: string) {
    return new Promise<IFeedBack>(async (resolv) => {
      let feedback = await this.getHashTable(name);
      if (feedback.err) {
        // insert
        feedback = await this.insertHashTable(name, HASH_TYPE.BLOCK);
      } else {
        feedback = await this.insertOrReplaceHashTable(name, HASH_TYPE.BLOCK);
      }
    });
  }

  // account
  public queryAccountTableByAddress(num: number) {

  }
  public queryAccountTableByToken(num: number) {

  }
  public queryAccountTableByTokenAndAddress(token: string, addr: string) {

  }
  public insertAccountTable(hash: string, token: string, amount: number, value: number): Promise<IFeedBack> {
    return this.insertRecord(`INSERT INTO ${this.accountTable} (hash, token, amount, value) VALUES("${hash}", "${token}", ${amount}, ${value})`);
  }
  public updateAccountTable() {

  }
  // block table
  public queryBlockTable(num: number) {

  }
  public insertOrReplaceBlockTable(hash: string, txno: number, address: string, datetime: number) {
    this.logger.info('into insertOrReplaceBlockTable()', hash, '\n')
    return this.insertOrReplaceRecord(`INSERT OR REPLACE INTO ${this.blockTable} (hash, txs, address,timestamp) VALUES("${hash}", ${txno}, "${address}", ${datetime});`);
  }

  // tx table
  public queryTxTable(num: number, time: number) {

  }
  public insertTxTable(hash: string, blockhash: string, address: string, datetime: number, fee: string) {
    this.logger.info('insertOrREplaceTxTable', hash, '\n');
    return this.insertOrReplaceRecord(`INSERT OR REPLACE INTO ${this.txTable} (hash, blockhash, address,timestamp, fee) VALUES("${hash}", "${blockhash}", "${address}", ${datetime},"${fee}");`);
  }

  public queryTokenTable(num: number) {

  }
  public insertTokenTable() {

  }
}
