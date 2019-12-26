/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {Icon, Image} from 'Components';
import React, {useState, useCallback, useEffect, useRef} from 'react';
import styled, {keyframes} from 'styled-components';
import {SongList} from './SongList';
import {throttle, debounce} from 'lodash';

const EMPTY_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const Wrapper = styled.div.attrs({'id': 'player'})`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 42px;
  z-index: 10;
`;

const PlayerWrapper = styled.div.attrs({
    className: 'player-controller',
})`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 42px;
  box-sizing: border-box;
  box-shadow: rgba(17, 17, 17, 0.7) 0px 10px 30px;
  background-color: #333;
  background-image: linear-gradient(45deg, #333, #111);
  z-index: 1;
`;

const CoverBox = styled.div`
  position: absolute;
  width: 64px;
  height: 64px;
  bottom: 6px;
  left: 6px;
  transform: translate(0, 70px);
  border-radius: 4px;
  background-color: #ddd;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 6px -2px;
  cursor: pointer;
  -webkit-user-drag: none;
  overflow: hidden;
  transition: transform 300ms;
  will-change: transition;
  
  &.show {
    transform: translate(0, 0);
  }
  
  &.expand {
    transform: translate(0, 70px);
  }
`;

const Cover = styled(Image)`
  width: 64px;
  height: 64px;
`;

const StarBtn = styled(Icon).attrs({
    className: 'star-btn',
})`
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 4px;
  border-radius: 4px 0 0 0;
  text-shadow: rgba(255, 255, 255, 0.7) 0px 0px 4px;
  color: rgba(142, 142, 142, 0.5);
  cursor: pointer;
  transition: color 300ms, opacity 300ms;
  
  &.collected {
    color: #ff8300;
  }
  
  &:hover {
    opacity: 0.5;
  }
  
  &[disabled] {
    color: #444;
    cursor: not-allowed;
  }
`;

const PlayerBtn = styled(Icon)`
  position: relative;
  margin: 3px;
  border-radius: 50%;
  color: #999;
  cursor: pointer;
  transition: color 300ms;
  text-shadow: rgba(0, 0, 0, 0.5) 0px 2px 2px;
  
  &:hover {
    color: #666;
  }
  
  &:active, &.active {
    color: #555;
  }
  
  &[disabled] {
    color: #444;
    cursor: not-allowed;
  }
`;

/*const StarBox = styled.div`
  margin-left: auto;
  position: relative;
  width: 30px;
  height: 30px;
  //transform: translate3d(0px, 0px, 0px);
  z-index: 1;
  user-select: none;
`;*/

/*const StarList = styled.div`
  position: absolute;
  bottom: 30px;
  left: calc(-50% + 15px);
  padding: 4px 8px;
  width: 100px;
  border-radius: 4px;
  background: #222;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 2px;
  color: #eee;
  visibility: hidden;

  &.show {
    visibility: visible;
  }

  .star-list-item {
    cursor: pointer;
  }
`;*/

const PlayBtn = styled(PlayerBtn).attrs({
    className: 'play-btn',
})`
  margin: 0;
  padding: 10px 8px 10px 10px;
`;

const PrevBtn = styled(PlayerBtn).attrs({
    className: 'prev-btn',
})`
  margin-right: 0;
  margin-left: auto;
  padding: 8px;
`;

const NextBtn = styled(PlayerBtn).attrs({
    className: 'next-btn',
})`
  margin-left: 0;
  //margin-right: auto;
  padding: 8px;
`;

const VolumeBox = styled.div`
  position: relative;
  width: 30px;
  height: 30px;
  transform: translate3d(0px, 0px, 0px);
`;

const VolumeBar = styled.input.attrs({
    className: 'volume-bar',
})`
  -webkit-appearance: none;
  position: absolute;
  bottom: 25px;
  left: calc(-50% + 20px);
  margin: 0;
  width: 100px;
  height: 20px;
  padding: 0px 1px;
  border-radius: 10px;
  background-color: #212121;
  outline: none;
  user-select: none;
  transform-origin: 10px;
  transform: rotate(-90deg);
  visibility: hidden;
  
  &.show {
    visibility: visible;
  }
  
  &::-webkit-slider-thumb {
    cursor: pointer;
  }
  
  &::-webkit-slider-runnable-track {
    padding: 2px;
    border-radius: 30px; 
    background: #222;
    box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 2px;
  }
`;

const VolumeBtn = styled(PlayerBtn).attrs({
    className: 'volume-btn',
})`
  padding: 4px;
`;

const PlayModeBtn = styled(PlayerBtn).attrs({
    className: 'play-mode-btn',
})`
  padding: 4px;
`;

const ListBtn = styled(PlayerBtn).attrs({
    className: 'list-btn',
})`
  margin-right: 8px;
  padding: 4px;
`;


const getPlayModeStr = (mode) => {
    switch (mode) {
        case 0:
            return 'orderList';
        case 1:
            return 'loopList';
        case 2:
            return 'loopOne';
        case 3:
            return 'random';
    }
};

export const Player = function({song, songList, showSongList, setShowSongList}) {
    const volumeRef = useRef(null);
    const [muted, setMuted] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const [volume, setVolume] = useState(1);
    const [playMode, setPlayMode] = useState(0);

    // 播放/暂停按钮点击事件
    const handleOnClickPlayBtn = useCallback(() => {
        if (!song) return;
        chrome.runtime.sendMessage({command: !!song && song.playing ? 'pause' : 'play', from: 'player'});
    }, [song]);

    // 切到上一首歌
    const handleOnClickPrevBtn = useCallback(() => {
        chrome.runtime.sendMessage({command: 'setPrevSong', from: 'player'});
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '上一首歌',
        });
    }, []);

    // 切到下一首歌
    const handleOnClickNextBtn = useCallback(() => {
        chrome.runtime.sendMessage({command: 'setNextSong', from: 'player'});
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '下一首歌',
        });
    }, []);

    // 展开音量调节按钮
    const handleOnMouseEnterVolumeBox = useCallback(debounce(() => {
        setShowVolume(true);
    }), [showVolume]);

    // 隐藏音量调节按钮
    const handleOnMouseLeaveVolumeBox = useCallback(debounce(() => {
        setShowVolume(false);
    }), [showVolume]);

    // 静音按钮
    const handleOnClickVolumeBtn = useCallback(() => {
        setShowVolume(false);
        chrome.runtime.sendMessage({
            command: 'setMeted',
            from: 'player',
        }, setMuted);
    }, [showVolume]);

    // 音量调节
    const handleOnVolumeChange = useCallback(throttle(() => {
        chrome.runtime.sendMessage({
            command: 'setVolume',
            from: 'player',
            volume: volumeRef.current.value,
        });
    }, 100), [showVolume]);

    // 播放模式切换按钮
    const handleOnClickPlayModeBtn = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '切换播放模式',
        });
        chrome.runtime.sendMessage({command: 'switchPlayMode', from: 'player'}, (playMode) => {
            setPlayMode(playMode);
        });
    }, [playMode]);

    // 展开播放列表
    const handleOnClickSongListBtn = useCallback(() => {
        setShowSongList(!showSongList);
        chrome.runtime.sendMessage({command: 'hideViewer', from: 'player'});
    }, [showSongList]);

    useEffect(() => {
        document.addEventListener('click', function(e) {
            const targetClassList = e.target.classList;
            if (!targetClassList.contains('volume-bar') && !targetClassList.contains('bilibili-music-icon-volume')) {
                setShowVolume(false);
            }
        });
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command = '', from = ''} = message;
            if (from !== 'playerBackground') return true;

            if (command === 'volumechange') {
                setVolume(message.volume);
            }
            sendResponse();
            return true;
        });
        // 初始化音量
        chrome.runtime.sendMessage({command: 'getConfig', from: 'player'}, (config) => {
            volumeRef.current.value = config.volume;
            setPlayMode(config.playMode);
        });
    }, []);

    return (
        <Wrapper>
            <PlayerWrapper>
                <PrevBtn
                    size={14}
                    icon="prev"
                    disabled={songList.length <= 1}
                    onClick={handleOnClickPrevBtn}
                />
                <PlayBtn
                    size={30}
                    icon={song && song.playing ? 'pause' : 'play'}
                    disabled={songList.length === 0}
                    onClick={handleOnClickPlayBtn}
                />
                <NextBtn
                    size={14}
                    icon="next"
                    disabled={songList.length <= 1}
                    onClick={handleOnClickNextBtn}
                />
                <VolumeBox>
                    <VolumeBtn
                        icon={muted ? 'volume-muted' : 'volume'}
                        className={showVolume ? 'active' : null}
                        onMouseEnter={handleOnMouseEnterVolumeBox}
                        onMouseLeave={handleOnMouseLeaveVolumeBox}
                        onClick={handleOnClickVolumeBtn}
                    />
                    <VolumeBar
                        ref={volumeRef}
                        className={showVolume ? 'show' : null}
                        type="range"
                        max={1}
                        min={0}
                        step={0.001}
                        defaultValue={volume}
                        onChange={handleOnVolumeChange}
                        onMouseEnter={handleOnMouseEnterVolumeBox}
                        onMouseLeave={handleOnMouseLeaveVolumeBox}
                    />
                </VolumeBox>
                <PlayModeBtn icon={getPlayModeStr(playMode)} onClick={handleOnClickPlayModeBtn}/>
                <ListBtn icon="list" size={16} onClick={handleOnClickSongListBtn}/>
            </PlayerWrapper>
        </Wrapper>
    );
};
