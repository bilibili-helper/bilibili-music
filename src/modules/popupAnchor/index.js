/**
 * Author: DrowsyFlesh
 * Create: 2018/11/7
 * Description:
 */

import {Feature} from 'Libs/feature';

export class PopupAnchor extends Feature {
    constructor() {
        super({
            name: 'popupAnchor',
            kind: 'popup',
            settings: {
                on: true,
                hide: true,
                hasUI: true,
            },
        });
    }
}
