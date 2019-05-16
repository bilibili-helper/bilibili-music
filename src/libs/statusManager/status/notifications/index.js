/**
 * Author: DrowsyFlesh
 * Create: 2019-05-15
 * Description:
 */
import {Status} from '../Status';
import {__} from 'Utils';

export class NotificationsStatus extends Status {
    error = '';
    description = '';

    constructor() {
        super('notification');
    }

    check() {
        if (this.hasChecked) { return this.currentStatus; }
        this.hasChecked = true;

        return new Promise(resolve => {
            chrome.permissions.contains({permissions: ['notifications']}, (res) => {
                const [pass, msg] = res ? [true, ''] : [false, __('status_notifications_error')];
                this.updatePermission(pass, msg);
                resolve({pass, msg});
            });
        });
    }

    addListener() {
        // ff 下不兼容
        chrome.permissions.onAdded && chrome.permissions.onAdded.addListener((permissions) => {
            permissions.map((permissionName) => {
                switch (permissionName) {
                    case 'notifications':
                        this.check();
                        break;
                }
            });
        });
    }
}

