'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailAuth } from '@/firebase/non-blocking-login';
import { initiateGoogleSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FirebaseError } from 'firebase/app';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signUpWithEmail, signInWithEmail } from '@/firebase/non-blocking-login';


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
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);

  const isOrgEmail = email.toLowerCase().endsWith('@omuto.org');

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);


  const handleAuthError = (error: Error | FirebaseError) => {
    let title = 'An error occurred';
    let description = error.message;

    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
                title = 'Invalid Credentials';
                description = 'Please check your email and password. If you are signing up for the first time, make sure your email has been approved by an admin.';
                break;
            case 'auth/user-not-found':
                title = 'Account Not Found';
                description = 'This email is not registered. An account will be created if the email is on the approved list.';
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading('email');
    try {
        if (activeTab === 'login') {
            await signInWithEmail(auth, email, password);
            toast({ title: 'Welcome Back!', description: 'Redirecting to your dashboard...' });
        } else {
            await signUpWithEmail(auth, email, password, accessCode);
            toast({ title: 'Account Created!', description: 'Welcome to the team. Redirecting to your dashboard...' });
        }
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
         // On success, the useEffect hook will handle the redirect.
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
            <Image src="/logo.svg" alt="Omuto Foundation Logo" width={80} height={80} data-ai-hint="logo" />
        </div>
        
        <Card className="border-lg shadow-comic-lg">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight text-omuto-navy">Omuto Central</CardTitle>
                <CardDescription className="font-bold text-omuto-navy/50">Mission Control Access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="login" className="rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Log In</TabsTrigger>
                        <TabsTrigger value="signup" className="rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                    </TabsList>

                    <div className="pt-6 space-y-4">
                        <Button variant="outline" className="w-full h-12 border-lg font-bold hover:bg-muted/50" onClick={handleGoogleSignIn} disabled={!!loading}>
                            {loading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
                            {activeTab === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                        </Button>
                        
                        <div className="flex items-center space-x-2">
                            <Separator className="flex-1" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">OR</span>
                            <Separator className="flex-1" />
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-omuto-navy/70">Email Address</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="m@example.com" 
                                    required 
                                    className="h-12 border-lg rounded-xl"
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password" name="password-label" className="text-xs font-black uppercase tracking-widest text-omuto-navy/70">Password</Label>
                                    {activeTab === 'login' && <ForgotPasswordDialog />}
                                </div>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    required 
                                    placeholder="••••••••"
                                    className="h-12 border-lg rounded-xl"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                            </div>

                            {activeTab === 'signup' && !isOrgEmail && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label htmlFor="accessCode" className="text-xs font-black uppercase tracking-widest text-primary">Volunteer Access Code</Label>
                                    <Input 
                                        id="accessCode" 
                                        type="password" 
                                        placeholder="Required for personal emails"
                                        required 
                                        className="h-12 border-lg border-primary/30 rounded-xl focus-visible:ring-primary"
                                        value={accessCode} 
                                        onChange={(e) => setAccessCode(e.target.value)} 
                                    />
                                    <p className="text-[10px] font-bold text-muted-foreground italic">Use the foundation's shared code to join as a volunteer.</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full h-14 btn-omuto shadow-comic-md hover:shadow-comic-sm bg-primary text-white border-white mt-4" disabled={!!loading}>
                                {loading === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {activeTab === 'login' ? 'Access Dashboard' : 'Create Volunteer Account'}
                            </Button>
                        </form>
                    </div>
                </Tabs>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
