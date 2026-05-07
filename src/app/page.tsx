
"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, LogIn } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useUser } from "@/firebase";

const translations = {
  welcome: {
    si: 'Ceiling Ace වෙත සාදරයෙන් පිළිගනිමු',
    en: 'Welcome to Ceiling Ace',
    ta: 'சீலிங் ஏஸ்-க்கு வரவேற்கிறோம்',
  },
  description: {
    si: 'සිවිලිම් ව්‍යාපෘති සැලසුම් කිරීම සහ දෘශ්‍යමාන කිරීම සඳහා ඔබේ అంతිమ මෙවලම. මානයන් ඇතුළත් කරන්න, කොටස් බෙදන්න, සහ AI-බලැති පෙරදසුන් සමඟ ඔබේ නිර්මාණයට ජීවය ලැබෙන ආකාරය බලන්න.',
    en: 'Your ultimate tool for planning and visualizing ceiling projects. Input dimensions, divide sections, and see your design come to life with AI-powered texture previews.',
    ta: 'கூரைத் திட்டங்களைத் திட்டமிடுவதற்கும் காட்சிப்படுத்துவதற்கும் உங்களின் இறுதிக் கருவி. பரிமாணங்களை உள்ளிடவும், பிரிவுகளைப் பிரிக்கவும், AI-ஆற்றல்மிக்க முன்னோட்டங்களுடன் உங்கள் வடிவமைப்பு உயிர் பெறுவதைப் பார்க்கவும்.',
  },
  ready: {
    si: 'පරිපූර්ණ සිවිලිමක් සෑදීමට සූදානම්ද? අපි පටන් ගනිමු.',
    en: "Ready to build the perfect ceiling? Let's get started.",
    ta: 'சரியான கூரையை உருவாக்கத் தயாரா? தொடங்குவோம்.',
  },
  startDesigning: {
    si: 'නිර්මාණය කිරීම ආරම්භ කරන්න',
    en: 'Start Designing',
    ta: 'வடிவமைக்கத் தொடங்கு',
  },
  login: {
    si: 'ඇතුල් වන්න',
    en: 'Login',
    ta: 'உள்நுழைக',
  },
  signUp: {
    si: 'ලියාපදිංචි වන්න',
    en: 'Sign Up',
    ta: 'பதிவு செய்க',
  },
};


export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-ceiling');
  const { language } = useLanguage();
  const { user } = useUser();

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-center">
      {heroImage && (
         <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover -z-10"
         />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent -z-10" />

      <div className="container flex flex-col items-center text-center">
        <Card className="max-w-xl bg-background/80 backdrop-blur-sm">
            <CardHeader>
                <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
                    {translations.welcome[language]}
                </h1>
                <CardDescription className="mt-4 text-lg text-foreground/80">
                    {translations.description[language]}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild size="lg">
                    <Link href="/design">
                        {translations.startDesigning[language]} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                 <p className="text-sm text-muted-foreground">{translations.ready[language]}</p>
                 {(!user || user.isAnonymous) && (
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline">
                            <Link href="/login">{translations.login[language]}</Link>
                        </Button>
                         <Button asChild variant="secondary">
                            <Link href="/signup">{translations.signUp[language]}</Link>
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
