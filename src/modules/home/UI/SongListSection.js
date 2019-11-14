/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {Icon} from 'Components/Icon';
import PropTypes from 'prop-types';
import React, {useState, useCallback} from 'react';
import styled from 'styled-components';

const Wrapper = styled.div.attrs({
    className: 'song-list-section',
})`
  display: flex;
  flex-wrap: wrap;
  margin: 16px 8px 8px 8px;
  
  .song-list-item {
    padding: 8px;
    width: 85px;
    border-radius: 4px;
    color: #333;
    cursor: pointer;
    transition: background-color 300ms;
    
    &:hover {
      background-color: #eee;
    }
    
    &:active {
      background-color: #dddddd;
    }
    
    img {
      display: block;
      width: 85px;
      height: 85px;
      border-radius: 4px;
    }
    
    p {
      margin: 4px 0;
      width: 100px;
      transform-origin: left top;
      transform: scale(0.8);
    }
  }
`;

const SongList = styled.div`
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
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  &.show {
    transform: translateY(0%);
  }
  
  header {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0px 0px 8px 8px;
    border-radius: 0 0 8px 8px;
    background-color: whitesmoke;
    z-index: 1;
    
    .menu-info {
    
      .cover {
        display: block;
        width: 100px;
        margin: 8px 8px 8px 0;
        border-radius: 4px;
      }
      .title {
        span {
          display: inline-block;
          width: 46px;
        }
      }
    }
  }
  
  ol {
    margin: 0;
    padding: 10px 0 50px 0;
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
      
      &:hover {
        background-color: whitesmoke;
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
  margin: 4px 4px auto auto;
  padding: 4px;
  color: #999;
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
    className: 'action-btn play-btn'
})`
  margin-right: -24px;
`;

const AddBtn = styled(ActionBtn).attrs({
    className: 'action-btn add-btn'
})`
  margin-left: auto;
  margin-right: 6px;
`;

export const SongListSection = function({data}) {
    const [showSongList, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [songList, setSongList] = useState({});

    // 歌单被点击
    const handleOnClickSongMenu = useCallback((item) => {
        setLoading(true);
        chrome.runtime.sendMessage({command: 'getMenuSong', sid: item.menuId}, (res) => {
            setLoading(false);
            setShow(true);
            setSongList({...item, ...res});
        });
    }, [showSongList, songList]);

    const handleOnClickClose = useCallback(() => {
        setShow(false);
    }, [showSongList]);

    const handleOnClickPlaySong = useCallback((song) => {
        chrome.runtime.sendMessage({command: 'setSong', from: 'songMenu', song});
    },[songList]);

    return (
        <React.Fragment>
            <Loading className={loading ? 'show' : ''}/>
            <SongList className={showSongList ? 'show' : ''}>
                <header>
                    <div className="menu-info">
                        <img className="cover" src={songList.cover}/>
                        <div className="title"><span>歌单：</span>{songList.title}</div>
                        <div className="playCount"><span>播放数：</span>{songList.statistic && songList.statistic.play}</div>
                    </div>
                    <CloseBtn icon="close" onClick={handleOnClickClose}/>
                </header>
                <ol className="song-list">
                    {songList.data && songList.data.map((song, index) => {
                        return (
                            <li key={song.id}>
                                <span className="index">{index + 1}. </span>
                                <span className="title">{song.title}</span>
                                {/*<span className="author">{song.author}</span>*/}
                                <AddBtn icon="add" size={12}/>
                                <PlayBtn icon="play" size={12} onClick={() => handleOnClickPlaySong(song)}/>
                            </li>
                        );
                    })}
                </ol>
            </SongList>
            <Wrapper>
                {data.data && data.data.map((item) => {
                    return (
                        <div
                            key={item.menuId}
                            className="song-list-item"
                            onClick={() => handleOnClickSongMenu(item)}
                        >
                            <img src={item.cover}/>
                            <p>{item.title}</p>
                        </div>
                    );
                })}
            </Wrapper>
        </React.Fragment>
    );
};

SongListSection.propTypes = {
    data: PropTypes.array,
};
