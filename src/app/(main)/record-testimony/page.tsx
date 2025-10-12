'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Mic, Video, StopCircle, Loader2, AlertTriangle, FileText, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { serverTimestamp, collection } from 'firebase/firestore';


export default function RecordTestimonyPage() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const getPermissions = async () => {
      if (hasPermission) return; // Don't ask again if already granted
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera/mic:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera & Mic Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings to record audio or video.',
          duration: 10000,
        });
      }
    };

  const handleRecordClick = () => {
      // Logic for starting/stopping recording will be added in a future step.
      setIsRecording(!isRecording);
      toast({
          title: isRecording ? "Recording Stopped" : "Recording Started",
          description: isRecording ? "Your testimony recording has finished." : "You can now record your testimony.",
      })
  }

  const saveTestimony = async () => {
      if (!title.trim() || !textContent.trim()) {
          toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title and some text for the testimony.' });
          return;
      }
      if (!user || !profile || !firestore) {
          toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to save a testimony.' });
          return;
      }
      
      setIsSaving(true);
      
      const testimonyData = {
          title,
          text: textContent,
          userId: user.uid,
          userName: profile.name,
          createdAt: serverTimestamp(),
          audioUrl: '',
          videoUrl: '',
      };
      
      try {
          await addDocumentNonBlocking(collection(firestore, 'testimonies'), testimonyData);
          toast({ title: 'Testimony Saved!', description: 'The written testimony has been saved successfully.' });
          setTitle('');
          setTextContent('');
      } catch (e) {
          console.error("Error saving testimony:", e);
          toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the testimony. Please try again.' });
      } finally {
          setIsSaving(false);
      }
  };


  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-8 w-8" />
          Capture Testimony
        </h1>
        <p className="text-muted-foreground">
          Record a success story or testimonial directly from the field in text, audio, or video format.
        </p>
      </header>
      <Card>
        <CardHeader>
             <div className="space-y-2">
                <Label htmlFor="title">Testimony Title</Label>
                <Input id="title" placeholder="e.g., Jane's Story of Empowerment" value={title} onChange={(e) => setTitle(e.target.value)} />
             </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Write Text</TabsTrigger>
                <TabsTrigger value="audio" onClick={getPermissions}><Mic className="mr-2 h-4 w-4" />Record Audio</TabsTrigger>
                <TabsTrigger value="video" onClick={getPermissions}><Camera className="mr-2 h-4 w-4" />Record Video</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="pt-4">
                <div className="space-y-4">
                    <Textarea 
                        placeholder="Transcribe the beneficiary's story here..." 
                        className="min-h-[300px]"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                    />
                    <Button onClick={saveTestimony} disabled={isSaving || !title.trim() || !textContent.trim()}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Written Testimony
                    </Button>
                </div>
            </TabsContent>
            <TabsContent value="audio" className="pt-4">
                 <div className="aspect-video w-full bg-muted rounded-lg flex flex-col items-center justify-center relative overflow-hidden text-muted-foreground">
                     {hasPermission === null && <p>Click the tab again to grant mic access.</p>}
                     {hasPermission === false && (
                         <Alert variant="destructive" className="w-auto">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Microphone Access Required</AlertTitle>
                         </Alert>
                     )}
                     {hasPermission && (
                         <>
                             <Mic className="h-24 w-24" />
                            <p className="mt-4">Ready to record audio</p>
                         </>
                     )}
                 </div>
                 <div className="flex justify-center mt-4">
                    <Button onClick={handleRecordClick} size="lg" className="h-16 w-16 rounded-full" disabled={!hasPermission}>
                        {isRecording ? <StopCircle className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                        <span className="sr-only">{isRecording ? "Stop Recording" : "Start Recording"}</span>
                    </Button>
                </div>
            </TabsContent>
            <TabsContent value="video" className="pt-4">
                 <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {hasPermission === null && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">Requesting camera access...</p>
                        </div>
                    )}
                    {isRecording && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                            REC
                        </div>
                    )}
                </div>
                 {hasPermission === false && (
                     <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Camera & Mic Access Required</AlertTitle>
                        <AlertDescription>
                            We couldn't access your camera and microphone. Please go to your browser settings to allow access.
                        </AlertDescription>
                    </Alert>
                )}
                 <div className="flex justify-center mt-4">
                    <Button onClick={handleRecordClick} size="lg" className="h-16 w-16 rounded-full" disabled={!hasPermission}>
                        {isRecording ? <StopCircle className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
                        <span className="sr-only">{isRecording ? "Stop Recording" : "Start Recording"}</span>
                    </Button>
                </div>
            </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
