/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {Icon} from 'Components/Icon';
import React, {useState, useCallback, useEffect} from 'react';
import styled from 'styled-components';

const Wrapper = styled.div.attrs({'id': 'player'})`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 42px;
  box-sizing: border-box;
  border-radius: 8px 8px 0 0;
  background-color: #eee;
  z-index: 10;
`;

const Cover = styled.img`
  width: 64px;
  height: 64px;
  margin-right: auto;
  margin-bottom: 22px;
  border-radius: 4px;
`;

const PlayerBtn = styled(Icon)`
  position: relative;
  margin: 3px;
  border-radius: 50%;
  color: #999;
  cursor: pointer;
  transition: color 300ms;
  &:hover {
    color: #333;
  }
  &:active {
    color: #111;
  }
  
  &[disabled] {
    color: #ccc;
    cursor: not-allowed;
  }
`;

const StarBtn = styled(PlayerBtn).attrs({
    className: 'star-btn',
})`
  margin-left: auto;
  padding: 8px;
`;

const PlayBtn = styled(PlayerBtn).attrs({
    className: 'play-btn',
})`
  margin: 8px 8px 30px 8px;
  padding: 14px;
  text-indent: 1px;
  //border: 10px solid #eee;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0px 2px 3px rgba(153, 153, 153, 0.4);
`;

const PrevBtn = styled(PlayerBtn).attrs({
    className: 'prev-btn',
})`
  margin-right: 0;
  padding: 8px;
`;

const NextBtn = styled(PlayerBtn).attrs({
    className: 'next-btn',
})`
  margin-left: 0;
  padding: 8px;
`;

const ListBtn = styled(PlayerBtn).attrs({
    className: 'list-btn',
})`
  padding: 8px;
`;

export const Player = function() {
    const [playing, setPlaying] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [song, setSong] = useState(null);

    // 播放/暂停按钮点击事件
    const handleOnClickPlayBtn = useCallback(() => {
        if (disabled) return;
        chrome.runtime.sendMessage({command: playing ? 'pause' : 'play', from: 'player'});
    }, [playing, disabled]);

    useEffect(() => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            //console.info(message);
            const {command = '', from = ''} = message;
            //if (from !== 'playerBackground') return true;

            if (command === 'pause' || command === 'ended') { // 暂停或播放结束
                setDisabled(false);
                setPlaying(false);
            } else if (command === 'play') {
                setDisabled(false);
                setPlaying(true);
            } else if (command === 'loadstart') {
                const {song = null} = message;
                setSong(song);
            }
            sendResponse();
            return true;
        });
        chrome.runtime.sendMessage({command: 'getPlayerState'}, (state) => {
            console.info(state);
            if (state === 'disable' || state === 'empty') {
                setDisabled(true);
                setPlaying(false);
            } else if (state === 'paused') {
                setDisabled(false);
                setPlaying(false);
            } else {
                setDisabled(false);
                setPlaying(true);
            }
        });

        // 初始化歌曲
        chrome.runtime.sendMessage({command: 'getCurrentSong'}, (song) => {
            setSong(song);
        });
    }, []);
    return (
        <Wrapper>
            <Cover src={song ? song.cover : null}/>
            <PrevBtn icon="prev" size={14}/>
            <PlayBtn disabled={disabled} icon={playing ? 'pause' : 'play'} onClick={handleOnClickPlayBtn}/>
            <NextBtn disabled={disabled} icon="next" size={14}/>
            <StarBtn icon="star"/>
            <ListBtn icon="list" size={20}/>
        </Wrapper>
    );
};
