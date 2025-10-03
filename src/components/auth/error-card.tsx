'use client';
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { CardWrapper } from "@/components/auth/card-wrapper";

export const ErrorCard = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link may have expired or already been used.",
    OAuthSignin: "Could not initiate sign in with OAuth provider.",
    OAuthCallback: "Error completing OAuth sign in.",
    OAuthCreateAccount: "Could not create OAuth user in database.",
    EmailCreateAccount: "Could not create email user in database.",
    Callback: "Something went wrong with the authentication callback.",
    OAuthAccountNotLinked: "This email is already associated with another account.",
    EmailSignin: "The email could not be sent.",
    CredentialsSignin: "The credentials you provided are invalid.",
    SessionRequired: "You must be signed in to access this page.",
    default: "An unexpected error occurred."
  };

  const errorMessage = error && errorMessages[error] ? errorMessages[error] : errorMessages.default;

  useEffect(() => {
    // Enhanced error logging
    console.log('=====================================');
    console.log('❌ [ErrorCard] AUTH ERROR PAGE RENDERED');
    console.log('=====================================');
    console.log({
      errorCode: error,
      errorMessage,
      allSearchParams: Object.fromEntries(searchParams.entries()),
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'server',
      referrer: typeof document !== 'undefined' ? document.referrer : 'none',
      timestamp: new Date().toISOString()
    });

    // Log additional debugging info for specific errors
    if (error === "Configuration") {
      console.log('🔧 [ErrorCard] Configuration Error - Possible causes:', {
        hint: 'Check the following:',
        environment_variables: [
          'GOOGLE_CLIENT_ID - Must match Google Console',
          'GOOGLE_CLIENT_SECRET - Must match Google Console',
          'AUTH_SECRET - Must be set for production',
          'NEXTAUTH_URL - Must match your domain'
        ],
        oauth_settings: {
          expected_redirect_uri: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback/google`,
          google_console: 'https://console.cloud.google.com/apis/credentials'
        }
      });
    }

    if (error === "OAuthCallback") {
      console.log('🔐 [ErrorCard] OAuth Callback Error - Common issues:', {
        possible_causes: [
          '1. Redirect URI mismatch in Google Console',
          '2. Invalid or expired OAuth credentials',
          '3. OAuth consent screen not properly configured',
          '4. Domain not authorized in Google Console',
          '5. HTTPS required in production but using HTTP'
        ],
        debug_steps: [
          'Check Google Console OAuth 2.0 Client IDs',
          'Verify Authorized redirect URIs includes your callback URL',
          'Ensure OAuth consent screen is published (not in testing mode)',
          'Check that domain is added to authorized domains'
        ]
      });
    }

    if (error === "OAuthAccountNotLinked") {
      console.log('⚠️ [ErrorCard] Account Linking Error:', {
        issue: 'Email already exists with different provider',
        solution: 'User should sign in with their original provider',
        email: 'Check if user previously signed up with email/password'
      });
    }
  }, [error, errorMessage, searchParams]);

  return (
    <CardWrapper
      headerLabel="Authentication Error"
      backButtonHref="/login"
      backButtonLabel="Back to login"
    >
      <div className="w-full flex flex-col items-center gap-4">
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <p>{errorMessage}</p>
        </div>
        {error && (
          <div className="text-xs text-muted-foreground text-center">
            <p>Error code: {error}</p>
            <p className="mt-2">If this problem persists, please contact support.</p>
          </div>
        )}
      </div>
    </CardWrapper>
  );
};
