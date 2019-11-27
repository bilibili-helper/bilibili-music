/**
 * Author: DrowsyFlesh
 * Create: 2019/11/27
 * Description:
 */
export const getCSRF = () => {
    return new Promise((resolve, reject) => {
        chrome.cookies.get({
            url: 'http://interface.bilibili.com/',
            name: 'bili_jct',
        }, (cookie) => {
            const thisSecond = (new Date()).getTime() / 1000;
            // expirationDate 是秒数
            if (cookie && cookie.expirationDate > thisSecond) {
                resolve(cookie.value);
            } else {
                reject();
            }
        });
    });
};
