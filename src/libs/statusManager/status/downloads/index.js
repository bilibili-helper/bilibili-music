/**
 * Author: DrowsyFlesh
 * Create: 2019-05-15
 * Description:
 */
import {Status} from '../Status';
import {__} from 'Utils';

export class DownloadsStatus extends Status {
    error = '';
    description = '';

    constructor() {
        super('downloads');
    }

    check() {
        if (this.hasChecked) { return this.currentStatus; }
        this.hasChecked = true;

        return new Promise(resolve => {
            chrome.permissions.contains({permissions: ['downloads']}, (res) => {
                const [pass, msg] = res ? [true, ''] : [false, __('status_downloads_error')];
                this.updatePermission('downloads', pass, msg);
                resolve({pass, msg});
            });
        });
    }

    addListener() {
        // ff 下不兼容
        chrome.permissions.onAdded && chrome.permissions.onAdded.addListener((permissions) => {
            permissions.map((permissionName) => {
                switch (permissionName) {
                    case 'downloads':
                        this.check();
                        break;
                }
            });
        });
    }
}

