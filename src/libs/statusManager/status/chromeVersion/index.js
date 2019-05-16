/**
 * Author: DrowsyFlesh
 * Create: 2019-05-15
 * Description:
 */
import {Status} from '../Status';
import {__, isBiggerThan} from 'Utils';

export class ChromeVersionStatus extends Status {
    error = '';
    description = '';

    constructor() {
        super('chromeVersion');
    }


    check(paramsStr) {
        if (this.hasChecked) { return this.currentStatus; }
        this.hasChecked = true;

        const params = {};
        // eg: checkChromeVersion?version=73&operation=smaller
        paramsStr && paramsStr.split('&').map((queryStr) => {
            const queryMap = queryStr.split('=');
            if (queryMap) { params[queryMap[0]] = queryMap[1]; }
        });
        const {version, operation} = params;
        return new Promise(resolve => {
            const Regexp = new RegExp(/Chrome\/([\d|\\.]+)/g);
            const checkChrome = Regexp.exec(navigator.appVersion);
            let [pass, msg] = [true, ''];
            if (checkChrome) {
                switch (operation) {
                    case 'bigger':
                        if (isBiggerThan(checkChrome[1], version) < 0) {
                            [pass, msg] = [false, __('status_chrome_version_bigger_error',[version])];
                        }
                        break;
                    case 'smaller':
                        if (isBiggerThan(checkChrome[1], version) > 0) {
                            [pass, msg] = [false, __('status_chrome_version_small_error', [version])];
                        }
                        break;
                    default:
                        break;
                }
            } else {
                [pass, msg] = [false, __('status_chrome_version_none_webkit')];
            }
            this.updatePermission(pass, msg);
            resolve({pass, msg, type: operation});
        });
    }
}
