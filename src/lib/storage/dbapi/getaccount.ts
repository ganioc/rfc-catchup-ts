import { WRQueue } from "../queue";
import { IFeedBack, ErrorCode } from "../../../core";

export async function laGetAccount(handle: WRQueue, args: any) {
  return new Promise<IFeedBack>(async (resolv) => {
    // getAllRecords()
    let result = await handle.pStorageDb.queryAllAccountTableByAddress(args);
    if (result.err === ErrorCode.RESULT_OK) {
      let arr = result.data;

      for (let i = 0; i < arr.length; i++) {
        if (arr[i].token === 's') {
          arr[i].token = 'SYS'
          break
        }
      }

      resolv({ err: ErrorCode.RESULT_OK, data: arr });
    } else {
      resolv({ err: ErrorCode.RESULT_SYNC_GETACCOUNT_FAILED, data: [] })
    }
  })
}
