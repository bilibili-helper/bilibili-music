/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import styled, {keyframes} from 'styled-components';

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

const Wrapper = styled.div.attrs({
    id: 'banner',
})`
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  margin: 8px;
  padding: 8px;
  border-radius: 8px;
  overflow: auto;
  box-shadow: inset 0px 0px 0px #999;
  transition: box-shadow 300ms, background-color 300ms;
  animation-name: ${fadeIn};
  animation-duration: 300ms;
  animation-fill-mode: backwards;
  animation-timing-function: ease-out;
  will-change: box-shadow, background-color;
  
  &:hover {
    box-shadow: rgba(153, 153, 153, 0.5) 0px 0px 8px inset;
    .banner-item img {
      box-shadow: rgba(191, 191, 191, 0.5) 0px 0px 0px;
    }
  }
  
  &:active {
      background-color: #eee;
    }

  &::-webkit-scrollbar {
    display: none;
  }  
  
  .banner-item {
    flex-shrink: 0;
    margin-right: 8px;
    width: 100%;
    cursor: pointer;
    border-radius: 8px;
      
    &:last-of-type {
      margin-right: 0;
      padding-right: 8px;
    }
    
    img {
      display: block;
      width: 100%;
      border-radius: 8px;
      -webkit-user-drag: none;
      transition: box-shadow 300ms;
      box-shadow: rgba(191, 191, 191, 0.5) 0px 3px 6px;
      will-change: transition;
    }
  }
`;

const dealWithCoverSchema = (schema) => {
    const am = /bilibili:\/\/music\/menu\/detail\/(\d+)/.exec(schema);
    if (am) return `https://www.bilibili.com/audio/am${am[1]}?type=2`;

    const au = /bilibili:\/\/music\/detail\/(\d+)/.exec(schema);
    if (au) return `https://www.bilibili.com/audio/au${au[1]}`;

    return schema;
};

export const Banner = function({data = []}) {
    const handleOnClickBanner = useCallback((banner) => {
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-Banner',
            category: 'Banner',
            label: banner.bannerId,
        });
    }, []);

    return (
        <Wrapper>
            {data.map((item) => {
                return (
                    <div className="banner-item" key={item.bannerId}>
                        <a
                            href={dealWithCoverSchema(item.schema)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleOnClickBanner(item.bannerId)}
                        >
                            <img src={item.bannerImgUrl}/>
                        </a>
                    </div>
                );
            })}
        </Wrapper>
    );
};

Banner.propTypes = {
    data: PropTypes.array,
};
