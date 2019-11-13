/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {Icon} from 'Components/Icon';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div.attrs({'id': 'player'})`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 42px;
  box-sizing: border-box;
  border-radius: 8px 8px 0 0;
  background-color: #eee;
  z-index: 10;
`;

const PlayerBtn = styled(Icon)`
  position: relative;
  margin: 8px;
  border-radius: 50%;
  color: #999;
  cursor: pointer;
  transition: color 300ms;
  &:hover {
    color: #333;
  }
  &:active {
    color: #111;
  }
`;

const StarBtn = styled(PlayerBtn).attrs({
    className: 'star-btn',
})`
  margin-right: auto;
  padding: 8px;
`;

const PlayBtn = styled(PlayerBtn).attrs({
    className: 'play-btn',
})`
  margin: 0 0 30px 0;
  padding: 16px;
  text-indent: 1px;
  border: 10px solid #eee;
  border-radius: 50%;
  background-color: #fff;
`;

const PrevBtn = styled(PlayerBtn).attrs({
    className: 'prev-btn',
})`
  margin-right: 0;
  padding: 8px;
`;

const NextBtn = styled(PlayerBtn).attrs({
    className: 'next-btn',
})`
  margin-left: 0;
  padding: 8px;
`;

const ListBtn = styled(PlayerBtn).attrs({
    className: 'list-btn',
})`
  margin-left: auto;
  padding: 8px;
`;

export const Player = function() {
    return (
        <Wrapper>
            <StarBtn icon="star"/>
            <PrevBtn icon="prev" size={14}/>
            <PlayBtn icon="player"/>
            <NextBtn icon="next" size={14}/>
            <ListBtn icon="list" size={20}/>
        </Wrapper>
    );
};
