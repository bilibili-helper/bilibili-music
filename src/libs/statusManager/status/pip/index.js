/**
 * Author: DrowsyFlesh
 * Create: 2019-05-15
 * Description:
 */
import {Status} from '../Status';
import {__} from 'Utils';

export class PipStatus extends Status {
    error = '';
    description = '';

    constructor() {
        super('pip');
    }

    check() {
        if (this.hasChecked) { return this.currentStatus; }
        this.hasChecked = true;

        return new Promise(resolve => {
            const enabled = !!document.pictureInPictureEnabled;
            const [pass, msg] = enabled ? [true, ''] : [false, __('status_pip_error')];
            this.updatePermission(pass, msg);
            resolve({pass, msg});
        });
    }
}

