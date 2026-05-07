
'use client';

import { useCollection, useFirestore, useUser, useAdminStatus, useMemoFirebase } from '@/firebase';
import { collection, query, doc, updateDoc, deleteDoc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, UserX, ShieldQuestion, MoreVertical, UserCheck } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { formatDistanceToNow, Locale, subYears, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { useEffect } from 'react';


const translations = {
  title: {
    si: 'පරිශීලක කළමනාකරණය',
    en: 'User Management',
    ta: 'பயனர் மேலாண்மை',
  },
  description: {
    si: 'යෙදුමේ ලියාපදිංචි වී ඇති සියලුම පරිශීලකයින් බලන්න සහ කළමනාකරණය කරන්න.',
    en: 'View and manage all registered users in the application.',
    ta: 'பயன்பாட்டில் பதிவுசெய்யப்பட்ட அனைத்து பயனர்களையும் பார்க்கவும் நிர்வகிக்கவும்.',
  },
  loading: {
    si: 'පරිශීලකයින් පූරණය වෙමින් පවතී...',
    en: 'Loading users...',
    ta: 'பயனர்கள் ஏற்றப்படுகிறார்கள்...',
  },
  notAdmin: {
    si: 'මෙම පිටුවට පිවිසීමට ඔබට අවසර නැත.',
    en: 'You are not authorized to view this page.',
    ta: 'இந்தப் பக்கத்தைப் பார்க்க உங்களுக்கு அங்கீகாரம் இல்லை.',
  },
  goToHome: {
    si: 'මුල් පිටුවට යන්න',
    en: 'Go to Home',
    ta: 'முகப்புக்குச் செல்',
  },
  email: {
    si: 'විද්‍යුත් තැපෑල',
    en: 'Email',
    ta: 'மின்னஞ்சல்',
  },
  lastLogin: {
    si: 'අවසන් පිවිසුම',
    en: 'Last Login',
    ta: 'கடைசி உள்நுழைவு',
  },
  status: {
    si: 'තත්ත්වය',
    en: 'Status',
    ta: 'நிலை',
  },
  actions: {
    si: 'ක්‍රියා',
    en: 'Actions',
    ta: 'செயல்கள்',
  },
  active: {
    si: 'සක්‍රිය',
    en: 'Active',
    ta: 'செயலில்',
  },
  disabled: {
    si: 'අක්‍රියයි',
    en: 'Disabled',
    ta: 'முடக்கப்பட்டது',
  },
  accept: {
    si: 'පරිශීලක සක්‍රීය කරන්න',
    en: 'Enable User',
    ta: 'பயனரை இயக்கு',
  },
  reject: {
    si: 'පරිශීලක අක්‍රීය කරන්න',
    en: 'Disable User',
    ta: 'பயனரை முடக்கு',
  },
  deleteUser: {
    si: 'පරිශීලක මකන්න',
    en: 'Delete User',
    ta: 'பயனரை நீக்கு',
  },
  updateSuccess: {
    si: 'තත්ත්වය යාවත්කාලීන කරන ලදී',
    en: 'Status updated successfully',
    ta: 'நிலை வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது',
  },
  updateError: {
    si: 'යාවත්කාලීන කිරීමේ දෝෂයකි',
    en: 'Error updating status',
    ta: 'நிலையைப் புதுப்பிப்பதில் பிழை',
  },
  deleteSuccess: {
    si: 'පරිශීලක මකා දමන ලදී',
    en: 'User deleted successfully',
    ta: 'பயனர் வெற்றிகரமாக நீக்கப்பட்டார்',
  },
  deleteError: {
    si: 'මකා දැමීමේ දෝෂයකි',
    en: 'Error deleting user',
    ta: 'பயனரை நீக்குவதில் பிழை',
  },
  never: {
    si: 'කිසිදා නැත',
    en: 'Never',
    ta: 'ஒருபோதும்',
  },
  ago: {
    si: 'කට පෙර',
    en: 'ago',
    ta: 'க்கு முன்பு'
  },
  registered: {
    si: 'ලියාපදිංචි විය',
    en: 'Registered',
    ta: 'பதிவு செய்யப்பட்டது'
  },
  autoDisabled: {
    si: 'පැරණි ගිණුම් ස්වයංක්‍රීයව අක්‍රීය කරන ලදී.',
    en: 'Inactive accounts were auto-disabled based on policy.',
    ta: 'செயலற்ற கணக்குகள் கொள்கையின் அடிப்படையில் தானாகவே முடக்கப்பட்டன.',
  },
  autoDisablePolicy: {
    si: 'ස්වයංක්‍රීය අක්‍රිය කිරීමේ ප්‍රතිපත්තිය',
    en: 'Auto-Disable Policy',
    ta: 'தானியங்கு முடக்கக் கொள்கை',
  },
  setPolicy: {
    si: 'ප්‍රතිපත්තිය සකසන්න',
    en: 'Set Policy',
    ta: 'கொள்கையை அமைக்கவும்',
  },
  policyNone: {
    si: 'නැත',
    en: 'None',
    ta: 'இல்லை',
  },
  policy1Month: {
    si: 'මාස 1 කට පසු',
    en: 'After 1 Month',
    ta: '1 மாதத்திற்குப் பிறகு',
  },
  policy1Year: {
    si: 'වසර 1 කට පසු',
    en: 'After 1 Year',
    ta: '1 வருடத்திற்குப் பிறகு',
  },
};

const localeMap: { [key: string]: Locale } = {
  en: enUS,
};

type AutoDisablePolicy = 'none' | 'one_month' | 'one_year';

interface AppUser {
  uid: string;
  id: string;
  email?: string;
  disabled?: boolean;
  lastLoginAt?: Timestamp;
  createdAt?: Timestamp;
  autoDisablePolicy?: AutoDisablePolicy;
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { isCurrentUserAdmin, isAdminLoading } = useAdminStatus();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isCurrentUserAdmin) return null;
    return query(collection(firestore, 'users'));
  }, [firestore, isCurrentUserAdmin]);

  const { data: users, isLoading: areUsersLoading, error } = useCollection<AppUser>(usersQuery);

  useEffect(() => {
    if (users && firestore && isCurrentUserAdmin) {
      const now = new Date();
      const oneMonthAgo = subMonths(now, 1);
      const oneYearAgo = subYears(now, 1);
      
      const usersToDisable = users.filter(u => {
        if (u.disabled || !u.createdAt) return false;
        
        const createdAtDate = u.createdAt.toDate();
        const policy = u.autoDisablePolicy || 'none';

        if (policy === 'one_month' && createdAtDate < oneMonthAgo) {
            return true;
        }
        if (policy === 'one_year' && createdAtDate < oneYearAgo) {
            return true;
        }
        return false;
      });


      if (usersToDisable.length > 0) {
        const batch = writeBatch(firestore);
        usersToDisable.forEach(u => {
          const userDocRef = doc(firestore, 'users', u.uid);
          batch.update(userDocRef, { disabled: true });
        });

        batch.commit()
          .then(() => {
            toast({
              title: translations.autoDisabled[language],
              description: `${usersToDisable.length} user(s) were disabled.`,
            });
          })
          .catch(serverError => {
            console.error("Auto-disable batch failed:", serverError);
            toast({
              variant: 'destructive',
              title: "Auto-disable failed",
              description: "Could not automatically disable inactive accounts."
            });
          });
      }
    }
  }, [users, firestore, isCurrentUserAdmin, language, toast]);


  const handleStatusChange = async (targetUser: AppUser, disable: boolean) => {
    if (!firestore) return;
    
    const userDocRef = doc(firestore, 'users', targetUser.uid);
    const updatedUserData = { disabled: disable };

    updateDoc(userDocRef, updatedUserData)
      .then(() => {
         toast({ title: translations.updateSuccess[language] });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: updatedUserData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: translations.updateError[language] });
      });
  };

  const handleDeleteUser = async (uid: string) => {
     if (!firestore) return;
     
    const userDocRef = doc(firestore, 'users', uid);
    const adminDocRef = doc(firestore, 'admins', uid);

    deleteDoc(userDocRef)
      .then(() => {
         toast({ title: translations.deleteSuccess[language] });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: translations.deleteError[language] });
      });

    deleteDoc(adminDocRef)
      .catch((serverError) => {
        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: adminDocRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
      });
  };

  const handlePolicyChange = async (targetUser: AppUser, policy: AutoDisablePolicy) => {
    if (!firestore) return;

    const userDocRef = doc(firestore, 'users', targetUser.uid);
    const updatedUserData = { autoDisablePolicy: policy };

    updateDoc(userDocRef, updatedUserData)
      .then(() => {
        toast({ title: "Policy updated" });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: updatedUserData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: "Error updating policy" });
      });
  };


  const formatLastLogin = (loginTimestamp: Timestamp | undefined, createdTimestamp: Timestamp | undefined) => {
    const timestamp = loginTimestamp || createdTimestamp;
    if (!timestamp) {
      return translations.never[language];
    }
    
    const prefix = loginTimestamp ? '' : `${translations.registered[language]} `;
    const locale = localeMap[language] || enUS;

    try {
      return `${prefix}${formatDistanceToNow(timestamp.toDate(), { locale })} ${translations.ago[language]}`;
    } catch(e) {
      return `${prefix}${formatDistanceToNow(timestamp.toDate(), { locale: enUS })} ago`;
    }
  }

  const isLoading = isUserLoading || isAdminLoading || (isCurrentUserAdmin && areUsersLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isCurrentUserAdmin) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldQuestion className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">{translations.notAdmin[language]}</h1>
        <Button asChild>
          <Link href="/">{translations.goToHome[language]}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{translations.title[language]}</CardTitle>
          <CardDescription>{translations.description[language]}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.email[language]}</TableHead>
                <TableHead>{translations.lastLogin[language]}</TableHead>
                <TableHead>{translations.status[language]}</TableHead>
                <TableHead>{translations.autoDisablePolicy[language]}</TableHead>
                <TableHead className="text-right">{translations.actions[language]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email || 'N/A'}</TableCell>
                  <TableCell>{formatLastLogin(u.lastLoginAt, u.createdAt)}</TableCell>
                  <TableCell>
                    {u.disabled ? (
                      <Badge variant="destructive" className="bg-red-600">
                        <UserX className="mr-1 h-4 w-4" />
                        {translations.disabled[language]}
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">
                        <UserCheck className="mr-1 h-4 w-4" />
                        {translations.active[language]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.autoDisablePolicy === 'none' || !u.autoDisablePolicy ? 'secondary' : 'outline'}>
                        {u.autoDisablePolicy === 'one_month' ? translations.policy1Month[language] : u.autoDisablePolicy === 'one_year' ? translations.policy1Year[language] : translations.policyNone[language]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={u.uid === user?.uid}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {u.disabled ? (
                          <DropdownMenuItem onClick={() => handleStatusChange(u, false)}>
                            <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                            <span>{translations.accept[language]}</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleStatusChange(u, true)}>
                            <UserX className="mr-2 h-4 w-4 text-orange-500" />
                            <span>{translations.reject[language]}</span>
                          </DropdownMenuItem>
                        )}
                         <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <span>{translations.setPolicy[language]}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handlePolicyChange(u, 'none')}>
                              {translations.policyNone[language]}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePolicyChange(u, 'one_month')}>
                              {translations.policy1Month[language]}
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handlePolicyChange(u, 'one_year')}>
                              {translations.policy1Year[language]}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteUser(u.uid)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{translations.deleteUser[language]}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {error && <p className="mt-4 text-center text-destructive">Error loading users: {error.message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
