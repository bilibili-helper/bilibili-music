/**
 * Author: DrowsyFlesh
 * Create: 2019/12/25
 * Description:
 */
import * as stores from '../stores';

export class StoreManager {
    constructor() {
        Object.keys(stores).forEach((name) => {
            const store = new stores[name]();
            this[store.name] = store;
        });
    }
}
