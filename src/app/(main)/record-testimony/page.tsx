'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Mic, Video, StopCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RecordTestimonyPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera & Mic Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings to record a testimony.',
          duration: 10000,
        });
      }
    };

    getCameraPermission();
  }, [toast]);
  
  const handleRecordClick = () => {
      // Logic for starting/stopping recording will be added in a future step.
      setIsRecording(!isRecording);
      toast({
          title: isRecording ? "Recording Stopped" : "Recording Started",
          description: isRecording ? "Your testimony recording has finished." : "You can now record your testimony.",
      })
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-8 w-8" />
          Record a Testimony
        </h1>
        <p className="text-muted-foreground">
          Capture a success story or testimonial directly from the field.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
             <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {hasCameraPermission === null && (
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
          
          {hasCameraPermission === false && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera & Mic Access Required</AlertTitle>
                <AlertDescription>
                    We couldn't access your camera and microphone. Please go to your browser settings, find this site, and allow access to your camera and mic to continue.
                </AlertDescription>
            </Alert>
          )}

           <div className="flex justify-center">
              <Button onClick={handleRecordClick} size="lg" className="h-16 w-16 rounded-full" disabled={!hasCameraPermission}>
                  {isRecording ? <StopCircle className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  <span className="sr-only">{isRecording ? "Stop Recording" : "Start Recording"}</span>
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
