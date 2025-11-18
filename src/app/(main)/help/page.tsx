
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy, Mail, Bug } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useUser } from "@/firebase";
import { useViewAs } from "@/hooks/use-view-as";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

const InternVolunteerManual = () => (
    <div className="prose dark:prose-invert max-w-full">
        <p>Welcome to the Omuto Foundation family! We are thrilled to have you on board. This guide will help you get started with Omuto Central, our all-in-one application designed to make your work impactful, efficient, and connected to the rest of the team.</p>

        <hr />

        <h3>1. Your Dashboard: Your Mission Control</h3>
        <p>When you log in, you'll land on your personal dashboard. Think of this as your daily mission control.</p>
        
        <Image src="https://i.imgur.com/AuhF19l.jpeg" alt="Your Dashboard" width={800} height={450} className="rounded-lg border" data-ai-hint="dashboard screenshot" />

        <p>Here you will find:</p>
        <ul>
            <li><strong>A Warm Welcome:</strong> A greeting to get your day started.</li>
            <li><strong>Smart Reminders:</strong> Your AI Coach will analyze your pending tasks and calendar events to give you smart, actionable reminders for the day. This helps you stay on track and focus on what matters most.</li>
            <li><strong>Quick Actions:</strong> A set of buttons for the most common tasks you'll perform.</li>
        </ul>

        <hr />

        <h3>2. Your Daily Rhythm: Logging Hours & Submitting Notes</h3>
        <p>Your most important daily tasks will be to log your work and share your progress.</p>

        <h4>Logging Your Hours (Activity Form)</h4>
        <p>This is how you record the work you've done. You can access this from the "Quick Actions" on your dashboard or via the "Forms Hub".</p>
        <ul>
            <li><strong>How:</strong> Click "Log My Hours" and fill out the simple form about the activity you participated in.</li>
            <li><strong>Why:</strong> This helps us understand where our team's effort is going and is crucial for reporting to our partners and funders.</li>
        </ul>

        <h4>Submitting Your End-of-Day Note</h4>
        <p>At the end of your day, it's essential to submit a quick note. This is how your supervisor and the rest of the team see your progress and learnings.</p>
        <ul>
            <li><strong>How:</strong> Click "Submit End-of-Day Note." Briefly describe what you accomplished and one new thing you learned.</li>
            <li><strong>Why:</strong> This keeps everyone in sync and helps us celebrate your contributions and growth! It's a key part of our culture of learning.</li>
        </ul>
        
        <hr />

        <h3>3. Your AI Coach: Your Personal Assistant</h3>
        <p>You have a powerful AI assistant available 24/7. Use it for anything and everything!</p>
        <ul>
            <li><strong>How to Access:</strong> Click on the <strong>AI Coach</strong> link in the sidebar.</li>
            <li><strong>What to Ask:</strong>
                <ul>
                    <li>"Can you explain what the RED Campaign is?"</li>
                    <li>"Who is the lead for the GreenSchools program?"</li>
                    <li>"Summarize the team's activity from yesterday."</li>
                    <li>"Help me brainstorm ideas for a social media post about our recent field visit."</li>
                </ul>
            </li>
        </ul>
        <p>Your conversations with the AI Coach are <strong>private</strong>. Don't hesitate to use it to get up to speed on projects, understand terminology, or even help you draft messages.</p>

        <hr />

        <h3>4. Your Profile & Tasks: Staying Organized</h3>
        <p>Your profile is your personal space within Omuto Central.</p>
        <ul>
            <li><strong>How to Access:</strong> Click on your avatar in the top-right corner and select "Profile," or use the "Profile" link in the navigation.</li>
            <li><strong>Features:</strong>
                <ul>
                    <li><strong>Update Your Picture:</strong> Click on your avatar to upload a new profile picture.</li>
                    <li><strong>Manage Your Tasks:</strong> Switch to the "Task Management" tab to see your personal to-do list. You can add new tasks to keep yourself organized. As you complete them, check them off!</li>
                </ul>
            </li>
        </ul>

        <hr />

        <h3>5. The Team Hub: Staying Connected</h3>
        <p>Even when working remotely, it's important to stay connected. The Team Hub section is where this happens.</p>
        <ul>
            <li><strong>Team Space:</strong> A group chat for all team members. Share quick updates, ask questions, and celebrate wins together.</li>
            <li><strong>Team Calendar:</strong> A shared calendar showing all upcoming events, meetings, and important deadlines. Check this regularly to know what's happening.</li>
            <li><strong>Check-in & Check-out Streams:</strong> These are live feeds of the daily plans (check-ins) and end-of-day reports (check-outs) from the entire team. It's a great way to see what everyone is working on and learn from their progress.</li>
        </ul>

        <hr />

        <p>We are so excited to see the amazing contributions you will make. If you ever feel stuck, your first point of contact should be your supervisor, and your second should be your AI Coach! Welcome aboard.</p>
    </div>
);

const DefaultManual = () => (
    <div className="prose dark:prose-invert max-w-full">
        <p>Welcome to Omuto Central! This is your central hub for all things Omuto Foundation.</p>
        <p>Select your role from the user menu to view a guide tailored to your responsibilities. If a guide for your role is not yet available, please check back soon.</p>
    </div>
)


export default function HelpPage() {
    const { user } = useUser();
    const { profile } = useUserProfile(user);
    const { viewAsRole } = useViewAs();

    const effectiveRole = viewAsRole || profile?.role;

    const renderManual = () => {
        switch (effectiveRole) {
            case 'Intern':
            case 'Volunteer':
                return <InternVolunteerManual />;
            // Add cases for other roles here in the future
            // case 'Executive Director':
            //     return <ExecutiveDirectorManual />;
            default:
                return <DefaultManual />;
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <LifeBuoy className="h-8 w-8" />
                    Help & Support
                </h1>
                <p className="text-muted-foreground">
                    Your guide to making the most of Omuto Central.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>User Manual for: {effectiveRole}</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderManual()}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Need Assistance?</CardTitle>
                    <CardDescription>
                        Found a bug, have a question, or want to request a new feature? Let us know!
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="w-full sm:w-auto">
                        <a href="mailto:support@omuto.org?subject=Omuto%20Central%20-%20Bug%20Report">
                            <Bug className="mr-2 h-4 w-4" /> Report a Bug
                        </a>
                    </Button>
                     <Button asChild variant="outline" className="w-full sm:w-auto">
                        <a href="mailto:support@omuto.org?subject=Omuto%20Central%20-%20Feature%20Request">
                            <Mail className="mr-2 h-4 w-4" /> Request a Feature
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
