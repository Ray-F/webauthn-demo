import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import cors from "cors";
import express, { json } from "express";
import { Authenticator, User, UserRepository } from "./user.repo";
import crypto from "crypto";
import cookieParser from "cookie-parser";

const RP_NAME = "Raymond's WebAuthn Demo";
const RP_ID = "localhost"; // configure to be actual domain name in environment
const RP_ORIGIN = "http://localhost:5173"; // configure to be remote client host

// Create a basic express server with minimal dependencies for clarity
const app = express();
app.use(json());
app.use(cors());
app.use(cookieParser());
const router = express.Router();
app.use(router);

/**
 * Creates a new data store for users.
 */
const userRepo = new UserRepository();

/**
 * NOT PART OF WEBAUTHN/AUTHENTICATION
 * 
 * Used as a primitive cookie session technique that demonstrates what
 * happens after a user has been authenticated via web authn.
 */
const authorizedSessionIds = new Set<string>();

router.get('/restricted-content', (req, res, next) => {
  const sessionId = req.headers.authorization;
  if (!sessionId) {
    res.sendStatus(401);
    return;
  }

  if (authorizedSessionIds.has(sessionId)) {
    res.status(200).send(
      `Congrats! This is a top secret message you would only see after being 
      authenticated, and receive a special session token stored as a cookie.`);
  } else {
    res.sendStatus(403);
  }
})

router.post("/register-options", (req, res, next) => {
  const { email } = req.body;

  if (userRepo.exists(email)) {
    res.status(409).send(`User with email "${email}" already exists!`);
    return;
  }

  const options = generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: email,
    userName: email,
    authenticatorSelection: {
      userVerification: "preferred",
      residentKey: "discouraged",
    },
  });

  const user: User = {
    email: email,
    currentChallenge: options.challenge,
  };

  userRepo.save(user);

  res.status(201).json(options);
});

// Registers a new user
router.post("/register", async (req, res, next) => {
  const { email, credential } = req.body;

  const user = userRepo.get(email);

  // User does not exist, cannot register user.
  if (!user) {
    res.sendStatus(404);
    return;
  }

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: user.currentChallenge,
    expectedOrigin: RP_ORIGIN,
  });

  const { verified } = verification;

  if (verified) {
    res.sendStatus(201);
  } else {
    res.status(403).send("Failed to register new user")
    return;
  }


  const { registrationInfo } = verification;
  const newAuth: Authenticator = {
    counter: registrationInfo.counter,
    credentialId: Buffer.from(registrationInfo.credentialID),
    credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey),
  };

  user.authenticator = newAuth;

  userRepo.save(user);
});

router.post("/authenticate-options", (req, res, next) => {
  const { email } = req.body;

  const user = userRepo.get(email);

  // User does not exist, cannot generate authentication options
  if (!user) {
    res.sendStatus(404);
    return;
  }

  const options = generateAuthenticationOptions({
    allowCredentials: !!user.authenticator
      ? [
          {
            id: user.authenticator.credentialId,
            type: "public-key",
          },
        ]
      : [],
  });

  user.currentChallenge = options.challenge;

  res.status(201).json(options);
});

// Authenticates an existing user
router.post("/authenticate", async (req, res, next) => {
  const { email, credential } = req.body;

  const user = userRepo.get(email);

  // User does not exist, cannot authenticate.
  if (!user || !user.authenticator?.credentialId) {
    res.sendStatus(404);
    return;
  }
  
  const authenticator = user.authenticator!!;

  if (authenticator.credentialId.toString('base64url') != credential.id) {
    res.status(401).send("No such authenticator registered with this user");
    return;
  }

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: user.currentChallenge,
    expectedOrigin: RP_ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      counter: authenticator.counter,
      credentialID: authenticator.credentialId,
      credentialPublicKey: authenticator.credentialPublicKey,
    },
  });

  const { verified } = verification;
  if (verified) {
    const randomSessionToken = crypto.randomUUID();
    authorizedSessionIds.add(randomSessionToken);

    res.status(200).json({ token: randomSessionToken });
  } else {
    res.status(403).send("Failed to verify with authentication key");
    return;
  }

  const { authenticationInfo } = verification;
  const { newCounter } = authenticationInfo;

  user.authenticator.counter = newCounter;
  userRepo.save(user);
});

// Start the app on port 9000
const port = process.env.PORT || 9000;
app.listen(port, () => {
  console.log(`Server started, listening to port: ${port}`);
});
