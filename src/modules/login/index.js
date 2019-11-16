/* global process */
/**
 * Author: DrowsyFlesh
 * Create: 2018/12/9
 * Description:
 */
import {Feature} from 'Libs/feature';
//import {__, createTab, hasNewVersion, version, getURL} from 'Utils';

export class Login extends Feature {
    constructor() {
        super({
            name: 'login',
            kind: 'popup',
            permissions: ['login'],
            dependencies: ['popupAnchor'],
            settings: {
                on: true,
                hide: true,
                hasUI: true,
                toggle: false,
            },
        });
    }
}
