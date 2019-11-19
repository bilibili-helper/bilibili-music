/**
 * Author: DrowsyFlesh
 * Create: 2019/11/19
 * Description:
 */
import {Icon} from 'Components/Icon';
import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';
import styled from 'styled-components';

const EMPTY_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const Wrapper = styled.div.attrs({
    className: 'song-window',
})`
`;

const Cover = styled.img`
  position: absolute;
  width: 64px;
  height: 64px;
  bottom: 6px;
  left: 6px;
  //margin: 0px auto -80px 6px;
  margin-bottom: -10px;
  border-radius: 4px;
  background-color: #ddd;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 6px -2px;
  opacity: 0;
  cursor: pointer;
  -webkit-user-drag: none;
  transition: opacity 300ms, margin 300ms;
  
  &.show {
    opacity: 1;
    margin-bottom: 0px;
  }
  
  &.expand {
    opacity: 0;
    margin-top: 6px;
    margin-bottom: -70px;
  }
`;

const SongDetailWrapper = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: calc(100% - 42px);
  
  backdrop-filter: blur(20px);
  transform: translate(0px, 500px);
  transition: transform 300ms;
  will-change: transform, backdrop-filter;
  z-index: -1;
  
  &.expand {
    transform: translate(0px, 0px);
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

export const Song = function({song}) {
    const [displayWindow, setDisplayWindow] = useState(false);
    // 当前歌曲封面被点击
    const handleOnClickCover = useCallback(() => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-播放器',
            category: '封面',
            label: song.id,
        });
        //setDisplayWindow(!displayWindow);
    }, [displayWindow]);
    return (
        <Wrapper className={displayWindow ? 'expand' : ''}>
            <a
                href={song ? `https://www.bilibili.com/audio/au${song.id}` : null}
                target="_blank"
                rel="noopener noreferrer"
            >
            <Cover
                className={[
                    song && song.cover ? 'show' : '',
                    displayWindow ? 'expand' : '',
                ]}
                src={song ? song.cover : EMPTY_IMAGE_SRC}
                onClick={handleOnClickCover}
            />
            </a>

            <SongDetailWrapper className={[displayWindow ? 'expand' : '']}>
                <CloseBtn/>
                <div className="song-information">
                    <img className="cover"/>
                    <p className="name"></p>
                    <p className="author"></p>
                    <p className="uploader"></p>
                    <p className="duration"></p>
                    <p className="intro"></p>
                </div>
            </SongDetailWrapper>
        </Wrapper>
    );
};
Song.propTypes = {
    song: PropTypes.any,
};
