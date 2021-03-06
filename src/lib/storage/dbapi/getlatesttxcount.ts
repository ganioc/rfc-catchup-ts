import { IFeedBack, ErrorCode } from "../../../core";
import { WRQueue } from "../queue";


/**
 * Get tx, transactions from a time span
 * @param handle 
 * @param {{from:string, to:string}} args  - time span
 */
export async function laGetLatestTxCount(handle: WRQueue, args: any) {
  return new Promise<IFeedBack>(async (resolv) => {
    handle.logger.info('taskGetLatestTxCount');
    let obj: any;
    try {
      obj = JSON.parse(JSON.stringify(args));
      let nFrom = new Date(obj.from).getTime();
      let nTo = new Date(obj.to).getTime();

      let nTxCount = 0;

      let result2 = await handle.pStorageDb.queryTxTableByDatetime(nFrom, nTo);
      console.log('getLatestTxCount -> ', result2)
      if (result2.err === ErrorCode.RESULT_OK) {

        // nTxCount = parseInt(result2.data.count)
        nTxCount = result2.data.count;

        resolv({
          err: ErrorCode.RESULT_OK,
          data: nTxCount
        });
        return;
      }
    } catch (e) {
      handle.logger.error('taskGetLatestTxCount input JSON parse fail');
    }
    handle.logger.info('taskGetLatestTxCount failed')
    resolv({ err: ErrorCode.RESULT_SYNC_PARSE_JSON_QUERY_FAILED, data: null })


  })
}
