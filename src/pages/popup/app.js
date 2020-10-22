/**
 * Author: DrowsyFlesh
 * Create: 2019/12/26
 * Description:
 */
import {Banner} from 'Modules/home/UI/Banner';
import {SongListSection} from 'Modules/home/UI/SongListSection';
import {SongMenu} from 'Modules/home/UI/SongMenu';
import {SongList} from 'Modules/player/UI/SongList';
import React, {useEffect, useState} from 'react';
import {Player} from 'Modules/player/UI/Player';
import {Viewer} from 'Modules/mediaViewer/UI/Viewer';
import {VideoSearcher} from 'Modules/home/UI/VideoSearcher';
import styled from 'styled-components';

const Wrapper = styled.div.attrs({id: 'home'})`
  width: 320px;
  height: 500px;
  max-width: 320px;
  //min-height: 500px;
  padding-bottom: 64px;
  box-sizing: border-box;
  overflow: hidden auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const App = function() {
    const [data, setData] = useState({});
    const [song, setSong] = useState(null);
    const [songList, setSongList] = useState([]);
    const [showSongList, setShowSongList] = useState(false);
    const [showSongMenu, setSongMenuShow] = useState(false);
    const [showSongViewer, setShowSongViewer] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({command: 'getData', from: 'home'}, (res) => {
            setData(res);
        });
        chrome.runtime.onMessage.addListener((message) => {
            const {command = '', from = ''} = message;
            if (from !== 'dataManager' && from !== 'mediaDetailBackground') { return true; }

            if ((command === 'starSongMenuSuccessfully' || command === 'unStarSongMenuSuccessfully') && message.data) {
                setData(message.data);
            } else if (command === 'dataUpdated') {
                const {data} = message;
                setData(data);
            }

            return true;
        });
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command = '', from = ''} = message;
            if (command === 'collectedSongSuccessfully' || command === 'cancelCollectSongSuccessfully') {
                const {song} = message;
                setSong(song);
            }
            if (from !== 'playerBackground') { return true; }
            if (command === 'ended') {
                return true;
            } else if (command === 'pause') { // 暂停或播放结束
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'play') {
                setSong(message.song);
                setSongList(message.songList);
            } else if (command === 'loadstart') {
                setSong(message.song);
            } else if ((command === 'addSongSuccessfully' || command === 'deleteSongSuccessfully' || command === 'modifySongListSuccessfully') && message.songList) {
                setSong(message.song);
                setSongList(message.songList);
            }
            sendResponse();
            return true;
        });

        chrome.runtime.sendMessage({command: 'getSongList', from: 'player'}, ({song, songList}) => {
            setSongList(songList);
            setSong(song);
            console.info(song);
        });
    }, []);

    const {banner = [], recommendList = [], userMenu = [], userCollectedMenu = [], allRank = [], hotRank = []} = data;

    return (
        <React.Fragment>
            <Wrapper>
                <Banner data={banner}/>
                <VideoSearcher/>
                <SongListSection
                    simple
                    topic="热门榜单"
                    setSongMenuShow={setSongMenuShow}
                    menuList={hotRank}
                    userMenu={userMenu}
                />
                <SongListSection
                    simple
                    topic="全部榜单"
                    setSongMenuShow={setSongMenuShow}
                    menuList={allRank}
                    userMenu={userMenu}
                />
                <SongListSection
                    simple topic="收藏歌单"
                    setSongMenuShow={setSongMenuShow}
                    menuList={userCollectedMenu}
                    userMenu={userMenu}
                />
                <SongListSection
                    topic="收藏列表"
                    setSongMenuShow={setSongMenuShow}
                    menuList={userMenu}
                    userMenu={userMenu}
                />
                <SongListSection
                    topic="推荐歌单"
                    setSongMenuShow={setSongMenuShow}
                    menuList={recommendList}
                    userMenu={userMenu}
                />
                <SongMenu
                    show={showSongMenu}
                    setSongMenuShow={setSongMenuShow}
                    userMenu={userMenu}
                    collectedSongMenu={userCollectedMenu}
                    setShowSongList={setShowSongList}
                />
            </Wrapper>
            <Player
                song={song}
                songList={songList}
                setSongList={setSongList}
                showSongList={showSongList}
                setShowSongList={setShowSongList}
            />
            <SongList
                show={showSongList}
                setShow={setShowSongList}
                song={song}
                setSong={setSong}
                songList={songList}
                setSongList={setSongList}
            />
            <Viewer
                song={song}
                show={showSongViewer}
                setShow={setShowSongViewer}
                userMenu={userMenu}
                setShowSongList={setShowSongList}
            />
        </React.Fragment>
    )
}
