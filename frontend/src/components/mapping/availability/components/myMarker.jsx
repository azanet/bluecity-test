import React from 'react';
import PropTypes from 'prop-types';

/**
|--------------------------------------------------
| Material UI
|--------------------------------------------------
*/
import Typography from '@material-ui/core/Typography';

/**
|--------------------------------------------------
| Libraries
|--------------------------------------------------
*/
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
|--------------------------------------------------
| Styled
|--------------------------------------------------
*/
import { ColorMarker } from '../styled/styles';

/**
|--------------------------------------------------
| Constants
|--------------------------------------------------
*/

const MyMarker = ({ color, state, text, icon }) => {

  return (
    <>
      {icon !== null ?
        <>
          <ColorMarker color={color} component="span">
            {/* {icon !== null ? <FontAwesomeIcon icon={icon} /> : <></>} */}
            <FontAwesomeIcon icon={icon} />
          </ColorMarker>{state} {text}<br />
        </>
        :
        <>
        {/* <Typography style={{ fontWeight: 600 }} component="span"> */}
            {state} {text}
        {/* </Typography> */}
        </>
      }

    </>
  )
};

MyMarker.propTypes = {
  color: PropTypes.string.isRequired,
  state: PropTypes.number,
  text: PropTypes.string.isRequired
};

export default MyMarker;