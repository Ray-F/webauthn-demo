# WebAuthn API Demo

Created by Raymond Feng for SE750.

### Prerequisites

You need to have `yarn` (classic stable, v1.22.19) package manager installed. Steps to install this can be 
found [here](https://classic.yarnpkg.com/en/docs/install#mac-stable)

You need to have `node` version 16+ installed.

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

Navigate to [http://localhost:5173](http://localhost:5173) to access the local development environment.

IMPORTANT: This must be `localhost` and not any other equivalent (e.g. 127.0.0.1) or else the WebAuthn API
will not let the demo run, as the API standard does not support non HTTPS contexts other than the explicit 'localhost'