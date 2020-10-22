/**
 * Author: DrowsyFlesh
 * Create: 2020/10/21
 * Description:
 */
import {Icon} from 'Components/Icon';
import {Image} from 'Components/Image';
import React, {useState, useCallback} from 'react';
import PropTypes from 'prop-types';
import styled, {keyframes} from 'styled-components';
import {av2bv} from 'Utils/functions';

const fadeInFromTop = keyframes`
  0% {
    opacity: 0;
    transform: translate(0, -10px);
  }
  100% {
    transform: translate(0, 0px);
    opacity: 1;
  }
`;

const fadeInFromBottom = keyframes`
  0% {
    opacity: 0;
    transform: translate(0, 10px);
  }
  100% {
    transform: translate(0, 0px);
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  0% {
    opacity: 1;
    transform: translate(0, 0px);
  }
  100% {
    transform: translate(0, -10px);
    opacity: 0;
  }
`;

const Wrapper = styled.div.attrs({
    className: 'video-searcher',
})`
  position: relative;
  margin: -4px 8px -4px;
  padding: 8px;
  box-shadow: rgba(153, 153, 153, 0.5) 0px 0px 0px inset;
  border-radius: 8px;
  animation-name: ${fadeInFromBottom};
  animation-duration: 300ms;
  animation-fill-mode: backwards;
  animation-timing-function: ease-out;
  transition: box-shadow 500ms ease 0s, background-color 300ms ease 0s;
  
  &:focus-within {
    box-shadow: rgba(153, 153, 153, 0.5) 0px 0px 4px inset;
    .result-list.active {
      animation-name: ${fadeInFromTop};
    }
  }
  
  &:not(:focus-within) {
    //z-index: 0;
    input:valid {
      box-shadow:rgba(153, 153, 153, 0.5) 0px 0px 2px inset;
      color: #333;
    }
  }
  
  input {
    display: block;
    width: calc(100% - 16px);
    height: 24px;
    padding: 4px 8px;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    //box-shadow: rgba(153, 153, 153, 0.5) 0px 0px 4px inset;
    outline: none;
    transition: box-shadow 350ms ease 0s;
    text-align: center;
    
    &:invalid {
      box-shadow: rgba(153, 153, 153, 0.5) 0px 0px 4px inset;
    }
    
    &:focus {
      box-shadow: rgba(153, 153, 153, 0.5) 0px 0px 0px inset;
    }
    
    &::placeholder {
      color: #ccc;
      font-size: 14px;
      text-transform: initial;
    }
  }
  .result-list {
    position: absolute;
    top: 45px;
    display: flex;
    width: calc(100% - 16px);
    max-height: 100px;
    background-color: #fff;
    box-shadow: rgba(191, 191, 191, 0.5) 0px 3px 4px;
    border-radius: 2px 2px 4px 4px;
    animation-name: ${fadeOut};
    animation-duration: 150ms;
    animation-fill-mode: both;
    animation-timing-function: ease-out;
    outline: none;
    transition: background-color 300ms ease 0s;
    z-index: 1;
    
    &:hover {
      background-color: rgb(249 248 248);
    }
    
    .cover-box {
      width: 50px;
      height: 50px;
      margin: 8px;
      flex-shrink: 0;
      
      img {
        object-fit: cover;
        width: 100%;
        height: 100%;
        border-radius: 4px;
      }
    }
    
    .content {
      width: 180px;
      
      h4 {
        display: -webkit-box;
        height: 34px;
        margin: 8px 8px 0px 0px;
        word-break: break-all;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      p {
        margin: 0px 8px 0px 0px;
      }
    }
    .action-box {
      width: 30px;
      text-align: center;
      
      .bilibili-music-icon-play {
        line-height: 66px;
        color: #777;
        cursor: pointer;
        transition: color 300ms;
        
        &:hover {
          color: #333;
        }
        
        &:active {
          color: #000;
        }
      }
    }
  }
`;
const linkerRegExp = new RegExp(/^(av|ss|ep)?(\d+)$/);
const bvidRegExp = new RegExp(/^(bv|BV)?(\w+)$/);
export const VideoSearcher = function() {
    const [showResultList, setShowResultList] = useState(false);
    const [result, setResult] = useState(false);

    const handleOnKeyPress = useCallback((e) => {
        e.persist();
        const value = e.target.value.trim();
        let hit, id, type;
        //console.log(e.target.value);
        if (e.charCode === 13) {
            const avCheckRes = linkerRegExp.exec(value);
            console.info(avCheckRes);
            if (avCheckRes) {
                if (avCheckRes[1] === 'av') {
                    hit = true;
                    type = 'video';
                    id = av2bv(+avCheckRes[2]);
                } else {
                    console.info(avCheckRes);
                }
            } else {
                const bvCheckRes = bvidRegExp.exec(value);
                if (bvCheckRes && bvCheckRes[1] && bvCheckRes[2]) {
                    hit = true;
                    type = 'video';
                    id = bvCheckRes[0];
                }
            }
            if (hit) {
                chrome.runtime.sendMessage({
                    command: 'getVideoData',
                    type,
                    id,
                }, (res) => {
                    console.info(res);
                    if (res) {
                        setShowResultList(true);
                        setResult(res);
                    }
                });
            }
        }
    }, []);

    const handleOnClickPlay = useCallback(() => {
        chrome.runtime.sendMessage({command: 'setSong', from: 'videoSearcher', song: result});
    }, [result]);
    return (
        <Wrapper>
            <input placeholder="输入 bvid / avid 按回车试听" onKeyPress={handleOnKeyPress} required/>
            <div className={['result-list', showResultList ? 'active' : ''].join(' ')} tabIndex={0}>
                {result && (
                    <React.Fragment>
                        <div className="cover-box">
                            <Image src={result.cover}/>
                        </div>
                        <div className="content">
                            <h4>{result.title}</h4>
                            <p>{result.author}</p>
                        </div>
                        <div className="action-box">
                            <Icon icon="play" size={24} onClick={handleOnClickPlay}/>
                        </div>
                    </React.Fragment>
                )}
            </div>
        </Wrapper>
    );
};
