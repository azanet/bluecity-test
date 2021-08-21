import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import socketIOClient from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../ui/footer';

/**
|--------------------------------------------------
| Components
|--------------------------------------------------
*/
import { MyNavbar } from '../../ui/navbar/my-navbar';
import { MyContainer } from '../../ui/my-container';
import MyParkingProcessInCard from './components/myParkingProcessInCard';
import MyMarker from '../availability/components/myMarker';
import { getSessionDoNotShowThisAgain, setSessionDoNotShowThisAgain } from '../../../utils/common';

/**
|--------------------------------------------------
| Libraries
|--------------------------------------------------
*/
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Row, Col, Card } from 'react-bootstrap';

import Image from 'material-ui-image'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import Checkbox from '@material-ui/core/Checkbox';

/**
|--------------------------------------------------
| Services
|--------------------------------------------------
*/
import BoxDataService from '../../../services/box.service';

/**
|--------------------------------------------------
| Constants
|--------------------------------------------------
*/
import {
  TIMEOUT_FORCE_BOX_FREE,
  PARKING_MODE_INTRODUCING_SCOOTER_ORDER_TO_OPEN_DOOR_SENT,
  PARKING_MODE_INTRODUCING_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED,
  PARKING_MODE_INTRODUCING_SCOOTER_CHARGER_PLUGGED_IN_CONFIRMATION_RECEIVED,
  PARKING_MODE_INTRODUCING_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED,
  NEITHER_PARKING_NOT_RENTING
} from '../constants/constants';
import { BEGIN_OF_TIMES } from '../availability/constants/constants';

const ParkingProcessInScreen = ({ location, history }) => {

  const { state: { parking, boxId } } = location;

  const { t } = useTranslation();

  const socketRef = useRef();

  const [stateParkingProcess, setStateParkingProcess] = useState(NEITHER_PARKING_NOT_RENTING);

  const openBoxTimeout = useRef(null);

  const [noResponseFromParkingDevice, setNoResponseFromParkingDevice] = useState(false);

  const [doorClosedBeforeDetectorFires, setDoorClosedBeforeDetectorFires] = useState(false);

  const [openMessageHelp, setOpenMessageHelp] = useState(false);

  const [doNotShowThisAgain, setDoNotShowThisAgain] = useState(false);

  const refreshBoxState = () => {
    BoxDataService.get(boxId).then((data) => {
      setStateParkingProcess(
        data.data.state
      );
    });
  }

  useEffect(() => {
    refreshBoxState();

    setDoNotShowThisAgain(getSessionDoNotShowThisAgain());
  }, []);

  useEffect(() => {
    if (stateParkingProcess === PARKING_MODE_INTRODUCING_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED && !doNotShowThisAgain) {
      setTimeout(function(){
        setOpenMessageHelp(true);
      }, 2000);
      return;
    }

    if (stateParkingProcess === PARKING_MODE_INTRODUCING_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED) {
      history.push({
        pathname: "/while-parking",
        state: {
          parking,
          boxId: boxId
        },
      });
    }
  }, [stateParkingProcess]);

  useEffect(() => {
    socketRef.current = socketIOClient(process.env.REACT_APP_BASEURL);

    socketRef.current.on('welcome', () => {
      // console.log('connected to backend');
    });

    socketRef.current.on('refresh-box-state', data => {
      if (data.boxId === boxId) {
        if (data.resetFromServer) {
          history.push({
            pathname: "/main"
          });
          return;
        }
        if (data.doorClosedBeforeDetectorFires) {
          setDoorClosedBeforeDetectorFires(true);
          return;
        }
        console.log("box state will be refreshed");
        refreshBoxState();
      }
    });

    return () => {
      socketRef.current.disconnect();
    }
  }, []);

  const continueWithProcess = () => {
    const boxData = {
      state: NEITHER_PARKING_NOT_RENTING,
      lastReservationDate: BEGIN_OF_TIMES,
      userId: null
    };
    BoxDataService.update(boxId, boxData).then(data => {
      history.push({
        pathname: "/main"
      })
    });
  }

  
  useEffect(() => {
    openBoxTimeout.current = setTimeout(function () {
      BoxDataService.get(boxId).then(data => {
        if (data.data.state === NEITHER_PARKING_NOT_RENTING ||
          data.data.state === PARKING_MODE_INTRODUCING_SCOOTER_ORDER_TO_OPEN_DOOR_SENT ||
          data.data.state === PARKING_MODE_INTRODUCING_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED ||
          data.data.state === PARKING_MODE_INTRODUCING_SCOOTER_CHARGER_PLUGGED_IN_CONFIRMATION_RECEIVED 
          ) {
          setNoResponseFromParkingDevice(true);
        }
      });
    }, TIMEOUT_FORCE_BOX_FREE);

    return () => {
      if (openBoxTimeout.current !== null) clearTimeout(openBoxTimeout.current);
    }
  }, []);

   
  
  const handleClose = () => {
    setOpenMessageHelp(false);
  };

  const handleChange = (event) => {
    setSessionDoNotShowThisAgain(event.target.checked);
  };

  return (
    <>
      <MyNavbar history={history} />
      <MyContainer>
        <Row>
          <Card className='m-2'>
            <MyParkingProcessInCard
              parking={parking}
              stateParkingProcess={stateParkingProcess}
              noResponseFromParkingDevice={noResponseFromParkingDevice}
              continueWithProcess={continueWithProcess}
              doorClosedBeforeDetectorFires={doorClosedBeforeDetectorFires}
            />
          </Card>
        </Row>
        <Row className='pt-3'>
          <Col>
            {doorClosedBeforeDetectorFires ?
              <MyMarker
                color='blue'
                state={null}
                text={`${t('The door was closed before introducing the scooter')}. ${t('Click continue to start parking again...')}.`}
                icon={faInfoCircle}
              />
              :
              stateParkingProcess === PARKING_MODE_INTRODUCING_SCOOTER_ORDER_TO_OPEN_DOOR_SENT
                ?
                <MyMarker
                  color='blue'
                  state={null}
                  text={t('Waiting for the door to get open...')}
                  icon={faInfoCircle}
                />
                : stateParkingProcess === PARKING_MODE_INTRODUCING_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED ?
                  <MyMarker
                    color='blue'
                    state={null}
                    text={t('The door is opened. Please, introduce your scooter and plug the charger in.')}
                    icon={faInfoCircle}
                  />
                  : stateParkingProcess === PARKING_MODE_INTRODUCING_SCOOTER_CHARGER_PLUGGED_IN_CONFIRMATION_RECEIVED ?
                    <MyMarker
                      color='blue'
                      state={null}
                      text={t('The scooter is in the box. Please, close the door.')}
                      icon={faInfoCircle}
                    />
                    :
                    <>
                      <MyMarker
                        color='blue'
                        state={null}
                        text={t('The door is closed. The parking process is complete.')}
                        icon={faInfoCircle}
                      />
                    </>
            }
          </Col>
        </Row>
      </MyContainer>
      <Footer />
      <Dialog
        open={openMessageHelp}
        onClose={handleClose}
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">{t("The door didn't open?")}</DialogTitle>
        <DialogContent dividers={true}>
          <DialogContentText
            id="scroll-dialog-description"
          // ref={descriptionElementRef}
          // tabIndex={-1}
          >
            {t("Press on the logo at the right left corner of the door to open it.")}
            <Image src="img/doorDoNotOpen.svg" />
          </DialogContentText>
          <Checkbox
            onChange={handleChange}
            disableRipple
            color="primary"
            inputProps={{ 'aria-label': 'decorative checkbox' }}
          />{t("Don't show this again")}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
};

ParkingProcessInScreen.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

export default ParkingProcessInScreen;
