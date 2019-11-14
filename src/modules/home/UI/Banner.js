/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div.attrs({
    id: 'banner',
})`
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  margin: 16px;
  overflow: auto;

  &::-webkit-scrollbar {
    display: none;
  }  
  
  .banner-item {
    flex-shrink: 0;
    width: 100%;
    cursor: pointer;
    
    &:first-of-type img {
        border-radius: 4px 0 0 4px;
      }
      
      &:last-of-type img {
        border-radius: 0 4px 4px 0;
      }
    
    img {
      display: block;
      width: 100%;
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

export const Banner = function({data}) {
    return (
        <Wrapper>
            {data.map((item) => {
                return (
                    <div className="banner-item" key={item.bannerId}>
                        <a href={dealWithCoverSchema(item.schema)} target="_blank" rel="noopener noreferrer"><img src={item.bannerImgUrl}/></a>
                    </div>
                );
            })}
        </Wrapper>
    );
};

Banner.propTypes = {
    data: PropTypes.array,
};
