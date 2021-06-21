import React, { useEffect, useState } from "react";
// import sections
import Hero from "../components/sections/Hero";
import FeaturesTiles from "../components/sections/FeaturesTiles";
import FeaturesSplit from "../components/sections/FeaturesSplit";
import FeaturesSplitTop from "../components/sections/FeaturesSplitTop";
import MediaCard from "../components/sections/MediaCard";
import Rincon from "./Rincon";
import Terradas from "./Terradas";
import Bernat from "./Bernat";
import Koalas from "./Koalas";
import { useTranslation } from "react-i18next";

import { setLanguage, getLanguage } from "../../../utils/common";

/*-----------------------------------
        Material-UI Imports
------------------------------------*/
import { Select, MenuItem } from "@material-ui/core";
import FlagIcon from "../../languages/flagIcon";

const Home = () => {
  const { t, i18n } = useTranslation();
  const [languageState, setLanguageState] = useState(null);
  const [webpage, setWebpage] = useState("main");
  const changeWebpage = page => {
    setWebpage(page);
  };

  const changeLanguage = event => {
    i18n.changeLanguage(event.target.value);
    setLanguageState(event.target.value);

    setLanguage(event.target.value);
  };

  useEffect(() => {
    setLanguageState(getLanguage());
  }, []);
  return (
    <>
      {webpage == "rincon" ? (
        <Rincon />
      ) : webpage == "terradas" ? (
        <Terradas />
      ) : webpage == "bernat" ? (
        <Bernat />
      ) : webpage == "koalas" ? (
        <Koalas />
      ) : (
        <>
          <div className="illustration-section-01" >
            <Select
              labelId="language"
              id="select"
              value={languageState}
              onChange={changeLanguage}
            >
              <MenuItem value="es">
                <FlagIcon code="es" />
                &nbsp;Español
              </MenuItem>
              <MenuItem value="es-CA">
                <FlagIcon code="es-ca" />
                &nbsp;Catal&agrave;
              </MenuItem>
              <MenuItem value="en">
                <FlagIcon code="gb" />
                &nbsp;English
              </MenuItem>
            </Select>
          </div>

          <Hero className="illustration-section-01" />
          <FeaturesSplitTop
            invertMobile
            topDivider
            imageFill
            className="illustration-section-02"
          />

          <FeaturesSplit
            invertMobile
            topDivider
            imageFill
            bottomDivider
            className="illustration-section-02"
          />
          <MediaCard changeWebpage={changeWebpage} />

          <FeaturesTiles />
        </>
      )}
    </>
  );
};

export default Home;
