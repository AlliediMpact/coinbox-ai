'use client';

import { auth } from './firebase';
import { 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  RecaptchaVerifier, 
  MultiFactorResolver,
  getMultiFactorResolver,
  multiFactor
} from 'firebase/auth';
import { authLogger, AuthEventType } from './auth-logger';

/**
 * Service for managing multi-factor authentication
 */
export const mfaService = {
  /**
   * Initialize a reCAPTCHA verifier for phone authentication
   */
  initRecaptchaVerifier(containerId: string) {
    try {
      return new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved, allow user to continue
        },
        'expired-callback': () => {
          // Reset the reCAPTCHA
        }
      });
    } catch (error) {
      console.error('Error initializing reCAPTCHA verifier:', error);
      throw error;
    }
  },

  /**
   * Start the enrollment process for a new phone number
   */
  async startEnrollment(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Get the user's multi-factor session
      const multiFactorUser = multiFactor(user);
      const session = await multiFactorUser.getSession();

      // Start the phone verification process
      const phoneInfoOptions = {
        phoneNumber,
        session
      };
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions, 
        recaptchaVerifier
      );

      // Log the MFA enrollment attempt
      await authLogger.logEvent(
        AuthEventType.MFA_ENABLED,
        user.uid,
        { phoneNumber, success: false, step: 'verification_sent' }
      );

      return verificationId;
    } catch (error) {
      console.error('Error starting MFA enrollment:', error);
      
      // Log the failure
      const user = auth.currentUser;
      if (user) {
        await authLogger.logEvent(
          AuthEventType.AUTH_ERROR,
          user.uid,
          { 
            action: 'mfa_enrollment_start',
            phoneNumber,
            errorMessage: (error as Error).message,
          }
        );
      }
      
      throw error;
    }
  },

  /**
   * Complete the enrollment process with the verification code
   */
  async completeEnrollment(verificationId: string, verificationCode: string, displayName?: string) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Create the multi-factor assertion
      const phoneAuthCredential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);

      // Enroll the user's phone as a second factor
      const multiFactorUser = multiFactor(user);
      await multiFactorUser.enroll(multiFactorAssertion, displayName || 'My phone');

      // Log the successful MFA enrollment
      await authLogger.logEvent(
        AuthEventType.MFA_ENABLED,
        user.uid,
        { success: true, displayName }
      );

      return true;
    } catch (error) {
      console.error('Error completing MFA enrollment:', error);
      
      // Log the failure
      const user = auth.currentUser;
      if (user) {
        await authLogger.logEvent(
          AuthEventType.AUTH_ERROR,
          user.uid,
          { 
            action: 'mfa_enrollment_complete',
            errorMessage: (error as Error).message,
          }
        );
      }
      
      throw error;
    }
  },

  /**
   * List all enrolled multi-factor methods for the current user
   */
  async listEnrolledFactors() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      const multiFactorUser = multiFactor(user);
      return multiFactorUser.enrolledFactors;
    } catch (error) {
      console.error('Error listing enrolled factors:', error);
      throw error;
    }
  },

  /**
   * Unenroll a multi-factor method
   */
  async unenrollFactor(factorUid: string) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      const multiFactorUser = multiFactor(user);
      await multiFactorUser.unenroll({ uid: factorUid });

      // Log the MFA removal
      await authLogger.logEvent(
        AuthEventType.MFA_DISABLED,
        user.uid,
        { factorUid }
      );

      return true;
    } catch (error) {
      console.error('Error unenrolling factor:', error);
      
      // Log the failure
      const user = auth.currentUser;
      if (user) {
        await authLogger.logEvent(
          AuthEventType.AUTH_ERROR,
          user.uid,
          { 
            action: 'mfa_unenroll',
            factorUid,
            errorMessage: (error as Error).message,
          }
        );
      }
      
      throw error;
    }
  },

  /**
   * Handle the MFA challenge during login
   */
  async processMfaChallenge(
    error: any,
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ) {
    try {
      // Get the resolver from the error
      const resolver = getMultiFactorResolver(auth, error);
      
      // We only handle phone authentication for now
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session
      };
      
      // Start the phone verification process
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions, 
        recaptchaVerifier
      );
      
      // Log the MFA verification attempt
      await authLogger.logEvent(
        AuthEventType.MFA_VERIFICATION_SUCCESS,
        null, // Don't have user ID yet
        { phoneNumber, step: 'verification_sent' }
      );
      
      return { verificationId, resolver };
    } catch (error) {
      console.error('Error processing MFA challenge:', error);
      
      // Log the failure
      await authLogger.logEvent(
        AuthEventType.MFA_VERIFICATION_FAILURE,
        null, // Don't have user ID yet
        { 
          phoneNumber,
          errorMessage: (error as Error).message,
        }
      );
      
      throw error;
    }
  },

  /**
   * Complete the MFA verification with the verification code
   */
  async completeMfaVerification(
    verificationId: string,
    verificationCode: string,
    resolver: MultiFactorResolver
  ) {
    try {
      // Create the credential
      const phoneAuthCredential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
      
      // Complete the sign in
      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
      
      // Log the successful MFA verification
      await authLogger.logEvent(
        AuthEventType.MFA_VERIFICATION_SUCCESS,
        userCredential.user.uid,
        { step: 'verification_complete' }
      );
      
      return userCredential;
    } catch (error) {
      console.error('Error completing MFA verification:', error);
      
      // Log the failure
      await authLogger.logEvent(
        AuthEventType.MFA_VERIFICATION_FAILURE,
        null, // Still don't have user ID
        { 
          errorMessage: (error as Error).message,
        }
      );
      
      throw error;
    }
  }
};
