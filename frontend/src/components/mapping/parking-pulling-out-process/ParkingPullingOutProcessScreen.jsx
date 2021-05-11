//ATENTION: THIS FILE COULD/SHOULD BE MERGED WITH AvailabilityScreen.jsx IN THE FUTURE
//          NOW IT'S JUST A WAY TO WORK IN A MORE UNDERSTANDABLE WAY

import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import socketIOClient from "socket.io-client";

/**
|--------------------------------------------------
| Components
|--------------------------------------------------
*/
import { MyNavbar } from "../../ui/navbar/my-navbar";
import { MyContainer } from "../../ui/my-container";
import { Footer } from "../../ui/footer";
import MyPullingOutParkingProcessCard from "./components/myParkingPullingOutProcessCard";
import MyMarker from "../availability/components/myMarker";

/**
|--------------------------------------------------
| Libraries
|--------------------------------------------------
*/
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Row, Col, Card } from "react-bootstrap";

/**
|--------------------------------------------------
| Services
|--------------------------------------------------
*/
import BoxDataService from "../../../services/box.service";

/**
|--------------------------------------------------
| Constants
|--------------------------------------------------
*/
import {
  PARKING_MODE_INTRODUCING_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED,
  PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PLUGGED_OUT_CONFIRMATION_RECEIVED,
  PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED,
  PARKING_MODE_PULLING_OUT_SCOOTER_ORDER_TO_OPEN_DOOR_SENT,
  PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED,
  NEITHER_PARKING_NOT_RENTING,
} from "./constants/constants";

const ParkingPullingOutProcessScreen = ({ location, history }) => {
  const {
    state: { parking, boxId },
  } = location;

  const socketRef = useRef();

  const [stateParkingProcess, setStateParkingProcess] = useState(
    NEITHER_PARKING_NOT_RENTING
  );

  const refreshBoxState = () => {
    console.log("refreshBoxState");

    BoxDataService.get(boxId).then((data) => {
      console.log("refreshBoxState after call to boxdataservice");
      console.log(boxId);
      console.log(data);
      console.log(data.data.state);
      setStateParkingProcess(data.data.state);
    });
  };

  useEffect(() => {
    console.log("useEffect primero");
    refreshBoxState();
  }, []);

  useEffect(() => {
    console.log("useEffect socket");
    socketRef.current = socketIOClient(process.env.REACT_APP_BASEURL);

    socketRef.current.on("welcome", () => {
      console.log("connected to backend");
    });

    socketRef.current.on("refresh-box-state", (data) => {
      if (data.boxId === boxId) {
        console.log("box state refreshed");
        refreshBoxState();
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  //////////////////////////////////////////////////////////////////////////////////

  const [elapsedTime, setElapsedTime] = useState(0);

  const formatTime = () => {
    const getSeconds = `0${(elapsedTime % 60)}`.slice(-2)
    const minutes = `${Math.floor(elapsedTime / 60)}`
    const getMinutes = `0${minutes % 60}`.slice(-2)
    const getHours = `0${Math.floor(elapsedTime / 3600)}`.slice(-2)

    return `${getHours}:${getMinutes}:${getSeconds}`
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((elapsedTime) => elapsedTime + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////

  return (
    <>
      <MyNavbar history={history} />
      <MyContainer>
        <Row>
          <Card className="m-2">
            <MyPullingOutParkingProcessCard
              parking={parking}
              stateParkingProcess={stateParkingProcess}
            />
          </Card>
        </Row>
        <Row className="pt-3">
          <Col>
            {stateParkingProcess ===
            PARKING_MODE_INTRODUCING_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED ? (
              <MyMarker
                color="blue"
                state={null}
                text={`Your Scooter has been parked ${formatTime(elapsedTime)
                  
                } seconds in box ${boxId} located on parking ${parking.name}`}
                icon={faInfoCircle}
              />
            ) : stateParkingProcess ===
              PARKING_MODE_PULLING_OUT_SCOOTER_ORDER_TO_OPEN_DOOR_SENT ? (
              <MyMarker
                color="blue"
                state={null}
                text="Waiting for the door to get open..."
                icon={faInfoCircle}
              />
            ) : stateParkingProcess ===
              PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED ? (
              <MyMarker
                color="blue"
                state={null}
                text="The door is open. Please, unplug the charger and take your scooter."
                icon={faInfoCircle}
              />
            ) : stateParkingProcess ===
              PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PLUGGED_OUT_CONFIRMATION_RECEIVED ? (
              <MyMarker
                color="blue"
                state={null}
                text="The charger is unplugged. Please, close the door."
                icon={faInfoCircle}
              />
            ) : (
              <MyMarker
                color="blue"
                state={null}
                text="The door is closed. The scooter pulling out process is complete."
                icon={faInfoCircle}
              />
            )}
          </Col>
        </Row>
      </MyContainer>
      <Footer />
    </>
  );
};

ParkingPullingOutProcessScreen.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

export default ParkingPullingOutProcessScreen;
