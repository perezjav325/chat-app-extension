import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faRightFromBracket,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";

const Header = ({ title, leaveRoomClick, inRoom = false, children }) => {
  const [settings, setSettings] = useState(false);

  const settingsClick = () => {
    setSettings((prev) => !prev);
  };

  return (
    <div className="header">
      {settings ? (
        <>
          <div className="font-bold text-center flex gap-2">
            Settings
            <FontAwesomeIcon
              onClick={settingsClick}
              className="text-base self-end hover:text-[greenyellow]"
              icon={faCaretUp}
            />
          </div>
          <div className="text-center text-white">Settings Go Here</div>
        </>
      ) : (
        <>
          <div className="w-full flex flex-row justify-end gap-2">
            <FontAwesomeIcon
              onClick={settingsClick}
              className="text-base hover:text-[greenyellow]"
              icon={faGear}
            />
            {inRoom && (
              <FontAwesomeIcon
                onClick={leaveRoomClick}
                className="text-base hover:text-red-600"
                icon={faRightFromBracket}
              />
            )}
          </div>
          <h1 className="text-[greenyellow] font-bold text-2xl">{title}</h1>
          {children}
        </>
      )}
    </div>
  );
};

export default Header;
