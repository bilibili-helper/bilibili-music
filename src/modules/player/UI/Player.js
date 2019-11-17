/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {Icon} from 'Components/Icon';
import React, {useState, useCallback, useEffect, useRef} from 'react';
import styled from 'styled-components';

const EMPTY_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const Wrapper = styled.div.attrs({'id': 'player'})`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 42px;
  z-index: 10;
`;

const PlayerWrapper = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 42px;
  box-sizing: border-box;
  box-shadow: rgba(17, 17, 17, 0.7) 0px 10px 50px;
  background-color: #333;
  background-image: linear-gradient(45deg, #333, #111);
  z-index: 1;
`;

const Cover = styled.img`
  width: 64px;
  height: 64px;
  margin: 0px auto -110px 6px;
  border-radius: 4px;
  background-color: #ddd;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 6px -2px;
  opacity: 0;
  cursor: pointer;
  transition: opacity 300ms, margin 300ms;
  
  &.show {
    opacity: 1;
    margin-bottom: 36px;
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
  
  &:active {
    color: #555;
  }
  
  &[disabled] {
    color: #444;
    cursor: not-allowed;
  }
`;

const VolumeBtn = styled(PlayerBtn).attrs({
    className: 'volume-btn',
})`
  //margin-left: auto;
  padding: 8px;
`;

const PlayBtn = styled(PlayerBtn).attrs({
    className: 'play-btn',
})`
  margin: 0 6px;
  padding: 10px;
`;

const PrevBtn = styled(PlayerBtn).attrs({
    className: 'prev-btn',
})`
  margin-left: auto;
  margin-right: 0;
  padding: 8px;
`;

const NextBtn = styled(PlayerBtn).attrs({
    className: 'next-btn',
})`
  margin-left: 0;
  //margin-right: auto;
  padding: 8px;
`;

const PlayModeBtn = styled(PlayerBtn).attrs({
    className: 'play-mode-btn',
})`
`;

const ListBtn = styled(PlayerBtn).attrs({
    className: 'list-btn',
})`
  //margin-left: auto;
  margin-top: 0;
  padding: 8px;
`;

const SongListWrapper = styled.div.attrs({
    className: 'song-list',
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
  z-index: -1;
  
  @supports (backdrop-filter: blur(30px)) {
    backdrop-filter: blur(30px);
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  
  &.show {
    transform: translate(0px, 0px);
  }
  
  header {
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

const SongList = styled.div`
  position: absolute;
  top: 60px;
  right: 0px;
  bottom: 87px;
  left: 0px;
  overflow: auto;
  transition: bottom 300ms;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  &.noCover {
    bottom: 42px;
  }
  
  .song-list-item {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 8px 16px;
    white-space: nowrap;
    text-overflow: ellipsis;
    word-break: keep-all;
    cursor: pointer;
    overflow: hidden;
    transition: background-color 300ms, color 300ms;
    
    &.playing {
      color: #FF7AA5;
    }
    
    &.current {
      background-color: rgba(255, 255, 255, 0.8);
    }
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.5);
      .action-btn {
        opacity: 1;
      }
    }
    
    &:active {
      background-color: rgba(255, 255, 255, 0.75);
    }
    
    .index {
      display: inline-block;
      width: 12px;
      margin-right: 4px;
    }
    
    .title {
      margin-right: auto;
      width: 250px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
`;

const EmptySongList = styled.div`
  margin-top: 32px;
  font-size: 14px;
  text-align: center;
  color: #666;
  user-select: none;
`;

const ActionBtn = styled(Icon)`
  padding: 6px;
  border-radius: 4px;
  color: #999;
  opacity: 0;
  cursor: pointer;
  //background-color: whitesmoke;
  transition: background-color 300ms;
  
  &:hover {
    //background-color: #fff;
  }
  
  &:active {
    //background-color: #ececec;
  }
`;

const SongListPlayBtn = styled(ActionBtn).attrs({
    className: 'action-btn song-list-play-btn',
})`
  margin: 4px;
  position: absolute;
  top: 0px;
  right: 4px;
  transform: scale(0.75);
`;

const SongListReduceBtn = styled(ActionBtn).attrs({
    className: 'action-btn song-list-reduce-btn',
})`
  margin: 4px;
  position: absolute;
  top: 0px;
  right: 30px;
  transform: scale(0.75);
`;

const VolumeBox = styled.div`
  position: relative;
`;

const VolumeBar = styled.input.attrs({
    className: 'volume-bar',
})`
  position: absolute;
  bottom: 34px;
  left: calc(-50% + 25px);
  width: 20px;
  height: 100px;
  transform: translate(0px, 140px);
  -webkit-appearance: slider-vertical;
  opacity: 0;
  user-select: none;
  transition: opacity 200ms, transform 200ms;
  
  &.show {
    opacity: 1;
    transform: translate(0px, 0px);
  }
  
  &::-webkit-slider-thumb {
    background-color: #222;
    border: none;
    cursor: pointer;
  }
  
  &::-webkit-slider-container {
    background-color: transparent;
  }
  
  &::-webkit-slider-runnable-track {
    padding: 2px;
    border-radius: 30px; 
    background: #222;
    box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 2px;;
    //height:15px;
  }
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

export const Player = function() {
    const volumeRef = useRef(null);
    const [disabled, setDisabled] = useState(true);
    const [song, setSong] = useState(null);
    const [songList, setSongList] = useState([]);
    const [showSongList, setShowSongList] = useState(false);

    const [showVolume, setShowVolume] = useState(false);
    const [volume, setVolume] = useState(1);
    const [playMode, setPlayMode] = useState(0);

    // 播放/暂停按钮点击事件
    const handleOnClickPlayBtn = useCallback(() => {
        if (disabled) return;
        chrome.runtime.sendMessage({command: !!song && song.playing ? 'pause' : 'play', from: 'player'});
    }, [disabled, song]);

    // 切到上一首歌
    const handleOnClickPrevBtn = useCallback(() => {
        chrome.runtime.sendMessage({command: 'setPrevSong', from: 'player'});
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '上一首歌',
        });
    }, [song]);

    // 切到下一首歌
    const handleOnClickNextBtn = useCallback(() => {
        chrome.runtime.sendMessage({command: 'setNextSong', from: 'player'});
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '下一首歌',
        });
    }, [song, songList]);

    // 展开音量调节按钮
    const handleOnClickVolumeBtn = useCallback(() => {
        setShowVolume(!showVolume);
        !showVolume && chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '调节音量',
        });
    }, [showVolume]);

    // 展开音量调节按钮
    const handleOnMouseUpVolumeBtn = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setVolume',
            from: 'player',
            volume: volumeRef.current.value,
        });
    }, [showVolume]);

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
    }, [showSongList]);

    const handleOnClickClearSongList = useCallback(() => {
        chrome.runtime.sendMessage({command: 'clearSongList', from: 'songList'});
    });

    // 关闭播放列表
    const handleOnClickCloseBtn = useCallback(() => {
        setShowSongList(false);
    }, [showSongList]);

    // 歌单歌曲播放事件
    const handleOnClickPlaySong = useCallback((s) => {
        chrome.runtime.sendMessage({command: 'setSong', from: 'songList', song: s});
    }, []);

    // 当前歌曲封面被点击
    const handleOnClickCover = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '封面',
            label: song.id,
        });
    }, [song]);

    // 删除媒体事件
    const handleOnClickReduceSong = useCallback((song) => {
        chrome.runtime.sendMessage({command: 'reduceSong', from: 'songList', song}, (songList) => {
            setSongList(songList);
        });
    }, [songList]);

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

            if (command === 'ended') {
                setDisabled(false);
            } else if (command === 'pause') { // 暂停或播放结束
                setDisabled(false);
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'play') {
                setDisabled(false);
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'loadstart') {
                setSong(message.song);
            } else if ((command === 'addSongSuccessfully' || command === 'reduceSongSuccessfully' || command === 'clearSongListSuccessfully') && message.songList) {
                setDisabled(!message.song);
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'volumechange') {
                setVolume(message.volume);
            }
            sendResponse();
            return true;
        });
        chrome.runtime.sendMessage({command: 'getPlayerState', from: 'player'}, (state) => {
            if (state === 'disable' || state === 'empty') {
                setDisabled(true);
            } else if (state === 'paused') {
                setDisabled(false);
            } else {
                setDisabled(false);
            }
        });
        chrome.runtime.sendMessage({command: 'getSongList', from: 'player'}, ({songList}) => {
            setSongList(songList);
        });
        // 初始化歌曲
        chrome.runtime.sendMessage({command: 'getCurrentSong', from: 'player'}, (song) => {
            setSong(song);
        });
        // 初始化音量
        chrome.runtime.sendMessage({command: 'getVolume', from: 'player'}, (volume) => {
            volumeRef.current.value = volume;
        });
        // 初始化播放模式
        chrome.runtime.sendMessage({command: 'getPlayMode', from: 'player'}, (playMode) => {
            setPlayMode(playMode);
        });
    }, []);

    return (
        <Wrapper>
            <SongListWrapper className={[showSongList ? 'show' : '']}>
                <CloseBtn icon="close" onClick={handleOnClickCloseBtn}/>
                <header>
                    播放列表
                    <button
                        className="clear-all-btn"
                        disabled={songList.length === 0}
                        onClick={handleOnClickClearSongList}
                    >清空列表</button>
                </header>
                <SongList className={[song && song.cover ? '' : 'noCover']}>
                    {songList.length > 0 && songList.map((s, index) => {
                        return (
                            <div
                                key={s.id}
                                className={[
                                    'song-list-item',
                                    s.playing ? 'playing' : '',
                                    s.current ? 'current' : '',
                                ].join(' ')}
                            >
                                <span className="index">{s.playing ? <Icon icon="playing" size={12}/> : `${index + 1}.`}</span>
                                <span className="title">{s.title}</span>

                                <SongListReduceBtn
                                    size={12}
                                    icon={'reduce'}
                                    onClick={() => handleOnClickReduceSong(s)}
                                />
                                <SongListPlayBtn
                                    size={12}
                                    icon={s.playing ? 'pause' : 'play'}
                                    onClick={() => handleOnClickPlaySong(s)}
                                />
                            </div>
                        );
                    })}
                    {songList.length === 0 && (
                        <EmptySongList>没有可播放的媒体</EmptySongList>
                    )}
                </SongList>
            </SongListWrapper>
            <PlayerWrapper>
                <a
                    href={song ? `https://www.bilibili.com/audio/au${song.id}` : null}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleOnClickCover}
                >
                    <Cover className={song && song.cover ? 'show' : ''} src={song ? song.cover : EMPTY_IMAGE_SRC}/>
                </a>
                <PrevBtn disabled={disabled || songList.length <= 1} icon="prev" size={14} onClick={handleOnClickPrevBtn}/>
                <PlayBtn disabled={songList.length === 0} size={30} icon={song && song.playing ? 'pause' : 'play'} onClick={handleOnClickPlayBtn}/>
                <NextBtn disabled={disabled || songList.length <= 1} icon="next" size={14} onClick={handleOnClickNextBtn}/>
                <VolumeBox>
                    <VolumeBtn disabled={disabled || songList.length === 0} icon="volume" onClick={handleOnClickVolumeBtn}/>
                    <VolumeBar
                        ref={volumeRef}
                        className={showVolume ? 'show' : ''}
                        type="range"
                        max={1}
                        min={0}
                        step={0.001}
                        defaultValue={volume}
                        onMouseUp={handleOnMouseUpVolumeBtn}
                    />
                </VolumeBox>
                <PlayModeBtn
                    disabled={disabled || songList.length === 0}
                    icon={getPlayModeStr(playMode)}
                    onClick={handleOnClickPlayModeBtn}
                />
                <ListBtn icon="list" size={20} onClick={handleOnClickSongListBtn}/>
            </PlayerWrapper>
        </Wrapper>
    );
};
