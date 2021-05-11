import React from "react";
import PropTypes from "prop-types";

/**
|--------------------------------------------------
| Components from Availability
|--------------------------------------------------
*/
import MyCarHeader from "../../availability/components/myCarHeader";
import MyCarImg from "../../availability/components/myCarImg";
import MyMarker from "../../availability/components/myMarker";

/**
|--------------------------------------------------
| Libraries
|--------------------------------------------------
*/
import { faCheckCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Card, Col, Row ,Button } from "react-bootstrap";

/**
|--------------------------------------------------
| Constants
|--------------------------------------------------
*/
import {
  PARKING_MODE_INTRODUCING_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED,
  PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED,
  PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PLUGGED_OUT_CONFIRMATION_RECEIVED,
  PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED,
} from "../constants/constants";

const MyPullingOutParkingProcessCard = ({ parking, stateParkingProcess }) => {
  const { id, address, name } = parking;

 /////////////////////////////////////////////////////////

//  const openBox = () => {
//   console.log('openBox');
//   try {
//     let index = stateParking.boxReservedByThisUser;  //Possible Stale Closure
//     let data = stateParking.boxes[index];  //Possible Stale Closure
//     data.state = PARKING_MODE_INTRODUCING_SCOOTER_ORDER_TO_OPEN_DOOR_SENT;
//     data.lastReservationDate = BEGIN_OF_TIMES;
//     BoxDataService.update(data.id, data).then(() => {
//       socketRef.current.emit('open-box', data);

//       history.push({
//         pathname: '/parking-process',
//         state: {
//           parking,
//           boxId: data.id   //Possible stale clossure
//         }
//       })
//     });
//   } catch (e) {
//     console.log(e);
//   }
// };

/////////////////////////////////////////////////////////////////////////




  return (
    <>
      <MyCarHeader address={address} name={name} />
      <MyCarImg id={id} />
      <Card.Body>
        <Card.Title>Scooter pulling out process steps...</Card.Title>
        {stateParkingProcess ===
        PARKING_MODE_INTRODUCING_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED ? 
          <Button>Open door</Button>
         : 
          <>
            <Row className="pt-2">
              <Col>
                <MyMarker
                  color={
                    stateParkingProcess >=
                    PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED
                      ? "green"
                      : "red"
                  }
                  state={null}
                  text="Open box door"
                  icon={
                    stateParkingProcess >=
                    PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_OPEN_CONFIRMATION_RECEIVED
                      ? faCheckCircle
                      : faTimes
                  }
                />
              </Col>
            </Row>
            <Row className="pt-2">
              <Col>
                <MyMarker
                  color={
                    stateParkingProcess >=
                    PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PLUGGED_OUT_CONFIRMATION_RECEIVED
                      ? "green"
                      : "red"
                  }
                  state={null}
                  text="Unplug the charger"
                  icon={
                    stateParkingProcess >=
                    PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PLUGGED_OUT_CONFIRMATION_RECEIVED
                      ? faCheckCircle
                      : faTimes
                  }
                />
              </Col>
            </Row>
            <Row className="pt-2">
              <Col>
                <MyMarker
                  color={
                    stateParkingProcess >=
                    PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PLUGGED_OUT_CONFIRMATION_RECEIVED
                      ? "green"
                      : "red"
                  }
                  state={null}
                  text="Pull the scooter out"
                  icon={
                    stateParkingProcess >=
                    PARKING_MODE_PULLING_OUT_SCOOTER_CHARGER_PLUGGED_OUT_CONFIRMATION_RECEIVED
                      ? faCheckCircle
                      : faTimes
                  }
                />
              </Col>
            </Row>
            <Row></Row>
            <Row className="pt-2">
              <Col>
                <MyMarker
                  color={
                    stateParkingProcess >=
                    PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED
                      ? "green"
                      : "red"
                  }
                  state={null}
                  text="Close box door"
                  icon={
                    stateParkingProcess >=
                    PARKING_MODE_PULLING_OUT_SCOOTER_DOOR_CLOSED_CONFIRMATION_RECEIVED
                      ? faCheckCircle
                      : faTimes
                  }
                />
              </Col>
            </Row>
          </>
        }
      </Card.Body>
    </>
  );
};

MyPullingOutParkingProcessCard.propTypes = {
  parking: PropTypes.object.isRequired,
  stateParkingProcess: PropTypes.number.isRequired,
};

export default MyPullingOutParkingProcessCard;
