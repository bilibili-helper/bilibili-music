/* global process */
/**
 * Author: DrowsyFlesh
 * Create: 2018/12/9
 * Description:
 */
import {Feature} from 'Libs/feature';
import {DataManager as Manager} from './DataManager';

//import {__, createTab, hasNewVersion, version, getURL} from 'Utils';

export class DataManager extends Feature {
    constructor() {
        super({
            name: 'dataManager',
            kind: 'other',
            settings: {
                on: true,
                hide: true,
                toggle: false,
            },
        });

        this.tempData = {};
        this.cache = {}; // 缓存30分钟

        this.current = null;

        this.locked = false;
        this.lockCommand = null;
    }


    launch = async () => {
        window.dataManager = new Manager();
    };
}
