'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Mic, Video, StopCircle, Loader2, AlertTriangle, FileText, Save, Upload, Wand } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { serverTimestamp, collection } from 'firebase/firestore';
import { uploadFile } from '@/firebase/storage';
import { processTestimony, TestimonyOutput } from '@/ai/flows/testimony-processor-flow';


export default function RecordTestimonyPage() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'audio' | 'video'>('text');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const firestore = useFirestore();

  const getPermissions = async (audio: boolean, video: boolean) => {
    if (hasPermission && mediaStreamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      setHasPermission(true);
      mediaStreamRef.current = stream;
      if (videoRef.current && video) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasPermission(false);
      toast({
        variant: 'destructive',
        title: 'Media Access Denied',
        description: 'Please enable camera/microphone permissions in your browser settings.',
        duration: 10000,
      });
    }
  };
  
  useEffect(() => {
    return () => {
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    }
  }, []);

  const startRecording = () => {
    if (!mediaStreamRef.current) {
        toast({ variant: 'destructive', title: 'Media stream not ready.' });
        return;
    }
    
    recordedChunksRef.current = [];
    const mimeType = activeTab === 'video' ? 'video/webm;codecs=vp9' : 'audio/webm';
    
    try {
        mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, { mimeType });
    } catch (e) {
        console.error("Error creating MediaRecorder:", e);
        toast({ variant: 'destructive', title: 'Recording Error', description: 'Your browser may not support this recording format.'});
        return;
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      saveTestimony(blob, mimeType); // Pass blob and mimeType
      recordedChunksRef.current = [];
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      setHasPermission(null);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    toast({ title: 'Recording Started', description: 'Your testimony is being recorded.' });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording Stopped', description: 'Saving your testimony...' });
    }
  };
  
  const handleRecordClick = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };


  const saveTestimony = async (mediaBlob?: Blob, mimeType?: string) => {
      if (!title.trim()) {
          toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title for the testimony.' });
          return;
      }
      if (!user || !profile || !firestore) {
          toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to save a testimony.' });
          return;
      }
      
      setIsSaving(true);
      
      let audioUrl = '';
      let videoUrl = '';
      let aiAnalysis: TestimonyOutput | null = null;

      if (mediaBlob && mimeType) {
        setIsProcessingAI(true);
        try {
            const path = `testimonies/${user.uid}/${Date.now()}.${activeTab === 'video' ? 'webm' : 'webm'}`;
            const downloadUrl = await uploadFile(mediaBlob, path);
            
            if (activeTab === 'video') videoUrl = downloadUrl;
            if (activeTab === 'audio') audioUrl = downloadUrl;
            
            // Convert Blob to data URI for AI processing
            const reader = new FileReader();
            reader.readAsDataURL(mediaBlob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                try {
                  aiAnalysis = await processTestimony({ mediaUri: base64data });
                  await finishSaving(audioUrl, videoUrl, aiAnalysis);
                } catch(aiError) {
                  console.error("AI processing error:", aiError);
                  toast({ variant: 'destructive', title: 'AI Analysis Failed', description: 'Could not transcribe or analyze the recording. Saving raw file only.' });
                  await finishSaving(audioUrl, videoUrl, null); // Save without AI data
                } finally {
                  setIsProcessingAI(false);
                }
            };
        } catch (e) {
            console.error("Upload error:", e);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your recording.' });
            setIsSaving(false);
            setIsProcessingAI(false);
            return;
        }
      } else {
          if (!textContent.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please write some text for the testimony.' });
            setIsSaving(false);
            return;
          }
          await finishSaving(audioUrl, videoUrl, null);
      }
  };
  
  const finishSaving = async (audioUrl: string, videoUrl: string, aiData: TestimonyOutput | null) => {
      if (!user || !profile || !firestore) return;
      
      const testimonyData = {
          title,
          text: aiData ? aiData.transcription : textContent,
          summary: aiData?.summary || '',
          quotes: aiData?.quotes || [],
          hashtags: aiData?.hashtags || [],
          userId: user.uid,
          userName: profile.name,
          createdAt: serverTimestamp(),
          audioUrl,
          videoUrl,
      };
      
      try {
          await addDocumentNonBlocking(collection(firestore, 'testimonies'), testimonyData);
          toast({ title: 'Testimony Saved!', description: 'Your testimony has been saved successfully.' });
          setTitle('');
          setTextContent('');
      } catch (e) {
          console.error("Error saving testimony:", e);
          toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the testimony to the database.' });
      } finally {
          setIsSaving(false);
      }
  }


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
            <Tabs defaultValue="text" className="w-full" onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Write Text</TabsTrigger>
                    <TabsTrigger value="audio" onClick={() => getPermissions(true, false)}><Mic className="mr-2 h-4 w-4" />Record Audio</TabsTrigger>
                    <TabsTrigger value="video" onClick={() => getPermissions(true, true)}><Camera className="mr-2 h-4 w-4" />Record Video</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="pt-4">
                    <div className="space-y-4">
                        <Textarea 
                            placeholder="Transcribe the beneficiary's story here..." 
                            className="min-h-[300px]"
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                        />
                        <Button onClick={() => saveTestimony()} disabled={isSaving || !title.trim() || !textContent.trim()}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Written Testimony
                        </Button>
                    </div>
                </TabsContent>
                 <TabsContent value="audio" className="pt-4">
                    <div className="aspect-video w-full bg-muted rounded-lg flex flex-col items-center justify-center relative overflow-hidden text-muted-foreground">
                        {hasPermission === null && <p>Click the tab to grant mic access.</p>}
                        {hasPermission === false && (
                            <Alert variant="destructive" className="w-auto">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Microphone Access Required</AlertTitle>
                            </Alert>
                        )}
                        {hasPermission && (
                            <>
                                <Mic className="h-24 w-24" />
                                <p className="mt-4">{isRecording ? "Recording in progress..." : "Ready to record audio."}</p>
                            </>
                        )}
                        {isRecording && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                                <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                                REC
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center mt-4 gap-4">
                        <Button onClick={handleRecordClick} size="lg" className="h-16 w-16 rounded-full" disabled={!hasPermission || isSaving}>
                            {(isSaving || isProcessingAI) ? <Loader2 className="h-8 w-8 animate-spin" /> : (isRecording ? <StopCircle className="h-8 w-8" /> : <Mic className="h-8 w-8" />)}
                            <span className="sr-only">{isRecording ? "Stop Recording" : "Start Recording"}</span>
                        </Button>
                        {isProcessingAI && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Wand className="h-4 w-4 animate-spin" />
                                AI is transcribing and analyzing...
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="video" className="pt-4">
                    <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        {hasPermission === null && !isRecording && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                                <p className="mt-4 text-muted-foreground">Click tab to request camera access.</p>
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
                    <div className="flex flex-col items-center mt-4 gap-4">
                        <Button onClick={handleRecordClick} size="lg" className="h-16 w-16 rounded-full" disabled={!hasPermission || isSaving}>
                           {(isSaving || isProcessingAI) ? <Loader2 className="h-8 w-8 animate-spin" /> : (isRecording ? <StopCircle className="h-8 w-8" /> : <Camera className="h-8 w-8" />)}
                           <span className="sr-only">{isRecording ? "Stop Recording" : "Start Recording"}</span>
                        </Button>
                         {isProcessingAI && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Wand className="h-4 w-4 animate-spin" />
                                AI is transcribing and analyzing...
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
