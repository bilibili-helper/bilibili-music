/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {Icon} from 'Components/Icon';
import PropTypes from 'prop-types';
import React, {useState, useCallback, useRef, useEffect} from 'react';
import styled from 'styled-components';

const DEFAULT_COVER = chrome.extension.getURL('static/images/default-cover.png');

const Wrapper = styled.div.attrs({
    className: 'song-list-section',
})`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  margin: 8px 8px 12px 8px;
  
  header {
    display: block;
    padding: 8px;
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }
  
  .menu-list {
    display: flex;
    flex-direction: column;
    &.simple {
      flex-direction: row;
      width: 100%;
      overflow: overlay auto;
      &::-webkit-scrollbar {
        display: none;
      }
      .song-list-item {
        margin-right: 4px;
        margin-bottom: 0;
        width: 103px;
        
        &:last-of-type {
          margin-right: 0;
        }
        img {
          margin-right: 0;
        }
      }
    }
  }
  
  .song-list-item {
    display: flex;
    box-sizing: border-box;
    margin-bottom: 8px;
    padding: 8px;
    //width: 85px;
    width: 100%;
    border: 1px solid transparent;
    border-radius: 8px;
    background-color: #fff;
    color: #333;
    cursor: pointer;
    box-shadow: inset 0px 0px 0px #999;
    transition: box-shadow 300ms, background-color 300ms;
    will-change: box-shadow, background-color;
    //user-select: none;
    
    &:last-of-type {
      margin-bottom: 0;
    }
    
    &:hover {
      //background-color: #eee;
      //border: 1px solid #999;
      box-shadow: rgba(153, 153, 153, 0.5) 0px 0px 8px inset;
      
      img {
        box-shadow: hsla(0, 0%, 75%, 0.5) 0px 0px 0px;
      }
    }
    
    &:active {
      background-color: #eee;
    }
    
    img {
      display: block;
      margin-right: 16px;
      width: 85px;
      height: 85px;
      border: 2px solid #fff;
      border-radius: 8px;
      box-sizing: border-box;
      box-shadow: hsla(0, 0%, 75%, 0.5) 0px 3px 10px;
      transition: box-shadow 150ms;
    }
    
    .description {
      p {
        margin: 4px 0;
        width: 180px;
        text-align: justify;
      }
      
      .title {
        font-weight: bold;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .intro {
        max-height: 100px;
        white-space: pre-line;
        text-overflow: ellipsis;
        overflow: auto;
        
        &::-webkit-scrollbar {
          display: none;
        }
      }
    }
    
  }
`;

const SongMenu = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  
  box-sizing: border-box;
  background-color: #fff;
  z-index: 1;
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
        margin: 8px;
        border-radius: 8px;
        box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 2px;
        user-select: none;
      }
      
      .description {
        color: #fff;
        p {
          width: 175px;
          text-shadow: hsla(0, 0%, 0%, 0.35) 0px 0px 3px;
        }
        .title {
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
        vertical-align: text-bottom;
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
      //border-radius: 4px;
      background-color: #fff;
      white-space: nowrap;
      list-style: none;
      text-overflow: ellipsis;
      word-break: keep-all;
      cursor: pointer;
      overflow: hidden;
      //transition: background-color 300ms;
      
      &.playing {
        color: #FF7AA5;
        background-color: #fafafa;
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
        width: 12px;
        text-align: center;
        
        .bilibili-music-iconfont {
          transform-origin: left;
          transform: scale(0.8);
        }
      }
      
      .title {
        white-space: nowrap;
        text-overflow: ellipsis;
        word-break: keep-all;
        overflow: hidden;
      }
      
      .author {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
`;

const Loading = styled.div`
  .show {
    
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
  cursor: pointer;
`;

const ActionBtn = styled(Icon)`
  padding: 6px;
  border-radius: 4px;
  color: #999;
  opacity: 0;
  cursor: pointer;
  background-color: whitesmoke;
  transition: background-color 300ms;
  
  &:hover {
    background-color: #fff;
  }
  
  &:active {
    background-color: #ececec;
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
  margin-left: auto;
  margin-right: 4px;
`;

const dealWithTitle = (title) => {
    //if (title) return title.replace(/^【(.+?)】/, '[$1] ');
    //else return title;
    return title;
};

export const SongListSection = function({topic, menuList = [], collectedSongMenu: userCollectedSongMenu = [], simple = false}) {
    const songMenuRef = useRef(null);
    const [showSongMenu, setShow] = useState(false);
    const [songMenuList, setSongMenuList] = useState(menuList);
    const [collectedSongMenu, setCollectedSongMenu] = useState(userCollectedSongMenu);
    const [loading, setLoading] = useState(false);
    const [songMenu, setSongMenu] = useState({});
    const [songList, setSongList] = useState([]);
    const [song, setSong] = useState(null);
    const [songMenuHasStar, setSongMenuHasStar] = useState(false); // 当前显示歌单是否被收藏

    useEffect(() => {
        setSongMenuList(menuList);
        setCollectedSongMenu(userCollectedSongMenu);
    }, [menuList, userCollectedSongMenu]);

    useEffect(() => {
        const found = collectedSongMenu.find((m) => m.menuId === songMenu.menuId);
        setSongMenuHasStar(!!found);
    }, [songMenu, collectedSongMenu]);

    // 歌单被点击
    const handleOnClickSongMenu = useCallback((item) => {
        setLoading(true);
        chrome.runtime.sendMessage({command: 'getSongMenu', sid: item.menuId}, (res) => {
            setLoading(false);
            setShow(true);
            songMenuRef.current.scrollTop = 0;
            setSongMenu({...item, data: res});
        });
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-歌单列表',
            category: topic,
            label: `歌单 ${item.menuId}`,
        });
    }, [showSongMenu, songMenu]);

    // 关闭歌单按钮点击事件
    const handleOnClickClose = useCallback(() => {
        setShow(false);
    }, [showSongMenu]);

    // 添加媒体事件
    const handleOnClickAddSong = useCallback((song) => {
        chrome.runtime.sendMessage({command: 'addSong', from: 'songMenu', song}, (songList) => {
            setSongList(songList);
        });
    });

    // 删除媒体事件
    const handleOnClickReduceSong = useCallback((song) => {
        chrome.runtime.sendMessage({command: 'reduceSong', from: 'songMenu', song}, (songList) => {
            setSongList(songList);
        });
    });

    // 歌单歌曲播放事件
    const handleOnClickPlaySong = useCallback((song) => {
        chrome.runtime.sendMessage({command: 'setSong', from: 'songMenu', song});
    }, [songMenu]);

    // 播放全部
    const handleOnClickPlayAllSong = useCallback((songList) => {
        chrome.runtime.sendMessage({command: 'addSongMenu', from: 'songMenu', songList});
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
    }, []);

    // 当前歌曲封面被点击
    const handleOnClickCover = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-歌单歌曲列表',
            category: '封面',
            label: `歌单 ${songMenu.menuId}`,
        });
    }, [songMenu]);

    useEffect(() => {
        setSongMenuList(menuList);
        chrome.runtime.sendMessage({command: 'getSongList'}, ({song, songList}) => {
            //console.info(songList);
            setSong(song);
            setSongList(songList);
        });
        // 接收来自播放器背景页的播放状态指令
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            //console.info(message);
            const {command = '', from = ''} = message;
            if (from !== 'playerBackground') return true;
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
            } else if ((command === 'addSongSuccessfully' || command === 'reduceSongSuccessfully' || command === 'clearSongListSuccessfully') && message.songList) {
                setSong(!message.song);
                setSongList(message.songList);
            }
        });
    }, []);

    return (
        <React.Fragment>
            <Loading className={loading ? 'show' : ''}/>
            <SongMenu className={showSongMenu ? 'show' : ''} ref={songMenuRef}>
                <header>
                    <img className="background" src={songMenu.cover || DEFAULT_COVER}/>
                    <div className="menu-info">
                        <a
                            href={songMenu ? `https://www.bilibili.com/audio/am${songMenu.menuId}` : null}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleOnClickCover}
                        >
                            <img className="cover" src={songMenu.cover || DEFAULT_COVER}/>
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
                    <CloseBtn icon="close" onClick={handleOnClickClose}/>
                </header>
                <ol className="song-list">
                    {songMenu.data && songMenu.data.map((s, index) => {
                        const inList = songList.find((item) => item.id === s.id);
                        const isPlaying = song ? (song.id === s.id && song.playing) : false;
                        return (
                            <li key={s.id} className={isPlaying ? 'playing' : ''}>
                                <span className="index">{isPlaying ? <Icon icon="playing"/> : `${index + 1}.`}</span>
                                <span className="title">{dealWithTitle(s.title)}</span>
                                {/*<span className="author">{song.author}</span>*/}
                                <AddBtn
                                    size={12}
                                    icon={inList ? 'reduce' : 'add'}
                                    onClick={() => inList ? handleOnClickReduceSong(s) : handleOnClickAddSong(s)}
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
            </SongMenu>
            <Wrapper>
                {topic && (songMenuList && songMenuList.length !== 0 && (!!songMenuList[0].snum || !!songMenuList[0].song)) && (
                    <header>{topic}</header>
                )}
                <div className={['menu-list', simple ? 'simple' : ''].join(' ')}>
                    {songMenuList.map((item) => {
                        if (!item.snum && !item.song) return null;
                        return (
                            <div
                                key={item.menuId}
                                className="song-list-item"
                                onClick={() => handleOnClickSongMenu(item)}
                            >
                                <img src={item.cover || DEFAULT_COVER}/>
                                {!simple && <div className="description">
                                    <p className="title">{dealWithTitle(item.title)}</p>
                                    <p className="intro">{item.intro}</p>
                                </div>}
                            </div>
                        );
                    })}
                </div>
            </Wrapper>
        </React.Fragment>
    );
};

SongListSection.propTypes = {
    topic: PropTypes.oneOfType(PropTypes.any, PropTypes.string),
    menuList: PropTypes.array,
    collectedSongMenu: PropTypes.array,
    simple: PropTypes.bool,
};
