/**
 * Author: DrowsyFlesh
 * Create: 2019/11/20
 * Description:
 */
import {Icon} from 'Components/Icon';
import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

const Wrapper = styled.div.attrs({
    className: 'song-viewer',
})`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 16px 16px 87px 16px;
  height: 500px;
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.85);
  
  transform: translate(0px, 500px);
  transition: transform 300ms;
  will-change: transform, backdrop-filter;
  
  @supports (backdrop-filter: blur(30px)) {
    backdrop-filter: blur(30px);
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  &.show {
    transform: translate(0px, 0px);
  }
  
  header {
    display: flex;
    align-items: center;
    margin-top: -2px;
    line-height: 24px;
    font-size: 24px;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.75);
    user-select: none;
    
    .clear-all-btn {
      vertical-align: top;
      margin-left: 16px;
      padding: 2px 8px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      background-color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      opacity: 1;
      outline: none;
      transition: opacity 300ms;
    
      &:hover {
        opacity: 0.75;
      }
      
      &:active {
        opacity: 0.5;
      }
      
      &[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }
    }
  }
`;

const CloseBtn = styled(Icon)`
  position: absolute;
  right: 0;
  margin: -8px 8px 8px;
  padding: 4px;
  color: #fff;
  text-shadow: rgba(51, 51, 51, 0.5) 0px 0px 3px;
  cursor: pointer;
`;

const Cover = styled.img`

`

export const SongViewer = function() {
    const [song, setSong] = useState(null);

    useEffect(() => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command = '', from = ''} = message;
            if (from !== 'playerBackground') return true;

            if (command === 'setSongViewSuccessfully' && message.song) { // 暂停或播放结束
                console.info(message.song);
                setSong(message.song);
            }
            sendResponse();
            return true;
        });
    }, []);

    return (
        <Wrapper>
            <CloseBtn icon="close"/>

        </Wrapper>
    );
};
