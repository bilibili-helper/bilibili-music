/**
 * Author: DrowsyFlesh
 * Create: 2019/11/20
 * Description:
 */
import {Feature} from 'Libs/feature';
import {MediaDetail} from './MediaDetail';

export class MediaViewer extends Feature {
    constructor() {
        super({
            name: 'mediaViewer',
            kind: 'popup',
            dependencies: ['dataManager', 'popupAnchor', 'googleAnalytics'],
            settings: {
                on: true,
                hide: true,
                hasUI: true,
                toggle: false,
            },
        });
    }

    launch = () => {
        window.mediaDetail = new MediaDetail();
    }
}
