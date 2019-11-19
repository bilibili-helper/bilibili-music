/**
 * Author: DrowsyFlesh
 * Create: 2019/11/19
 * Description:
 */
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Wrapper = styled.div`

`;

export const Message = function({message}) {
    return (
        <Wrapper>{message}</Wrapper>
    )
}

Message.propTypes = {
    message: PropTypes.string,
}
