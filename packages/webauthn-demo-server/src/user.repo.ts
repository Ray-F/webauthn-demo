/**
 * An in-memory repository that holds user data.
 */
class UserRepository {
  private userStore = new Map<string, User>();

  public get(email: string) {
    return this.userStore.get(this.emailToId(email));
  }

  public save(user: User) {
    this.userStore.set(this.emailToId(user.email), user);
  }

  /**
   * Trims white space and sets email to lower case to use as ID.
   */
  private emailToId(email: string) {
    return email.toLowerCase().trim();
  }
}

interface Authenticator {
  credentialId: Buffer;
  credentialPublicKey: Buffer;
  counter: number;
}

interface User {
  email: string;
  currentChallenge?: string;

  // Currently only supporting one authenticator, but can add support for many
  authenticator?: Authenticator;
}

export { User, Authenticator, UserRepository };
