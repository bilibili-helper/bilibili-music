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
    background-color: #eee;
    
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
    //position: absolute;
    //top: 32px;
    //bottom: 40px;
    //right: 0;
    //left: 0;
    margin: 0;
    padding: 0 0 50px 0;
    overflow: auto;
    
    li {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding: 8px;
      background-color: #fff;
      white-space: nowrap;
      list-style: none;
      text-overflow: ellipsis;
      word-break: keep-all;
      cursor: pointer;
      overflow: hidden;
      
      &:hover {
        background-color: #eee;
      }
      
      span {
        display: inline-block;;
      }
      
      .index {
        display: inline-block;
        margin-right: 4px;
        //min-width: 20px;
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

const CloseBtn = styled(Icon)`
  margin: 4px 4px auto auto;
  padding: 4px;
  color: #999;
  cursor: pointer;
`;

export const SongListSection = function({data}) {

    const [showSongList, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [songList, setSongList] = useState({});
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

    console.warn(songList);
    return (
        <React.Fragment>
            <SongList className={showSongList ? 'show' : ''}>
                <header>
                    <div className="menu-info">
                        <img className="cover" src={songList.cover}/>
                        <div className="title"><span>歌单：</span>{songList.title}</div>
                        <div className="playCOunt"><span>播放数：</span>{songList.statistic && songList.statistic.play}</div>
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
