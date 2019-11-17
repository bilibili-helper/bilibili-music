/**
 * Author: DrowsyFlesh
 * Create: 2019/11/16
 * Description:
 */
import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import {Icon} from 'Components/Icon';

const Wrapper = styled.div.attrs({
    id: 'login',
})`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.85);
  z-index: 100;
  will-change: backdrop-filter;
  
  @supports (backdrop-filter: blur(10px)) {
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const Logo = styled(Icon)`
  display: block;
  //color: #FE98B5;
  color: #FE98B5;
  text-shadow: rgba(254,152,181,0.5) 0px 2px 6px;
`;

const Title = styled.h1`
  margin-bottom: 172px;
  color: #FE98B5;
`;

const LoginBtn = styled.a`
  position: absolute;
  right: auto;
  bottom: 48px;
  left: auto;
  display: block;
  width: 150px;
  height: 32px;
  line-height: 32px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 6px -2px;
  text-align: center;
  text-decoration: none;
  background-color: #fff;
  color: #333;
  cursor: pointer;
  outline: none;
  transition: opacity 300ms;
  
  &:hover {
    opacity: 0.75;
  }
  
  &:active {
    opacity: 1;
  }
`;

export const Login = function() {
    const [permissionMap, setPermissionMap] = useState({login: {pass: true}});
    useEffect(() => {
        chrome.runtime.onMessage.addListener(((message) => {
            if (message.command === 'permissionUpdate') {
                permissionMap[message.permission] = {pass: message.value, msg: message.msg};
                setPermissionMap(permissionMap);
            }
            return true;
        }));
        chrome.runtime.sendMessage({command: 'getPermissionMap', featureName: 'login'}, (permissionMap) => {
            setPermissionMap(permissionMap);
        });
    }, []);

    return (
        permissionMap.login.pass ? null : (
            <Wrapper>
                <Logo icon="logo" size={100}/>
                <Title>哔哩哔哩音乐</Title>
                <LoginBtn href="https://passport.bilibili.com/login" target="_blank">登录</LoginBtn>
            </Wrapper>
        )
    );
};
