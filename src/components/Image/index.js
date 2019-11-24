/**
 * Author: DrowsyFlesh
 * Create: 2019/11/20
 * Description:
 */
import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import styled, {keyframes} from 'styled-components';

const FadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const Img = styled.img.attrs({
    className: 'model-img',
})`
  &:not([src]) {
    content: url("data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");
    border: 1px solid var(--border-color);
    box-sizing: border-box;
    opacity: 0;
  }
  &[src] {
    animation: ${FadeIn} cubic-bezier(0.16, 0.6, 0.45, 0.93);
    animation-duration: 300ms;
  }
`;

export const Image = function({src = '', ...rest}) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const img = new window.Image();
        img.onload = () => setLoaded(true);
        img.src = src;
    }, [src]);

    return (
        <Img src={loaded ? src : null} {...rest}/>
    );
};

Image.propTypes = {
    className: PropTypes.string,
    src: PropTypes.string,
};
