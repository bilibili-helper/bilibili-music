/* global process */
/**
 * Author: DrowsyFlesh
 * Create: 2018/12/9
 * Description:
 */
import {Feature} from 'Libs/feature';
//import {__, createTab, hasNewVersion, version, getURL} from 'Utils';

export class Home extends Feature {
    constructor() {
        super({
            name: 'home',
            kind: 'popup',
            dependencies: ['popupAnchor', 'googleAnalytics'],
            settings: {
                on: true,
                hide: true,
                hasUI: true,
                toggle: false,
            },
        });
    }
}
