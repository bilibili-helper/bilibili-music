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
import {av2bv} from 'Utils/functions';

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
  transition: color 300ms;
  z-index: 1;
  
  &:hover {
    color: #eee;
  }
  
  &:active {
    color: #ccc;
  }
`;

const CoverBox = styled.div`
  position: absolute;
  width: 64px;
  height: 64px;
  bottom: 6px;
  left: 6px;
  border-radius: 4px;
  backdrop-filter: blur(14px);
  background-color: rgb(221 221 221 / 7%);
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
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
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
          height: 100%;
          border-radius: 8px;
          box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 6px -2px;
          user-select: none;
          -webkit-user-drag: none;
          object-fit: cover;
        }
      }
      
      
      
      .description {
        color: #333;
        p {
          width: 160px;
        }
        .title {
          display: -webkit-box;
          max-height: 40px;
          font-size: 14px;
          font-weight: bold;
          text-overflow: ellipsis;
          word-break: break-all;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
    word-break: break-all;
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
  
  a {
    margin-right: 6px;
    line-height: 24px;
    color: initial;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
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
        case 8:
            return '音源';
        case 9:
            return '调音';
        case 10:
            return '演奏';
        case 11:
            return '乐器';
        case 127:
            return '上传者';
        case 1000:
            return 'UP主';
        case 1001:
            return '视频制作';
    }
};

export const Viewer = function({song: coverMedia, userMenu, setShow, show, setShowSongList}) {
    const [detailMedia, setDetailMedia] = useState(null);
    //const [coverMedia, setCoverMedia] = useState(song);
    const coverMediaStarted = coverMedia && coverMedia.collectIds && coverMedia.collectIds.length > 0;
    const detailMediaStarted = detailMedia && detailMedia.collectIds && detailMedia.collectIds.length > 0;

    const handleOnClickStarBtn = useCallback((collected = false) => {
        chrome.runtime.sendMessage({
            command: 'collectSong',
            from: 'player',
            sid: detailMedia.id,
            cid: collected ? '' : userMenu[0].id,
        });
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-媒体详情页',
            category: '收藏按钮',
        });
    }, [detailMedia, userMenu]);

    // 封面点击
    const handleOnClickCover = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '封面',
            label: detailMedia.id,
        });
        if (!show && coverMedia) {
            chrome.runtime.sendMessage({
                command: 'viewMedia',
                from: 'player',
                type: coverMedia.type,
                song: coverMedia,
                sid: coverMedia.id,
            });
        } else {
            setShow(!show);
        }
    }, [show, coverMedia, detailMedia]);

    // 点击下载歌词
    const handleOnClickDownloadLRC = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'downloadLrc',
            from: 'mediaViewer',
            song: detailMedia,
        });
    }, [detailMedia]);

    // 封面外链点击事件
    const handleOnClickDetailCover = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-媒体详情页',
            category: '封面',
            label: detailMedia.id,
        });
        if (detailMedia.type === 'audio') {
            window.open(`https://www.bilibili.com/audio/au${detailMedia.id}`, '__blank');
        } else if (detailMedia.type === 'video') {
            window.open(`https://www.bilibili.com/video/${av2bv(detailMedia.aid)}`, '__blank');
        }
    }, [detailMedia]);

    // 下载媒体事件
    const handleOnClickDownloadMedia = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-媒体详情页',
            category: '下载媒体',
            label: coverMedia.id,
        });
        chrome.runtime.sendMessage({
            command: 'downloadMedia',
            from: 'mediaViewer',
            song: coverMedia,
        });
    }, [coverMedia]);

    const handleOnClickPlayMedia = useCallback(() => {
        chrome.runtime.sendMessage({command: 'setSong', from: 'videoSearcher', song: detailMedia});
    }, [detailMedia]);

    const handleOnMessageListener = useCallback((message, sender, sendResponse) => {
        const {command = '', from = ''} = message;
        if (from !== 'playerBackground' && from !== 'mediaDetailBackground') return true;
        console.info(message);
        if (command === 'hideViewer') {
            setShow(false);
        } else if (command === 'ended') {
            return true;
        } else if (command === 'pause') { // 暂停或播放结束
            //setCoverMedia(message.song);
        } else if (command === 'play') {
            //setCoverMedia(message.song);
        } else if (command === 'loadstart') {
            //setCoverMedia(message.song);
        } else if ((command === 'addSongSuccessfully' || command === 'deleteSongSuccessfully' || command === 'modifySongListSuccessfully') && message.songList) {
            const {song} = message;
            if (song && coverMedia && song.id !== coverMedia.id) {
                //setCoverMedia(song);
            }
        } else if (command === 'collectedSongSuccessfully' || command === 'cancelCollectSongSuccessfully') {
            const {song} = message;
            console.info(song, detailMedia);
            if (song && detailMedia && song.id === detailMedia.id) {
                setDetailMedia({detailMedia, ...song});
            } else if (song && coverMedia && song.id === coverMedia.id) {
                //setCoverMedia(song);
            }
        } else if (command === 'setSongViewSuccessfully' && message.song) { // 暂停或播放结束
            setDetailMedia(message.song);
            setShowSongList(false);
            setShow(true);
        }
        sendResponse();
        return true;
    }, [detailMedia]);

    useEffect(() => {
        if (!detailMedia && coverMedia) {
            setDetailMedia(coverMedia);
        }
        chrome.runtime.onMessage.addListener(handleOnMessageListener);
        return () => chrome.runtime.onMessage.removeListener(handleOnMessageListener);
    }, [coverMedia, detailMedia]);

    //console.log(detailMedia);

    return (
        <React.Fragment>
            <CoverBox className={coverMedia && coverMedia.cover ? 'show' : null}>
                <CoverBtn
                    alt={coverMedia ? coverMedia.title : null}
                    src={coverMedia ? coverMedia.cover : EMPTY_IMAGE_SRC}
                    onClick={() => coverMedia ? handleOnClickCover() : null}
                />
                {coverMedia && coverMedia.type === 'audio' && (
                    <StarBtn
                        icon="star"
                        size={14}
                        className={coverMediaStarted ? 'collected' : null}
                        disabled={!coverMedia}
                        onClick={() => handleOnClickStarBtn(coverMediaStarted)}
                    />
                )}
                <i className={`bilibili-music-iconfont bilibili-music-icon-right-dashed ${show ? 'show-viewer' : null}`}/>
            </CoverBox>
            <Wrapper className={show ? 'show' : null}>
                <CloseBtn icon="down" onClick={() => setShow(false)}/>
                {detailMedia && (<div className="content">
                    <header>
                        <div className="menu-info">
                            <a
                                className="cover-box"
                                //href={`https://www.bilibili.com/audio/au${detailMedia.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleOnClickDetailCover}
                            >
                                <Image className="cover" src={detailMedia.cover || DEFAULT_COVER}/>
                                <Icon icon="outLink"/>
                            </a>
                            <div className="description">
                                <p className="title">{detailMedia.title}</p>
                                {(() => {
                                    if (!detailMedia.statistic) return null;
                                    const {play, collect, comment} = detailMedia.statistic;
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
                        <div className="extra-tools">
                            {!detailMedia.playing && (
                                <button
                                    className="play-all-btn"
                                    disabled={!detailMedia}
                                    onClick={handleOnClickPlayMedia}
                                >
                                    <Icon icon="play"/>播放
                                </button>
                            )}
                            {/*{detailMedia.type === 'audio' && (
                                <button
                                    className="star-btn"
                                    disabled={!detailMedia}
                                    onClick={() => handleOnClickStarBtn(detailMediaStarted)}
                                >
                                    <Icon icon="star"/>{detailMediaStarted ? '取消收藏' : '收藏'}
                                </button>
                            )}*/}
                        </div>
                    </header>
                    <IntroductionSection>
                        <h1>简介
                            <button onClick={handleOnClickDownloadMedia}><Icon icon="download"/>下载歌曲</button>
                        </h1>
                        <pre>{detailMedia.intro}</pre>
                    </IntroductionSection>
                    <TagSection>分类：{detailMedia.tags && detailMedia.tags.map(({info}, index) => (
                        <a
                            key={index}
                            href={`https://search.bilibili.com/all?keyword=${info}&from_source=video_tag`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >{info}</a>
                    ))}</TagSection>
                    {detailMedia.members && detailMedia.members.length > 0 && <MemberSection>
                        <h1>创作团队</h1>
                        <ul>
                            {detailMedia.members.map((member) => (
                                <li key={member.type}>
                                    <span>{getMemberStrByType(member.type)}:</span> {member.list.map(({name}) => name).join('/')}
                                </li>
                            ))}
                        </ul>
                    </MemberSection>}
                    {detailMedia.lyric && detailMedia.lrcData && detailMedia.lrcData.length > 0 && detailMedia.lrcData[0].length > 0 && <LrcSection>
                        <h1>歌词
                            <button onClick={handleOnClickDownloadLRC}><Icon icon="download"/>下载 LRC 文件</button>
                        </h1>
                        {detailMedia.lrcData.map((sentence, index) => <p key={index}>{sentence[3]}</p>)}
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
