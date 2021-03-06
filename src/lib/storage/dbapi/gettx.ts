import { IFeedBack, ErrorCode } from "../../../core";
import { WRQueue } from "../queue";


/**
 * Get TX info
 * @param handle 
 * @param {string} args - address
 */
export async function laGetTx(handle: WRQueue, args: any) {
  return new Promise<IFeedBack>(async (resolv) => {

    // getRecord
    let result = await handle.pStorageDb.queryTxTable(args);
    if (result.err === ErrorCode.RESULT_OK) {
      try {
        result.data.content = JSON.parse(result.data.content.toString())
      } catch (e) {
        handle.logger.info('Wrong getTx result parsing')
        resolv({ err: ErrorCode.RESULT_SYNC_GETTX_FAILED, data: {} })
        return;
      }
      resolv(result);

    } else {
      resolv({ err: ErrorCode.RESULT_SYNC_GETTX_FAILED, data: {} })
    }
  })
}
