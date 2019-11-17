/* global process */
/**
 * Author: DrowsyFlesh
 * Create: 2018/12/9
 * Description:
 */
import {Feature} from 'Libs/feature';

export class Login extends Feature {
    constructor() {
        super({
            name: 'login',
            kind: 'popup',
            permissions: ['login'],
            dependencies: ['popupAnchor', 'googleAnalytics'],
            settings: {
                on: true,
                hide: true,
                hasUI: true,
                toggle: false,
            },
        });
    }

    permissionHandleLogin = (pass, msg) => {
        this.permissionMap.login = {pass, msg};
    };
}
