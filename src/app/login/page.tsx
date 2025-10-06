'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FirebaseError } from 'firebase/app';

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

const OmutoLogo = () => (
    <div className="flex items-center gap-3" data-ai-hint="logo">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
        <svg
          className="h-9 w-9"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M45.5621 16.6323C41.3473 17.5186 40.8525 21.3323 39.8629 25.146C38.3785 30.7019 36.4026 36.312 36.4026 41.813C36.4026 47.7571 39.3681 53.6469 39.3681 59.8082C39.3681 65.698 34.9317 71.9793 30.7169 75.8473C27.5919 78.6813 23.3771 80.3953 19.1623 81.2816C23.8719 83.0499 28.5815 84.4267 33.7859 84.4267C55.8839 84.4267 73.7121 66.5985 73.7121 44.5005C73.7121 22.4025 55.8839 4.57428 33.7859 4.57428C28.5815 4.57428 23.8719 5.95111 19.1623 8.71841C24.3667 9.87611 27.5919 12.0494 31.2117 15.0153C31.7065 15.0153 32.2013 15.0153 32.6961 14.961C37.4057 14.4178 41.3473 14.8093 45.5621 16.6323Z"
            fill="currentColor"
          />
          <path
            d="M59.3908 44.5005C59.3908 51.5283 53.8051 57.114 46.7773 57.114C39.7495 57.114 34.1638 51.5283 34.1638 44.5005C34.1638 37.4727 39.7495 31.887 46.7773 31.887C53.8051 31.887 59.3908 37.4727 59.3908 44.5005Z"
            stroke="#FF6B35"
            strokeWidth="3"
          />
          <rect x="44.5" y="27" width="4.5" height="7" fill="#FF6B35" />
          <rect x="44.5" y="62" width="4.5" height="7" fill="#FF6B35" />
          <rect x="62" y="44.5" width="7" height="4.5" transform="rotate(90 62 44.5)" fill="#FF6B35" />
          <rect x="27" y="44.5" width="7" height="4.5" transform="rotate(90 27 44.5)" fill="#FF6B35" />
          <rect x="34.8" y="32" width="4" height="6" transform="rotate(45 34.8 32)" fill="#FF6B35" />
          <rect x="58" y="55.2" width="4" height="6" transform="rotate(45 58 55.2)" fill="#FF6B35" />
          <rect x="32" y="55.2" width="6" height="4" transform="rotate(-45 32 55.2)" fill="#FF6B35" />
          <rect x="55.2" y="32" width="6" height="4" transform="rotate(-45 55.2 32)" fill="#FF6B35" />
          <rect x="38" y="28.2" width="4.5" height="7" transform="rotate(22.5 38 28.2)" fill="#FF6B35" />
          <rect x="52.2" y="60.8" width="4.5" height="7" transform="rotate(22.5 52.2 60.8)" fill="#FF6B35" />
          <rect x="28.2" y="52.2" width="7" height="4.5" transform="rotate(-22.5 28.2 52.2)" fill="#FF6B35" />
          <rect x="60.8" y="38" width="7" height="4.5" transform="rotate(-22.5 60.8 38)" fill="#FF6B35" />
          <rect x="30" y="37" width="6" height="4.5" transform="rotate(67.5 30 37)" fill="#FF6B35" />
          <rect x="56" y="59" width="6" height="4.5" transform="rotate(67.5 56 59)" fill="#FF6B35" />
          <rect x="37" y="59" width="4.5" height="6" transform="rotate(-67.5 37 59)" fill="#FF6B35" />
          <rect x="59" y="30" width="4.5" height="6" transform="rotate(-67.5 59 30)" fill="#FF6B35" />
        </svg>
      </div>
      <span className="font-headline text-3xl font-bold">Omuto Central</span>
    </div>
);

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
                description = 'Please check your email and password and try again.';
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
            <OmutoLogo />
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Sign In to Your Account</CardTitle>
                <CardDescription>Enter your credentials to access Omuto Central.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
