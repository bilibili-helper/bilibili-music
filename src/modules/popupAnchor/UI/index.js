/**
 * Author: DrowsyFlesh
 * Create: 2018/11/7
 * Description:
 */
import React from 'react';
import ReactDOM from 'react-dom';
import styled, {createGlobalStyle} from 'styled-components';
import {UI} from 'Libs/UI';

const UIBuilder = () => {
    const Main = styled.div.attrs({id: 'popup'})`
      position: relative;
      display: flex;
      flex-direction: row-reverse;
      margin: auto;
      width: 320px;
      height: 500px;
      background-color: #fff;
      overflow: hidden;
    `;

    const GlobalStyle = createGlobalStyle`
      html {
        background-color: #111;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif;
      }
    `;
    return {Main, GlobalStyle};
};

export class PopupAnchorUI extends UI {
    constructor() {
        super({
            name: 'popup',
        });
    }

    load = () => {
        return new Promise(resolve => {
            const {Main, GlobalStyle} = UIBuilder();
            ReactDOM.render(
                <Main>
                    <GlobalStyle/>
                </Main>,
                document.getElementById('root'),
                () => resolve(document.querySelector('#popup')),
            );
        });
    };
}

