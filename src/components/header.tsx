
"use client";

import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft, Bell, User, LogOut, FolderKanban, Folder, LogIn, Shield } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import LanguageToggle from "./language-toggle";
import { useLanguage } from "@/context/language-context";
import { useAuth, useUser, useAdminStatus } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const translations = {
  design: {
    si: 'නිර්මාණය',
    en: 'Design',
    ta: 'வடிவமைப்பு',
  },
  startDesigning: {
    si: 'නිර්මාණය ආරම්භ කරන්න',
    en: 'Start Designing',
    ta: 'வடிவமைக்கத் தொடங்கு',
  },
  notifications: {
    si: 'දැනුම්දීම්',
    en: 'Notifications',
    ta: 'அறிவிப்புகள்',
  },
  back: {
    si: 'ආපසු',
    en: 'Back',
    ta: 'பின்செல்',
  },
  profile: {
    si: 'පැතිකඩ',
    en: 'Profile',
    ta: 'சுயவிவரம்',
  },
  toggleMenu: {
    si: 'මෙනුව විවෘත කරන්න',
    en: 'Toggle Menu',
    ta: 'மெனுவைத் திற',
  },
  menu: {
    si: 'මෙනුව',
    en: 'Menu',
    ta: 'பட்டி',
  },
  mainNavigation: {
    si: 'ප්‍රධාන සංචලනය',
    en: 'Main Navigation',
    ta: 'முதன்மை ஊடுருவல்',
  },
  myAccount: {
    si: 'මගේ ගිණුම',
    en: 'My Account',
    ta: 'என் கணக்கு',
  },
  myProjects: {
    si: 'මගේ ව්‍යාපෘති',
    en: 'My Projects',
    ta: 'எனது திட்டங்கள்',
  },
  adminPanel: {
    si: 'පරිපාලක පැනලය',
    en: 'Admin Panel',
    ta: 'நிர்வாக குழு',
  },
  logout: {
    si: 'පිටවීම',
    en: 'Logout',
    ta: 'வெளியேறு',
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
  gallery: {
    si: 'ගොනු',
    en: 'Files',
    ta: 'கோப்புகள்',
  }
};

export default function Header() {
  const { language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { isCurrentUserAdmin } = useAdminStatus();
  
  const isHomePage = pathname === '/';

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/');
    }
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'G'; // Guest
    const parts = email.split('@')[0].split(/[._-]/);
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center">
             <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden mr-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">{translations.toggleMenu[language]}</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="pr-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>{translations.menu[language]}</SheetTitle>
                        <SheetDescription>{translations.mainNavigation[language]}</SheetDescription>
                    </SheetHeader>
                     <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="font-bold text-lg bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 bg-clip-text text-transparent animate-text-gradient bg-[200%_auto]">
                            Ceiling Ace
                        </span>
                    </Link>
                    <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                      <div className="flex flex-col space-y-3">
                         
                      </div>
                    </div>
                </SheetContent>
            </Sheet>
            
            <Link href="/" aria-label={translations.back[language]} className={cn("mr-2", isHomePage ? "hidden" : "md:inline-flex")}>
                <Button variant="ghost" size="icon" asChild>
                     <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            
           <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold sm:inline-block text-lg bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 bg-clip-text text-transparent animate-text-gradient bg-[200%_auto]">
              Ceiling Ace
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
             
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
           <nav className="flex items-center gap-2">
            
            <LanguageToggle />
            <ThemeToggle />
             <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">{translations.notifications[language]}</span>
            </Button>
            {isUserLoading ? null : user ? (
              user.isAnonymous ? (
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost">
                    <Link href="/login">{translations.login[language]}</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">{translations.signUp[language]}</Link>
                  </Button>
                </div>
              ) : (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-green-500 to-blue-500">
                            <Avatar className="h-full w-full bg-background">
                                <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email || ''} />
                                <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.displayName || translations.myAccount[language]}</p>
                                {user.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/my-projects">
                                <FolderKanban className="mr-2 h-4 w-4" />
                                <span>{translations.myProjects[language]}</span>
                            </Link>
                        </DropdownMenuItem>
                        {isCurrentUserAdmin && (
                            <DropdownMenuItem asChild>
                                <Link href="/admin">
                                    <Shield className="mr-2 h-4 w-4" />
                                    <span>{translations.adminPanel[language]}</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{translations.logout[language]}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              )
            ) : null}

          </nav>
        </div>
      </div>
    </header>
  );
}
