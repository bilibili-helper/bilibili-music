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
  overflow: hidden;
  
  .banner-item {
    flex-shrink: 0;
    width: 100%;
    cursor: pointer;
    
    img {
      display: block;
      width: 100%;
      border-radius: 4px;
    }
  }
`;

export const Banner = function({data}) {
    return (
        <Wrapper>
            {data.map((item) => {
                return (
                    <div className="banner-item" key={item.bannerId}>
                        <img src={item.bannerImgUrl}/>
                    </div>
                )
            })}
        </Wrapper>
    );
};

Banner.propTypes = {
    data: PropTypes.array,
}
