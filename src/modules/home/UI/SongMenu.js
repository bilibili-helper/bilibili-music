/**
 * Author: DrowsyFlesh
 * Create: 2019/11/26
 * Description:
 */
import {Icon} from 'Components/Icon';
import {Image} from 'Components/Image';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import styled from 'styled-components';

const DEFAULT_COVER = chrome.extension.getURL('static/images/default-cover.png');

const dealWithTitle = (title) => {
    //if (title) return title.replace(/^【(.+?)】/, '[$1] ');
    //else return title;
    return title;
};

const Wrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 320px;
  height: 100%;
  
  box-sizing: border-box;
  background-color: #fff;
  overflow: auto overlay;
  transform: translateY(100%);
  transition: transform 300ms;
  will-change: transform;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  &.show {
    transform: translateY(0%);
  }
  
  header {
    position: sticky;
    top: 0;
    background: #fff linear-gradient(90deg, rgba(0, 0, 0, 0.1), transparent);
    z-index: 1;
    overflow: hidden;
    
    .background {
      display: block;
      position: absolute;
      top: calc(50% - 160px);
      right: 0;
      bottom: auto;
      left: 0;
      width: 100%;
      transform: scale(1.5);
      filter: blur(20px);
      z-index: -1;
    }
    
    .menu-info {
      display: flex;
      flex-grow: 1;
      //background: linear-gradient(90deg, rgba(0, 0, 0, 0.1), transparent);
      
      .cover {
        display: block;
        width: 100px;
        margin: 8px 14px 8px 8px;
        border-radius: 8px;
        box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 2px;
        user-select: none;
        -webkit-user-drag: none;
      }
      
      .description {
        color: #333;
        p {
          width: 160px;
          text-shadow: rgb(245 245 245 / 80%) 0px 0px 3px;
        }
        .title {
          font-size: 14px;
          font-weight: bold;
          text-overflow: ellipsis;
        }
        .mediaCount, .playCount {
          margin: 4px 0;
        }
      }
    }
    
    .extra-tools {
      display: flex;
      flex-direction: row-reverse;
      .bilibili-music-iconfont {
        transform: scale(0.8);
        vertical-align: bottom;
        margin-left: -2px;
        margin-right: 2px;
      }
      button {
        margin: 8px;
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
  }
  
  ol {
    margin: 0;
    padding: 10px 0 80px 0;
    overflow: auto;
    
    li {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding: 4px 30px 4px 8px;
      background-color: #fff;
      white-space: nowrap;
      list-style: none;
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
        background-color: rgba(255, 122, 165, 0.1);
      }
      
      &:hover {
        background-color: #f5f5f5;
        
        .action-btn {
          opacity: 1;
        }
      }
      
      &:active {
        background-color: #ececec;
      }
      
      span {
        display: inline-block;;
      }
      
      .index {
        display: inline-block;
        margin-right: 4px;
        min-width: 20px;
        height: 24px;
        line-height: 24px;
        text-align: center;
        
        .bilibili-music-iconfont {
          transform-origin: left;
          transform: scale(0.8);
        }
      }
      
      .title {
        height: 24px;
        line-height: 24px;
        white-space: nowrap;
        text-overflow: ellipsis;
        word-break: keep-all;
        overflow: hidden;
        &:hover {
          text-decoration: underline;
        }
      }
      
      .author {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
`;

const CloseBtn = styled(Icon)`
  position: absolute;
  top: 0;
  right: 0;
  margin: 8px 8px auto auto;
  padding: 4px;
  color: #fff;
  text-shadow: rgba(51, 51, 51, 0.5) 0px 0px 3px;
  transition: color 300ms;
  cursor: pointer;
  
  &:hover {
    color: #eee;
  }
  
  &:active {
    color: #ccc;
  }
`;

const ActionBtn = styled(Icon)`
  padding: 6px;
  border-radius: 4px;
  color: #999;
  opacity: 0;
  cursor: pointer;
  background-color: whitesmoke;
  transition: color 300ms, background-color 300ms;
  will-change: color, background-color;
  
  &:hover {
    color: #666;
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    color: #333;
    background-color: rgba(0, 0, 0, 0.2);
  }
`;

const PlayBtn = styled(ActionBtn).attrs({
    className: 'action-btn play-btn',
})`
  margin-right: -24px;
`;

const AddBtn = styled(ActionBtn).attrs({
    className: 'action-btn add-btn',
})`
  margin-right: 4px;
`;

const StarBtn = styled(ActionBtn).attrs({
    className: 'action-btn star-btn',
})`
  margin: 4px 4px 4px auto;
  text-shadow: rgba(255, 255, 255, 0.7) 0px 0px 4px;
  cursor: pointer;
  
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

export const SongMenu = function({show, setSongMenuShow, collectedSongMenu, userMenu, setShowSongList}) {
    const songMenuRef = useRef(null);
    const [songList, setSongList] = useState([]);
    const [song, setSong] = useState(null);
    const [songMenu, setSongMenu] = useState({});
    const [songMenuHasStar, setSongMenuHasStar] = useState(false); // 当前显示歌单是否被收藏

    useEffect(() => {
        if (songMenuRef && songMenuRef.current) {
            songMenuRef.current.scrollTop = 0;
        }
    }, [show]);

    useEffect(() => {
        const found = songMenu && collectedSongMenu.find((m) => m.menuId === songMenu.menuId);
        setSongMenuHasStar(!!found);
    }, [songMenu, collectedSongMenu]);

    // 歌单歌曲播放事件
    const handleOnClickPlaySong = useCallback((s) => {
        if (song && song.id === s.id) {
            chrome.runtime.sendMessage({command: song.playing ? 'pause' : 'play', from: 'songListSection', song});
        } else {
            chrome.runtime.sendMessage({command: 'setSong', from: 'songListSection', song: s});
        }
    }, [song, songMenu]);

    // 播放全部
    const handleOnClickPlayAllSong = useCallback((songList) => {
        chrome.runtime.sendMessage({command: 'setSongList', from: 'songMenu', songList});
    }, [songMenu]);

    // 收藏歌单
    const handleOnClickStarMenu = useCallback((songMenu) => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-歌单歌曲列表',
            category: '收藏按钮',
            label: `歌单 ${songMenu.menuId}`,
        });

        if (songMenuHasStar) {
            chrome.runtime.sendMessage({command: 'unStarSongMenu', from: 'songMenu', songMenu});
        } else {
            chrome.runtime.sendMessage({command: 'starSongMenu', from: 'songMenu', songMenu});
        }
    }, [songMenuHasStar]);

    // 关闭歌单按钮点击事件
    const handleOnClickClose = useCallback(() => {
        setSongMenuShow(false);
    }, [show]);

    // 添加媒体事件
    const handleOnClickAddSong = useCallback((song) => {
        chrome.runtime.sendMessage({command: 'addSong', from: 'songMenu', song}, (songList) => {
            setSongList(songList);
        });
    });

    // 删除媒体事件
    const handleOnClickDeleteSong = useCallback((song) => {
        chrome.runtime.sendMessage({command: 'deleteSong', from: 'songMenu', song});
    });

    // 双击播放事件
    const handleOnDoubleClickPlaySong = useCallback((e, s) => {
        if (!e.target.classList.contains('bilibili-music-iconfont')) { // 屏蔽连续删除导致的误播放
            if (song && song.id === s.id) {
                chrome.runtime.sendMessage({command: song.playing ? 'pause' : 'play', from: 'songMenu', song});
            } else {
                chrome.runtime.sendMessage({command: 'setSong', from: 'songMenu', song: s});
            }
        }
    }, [song, songMenu]);

    // 当前歌单封面被点击
    const handleOnClickCover = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-歌单歌曲列表',
            category: '封面',
            label: `歌单 ${songMenu.menuId}`,
        });
    }, [songMenu]);

    // 媒体名称被点击，弹出媒体详情卡片
    const handleOnClickTitle = useCallback((s) => {
        chrome.runtime.sendMessage({
            command: 'viewMedia',
            from: 'songMenu',
            type: s.type,
            song: s,
            sid: s.id,
        });
        setShowSongList(false);
    }, []);

    const handleOnClickStarBtn = useCallback((s) => {
        chrome.runtime.sendMessage({
            command: 'collectSong',
            from: 'player',
            sid: s.id,
            cid: s.collectIds && s.collectIds.length > 0 ? '' : userMenu[0].id,
        });
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-歌单歌曲列表',
            category: '收藏按钮',
        });
    }, [userMenu]);

    const handleOnMessageListener = useCallback((message) => {
        const {command = '', from = ''} = message;
        if (from !== 'playerBackground' && from !== 'mediaDetailBackground' && from !== 'dataManager') return true;

        if (command === 'ended') {
            setSong(message.song);
            setSongList(message.songList);
        } else if (command === 'pause') { // 暂停或播放结束
            setSong(message.song);
            setSongList(message.songList);
        } else if (command === 'play') {
            setSong(message.song);
            setSongList(message.songList);
        } else if (command === 'loadstart') {
            setSong(message.song);
        } else if ((command === 'addSongSuccessfully' || command === 'deleteSongSuccessfully' || command === 'modifySongListSuccessfully') && message.songList) {
            setSong(message.song);
            setSongList(message.songList);
        } else if (command === 'updateSongMenuSuccessfully') {
            const {songMenu, mediaList} = message;
            setSongMenu({...songMenu, data: mediaList});
        }
    }, [songMenu, song]);

    useEffect(() => {
        // 接收来自播放器背景页的播放状态指令
        chrome.runtime.onMessage.addListener(handleOnMessageListener);
        return () => {
            chrome.runtime.onMessage.removeListener(handleOnMessageListener);
        };
    }, [songMenu, song]);

    useEffect(() => {
        chrome.runtime.sendMessage({command: 'getSongList', from: 'songMenu'}, ({song, songList}) => {
            setSong(song);
            setSongList(songList);
        });

    }, []);
    return (
        <Wrapper className={show ? 'show' : ''} ref={songMenuRef}>
            <header>
                <Image className="background" src={songMenu.cover || DEFAULT_COVER}/>
                <div className="menu-info">
                    <a
                        href={songMenu ? `https://www.bilibili.com/audio/am${songMenu.menuId}` : null}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleOnClickCover}
                    >
                        <Image className="cover" src={songMenu.cover || DEFAULT_COVER}/>
                    </a>
                    <div className="description">
                        <p className="title">{dealWithTitle(songMenu.title)}</p>
                        <p className="mediaCount"><span>歌曲数：</span>{songMenu.snum || songMenu.song}</p>
                        <p className="playCount"><span>播放数：</span>{songMenu.statistic && songMenu.statistic.play}</p>
                    </div>
                </div>
                <div className="extra-tools">
                    <button
                        className="play-all-btn"
                        disabled={!songMenu.data || songMenu.data.length === 0}
                        onClick={() => handleOnClickPlayAllSong(songMenu.data)}
                    >
                        <Icon icon="play"/>播放全部
                    </button>
                    <button
                        className="star-btn"
                        disabled={!songMenu.data || songMenu.data.length === 0}
                        onClick={() => handleOnClickStarMenu(songMenu)}
                    >
                        <Icon icon="star"/>{songMenuHasStar ? '取消收藏' : '收藏歌单'}
                    </button>
                </div>
                <CloseBtn icon="down" onClick={handleOnClickClose}/>
            </header>
            <ol className="song-list">
                {songMenu.data && songMenu.data.map((s, index) => {
                    const inList = !!songList.find((item) => item.id === s.id);
                    const isPlaying = song ? (song.id === s.id && song.playing) : false;
                    const isCurrent = song ? (song.id === s.id && song.current) : false;
                    const hasStar = s.collectIds && s.collectIds.length > 0;
                    return (
                        <li
                            key={s.id}
                            className={[
                                isPlaying ? 'playing' : '',
                                isCurrent ? 'current' : '',
                            ].join(' ')}
                            onDoubleClick={(e) => handleOnDoubleClickPlaySong(e, s)}
                        >
                            <span className="index">{isPlaying ? <Icon icon="playing"/> : `${index + 1}.`}</span>
                            <span className="title" onClick={() => handleOnClickTitle(s)}>{s.title}</span>
                            {/*<span className="author">{song.author}</span>*/}
                            <StarBtn
                                size={12}
                                icon="star"
                                className={hasStar ? 'collected' : null}
                                onClick={() => handleOnClickStarBtn(s)}
                            />
                            <AddBtn
                                size={12}
                                icon={inList ? 'delete' : 'add'}
                                onClick={() => inList ? handleOnClickDeleteSong(s) : handleOnClickAddSong(s)}
                            />
                            <PlayBtn
                                size={12}
                                icon={song && (s.id === song.id) && song.playing ? 'pause' : 'play'}
                                onClick={() => handleOnClickPlaySong(s)}
                            />
                        </li>
                    );
                })}
            </ol>
        </Wrapper>
    );
};

SongMenu.propTypes = {
    show: PropTypes.bool,
    userMenu: PropTypes.array,
    collectedSongMenu: PropTypes.array,
    setSongMenuShow: PropTypes.func,
};
