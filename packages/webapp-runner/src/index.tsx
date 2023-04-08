// import React, { Suspense } from "react";
import React, { Suspense } from "react"
import App from "./App"
import ReactDOM from "react-dom/client"
// import { Buffer } from "buffer"
import reportWebVitals from "./reportWebVitals"

// eslint-disable-next-line @typescript-eslint/no-var-requires
// window.Buffer = window.Buffer || Buffer
// console.log("====Buffer", Buffer)

console.log("========window.Buffer", window.Buffer)

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error(`Unable to find element with id 'root'`)
}

const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    <Suspense>
      <App />
    </Suspense>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
