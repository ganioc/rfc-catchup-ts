import { IFeedBack, ErrorCode } from "../../../core";
import { WRQueue } from "../queue";

/**
 * Get BancorToken parameters, Factor, Supply, Reserve, latest value
 * @param handle 
 * @param {string[]} args 
 */
export async function laGetBancorTokenParams(handle: WRQueue, args: any) {
  return new Promise<IFeedBack>(async (resolv) => {
    // compute token price 
    // Price = R/SF
    // or SF/R, supply.F/reserve, 
    let F: number;
    let S: number;
    let R: number;

    let token: string = args.toUpperCase();

    let result = await handle.pStorageDb.queryBancorTokenTable(token);

    if (result.err) {
      resolv({ err: ErrorCode.RESULT_DB_RECORD_EMPTY, data: null });
      return;
    } else {
      F = result.data.factor;
      S = result.data.supply;
      R = result.data.reserve;
      // result.data.price = S * F / R;
    }
    resolv({
      err: ErrorCode.RESULT_OK, data: {
        F: F,
        S: S,
        R: R
      }
    })
  })
}
