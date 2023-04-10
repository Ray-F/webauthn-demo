import { useState } from "react";
import styles from "./Authentication.module.css";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "http://localhost:9000";

let sessionToken: string | undefined = undefined;

/**
 * Wrapper for fetch POST request.
 */
const usePostRequest = async (endpoint: string, body?: any) => {
  const resp = await fetch(`${API_ENDPOINT}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(!!body && { body: JSON.stringify(body) }),
  });

  return resp;
};

/**
 * WebAuthn related request to to the server to retrieve generated registration options.
 */
const useRegistrationOptions = async (email: string) => {
  const resp = await usePostRequest("/register-options", { email });
  if (resp.ok) {
    return await resp.json();
  }

  if (resp.status == 409) {
    alert(`Another user already exists with ${email}!`);
    throw Error("Invalid user alert");
  }
};

/**
 * WebAuthn related request to store/validate credentials + challenge on the server.
 */
const useRegister = async (email: string, credential: any) => {
  const resp = await usePostRequest("/register", { email, credential });

  if (resp.ok) {
    alert("Successfully registered account!");
  }
};

/**
 * WebAuthn related request to to the server to retrieve generated login options.
 */
const useLoginOptions = async (email: string) => {
  const resp = await usePostRequest("/authenticate-options", { email });
  if (resp.ok) {
    return await resp.json();
  }

  if (resp.status == 404) {
    alert(`No user exists with email: ${email}!`);
    throw Error("Invalid user alert");
  }
};

/**
 * WebAuthn related request to validate signed challenge on the server.
 */
const useLogin = async (email: string, credential: any) => {
  const resp = await usePostRequest("/authenticate", { email, credential });

  if (resp.ok) {
    const { token } = await resp.json();
    alert("Successfully logged in!");

    return token;
  }
};

export function Authentication() {
  const [email, setEmail] = useState("");
  const [restrictedData, setRestrictedData] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState("");

  /*
   * Web Authentication API
   */
  const onRegisterBtnPress = async () => {
    /*
     * Steps 2-4 of the Registration Workflow (see explainer video)
     *
     * Retrieves `RegistrationOptions` object from the relying party server,
     * with `challenge` string embedded inside options
     */
    const regOptions: any = await useRegistrationOptions(email);

    /*
     * Steps 5-7 of the Registration Workflow
     *
     * Initiates the registration process using the `...credentials.create(...)`
     * WebAuthn API method.
     */
    const regCredential = await startRegistration(regOptions);

    /*
     * Steps 8-10 of the Registration Workflow
     *
     * Passes the credentials and signed challenge back to the relying party's
     * server for verification.
     */
    await useRegister(email, regCredential);
  };

  const onLoginBtnPress = async () => {
    /*
     * Steps 2-4 of the Authentication Workflow
     *
     * Retrieves `AuthenticationOptions` from the relying party server,
     * with `challenge` string embedded inside options
     */
    const reqOptions: any = await useLoginOptions(email);

    /*
     * Steps 5-7 of the Authentication Workflow
     *
     * Initiates the authentication process using `...credentials.get(...)`
     * webAuthn API behind the SimpleWebAuthn wrapper.
     */
    const authCredential = await startAuthentication(reqOptions);

    /**
     * Steps 8 - 10 of the Authentication Workflow
     *
     * Passes the signed challenge back to the server/relying party for verification.
     */
    const token = await useLogin(email, authCredential);
    setSessionToken(token);

    // Set state of UI to be logged in.
    setEmail("");
    setIsLoggedIn(true);
  };

  const onFetchDataBtnPress = async () => {
    const resp = await fetch(`${API_ENDPOINT}/restricted-content`, {
      method: "GET",
      headers: {
        ...(!!sessionToken && { Authorization: sessionToken }),
      },
    });

    if (resp.status == 401) {
      alert("You have not logged in!");
    } else if (resp.status == 403) {
      alert(
        "Your session has ended (likely because the server was restarted). Please re-authenticate."
      );
    } else if (resp.ok) {
      const data = await resp.text();
      setRestrictedData(data);
    }
  };

  return (
    <>
      <div className={styles.pageLeft}>
        <div className={styles.container}>
          <h1 className={styles.title}>Passwordless Login</h1>
          <p>Implemented using FIDO2's Web Authentication API (WebAuthn).</p>
          <hr />

          {isLoggedIn ? (
            <>
              <p>You are currently logged in! (refresh the page to log out)</p>
            </>
          ) : (
            <>
              <input
                id="email-in"
                className={styles.emailIn}
                type="email"
                value={email}
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className={styles.loginBtn}
                type="submit"
                value="Login"
                onClick={onLoginBtnPress}
              />
              <p>or</p>
              <input
                className={styles.registerBtn}
                type="submit"
                value="Register"
                onClick={onRegisterBtnPress}
              />
            </>
          )}
        </div>
      </div>
      <div className={styles.pageRight}>
        <div className={styles.restrictedContentContainer}>
          <h4>Demo: Restricted data area</h4>
          <p>
            Complete the login on the left to gain access to this area with
            restricted content
          </p>

          <p className={styles.restrictedContent}>{restrictedData}</p>
          <button onClick={onFetchDataBtnPress}>Click to fetch content</button>
        </div>
      </div>
    </>
  );
}
