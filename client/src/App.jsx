import React from "react";
import CameraView from "./components/CameraView.jsx";

const App = () => {
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <CameraView />
    </div>
  );
};

export default App;
