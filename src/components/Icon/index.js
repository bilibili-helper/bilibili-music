/**
 * Author: Ruo
 * Create: 2018-07-29
 * Description: 图标
 */
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const iconList = {
    128: chrome.extension.getURL('statics/imgs/icon/128.png'),
};

const IconView = styled.div.attrs({
    className: ({icon}) => icon ? `bilibili-music-iconfont bilibili-music-icon-${icon}` : 'icon',
})`
  display: inline-block;
  width: ${props => props.size || 36}px;
  height: ${props => props.size || 36}px;
  font-size: ${props => props.size || 36}px !important;
  ${({icon}) => icon ? 'font-family: bilibili-music-iconfont' : ''};
  background-image: url(${({icon}) => iconList[icon]});
  background-position: center;
  background-repeat: no-repeat;
  background-size: ${props => props.image ? '100%' : '60%'};
  margin: ${props => props.image ? '0 12px 0 0' : ''};
  -webkit-font-smoothing: antialiased;
`;

export class Icon extends React.Component {
    propTypes = {
        icon: PropTypes.any,
        image: PropTypes.bool,
        size: PropTypes.number,
    }
    render() {
        const {icon, image = false, size = 16, ...rest} = this.props;
        return <IconView icon={icon} image={image} size={size} {...rest}></IconView>;
    }
}
