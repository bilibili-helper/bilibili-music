/**
 * Author: DrowsyFlesh
 * Create: 2019/11/19
 * Description:
 */
import {Icon} from 'Components/Icon';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState, useRef} from 'react';
import styled from 'styled-components';

const SongListWrapper = styled.div.attrs({
    className: 'song-list',
})`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 16px 16px 87px 8px;
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

const List = styled.div`
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
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 4px 4px 4px 16px;
    height: 24px;
    line-height: 16px;
    white-space: nowrap;
    text-overflow: ellipsis;
    word-break: keep-all;
    cursor: pointer;
    user-select: none;
    overflow: hidden;
    transition: background-color 150ms, color 150ms;
    
    &.playing {
      color: #FF7AA5;
    }
    
    &.current {
      background-color: rgba(255, 255, 255, 0.7);
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
      min-width: 20px;
      height: 24px;
      line-height: 24px;
      margin-right: 4px;
    }
    
    .title {
      margin-right: auto;
      max-width: 250px;
      height: 16px;
      line-height: 16px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      
      &:hover {
        text-decoration: underline;
      }
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
  display: none;
  cursor: pointer;
  
  .song-list-item:hover & {
    display: block;
  }
  
  .song-list-item:hover &:hover {
    color: #666;
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    display: block;
    color: #333;
    background-color: rgba(0, 0, 0, 0.2);
  }
`;

const SongListStarBtn = styled(ActionBtn).attrs({
    className: 'action-btn song-list-star-btn',
})`
  margin-left: auto;
  margin-right: 4px;
  line-height: normal;
  &.collected {
    color: #ff8300;
    background-color: transparent;
    opacity: 1;
  }
  
  &:hover {
    opacity: 0.5;
  }
  
  &[disabled] {
    color: #444;
    cursor: not-allowed;
  }
`;

const SongListDeleteBtn = styled(ActionBtn).attrs({
    className: 'action-btn song-list-delete-btn',
})`
  margin-right: 4px;
  line-height: normal;
`;

const SongListPlayBtn = styled(ActionBtn).attrs({
    className: 'action-btn song-list-play-btn',
})`
  line-height: normal;
`;

export const SongList = function({show, setShow, song, setSong, songList, setSongList}) {
    const listRef = useRef(null);
    const [deleteBtnDisabled, setDeleteBtnDisabled] = useState(false);

    const handleOnClickClearSongList = useCallback(() => {
        chrome.runtime.sendMessage({command: 'clearSongList', from: 'songList'});
    });

    const handleOnDoubleClickPlaySong = useCallback((e, s) => {
        if (!e.target.classList.contains('bilibili-music-iconfont')) { // 屏蔽连续删除导致的误播放
            chrome.runtime.sendMessage({command: 'setSong', from: 'songList', song: s});
        }
    });

    // 删除媒体事件
    const handleOnClickDeleteSong = useCallback((song) => {
        if (!deleteBtnDisabled) {
            setDeleteBtnDisabled(true);
            chrome.runtime.sendMessage({command: 'deleteSong', from: 'songList', song}, () => {
                setDeleteBtnDisabled(false);
            });
        }
    }, []);

    // 歌单歌曲播放事件
    const handleOnClickPlaySong = useCallback((s) => {
        if (s.current) {
            chrome.runtime.sendMessage({command: s.playing ? 'pause' : 'play', from: 'songList', song: s});
        } else {
            chrome.runtime.sendMessage({command: 'setSong', from: 'songList', song: s});
        }
    }, []);

    // 点击媒体标题展开媒体详情卡片
    const handleOnClickTitle = useCallback((s) => {
        chrome.runtime.sendMessage({command: 'viewMedia', from: 'player', sid: s.id});
        //chrome.runtime.sendMessage({command: 'hideMediaList', from: 'mediaViewer'});
        setShow(false);
    }, []);


    useEffect(() => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command = '', from = ''} = message;
            if (from !== 'playerBackground') return true;

            if (command === 'hideMediaList') {
                setShow(false);
            } else if (command === 'pause') { // 暂停或播放结束
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'play') {
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'loadstart') {
                setSong(message.song);
            } else if ((command === 'addSongSuccessfully' || command === 'deleteSongSuccessfully' || command === 'modifySongListSuccessfully')) {
                setSong(message.song);
                setSongList(message.songList);
            }
            sendResponse();
            return true;
        });
    }, []);

    return (
        <SongListWrapper className={[show ? 'show' : '']}>
            <CloseBtn icon="close" onClick={() => setShow(false)}/>
            <header>
                播放列表
                <button
                    className="clear-all-btn"
                    disabled={songList.length === 0}
                    onClick={handleOnClickClearSongList}
                ><Icon icon="delete" size="12"/> 清空列表</button>
            </header>
            <List className={[song && song.cover ? '' : 'noCover']} ref={listRef}>
                {songList.length > 0 && songList.map((s, index) => {
                    return (
                        <div
                            key={s.id}
                            className={[
                                'song-list-item',
                                s.playing ? 'playing' : '',
                                s.current ? 'current' : '',
                            ].join(' ')}
                            onDoubleClick={(e) => handleOnDoubleClickPlaySong(e, s)}
                        >
                            {/*<span className="index">{s.playing ? <Icon icon="playing" size={12}/> : `${index + 1}.`}</span>*/}
                            <span className="title" onClick={() => handleOnClickTitle(s)}>{s.title}</span>

                            <SongListDeleteBtn
                                size={12}
                                icon="delete"
                                disabled={deleteBtnDisabled}
                                onClick={() => deleteBtnDisabled ? null : handleOnClickDeleteSong(s)}
                            />
                            <SongListPlayBtn
                                size={12}
                                icon={s.playing ? 'pause' : 'play'}
                                onClick={() => handleOnClickPlaySong(s)}
                            />
                        </div>
                    );
                })}
                {songList.length === 0 && <EmptySongList>没有可播放的媒体</EmptySongList>}
            </List>
        </SongListWrapper>
    );
};
SongList.propTypes = {
    show: PropTypes.bool,
    setShow: PropTypes.func,
    setSong: PropTypes.func,
    setSongList: PropTypes.func,
    song: PropTypes.any,
    songList: PropTypes.any,
};
