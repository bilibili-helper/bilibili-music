/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import React, {useState, useEffect} from 'react';
import styled from 'styled-components';
import {Banner} from './Banner';
import {SongListSection} from './SongListSection';

const Wrapper = styled.div.attrs({id: 'home'})`
  width: 320px;
  height: 500px;
  min-width: 320px;
  min-height: 500px;
  padding-bottom: 64px;
  box-sizing: border-box;
  overflow: auto overlay;
  
  &::-webkit-scrollbar {
    //color: black;
    display: none;
  }
`;



export const Home = function() {
    const [data, setData] = useState({});
    useEffect(() => {
        chrome.runtime.sendMessage({command: 'getData'}, (res) => {
            setData(res);
            console.info(res);
        });
    }, []);
    const {banner = [], recommendList = {}} = data;
    return (
        <Wrapper>
            <Banner data={banner}/>
            <SongListSection data={recommendList}/>
        </Wrapper>
    );
};
