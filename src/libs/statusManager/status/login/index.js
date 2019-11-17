/**
 * Author: DrowsyFlesh
 * Create: 2019-05-15
 * Description:
 */
import {Status} from '../Status';
import {__} from 'Utils';

export class LoginStatus extends Status {
    error = '';
    description = '';

    constructor() {
        super('login');
    }

    check() {
        return new Promise((resolve) => {
            chrome.cookies.get({
                url: 'http://www.bilibili.com/',
                name: 'bili_jct',
            }, (cookie) => {
                const thisSecond = (new Date()).getTime() / 1000;
                let [pass, msg] = [false, ''];
                // expirationDate 是秒数
                if (cookie && cookie.expirationDate > thisSecond) {
                    [pass, msg] = [true, ''];
                } else {
                    [pass, msg] = [false, __('status_login_error')];
                }
                this.updatePermission('login', pass, msg);
                resolve({pass, msg});
            });
        });
    }

    addListener() {
        // 检测登录登出时cookie变化更新UI状态
        chrome.cookies.onChanged.addListener((changeInfo) => {
            const {/*cause,*/ cookie} = changeInfo;
            const {name, domain} = cookie;
            if (name === 'bili_jct' && domain === '.bilibili.com') {
                this.check(true);
            }
        });
    }
}

