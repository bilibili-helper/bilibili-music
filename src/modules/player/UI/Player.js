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
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 2px;
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

const StarBtn = styled(PlayerBtn).attrs({
    className: 'star-btn',
})`
  margin-left: auto;
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
  padding: 8px;
`;

const ListBtn = styled(PlayerBtn).attrs({
    className: 'list-btn',
})`
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
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(30px);
  transform: translate(0px, 500px);
  transition: transform 300ms;
  will-change: transform, backdrop-filter;
  z-index: -1;
  
  &.show {
    transform: translate(0px, 0px);
  }
  
  header {
    margin-top: -2px;
    line-height: 24px;
    font-size: 24px;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.75);
    pointer-events: none;
    user-select: none;
  }
`;

const CloseBtn = styled(Icon)`
  position: absolute;
  right: 0;
  margin: -8px 8px 8px;
  padding: 4px;
  color: #fff;
  text-shadow: rgb(51, 51, 51) 0px 0px 3px;
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
    transition: background-color 300ms;
    
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
  //margin-right: -24px;
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

export const Player = function() {
    const [playing, setPlaying] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [song, setSong] = useState(null);
    const [songList, setSongList] = useState([]);
    const [showSongList, setShowSongList] = useState(true);

    // 播放/暂停按钮点击事件
    const handleOnClickPlayBtn = useCallback(() => {
        if (disabled) return;
        chrome.runtime.sendMessage({command: playing ? 'pause' : 'play', from: 'player'});
    }, [playing, disabled]);

    const handleOnClickSongListBtn = useCallback(() => {
        setShowSongList(!showSongList);
    }, [showSongList]);

    const handleOnClickCloseBtn = useCallback(() => {
        setShowSongList(false);
    }, [showSongList]);

    // 歌单歌曲播放事件
    const handleOnClickPlaySong = useCallback((s) => {
        chrome.runtime.sendMessage({command: 'setSong', from: 'songList', song: s});
    }, []);

    // 删除媒体事件
    const handleOnClickReduceSong = useCallback((song) => {
        chrome.runtime.sendMessage({command: 'reduceSong', from: 'songList', song}, (songList) => {
            setSongList(songList);
        });
    });

    useEffect(() => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            //console.info(message);
            const {command = '', from = ''} = message;
            if (from !== 'playerBackground') return true;

            if (command === 'ended') {
                setDisabled(false);
                setPlaying(false);
            } else if (command === 'pause') { // 暂停或播放结束
                setDisabled(false);
                setPlaying(false);
                console.info(message);
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'play') {
                setDisabled(false);
                setPlaying(true);
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'loadstart') {
                setSong(message.song);
            } else if ((command === 'addSongSuccessfully' || command === 'reduceSongSuccessfully') && message.songList) {
                setSongList(message.songList);
            }
            sendResponse();
            return true;
        });
        chrome.runtime.sendMessage({command: 'getPlayerState', from: 'player'}, (state) => {
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
        chrome.runtime.sendMessage({command: 'getSongList', from: 'player'}, (songList) => {
            setSongList(songList);
        });
        // 初始化歌曲
        chrome.runtime.sendMessage({command: 'getCurrentSong', from: 'player'}, (song) => {
            setSong(song);
        });
    }, []);

    return (
        <Wrapper>
            <SongListWrapper className={[showSongList ? 'show' : '']}>
                <CloseBtn icon="close" onClick={handleOnClickCloseBtn}/>
                <header>播放列表</header>
                <SongList className={[song && song.cover ? '' : 'noCover']}>
                    {songList.map((s, index) => {
                        return (
                            <div key={s.id} className="song-list-item">
                                <span className="index">{index + 1}.</span>
                                <span className="title">{s.title}</span>
                                <SongListReduceBtn
                                    size={12}
                                    icon={'reduce'}
                                    onClick={() => handleOnClickReduceSong(s)}
                                />
                                <SongListPlayBtn
                                    size={12}
                                    icon={song && song.playing ? 'pause' : 'play'}
                                    onClick={() => handleOnClickPlaySong(s)}
                                />
                            </div>
                        );
                    })}
                </SongList>
            </SongListWrapper>
            <PlayerWrapper>
                <Cover disabled={disabled} className={song && song.cover ? 'show' : ''} src={song ? song.cover : null}/>
                <PrevBtn disabled={disabled} icon="prev" size={14}/>
                <PlayBtn disabled={disabled} size={22} icon={playing ? 'pause' : 'play'} onClick={handleOnClickPlayBtn}/>
                <NextBtn disabled={disabled} icon="next" size={14}/>
                <StarBtn disabled={disabled} icon="star"/>
                <ListBtn icon="list" size={20} onClick={handleOnClickSongListBtn}/>
            </PlayerWrapper>
        </Wrapper>
    );
};
