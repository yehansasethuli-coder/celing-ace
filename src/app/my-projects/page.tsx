'use client';

import { useMemoFirebase, useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';

const translations = {
  title: {
    si: 'මගේ ව්‍යාපෘති',
    en: 'My Projects',
    ta: 'எனது திட்டங்கள்',
  },
  description: {
    si: 'ඔබ විසින් සුරකින ලද සියලුම සිවිලිම් ව්‍යාපෘති මෙහි දැක්වේ.',
    en: 'Here are all the ceiling projects you have saved.',
    ta: 'நீங்கள் சேமித்த அனைத்து கூரை திட்டங்களும் இங்கே உள்ளன.',
  },
  loading: {
    si: 'ව්‍යාපෘති පූරණය වෙමින් පවතී...',
    en: 'Loading projects...',
    ta: 'திட்டங்கள் ஏற்றப்படுகின்றன...',
  },
  noProjects: {
    si: 'ඔබ තවමත් කිසිදු ව්‍යාපෘතියක් සුරැක නැත.',
    en: 'You have no saved projects yet.',
    ta: 'நீங்கள் இன்னும் எந்த திட்டங்களையும் சேமிக்கவில்லை.',
  },
  startDesigning: {
    si: 'නිර්මාණය ආරම්භ කරන්න',
    en: 'Start Designing',
    ta: 'வடிவமைக்கத் தொடங்கு',
  },
  dimensions: {
    si: 'මාන',
    en: 'Dimensions',
    ta: 'பரிமாணங்கள்',
  },
  savedOn: {
    si: 'සුරකින ලද්දේ',
    en: 'Saved on',
    ta: 'சேமிக்கப்பட்டது',
  },
};

interface CeilingProject {
  id: string;
  projectName: string;
  length: number;
  width: number;
  createdAt: Timestamp;
}

export default function MyProjectsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { language } = useLanguage();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/ceilingProjects`),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: projects, isLoading, error } = useCollection<CeilingProject>(projectsQuery);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return '...';
    return timestamp.toDate().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (isUserLoading || (isLoading && !projects)) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{translations.loading[language]}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // This should ideally not happen if you protect the route, but as a fallback
    return (
      <div className="container mx-auto p-4 text-center sm:p-6 lg:p-8">
        <p>Please log in to see your projects.</p>
        <Button asChild className="mt-4">
            <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{translations.title[language]}</h1>
        <p className="text-muted-foreground">{translations.description[language]}</p>
      </div>

      {error && <p className="text-destructive">Error loading projects: {error.message}</p>}

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.projectName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                    {translations.dimensions[language]}: {project.length} ft x {project.width} ft
                </p>
              </CardContent>
               <CardFooter>
                 <p className="text-xs text-muted-foreground">
                   {translations.savedOn[language]}: {formatDate(project.createdAt)}
                 </p>
               </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">{translations.noProjects[language]}</h2>
            <Button asChild className="mt-4">
                <Link href="/design">{translations.startDesigning[language]}</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
