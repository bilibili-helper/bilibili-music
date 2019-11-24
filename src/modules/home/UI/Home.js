/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import React, {useState, useEffect, useCallback} from 'react';
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
    display: none;
  }
`;

let initialized = false;

export const Home = function() {
    const [data, setData] = useState({});
    const handleOnDataChange = useCallback((message, sender, sendResponse) => {
        const {command = '', from = ''} = message;
        if (from !== 'dataManager') return true;

        if ((command === 'starSongMenuSuccessfully' || command === 'unStarSongMenuSuccessfully') && message.data) {
            setData(message.data);
            sendResponse();
        }

        return true;
    }, [data]);
    useEffect(() => {
        if (initialized) return;
        initialized = true;
        chrome.runtime.sendMessage({command: 'getData', from: 'home'}, (res) => {
            setData(res);
        });
        chrome.runtime.onMessage.addListener(handleOnDataChange);
    }, []);
    const {banner = [], recommendList = [], userMenu = [], userCollectedMenu = [], allRank = []} = data;
    return (
        <Wrapper>
            <Banner data={banner}/>
            <SongListSection simple topic="全部榜单" menuList={allRank} collectedSongMenu={userCollectedMenu}/>
            <SongListSection simple topic="收藏歌单" menuList={userCollectedMenu} collectedSongMenu={userCollectedMenu}/>
            <SongListSection topic="用户歌单" menuList={userMenu} collectedSongMenu={userCollectedMenu}/>
            <SongListSection topic="推荐歌单" menuList={recommendList} collectedSongMenu={userCollectedMenu}/>
        </Wrapper>
    );
};
