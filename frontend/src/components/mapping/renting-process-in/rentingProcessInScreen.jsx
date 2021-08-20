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
import MyRentingProcessInCard from './components/myRentingProcessInCard';
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
import ScooterDataService from '../../../services/scooter.service';

/**
|--------------------------------------------------
| Constants
|--------------------------------------------------
*/
import {
  RENTING_MODE_INTRODUCING_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED,
  RENTING_MODE_INTRODUCING_SCOOTER_ORDER_TO_OPEN_DOOR_SENT,
  RENTING_MODE_INTRODUCING_SCOOTER_CHARGER_PLUGGED_IN_CONFIRMATION_RECEIVED
} from '../constants/constants';
import { BEGIN_OF_TIMES, getApiUser, NEITHER_PARKING_NOT_RENTING } from '../availability/constants/constants';

const RentingProcessScreen = ({ location, history }) => {

  const { state: { parking, boxId } } = location;

  const { t } = useTranslation();

  const socketRef = useRef();

  const [stateRentingProcess, setStateRentingProcess] = useState(RENTING_MODE_INTRODUCING_SCOOTER_ORDER_TO_OPEN_DOOR_SENT);

  const [doorClosedBeforeDetectorFires, setDoorClosedBeforeDetectorFires] = useState(false);

  const [openMessageHelp, setOpenMessageHelp] = useState(false);

  const [doNotShowThisAgain, setDoNotShowThisAgain] = useState(false);

  const refreshBoxState = () => {
    BoxDataService.get(boxId).then((data) => {
      setStateRentingProcess(
        data.data.state
      );
    });
  }

  const continueWithProcess = () => {
    ScooterDataService.getScooterWithUserId(getApiUser().id).then(data => {
      const scooterData = {
        userId: null,
        lastReservationDate: BEGIN_OF_TIMES,
        boxId
      }
      ScooterDataService.update(data.data.id, scooterData).then(data => {
        const boxData = {
          userId: null,
          lastReservationDate: BEGIN_OF_TIMES,
          state: NEITHER_PARKING_NOT_RENTING,
          occupied: true
        };
        BoxDataService.update(boxId, boxData).then(data => {
          history.push({
            pathname: '/main',
          });
        })
      })
    });

    const data = {
      state: NEITHER_PARKING_NOT_RENTING,
      lastReservationDate: BEGIN_OF_TIMES,
      occupied: true,
      userId: null
    }
    BoxDataService.update(boxId, data).then((res) => {
      history.push("/main")
    }).catch((error) => console.log(error));
  }

  const continueWithWhileRenting = () => {
    console.log("continueWithWhileRenting")
    const boxData = {
      userId: null,
      lastReservationDate: BEGIN_OF_TIMES,
      state: NEITHER_PARKING_NOT_RENTING,
      occupied: false
    };
    BoxDataService.update(boxId, boxData).then(data => {
      history.push({
        pathname: '/while-renting',
      });
    }).catch((error) => console.log(error));
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
        if(data.resetFromServer){
          history.push({
            pathname: '/main',
          });
          return;
        }
        if (data.doorClosedBeforeDetectorFires) {
          setDoorClosedBeforeDetectorFires(true);
          return;
        }
        if(data.resetFromServer){
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
    if (stateRentingProcess === RENTING_MODE_INTRODUCING_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED && !doNotShowThisAgain) {
      setTimeout(function(){
        setOpenMessageHelp(true);
      }, 2000);
      return;
    }
  }, [stateRentingProcess]);

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
            <MyRentingProcessInCard
              parking={parking}
              stateRentingProcess={stateRentingProcess}
              continueWithProcess={continueWithProcess}
              doorClosedBeforeDetectorFires={doorClosedBeforeDetectorFires}
              continueWithWhileRenting={continueWithWhileRenting}
            />
          </Card>
        </Row>
        <Row className='pt-3'>
          <Col>
            {doorClosedBeforeDetectorFires ?
              <MyMarker
                color='blue'
                state={null}
                text={`${t('The door was closed before introducing the scooter')}. ${t('Click continue to try it again...')}.`}
                icon={faInfoCircle}
              />
              :
              stateRentingProcess === RENTING_MODE_INTRODUCING_SCOOTER_ORDER_TO_OPEN_DOOR_SENT
                ?
                <MyMarker
                  color='blue'
                  state={null}
                  text={t('Waiting for the door to get open...')}
                  icon={faInfoCircle}
                />
                : stateRentingProcess === RENTING_MODE_INTRODUCING_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED ?
                  <MyMarker
                    color='blue'
                    state={null}
                    text={t('The door is open. Introduce your scooter, plug it in and close the door.')}
                    icon={faInfoCircle}
                  />
                  : stateRentingProcess === RENTING_MODE_INTRODUCING_SCOOTER_CHARGER_PLUGGED_IN_CONFIRMATION_RECEIVED ?
                    <MyMarker
                      color='blue'
                      state={null}
                      text={t('The scooter is in the box. Close the door.')}
                      icon={faInfoCircle}
                    />
                    :
                    <MyMarker
                      color='blue'
                      state={null}
                      text={t('The door is closed. The parking process of your rented scooter is complete.')}
                      icon={faInfoCircle}
                    />
            }
          </Col>
        </Row>
      </MyContainer>
      <Footer/>
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

RentingProcessScreen.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

export default RentingProcessScreen;
