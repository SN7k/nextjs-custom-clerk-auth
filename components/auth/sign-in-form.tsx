'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SignInForm() {
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isSignUpFlow, setIsSignUpFlow] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded) return;

    setIsLoading(true);
    try {
      // First, always try to sign in with email link/code strategy
      console.log('Attempting to sign in with email:', email);
      
      const signInAttempt = await signIn.create({
        identifier: email,
      });

      console.log('Sign in attempt result:', signInAttempt);

      if (signInAttempt.status === 'needs_first_factor') {
        // Find email verification factor
        const emailFactor = signInAttempt.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );
        
        if (emailFactor) {
          console.log('Preparing email verification for existing user');
          await signInAttempt.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
          setPendingVerification(true);
          setIsSignUpFlow(false);
          toast.success('Verification code sent to your email!');
        }
      } else if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push('/dashboard');
        toast.success('Successfully signed in!');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // If user doesn't exist, create account using email link strategy
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        try {
          console.log('User not found, creating account with email:', email);
          
          // Create sign up - this creates the user record in Clerk
          const signUpAttempt = await signUp.create({
            emailAddress: email,
          });
          
          console.log('Sign up creation result:', signUpAttempt);
          console.log('Sign up status after creation:', signUpAttempt.status);
          
          // Check if account was created successfully
          if (signUpAttempt.status === 'complete') {
            // Account created and ready - no verification needed
            console.log('Account created successfully without verification');
            await setActiveSignUp({ session: signUpAttempt.createdSessionId });
            router.push('/dashboard');
            toast.success('Account created and signed in!');
          } else {
            // Account created but needs email verification
            console.log('Account created, preparing email verification');
            
            const prepareResult = await signUpAttempt.prepareEmailAddressVerification({
              strategy: 'email_code'
            });
            
            console.log('Email verification preparation result:', prepareResult);
            
            setPendingVerification(true);
            setIsSignUpFlow(true);
            toast.success('Account created! Verification code sent to your email.');
          }
        } catch (signUpErr: any) {
          console.error('Sign up error:', signUpErr);
          toast.error(signUpErr.errors?.[0]?.message || 'Error creating account');
        }
      } else {
        toast.error(err.errors?.[0]?.message || 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded) return;

    setIsLoading(true);
    try {
      if (isSignUpFlow) {
        console.log('=== SIGN UP VERIFICATION ===');
        console.log('Email:', email);
        console.log('Code:', verificationCode);
        
        // Step 1: Complete email verification
        const verificationResult = await signUp.attemptEmailAddressVerification({
          code: verificationCode,
        });

        console.log('Verification result status:', verificationResult.status);
        console.log('Verification result session:', verificationResult.createdSessionId);
        console.log('Full verification result:', verificationResult);

        // Step 2: Handle the verification result
        if (verificationResult.status === 'complete') {
          console.log('✅ Verification complete with session');
          await setActiveSignUp({ session: verificationResult.createdSessionId });
          router.push('/dashboard');
          toast.success('Account created and signed in!');
          return;
        }

        // Step 3: If not complete, try to complete the signup
        console.log('⚠️ Verification not complete, attempting to complete signup...');
        console.log('Current signUp status:', signUp.status);
        console.log('Current signUp session:', signUp.createdSessionId);

        // Check if signup already has a session (email is verified)
        if (signUp.createdSessionId) {
          console.log('✅ Found existing session in signup object');
          await setActiveSignUp({ session: signUp.createdSessionId });
          router.push('/dashboard');
          toast.success('Account created and signed in!');
          return;
        }

        // Step 4: Email is verified, but no session yet - this means we need to complete user creation
        console.log('🔄 Email verified but no session, creating user profile...');
        
        // The verification worked, so now we just need to complete the user setup
        // Since this is passwordless, we only need the email
        try {
          // Try to finalize the signup process
          const finalizeResult = await signUp.update({
            emailAddress: email,
          });
          
          console.log('Finalize result:', finalizeResult);
          
          if (finalizeResult.status === 'complete' && finalizeResult.createdSessionId) {
            console.log('✅ Signup completed successfully');
            await setActiveSignUp({ session: finalizeResult.createdSessionId });
            router.push('/dashboard');
            toast.success('Account created and signed in!');
            return;
          }
          
          // If still not complete, the user exists but we need to sign them in
          console.log('🔄 Update complete but no session, trying sign in...');
          
          // At this point, the email is verified and user exists, so sign them in
          const signInResult = await signIn.create({
            identifier: email,
          });
          
          console.log('Post-verification sign in result:', signInResult);
          
          if (signInResult.status === 'complete') {
            console.log('✅ Sign in successful after verification');
            await setActive({ session: signInResult.createdSessionId });
            router.push('/dashboard');
            toast.success('Account created and signed in!');
            return;
          } else {
            console.log('❌ Sign in not complete, final status:', signInResult.status);
            throw new Error('Could not complete sign in after email verification');
          }
          
        } catch (completeError: any) {
          console.error('❌ Error completing signup:', completeError);
          
          // Final attempt: the email is verified, so the account should exist
          // Try a direct sign in
          try {
            console.log('🔄 Final attempt: direct sign in with verified email');
            
            const directSignIn = await signIn.create({
              identifier: email,
            });
            
            if (directSignIn.status === 'complete') {
              await setActive({ session: directSignIn.createdSessionId });
              router.push('/dashboard');
              toast.success('Account verified and signed in!');
            } else {
              throw new Error('Direct sign in failed');
            }
          } catch (directSignInError) {
            console.error('❌ Direct sign in failed:', directSignInError);
            toast.error('Email verified but account setup incomplete. Please try signing in manually.');
            setPendingVerification(false);
            setIsSignUpFlow(false);
            setVerificationCode('');
          }
        }
        
      } else {
        // SIGN IN FLOW
        console.log('=== SIGN IN VERIFICATION ===');
        console.log('Email:', email);
        console.log('Code:', verificationCode);
        
        const verificationResult = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code: verificationCode,
        });

        console.log('Sign in verification result:', verificationResult);

        if (verificationResult.status === 'complete') {
          await setActive({ session: verificationResult.createdSessionId });
          router.push('/dashboard');
          toast.success('Successfully signed in!');
        } else {
          console.log('Sign in verification failed:', verificationResult.status);
          toast.error('Sign in verification failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('❌ Verification error:', err);
      console.error('Error details:', err.errors);
      
      const errorMessage = err.errors?.[0]?.message || 'Verification failed';
      console.log('Error message:', errorMessage);
      
      // Check if it's an invalid code error
      if (errorMessage.toLowerCase().includes('code') || 
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('incorrect')) {
        toast.error('Invalid verification code. Please check and try again.');
      } else {
        // For other errors, provide more helpful feedback
        toast.error('Verification failed. Please try again or contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signInLoaded) return;

    setIsLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.errors?.[0]?.message || 'Google sign in failed');
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <motion.form 
        onSubmit={handleVerification} 
        className="space-y-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Check your email
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We sent a verification code to <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Verification Code
          </Label>
          <Input
            id="code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
            placeholder="000000"
            maxLength={6}
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify & Continue'
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          onClick={() => {
            setPendingVerification(false);
            setVerificationCode('');
            setEmail('');
            setIsSignUpFlow(false);
          }}
          disabled={isLoading}
        >
          ← Back to email
        </Button>
      </motion.form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your email address"
          required
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          We'll send you a verification code if needed
        </p>
      </div>

      {/* Sign In Button */}
      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Please wait...
          </>
        ) : (
          'Continue with Email'
        )}
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Sign In Button */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        variant="outline"
        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-3 animate-spin" />
        ) : (
          <svg
            className="w-5 h-5 mr-3"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Sign in with Google
      </Button>
    </form>
  );
}
