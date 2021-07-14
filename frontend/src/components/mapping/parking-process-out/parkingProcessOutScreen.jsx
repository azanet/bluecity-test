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
import MyParkingProcessOutCard from './components/myParkingProcessOutCard';
import MyMarker from '../availability/components/myMarker';
import { BEGIN_OF_TIMES } from '../../mapping/availability/constants/constants';
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
  PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PULLED_OUT_CONFIRMATION_RECEIVED,
  PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED,
  PARKING_MODE_PULLING_OUT_SCOOTER_ORDER_TO_OPEN_DOOR_SENT,
  NEITHER_PARKING_NOT_RENTING,
  PARKING_MODE_INTRODUCING_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED
} from '../constants/constants';

const ParkingProcessOutScreen = ({ location, history }) => {

  const { state: { parking, boxId } } = location;

  const { t } = useTranslation();

  const socketRef = useRef();

  const [stateParkingProcess, setStateParkingProcess] = useState(NEITHER_PARKING_NOT_RENTING);

  const [doorClosedBeforeDetectorFires, setDoorClosedBeforeDetectorFires] = useState(false);

  const [openMessageHelp, setOpenMessageHelp] = useState(false);

  const [doNotShowThisAgain, setDoNotShowThisAgain] = useState(false);

  const continueWithProcess = () => {
    console.log("continueWithProcess")
    const data = {
      state: 0,
      lastReservationDate: BEGIN_OF_TIMES,
      occupied: false,
      userId: null
    }
    BoxDataService.update(boxId, data).then((res) => {
      history.push("/main")
    }).catch((error) => console.log(error));
  }

  const continueWithWhileParking = () => {
    console.log("continueWithWhileParking")
    const data = {
      state: PARKING_MODE_INTRODUCING_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED
    }
    BoxDataService.update(boxId, data).then((res) => {
      history.push({
        pathname: "/while-parking",
        state: {
          parking,
          boxId
        },
      });
    }).catch((error) => console.log(error));
  }

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
    socketRef.current = socketIOClient(process.env.REACT_APP_BASEURL);

    socketRef.current.on('welcome', () => {
      console.log('connected to backend');
    });

    socketRef.current.on('refresh-box-state', data => {
      if (data.boxId === boxId) {
        if (data.doorClosedBeforeDetectorFires) {
          setDoorClosedBeforeDetectorFires(true);
          return;
        }
        if (data.resetFromServer) {
          history.push("/main");
          return;
        }
        refreshBoxState();
      }
    });

    return () => {
      socketRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    if (stateParkingProcess === PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED && !doNotShowThisAgain) {
      setTimeout(function(){
        setOpenMessageHelp(true);
      }, 2000);
      return;
    }
  }, [stateParkingProcess]);

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
            <MyParkingProcessOutCard
              parking={parking}
              stateParkingProcess={stateParkingProcess}
              continueWithProcess={continueWithProcess}
              doorClosedBeforeDetectorFires={doorClosedBeforeDetectorFires}
              continueWithWhileParking={continueWithWhileParking}
            />
          </Card>
        </Row>
        <Row className='pt-3'>
          <Col>
            {doorClosedBeforeDetectorFires ?
              <MyMarker
                color='blue'
                state={null}
                text={`${t('The door was closed before pulling out the scooter')}. ${t('Click continue to try it again...')}.`}
                icon={faInfoCircle}
              />
              :
              stateParkingProcess === PARKING_MODE_PULLING_OUT_SCOOTER_ORDER_TO_OPEN_DOOR_SENT
                ?
                <MyMarker
                  color='blue'
                  state={null}
                  text={t('Waiting for the door to get open...')}
                  icon={faInfoCircle}
                />
                : stateParkingProcess === PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED ?
                  <MyMarker
                    color='blue'
                    state={null}
                    text={t('The door is opened. Please, pull out your scooter and unplug the charger.')}
                    icon={faInfoCircle}
                  />
                  : stateParkingProcess === PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PULLED_OUT_CONFIRMATION_RECEIVED ?
                    <MyMarker
                      color='blue'
                      state={null}
                      text={t('You have pulled your scooter out. Please, close the door.')}
                      icon={faInfoCircle}
                    />
                    :
                    <MyMarker
                      color='blue'
                      state={null}
                      text={t('The door is closed. Thank you for using our service.')}
                      icon={faInfoCircle}
                    />
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

ParkingProcessOutScreen.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

export default ParkingProcessOutScreen;
