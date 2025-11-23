
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn, isEmailApproved, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.612-3.512-11.283-8.197l-6.522 5.025A20.007 20.007 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.826 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );


function ForgotPasswordDialog() {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email) return;
    setLoading(true);
    try {
      await initiatePasswordReset(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Email',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0 h-auto">Forgot Password?</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Send Reset Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function LoginPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);

  const handleAuthError = (error: Error | FirebaseError) => {
    let title = 'An error occurred';
    let description = error.message;

    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                title = 'Invalid Credentials';
                description = 'Please check your email and password. If this is your first time signing in, please use the "Sign Up" tab instead.';
                break;
            case 'auth/email-already-in-use':
                title = 'Email Already in Use';
                description = 'This email address is already registered. Please sign in or use a different email.';
                break;
            case 'auth/weak-password':
                title = 'Weak Password';
                description = 'The password must be at least 6 characters long.';
                break;
            case 'auth/popup-closed-by-user':
                title = 'Sign-in Canceled';
                description = 'The Google sign-in popup was closed before completion.';
                break;
            case 'auth/invalid-api-key':
                 title = 'Configuration Error';
                 description = 'The application is not configured correctly. Please contact support.';
                 break;
            default:
                break;
        }
    } else if (error.message.includes("not authorized")) {
        title = "Unauthorized Account";
        description = error.message;
    }
    
    toast({
        variant: 'destructive',
        title: title,
        description: description,
    });
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading('email');
    try {
        await initiateEmailSignIn(auth, email, password);
    } catch (error: any) {
        handleAuthError(error);
    } finally {
        setLoading(null);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (!isEmailApproved(email)) {
      handleAuthError(new Error("This email address is not authorized to sign up."));
      return;
    }

    setLoading('email');
    try {
        await initiateEmailSignUp(auth, email, password);
    } catch (error: any) {
        handleAuthError(error);
    } finally {
        setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setLoading('google');
    try {
        await initiateGoogleSignIn(auth);
    } catch (error: any) {
        handleAuthError(error);
    } finally {
        setLoading(null);
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight">Omuto Central</h1>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Welcome to Your Mission Control</CardTitle>
                <CardDescription>Enter your credentials to access the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>First Time Signing In?</AlertTitle>
                    <AlertDescription>
                        If you have been given an approved email, please use the **Sign Up** tab first to create your account.
                    </AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={!!loading}>
                    {loading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
                    Sign in with Google
                </Button>
                
                <div className="flex items-center space-x-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
                    <Separator className="flex-1" />
                </div>

                <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email-signin">Email</Label>
                        <Input id="email-signin" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password-signin">Password</Label>
                        <Input id="password-signin" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                     <div className="flex items-center justify-between text-sm">
                        <ForgotPasswordDialog />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading === 'email'}>
                        {loading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Sign In
                    </Button>
                    </form>
                </TabsContent>
                <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email-signup">Email</Label>
                        <Input id="email-signup" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password-signup">Password</Label>
                        <Input id="password-signup" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading === 'email'}>
                        {loading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Sign Up
                    </Button>
                    </form>
                </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
