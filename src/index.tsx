import React from "react"
import ReactDOM from "react-dom"
import { WebrtcClient } from "./modules"

function App() {
  return (
    <WebrtcClient
      host={"/"}
      port={3001}
      server={"http://localhost:8080/"}
      roomId={"ckstn-room"}
    />
  )
}

ReactDOM.render(<App />, document.getElementById("root"))
