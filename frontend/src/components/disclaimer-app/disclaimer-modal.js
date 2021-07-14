import React from 'react';
import { useHistory } from "react-router-dom";

import Disclaimer from '../site/views/Disclaimer';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import { makeStyles } from "@material-ui/core/styles";

import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme) => ({
  dialogContentMargins: {
    marginLeft: "-1em",
    marginRight: "-1em",
  }
}));

export default function DisclaimerApp({ open, handleAccept }) {
  const classes = useStyles();
  let history = useHistory();
  const { t } = useTranslation();

  const handleClose = () => {
    history.push("/")
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">{t('Disclaimer')}</DialogTitle>
        <DialogContent dividers={true} className={classes.dialogContentMargins}>
          <DialogContentText
            id="scroll-dialog-description"
          // ref={descriptionElementRef}
          // tabIndex={-1}
          >
            <Disclaimer />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {t('Cancel')}
          </Button>
          <Button onClick={handleAccept} color="primary">
            {t('Accept')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
