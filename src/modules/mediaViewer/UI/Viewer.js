/**
 * Author: DrowsyFlesh
 * Create: 2019/11/20
 * Description:
 */
import {Icon} from 'Components/Icon';
import {Image} from 'Components/Image';
import {SongList} from 'Modules/player/UI/SongList';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';

const EMPTY_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const DEFAULT_COVER = chrome.extension.getURL('static/images/default-cover.png');

const CloseBtn = styled(Icon)`
  position: absolute;
  top: 16px;
  right: 0;
  margin: -8px 8px 8px;
  padding: 4px;
  color: #fff;
  text-shadow: rgba(51, 51, 51, 0.5) 0px 0px 3px;
  cursor: pointer;
  z-index: 1;
`;

const CoverBox = styled.div`
  position: absolute;
  width: 64px;
  height: 64px;
  bottom: 6px;
  left: 6px;
  border-radius: 4px;
  background-color: #ddd;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 6px -2px;
  cursor: pointer;
  transform: translate(0, 70px);
  -webkit-user-drag: none;
  overflow: hidden;
  transition: transform 300ms;
  will-change: transition;
  z-index: 10;
  
  &:hover {
    .bilibili-music-icon-right-dashed {
      opacity: 1;
    }
  }
  
  &.show {
    transform: translate(0, 0);
  }
  
  &.expand {
    transform: translate(0, 70px);
  }
  
  .bilibili-music-icon-right-dashed {
    position: absolute;
    top: -20px;
    right: -20px;
    bottom: -20px;
    left: -20px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 26px;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    transform: rotate(-90deg);
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms, transform 200ms;
    &.show-viewer {
      transform: rotate(90deg);
    }
  }
`;

const CoverBtn = styled(Image)`
  width: 64px;
  height: 64px;
  border-radius: 4px;
`;

const StarBtn = styled(Icon).attrs({
    className: 'star-btn',
})`
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 0 4px 4px 0;
  border-radius: 4px 0 0 0;
  text-shadow: rgba(255, 255, 255, 0.7) 0px 0px 4px;
  color: #ccc;
  cursor: pointer;
  z-index: 1;
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

const Wrapper = styled.div.attrs({
    className: 'song-viewer',
})`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 0 0 87px 0;
  height: 500px;
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.85);
  z-index: 1;
  
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
    //position: sticky;
    //top: -16px;
    margin: -16px -16px 0;
    overflow: hidden;
    
    .menu-info {
      display: flex;
      flex-grow: 1;
      
      .cover-box {
        position: relative;
        margin: 8px 14px 8px 8px;
        width: 100px;
        height: 100px;
        border-radius: 8px;
        overflow: hidden;
      
        .bilibili-music-icon-outLink {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          font-size: 32px!important;
          background-color: rgba(0,0,0,0.5);
          color: #fff;
          opacity: 0;
          transition: opacity 200ms;
          
          &:hover {
            opacity: 1;
          }
        }
      
        .cover {
          display: block;
          width: 100px;
          border-radius: 8px;
          box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 6px -2px;
          user-select: none;
          -webkit-user-drag: none;
        }
      }
      
      
      
      .description {
        color: #333;
        p {
          width: 160px;
        }
        .title {
          font-size: 14px;
          font-weight: bold;
          text-overflow: ellipsis;
        }
        .statistic {
          span {
            color: #666;
          }
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
  
  .content {
    height: 100%;
    padding: 16px 16px 24px;
    overflow: auto;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const Section = styled.section`
  margin: 0 auto 28px;
  
  h1 {
    display: flex;
    align-items: center;
    margin: 8px -8px 0;
    padding: 4px 8px;
    border-radius: 2px;
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const IntroductionSection = styled(Section)`
  line-height: 22px;
  color: #333;
  
  h1 {
    justify-content: space-between;
    
    button {
      margin-right: -4px;
      margin-left: 8px;
      border: none;
      border-radius: 2px;
      background-color: rgba(0, 0, 0, 0.3);
      color: #fff;
      cursor: pointer;
      outline: none;
      transition: opacity 300ms;
      
      &:hover {
        opacity: 0.75;
      }
      
      &:active {
        opacity: 1;
      }
      .bilibili-music-icon-download {
        vertical-align: text-bottom;
        margin-left: -4px;
        line-height: 20px;
        font-size: 12px!important;
      }
    }
  }
  
  pre {
    white-space: pre-wrap;
  }
`;

const MemberSection = styled(Section)`
  ul {
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    
    li {
      display: flex;
      margin-bottom: 2px;
      width: 50%;
      color: #333;
      span {
        flex-shrink: 0;
        margin-right: 6px;
        color: #666;
      }
    }
  }
`;

const TagSection = styled(Section)`
  color: #666;
`;

const LrcSection = styled(Section)`
  color: #444;
  
  h1 {
    justify-content: space-between;
    
    button {
      margin-right: -4px;
      margin-left: 8px;
      border: none;
      border-radius: 2px;
      background-color: rgba(0, 0, 0, 0.3);
      color: #fff;
      cursor: pointer;
      outline: none;
      transition: opacity 300ms;
      
      &:hover {
        opacity: 0.75;
      }
      
      &:active {
        opacity: 1;
      }
      
      .bilibili-music-icon-download {
        vertical-align: text-bottom;
        margin-left: -4px;
        line-height: 20px;
        font-size: 12px!important;
      }
    }
  }
`;

const getMemberStrByType = (type) => {
    switch (type) {
        case 1:
            return '歌手';
        case 2:
            return '作词';
        case 3:
            return '作曲';
        case 4:
            return '编曲';
        case 5:
            return '后期/混音';
        case 6:
            return '原曲';
        case 7:
            return '封面制作';
        case 127:
            return '上传者';
    }
};

export const Viewer = function({song, userMenu, setShow, show, setShowSongList}) {
    const [coverSong, setCoverSong] = useState(song);

    const handleOnClickStarBtn = useCallback((collected = false) => {
        chrome.runtime.sendMessage({
            command: 'collectSong',
            from: 'player',
            sid: coverSong.id,
            cid: collected ? '' : userMenu[0].id,
        });
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '收藏按钮',
        });
    }, [coverSong, userMenu]);

    // 封面点击
    const handleOnClickCover = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '封面',
            label: coverSong.id,
        });
        if (!show && coverSong) {
            chrome.runtime.sendMessage({command: 'viewMedia', from: 'player', sid: song.id});
        } else {
            setShow(!show);
        }
    }, [show, song, coverSong]);

    // 点击下载歌词
    const handleOnClickDownloadLRC = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'downloadLrc',
            from: 'mediaViewer',
            song: coverSong,
        });
    }, [coverSong]);

    // 封面外链点击事件
    const handleOnClickDetailCover = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-媒体详情页',
            category: '封面',
            label: coverSong.id,
        });
    }, [coverSong]);

    // 下载媒体事件
    const handleOnClickDownloadMedia = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-媒体详情页',
            category: '下载媒体',
            label: song.id,
        });
        chrome.runtime.sendMessage({
            command: 'downloadMedia',
            from: 'mediaViewer',
            song,
        });
    }, [song]);

    const handleOnMessageListener = useCallback((message, sender, sendResponse) => {
        const {command = '', from = ''} = message;
        console.info(message);
        if (from !== 'playerBackground' && from !== 'mediaDetailBackground') return true;

        if (command === 'hideViewer') {
            setShow(false);
        } else if (command === 'ended') {
            return true;
        } else if (command === 'pause') { // 暂停或播放结束
            setCoverSong(message.song);
        } else if (command === 'play') {
            setCoverSong(message.song);
        } else if (command === 'loadstart') {
            setCoverSong(message.song);
        } else if ((command === 'addSongSuccessfully' || command === 'deleteSongSuccessfully' || command === 'modifySongListSuccessfully') && message.songList) {
            setCoverSong(message.song);
        } else if (command === 'collectedSongSuccessfully' || command === 'cancelCollectSongSuccessfully') {
            const {song} = message;
            if (song && coverSong && song.id === coverSong.id) {
                setCoverSong(song);
            }
        } else if (command === 'setSongViewSuccessfully' && message.song) { // 暂停或播放结束
            setCoverSong(message.song);
            setShowSongList(false);
            setShow(true);
        }
        sendResponse();
        return true;
    }, [coverSong]);

    useEffect(() => {
        if (!coverSong && song) {
            setCoverSong(song);
        }
        chrome.runtime.onMessage.addListener(handleOnMessageListener);
        return () => chrome.runtime.onMessage.removeListener(handleOnMessageListener);
    }, [song, coverSong]);


    return (
        <React.Fragment>
            <CoverBox className={song && song.cover ? 'show' : null}>
                <CoverBtn
                    alt={song ? song.title : null}
                    src={song ? song.cover : EMPTY_IMAGE_SRC}
                    onClick={() => song ? handleOnClickCover() : null}
                />
                <StarBtn
                    icon="star"
                    size={14}
                    className={song && song.collectIds && song.collectIds.length > 0 ? 'collected' : null}
                    disabled={!song}
                    onClick={() => handleOnClickStarBtn(song && song.collectIds && song.collectIds.length > 0)}
                />
                <i className={`bilibili-music-iconfont bilibili-music-icon-right-dashed ${show ? 'show-viewer' : null}`}/>
            </CoverBox>
            <Wrapper className={show ? 'show' : null}>
                <CloseBtn icon="close" onClick={() => setShow(false)}/>
                {coverSong && (<div className="content">
                    <header>
                        <div className="menu-info">
                            <a
                                className="cover-box"
                                href={`https://www.bilibili.com/audio/au${coverSong.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleOnClickDetailCover}
                            >
                                <Image className="cover" src={coverSong.cover || DEFAULT_COVER}/>
                                <Icon icon="outLink"/>
                            </a>
                            <div className="description">
                                <p className="title">{coverSong.title}</p>
                                {(() => {
                                    if (!coverSong.statistic) return null;
                                    const {play, collect, comment} = coverSong.statistic;
                                    return (
                                        <React.Fragment>
                                            {play !== undefined && <p className="statistic"><span>播放数：</span>{play}</p>}
                                            {collect !== undefined && <p className="statistic"><span>收藏数：</span>{collect}</p>}
                                            {comment !== undefined && <p className="statistic"><span>评论数：</span>{comment}</p>}
                                        </React.Fragment>
                                    );
                                })()}
                            </div>
                        </div>
                    </header>
                    <IntroductionSection>
                        <h1>简介
                            <button onClick={handleOnClickDownloadMedia}><Icon icon="download"/>下载歌曲</button>
                        </h1>
                        <pre>{coverSong.intro}</pre>
                    </IntroductionSection>
                    <TagSection>分类：{coverSong.tags && coverSong.tags.map(({info}) => info).join('、')}</TagSection>
                    {coverSong.members && coverSong.members.length > 0 && <MemberSection>
                        <h1>创作团队</h1>
                        <ul>
                            {coverSong.members.map((member) => (
                                <li key={member.type}>
                                    <span>{getMemberStrByType(member.type)}:</span> {member.list.map(({name}) => name).join('/')}
                                </li>
                            ))}
                        </ul>
                    </MemberSection>}
                    {coverSong.lyric && coverSong.lrcData && coverSong.lrcData.length > 0 && coverSong.lrcData[0].length > 0 && <LrcSection>
                        <h1>歌词
                            <button onClick={handleOnClickDownloadLRC}><Icon icon="download"/>Download LRC</button>
                        </h1>
                        {coverSong.lrcData.map((sentence, index) => <p key={index}>{sentence[3]}</p>)}
                    </LrcSection>}
                </div>)}
            </Wrapper>
        </React.Fragment>
    );
};
Viewer.propTypes = {
    userMenu: PropTypes.any,
    song: PropTypes.any,
};
