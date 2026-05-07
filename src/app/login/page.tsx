
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
import { Label } from "@/components/ui/label";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";


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
  title: { si: "ගිණුමට පිවිසෙන්න", en: "Login to your Account", ta: "உங்கள் கணக்கில் உள்நுழைக" },
  description: { si: "ඔබගේ විද්‍යුත් තැපෑල සහ මුරපදය ඇතුළත් කරන්න.", en: "Enter your email and password to access your account.", ta: "உங்கள் கணக்கை அணுக உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்." },
  emailLabel: { si: "විද්‍යුත් තැපෑල", en: "Email", ta: "மின்னஞ்சல்" },
  passwordLabel: { si: "මුරපදය", en: "Password", ta: "கடவுச்சொல்" },
  loginButton: { si: "පිවිසෙන්න", en: "Login", ta: "உள்நுழைக" },
  orContinue: { si: "හෝ මෙයින් ඉදිරියට යන්න", en: "OR CONTINUE WITH", ta: "அல்லது தொடரவும்" },
  noAccount: { si: "තවම ගිණුමක් නැද්ද?", en: "Don't have an account?", ta: "கணக்கு இல்லையா?" },
  signUp: { si: "ලියාපදිංචි වන්න", en: "Sign Up", ta: "பதிவு செய்க" },
  forgotPassword: { si: "මුරපදය අමතක වුනා ද?", en: "Forgot password?", ta: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?" },
  loginSuccess: { si: "පිවිසීම සාර්ථකයි!", en: "Login successful!", ta: "உள்நுழைவு வெற்றி பெற்றது!" },
  loginError: { si: "පිවිසීමේ දෝෂයකි", en: "Login Error", ta: "உள்நுழைவு பிழை" },
  invalidCredentials: { si: "වැරදි ඊමේල් ලිපිනයක් හෝ මුරපදයක්. නැවත උත්සාහ කරන්න.", en: "Invalid email or password. Please try again.", ta: "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். மீண்டும் முயற்சிக்கவும்." },
};

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;


export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { language } = useLanguage();
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
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

    const onSubmit = async (data: LoginFormValues) => {
         if (!auth || !firestore) {
            toast({
                variant: "destructive",
                title: translations.loginError[language],
                description: "Authentication service is not available.",
            });
            return;
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            
            // Update last login timestamp
            const userDocRef = doc(firestore, "users", userCredential.user.uid);
            await updateDoc(userDocRef, {
                lastLoginAt: serverTimestamp()
            });

            toast({
                title: translations.loginSuccess[language],
            });
            // The useEffect will handle the redirect
        } catch (error: any) {
            let description = translations.invalidCredentials[language];
            // Firebase returns "auth/invalid-credential" for both user-not-found and wrong-password.
            if (error.code === 'auth/invalid-credential') {
                description = translations.invalidCredentials[language];
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                description = translations.invalidCredentials[language];
            }
             toast({
                variant: "destructive",
                title: translations.loginError[language],
                description: description,
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
                          <div className="flex items-center justify-between">
                            <FormLabel>{translations.passwordLabel[language]}</FormLabel>
                             <Link href="#" className="text-sm text-primary hover:underline">
                                {translations.forgotPassword[language]}
                            </Link>
                          </div>
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
                    {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : translations.loginButton[language]}
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
            {translations.noAccount[language]}{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {translations.signUp[language]}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
