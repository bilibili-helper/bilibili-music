/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {Icon, Image} from 'Components';
import PropTypes from 'prop-types';
import React, {useState, useCallback, useEffect} from 'react';
import styled, {keyframes} from 'styled-components';

const DEFAULT_COVER = chrome.extension.getURL('static/images/default-cover.png');

const fadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translate(0, 10px);
  }
  100% {
    transform: translate(0, 0px);
    opacity: 1;
  }
`;

const rightMove = keyframes`
  0% {
    transform: translate(0, 0);
  }
  80% {
    transform: translate(10px, 0);
  }
  100% {
    transform: translate(0, 0);
  }
`;

const Wrapper = styled.div.attrs({
    className: 'song-list-section',
})`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  margin: 8px 8px 12px 8px;
  
  header {
    display: flex;
    align-items: center;
    //justify-content: space-between;
    padding: 8px;
    font-size: 16px;
    font-weight: bold;
    color: #333;
    animation-name: ${fadeIn};
    animation-duration: 300ms;
    animation-fill-mode: backwards;
    animation-timing-function: ease-out;
    
    .bilibili-music-icon-right-dashed {
      margin-left: 8px;
      line-height: 16px;
      height: 16px;
      vertical-align: text-bottom;
      color: #ccc;
      animation-name: ${rightMove};
      animation-duration: 3000ms;
      animation-fill-mode: backwards;
      animation-timing-function: ease-out;
      animation-iteration-count: infinite;
    }
  }
  
  .menu-list {
    display: flex;
    flex-direction: column;
    padding: 3px;
    
    &::-webkit-scrollbar {
      display: none;
    }
    
    &.simple {
      flex-direction: row;
      width: 100%;
      overflow: auto hidden;
      
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
    animation-name: ${fadeIn};
    animation-duration: 300ms;
    animation-fill-mode: backwards;
    animation-timing-function: ease-out;
    user-select: none;
    
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
      -webkit-user-drag: none;
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
  margin-left: auto;
  margin-right: 4px;
`;

const dealWithTitle = (title) => {
    //if (title) return title.replace(/^【(.+?)】/, '[$1] ');
    //else return title;
    return title;
};

export const SongListSection = function({topic, menuList = [], simple = false, setSongMenu, setShow}) {
    const [songMenuList, setSongMenuList] = useState(menuList);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSongMenuList(menuList);
    }, [menuList]);

    // 歌单被点击
    const handleOnClickSongMenu = useCallback((item) => {
        setLoading(true);
        chrome.runtime.sendMessage({command: 'getSongMenu', from: 'songListSection', sid: item.menuId}, (res) => {
            setLoading(false);
            setShow(true);
            setSongMenu({...item, data: res});
        });
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-歌单列表',
            category: topic,
            label: `歌单 ${item.menuId}`,
        });
    }, []);

    return (
        <React.Fragment>
            <Loading className={loading ? 'show' : ''}/>
            <Wrapper>
                {topic && (songMenuList && songMenuList.length !== 0 && (!!songMenuList[0].snum || !!songMenuList[0].song)) && (
                    <header>{topic}{simple && <Icon icon="right-dashed" size="12"/>}</header>
                )}
                <div className={['menu-list', simple ? 'simple' : ''].join(' ')}>
                    {songMenuList.map((item, index) => {
                        if (!item.snum && !item.song) return null;
                        return (
                            <div
                                key={item.menuId}
                                className="song-list-item"
                                style={{'animation-delay': `${index * 100}ms`}}
                                onClick={() => handleOnClickSongMenu(item)}
                            >
                                <Image src={item.cover || DEFAULT_COVER}/>
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
    simple: PropTypes.bool,
    setSongMenu: PropTypes.func,
    setShow: PropTypes.func,
};
