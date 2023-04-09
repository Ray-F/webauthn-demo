# WebAuthn API Demo

Created by Raymond Feng.

### Prerequisites

You need to have `yarn` package manager installed. Steps to install this can be 
found [here](https://classic.yarnpkg.com/en/docs/install#mac-stable)

You need a [WebAuthn capable browser](https://webauthn.me/browser-support). A bonus is to give a device capable of 
biometrics (e.g. Touch ID, Face ID, Windows Hello). 

### How to setup

Run the command `yarn` in the root directory (this directory). This will install dependencies for both the client
and server packages. Then you're done!

### How to run

Start the client
```
yarn workspace @webauthn-demo/client dev
```

Start the server
```
yarn workspace @webauthn-demo/server dev
```

Navigate to [http://localhost:5137](http://localhost:5137) to access the local development environment.