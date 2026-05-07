
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Phone, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { useLanguage } from "@/context/language-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from "firebase/firestore";


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-5.067 2.4-4.354 0-7.893-3.59-7.893-8s3.54-8 7.893-8c2.227 0 4.013.84 5.347 2.08l2.627-2.627C18.44 1.587 15.72.63 12.48.63c-6.533 0-11.84 5.36-11.84 11.97s5.307 11.97 11.84 11.97c3.48 0 6.347-1.187 8.44-3.333 2.16-2.16 2.84-5.253 2.84-7.667 0-.76-.067-1.467-.187-2.133H12.48z" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Facebook</title>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

const translations = {
  title: { si: "ගිණුමක් සාදන්න", en: "Create an Account", ta: "ஒரு கணக்கை உருவாக்கவும்" },
  description: { si: "ආරම්භ කිරීමට ඔබගේ විස්තර ඇතුලත් කරන්න.", en: "Enter your details below to get started.", ta: "தொடங்குவதற்கு கீழே உங்கள் விவரங்களை உள்ளிடவும்." },
  firstNameLabel: { si: "මුල් නම", en: "First Name", ta: "முதல் பெயர்" },
  lastNameLabel: { si: "වාසගම", en: "Last Name", ta: "கடைசி பெயர்" },
  emailLabel: { si: "විද්‍යුත් තැපෑල", en: "Email", ta: "மின்னஞ்சல்" },
  passwordLabel: { si: "මුරපදය", en: "Password", ta: "கடவுச்சொல்" },
  createAccountButton: { si: "ගිණුම සාදන්න", en: "Create Account", ta: "கணக்கை உருவாக்கவும்" },
  orContinue: { si: "හෝ මෙයින් ඉදිරියට යන්න", en: "OR CONTINUE WITH", ta: "அல்லது தொடரவும்" },
  hasAccount: { si: "දැනටමත් ගිණුමක් තිබේද?", en: "Already have an account?", ta: "ஏற்கனவே கணக்கு உள்ளதா?" },
  login: { si: "පිවිසෙන්න", en: "Login", ta: "உள்நுழைக" },
  signupSuccess: { si: "ලියාපදිංචිය සාර්ථකයි!", en: "Signup successful!", ta: "பதிவு வெற்றி பெற்றது!" },
  adminAssigned: { si: "සුභ පැතුම්! ඔබ පළමු පරිශීලකයා නිසා පරිපාලක වරප්‍රසාද ලබා දී ඇත.", en: "Congratulations! You have been assigned admin privileges as the first user.", ta: "வாழ்த்துக்கள்! முதல் பயனராக உங்களுக்கு நிர்வாகி சலுகைகள் வழங்கப்பட்டுள்ளன." },
  signupError: { si: "ලියාපදිංචි වීමේ දෝෂයකි", en: "Signup Error", ta: "பதிவு பிழை" },
};

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;


export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { language } = useLanguage();
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (!isUserLoading && user && !user.isAnonymous) {
            router.push('/design');
        }
    }, [user, isUserLoading, router]);

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const onSubmit = async (data: SignupFormValues) => {
        if (!auth || !firestore) {
            toast({
                variant: "destructive",
                title: translations.signupError[language],
                description: "Authentication service is not available.",
            });
            return;
        }
        try {
            // Check if any user exists
            const usersCollectionRef = collection(firestore, "users");
            const existingUsersSnapshot = await getDocs(usersCollectionRef);
            const isFirstUser = existingUsersSnapshot.empty;

            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const newUser = userCredential.user;

            const batch = writeBatch(firestore);

            // Create user profile document
            const userDocRef = doc(firestore, "users", newUser.uid);
            batch.set(userDocRef, {
                uid: newUser.uid,
                email: newUser.email,
                displayName: `${data.firstName} ${data.lastName}`,
                photoURL: newUser.photoURL,
                isAdmin: isFirstUser, // Assign admin role if it's the first user
                createdAt: serverTimestamp(),
            });

            // If it's the first user, also add them to the 'admins' collection
            if (isFirstUser) {
                const adminDocRef = doc(firestore, "admins", newUser.uid);
                batch.set(adminDocRef, { uid: newUser.uid });
            }

            await batch.commit();

            toast({
                title: translations.signupSuccess[language],
                description: isFirstUser ? translations.adminAssigned[language] : undefined,
                duration: isFirstUser ? 8000 : 5000,
            });
            // The useEffect will handle the redirect
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: translations.signupError[language],
                description: error.message,
            });
        }
    };
    
    if (isUserLoading || (user && !user.isAnonymous)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{translations.title[language]}</CardTitle>
          <CardDescription>
            {translations.description[language]}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{translations.firstNameLabel[language]}</FormLabel>
                            <FormControl>
                                <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{translations.lastNameLabel[language]}</FormLabel>
                            <FormControl>
                                <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{translations.emailLabel[language]}</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="m@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{translations.passwordLabel[language]}</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                    <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground">
                                        {showPassword ? <EyeOff /> : <Eye />}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : translations.createAccountButton[language]}
                    </Button>
                </CardFooter>
            </form>
        </Form>
        <CardFooter className="flex flex-col gap-4 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {translations.orContinue[language]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            <Button variant="outline"><GoogleIcon className="h-5 w-5"/></Button>
            <Button variant="outline"><FacebookIcon className="h-5 w-5"/></Button>
            <Button variant="outline"><Phone className="h-5 w-5"/></Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {translations.hasAccount[language]}{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {translations.login[language]}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
