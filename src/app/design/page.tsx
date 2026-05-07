
"use client";

import { useState, useRef, MouseEvent, TouchEvent, useEffect } from 'react';
import { generateVisualizationAction, saveCeilingProjectAction } from '@/app/actions';
import CeilingDrawing from '@/components/ceiling-drawing';
import BillOfMaterials from '@/components/bill-of-materials';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Loader2, Wand2, ZoomIn, ZoomOut, Camera, Image as ImageIcon, ChevronsUpDown, Languages, Save, Download, X, Box, Grip, Rows, Square, LogIn, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { calculateMaterials, MaterialQuantities } from '@/lib/calculations';
import { useLanguage } from '@/context/language-context';
import { useFirestore, useUser } from '@/firebase';
import Link from 'next/link';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';
import { query, collection, orderBy, limit, getDocs } from 'firebase/firestore';


type Dimension = {
  feet: number | '';
  inches: number | '';
};

type BorderAlignment = 'end' | 'center' | 'large-center';

type ViewMode = '2d' | '3d';
type ActiveView = 'layout' | 'materials';

const initialDimension: Dimension = { feet: '', inches: '' };

const translations = {
  designTitle: {
    si: 'ඔබේ සිවිලිම නිර්මාණය කරන්න',
    en: 'Design Your Ceiling',
    ta: 'உங்கள் கூரையை வடிவமைக்கவும்',
  },
  designDescription: {
    si: 'මානයන් අඩි සහ අඟල් වලින් ඇතුලත් කරන්න.',
    en: 'Enter dimensions in feet and inches.',
    ta: 'அடி மற்றும் அங்குலத்தில் பரிமாணங்களை உள்ளிடவும்.',
  },
  projectName: {
    si: 'ව්‍යාපෘතියේ නම',
    en: 'Project Name',
    ta: 'திட்டத்தின் பெயர்',
  },
  totalLength: {
    si: 'සම්පූර්ණ දිග',
    en: 'Total Length',
    ta: 'மொத்த நீளம்',
  },
  totalWidth: {
    si: 'සම්පූර්ණ පළල',
    en: 'Total Width',
    ta: 'மொத்த அகலம்',
  },
  panelHeight: {
    si: 'පැනලයේ දිග',
    en: 'Panel Height',
    ta: 'பேனல் உயரம்',
  },
  panelWidth: {
    si: 'පැනලයේ පළල',
    en: 'Panel Width',
    ta: 'பேனல் அகலம்',
  },
  gridLineColor: {
    si: 'ග්‍රිඩ් ලයින් වර්ණය',
    en: 'Grid Line Color',
    ta: 'கட்டம் வரி நிறம்',
  },
  white: {
    si: 'සුදු',
    en: 'White',
    ta: 'வெள்ளை',
  },
  whiteBlack: {
    si: 'කළු ඉර සහිත සුදු',
    en: 'White with Black Line',
    ta: 'கருப்பு கோட்டுடன் வெள்ளை',
  },
  brown: {
    si: 'දුඹුරු',
    en: 'Brown',
    ta: 'பழுப்பு',
  },
  borderAlignment: {
    si: 'බෝඩර් සැකැස්ම',
    en: 'Border Alignment',
    ta: 'பார்டர் சீரமைப்பு',
  },
  alignEnd: {
    si: 'අගට සකසන්න',
    en: 'Align to End',
    ta: 'இறுதியில் சீரமை',
  },
  alignCenter: {
    si: 'මධ්‍යගත කරන්න',
    en: 'Center',
    ta: 'மையப்படுத்து',
  },
  alignLargeCenter: {
    si: 'බෝඩරය ලොකුවට සෙන්ටර් කිරීම',
    en: 'Large Center Border',
    ta: 'பெரிய மைய பார்டர்',
  },
  toggleView: {
    viewMaterials: {
      si: 'අමුද්‍රව්‍ය ලැයිස්තුව බලන්න',
      en: 'View Bill of Materials',
      ta: 'பொருள் பட்டியலைக் காண்க',
    },
    viewLayout: {
      si: 'සිවිලමේ සැකැස්ම බලන්න',
      en: 'View Ceiling Layout',
      ta: 'கூரை அமைப்பைக் காண்க',
    },
  },
  previewTitle: {
    aiResult: {
      si: 'AI දෘශ්‍යකරණ ප්‍රතිඵලය',
      en: 'AI Visualization Result',
      ta: 'AI காட்சிப்படுத்தல் முடிவு',
    },
    layoutPreview: {
      si: '',
      en: '',
      ta: '',
    },
  },
  addBorderImage: {
    si: 'බෝඩර්',
    en: 'Border',
    ta: 'பார்டர்',
  },
  addImage: {
    si: 'පැනල්',
    en: 'Panel',
    ta: 'பேனல்',
  },
  fromCamera: {
    si: 'කැමරාවෙන්',
    en: 'From Camera',
    ta: 'கேமராவிலிருந்து',
  },
  fromGallery: {
    si: 'ගැලරියෙන්',
    en: 'From Gallery',
    ta: 'தொகுப்பிலிருந்து',
  },
  totalArea: {
    si: 'සම්පූර්ණ වර්ගඵලය',
    en: 'Total Area',
    ta: 'மொத்த பரப்பளவு',
  },
  feet: {
    si: 'අඩි',
    en: 'Ft',
    ta: 'அடி',
  },
  inches: {
    si: 'අඟල්',
    en: 'In',
    ta: 'அங்',
  },
  loading: {
    si: 'ඔබේ සිවිලිමේ දෘශ්‍යකරණය ජනනය වෙමින් පවතී...',
    en: 'Generating your ceiling visualization...',
    ta: 'உங்கள் கூரை காட்சிப்படுத்தல் உருவாக்கப்படுகிறது...',
  },
  loadingSub: {
    si: 'මේ සඳහා මොහොතක් ගතවනු ඇත.',
    en: 'This may take a moment.',
    ta: 'இதற்கு சிறிது நேரம் ஆகலாம்.',
  },
  errorTitle: {
    si: 'දෘශ්‍යකරණය අසාර්ථක විය',
    en: 'Visualization Failed',
    ta: 'காட்சிப்படுத்தல் தோல்வியடைந்தது',
  },
   saveProject: {
    si: 'ව්‍යාපෘතිය සුරකින්න',
    en: 'Save Project',
    ta: 'திட்டத்தைச் சேமிக்கவும்',
  },
  projectSaved: {
    si: 'ව්‍යාපෘතිය සුරකින ලදී!',
    en: 'Project Saved!',
    ta: 'திட்டம் சேமிக்கப்பட்டது!',
  },
  loginToSave: {
    si: 'සුරැකීමට කරුණාකර ඇතුල් වන්න',
    en: 'Please login to save',
    ta: 'சேமிக்க உள்நுழையவும்',
  },
  downloadPdf: {
    si: 'PDF ලෙස බාගන්න',
    en: 'Download as PDF',
    ta: 'PDF ஆகப் பதிவிறக்கவும்',
  },
  billOfMaterials: {
    title: {
      si: 'අමුද්‍රව්‍ය ලැයිස්තුව',
      en: 'Bill of Materials',
      ta: 'பொருள் பட்டியல்',
    },
    item: {
      si: 'අයිතමය',
      en: 'Item',
      ta: 'பொருள்',
    },
    quantity: {
      si: 'ප්‍රමාණය',
      en: 'Quantity',
      ta: 'அளவு',
    },
    unit: {
      si: 'ඒකකය',
      en: 'Unit',
      ta: 'அலகு',
    },
     ceilingBoard: {
      si: 'සිවිලින් බෝඩ්',
      en: 'Ceiling Board',
      ta: 'கூரை பலகை',
    },
    mainTee: {
      si: 'මේන් ටී 12\'',
      en: 'Main Tee 12\'',
      ta: 'மெயின் டீ 12\'',
    },
    crossTee: {
      si: 'ක්‍රොස් ටී 2\'',
      en: 'Cross Tee 2\'',
      ta: 'கிராஸ் டீ 2\'',
    },
    wallAngle: {
      si: 'වෝල් ඇන්ගල් 10\'',
      en: 'Wall Angle 10\'',
      ta: 'சுவர் கோணம் 10\'',
    },
    concreteNails: {
      si: 'කොන්ක්‍රීට් ඇණ 1.5"',
      en: 'Concrete Nails 1.5"',
      ta: 'கான்கிரீட் ஆணிகள் 1.5"',
    },
    wire: {
      si: 'කම්බි',
      en: 'Wire',
      ta: 'கம்பி',
    },
    rivets: {
      si: 'ඇලුමිනියම් රිවට්',
      en: 'Aluminum Rivets',
      ta: 'அலுமினிய ரிவெட்டுகள்',
    },
    boards: {
      si: 'බෝඩ්',
      en: 'Boards',
      ta: 'பலகைகள்',
    },
    pieces: {
      si: 'කෑලි',
      en: 'Pieces',
      ta: 'துண்டுகள்',
    },
    kg: {
      si: 'kg',
      en: 'kg',
      ta: 'கிலோ',
    },
  },
  loginToContinue: {
    si: 'දිගටම වැඩ කිරීමට කරුණාකර ලොග් වන්න',
    en: 'Please log in to continue',
    ta: 'தொடர உள்நுழையவும்',
  },
  loginPrompt: {
    si: 'මෙම විශේෂාංගය අසීමිතව භාවිතා කිරීමට, කරුණාකර ඔබගේ ගිණුමට ලොග් වන්න.',
    en: 'To use this feature without limits, please log in to your account.',
    ta: 'இந்த அம்சத்தை வரம்பில்லாமல் பயன்படுத்த, உங்கள் கணக்கில் உள்நுழையவும்.',
  },
  loginButton: {
      si: "ලොග් වන්න",
      en: "Login",
      ta: "உள்நுழைக",
  },
  accountDisabled: {
      title: {
          si: "ගිණුම අක්‍රීයයි",
          en: "Account Disabled",
          ta: "கணக்கு முடக்கப்பட்டது",
      },
      description: {
          si: "ඔබගේ ගිණුම පරිපාලකයෙකු විසින් අක්‍රීය කර ඇත. වැඩි විස්තර සඳහා සහාය අමතන්න.",
          en: "Your account has been disabled by an administrator. Please contact support for more information.",
          ta: "உங்கள் கணக்கு நிர்வாகியால் முடக்கப்பட்டது. மேலும் தகவலுக்கு ஆதரவைத் தொடர்பு கொள்ளவும்.",
      },
  },
};


export default function DesignPage() {
  const [visualization, setVisualization] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [textureImage, setTextureImage] = useState<string | null>(null);
  const [borderImage, setBorderImage] = useState<string | null>(null);
  const textureInputRef = useRef<HTMLInputElement>(null);
  const borderTextureInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [length, setLength] = useState<Dimension>({ feet: 13, inches: 0 });
  const [width, setWidth] = useState<Dimension>({ feet: 10, inches: 0 });
  const [panelWidth, setPanelWidth] = useState<Dimension>({ feet: 2, inches: 0 });
  const [panelHeight, setPanelHeight] = useState<Dimension>({ feet: 2, inches: 0 });
  const [lineColor, setLineColor] = useState('white');
  const [borderAlignment, setBorderAlignment] = useState<BorderAlignment>('end');
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  
  const [rotation, setRotation] = useState({ x: 50, z: -15 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [activeView, setActiveView] = useState<ActiveView>('layout');
  const { language, toggleLanguage } = useLanguage();
  
  const [manualCeilingBoards, setManualCeilingBoards] = useState<number | ''>('');
  const [manualMainTees, setManualMainTees] = useState<number | ''>('');
  const [manualCrossTees, setManualCrossTees] = useState<number | ''>('');
  const [manualWallAngles, setManualWallAngles] = useState<number | ''>('');
  const [manualRivets, setManualRivets] = useState<number | ''>('');
  const [manualWire, setManualWire] = useState<number | ''>('');
  const [manualNails, setManualNails] = useState<number | ''>('');
  const [projectName, setProjectName] = useState('');

  const [isBlocked, setIsBlocked] = useState(false);
  const pageViewTracked = useRef(false);

  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-ceiling');
  
    const toDecimalFeet = (dim: Dimension) => {
    const feet = typeof dim.feet === 'number' ? dim.feet : 0;
    const inches = typeof dim.inches === 'number' ? dim.inches : 0;
    return feet + inches / 12;
  };

  const decimalToDimension = (decimal: number): Dimension => {
      if (!decimal || decimal < 0) return { feet: 0, inches: 0 };
      const feet = Math.floor(decimal);
      const inches = Math.round((decimal - feet) * 12);
      if (inches === 12) {
          return { feet: feet + 1, inches: 0 };
      }
      return { feet, inches };
  };

  useEffect(() => {
    if (isUserLoading || pageViewTracked.current) return;

    if (user && user.isAnonymous) {
      if (localStorage.getItem('anonymousDesignUsed')) {
        setIsBlocked(true);
      } else {
        localStorage.setItem('anonymousDesignUsed', 'true');
      }
      pageViewTracked.current = true;
    } else if (user && !user.isAnonymous) {
      // Clear the flag for logged-in users so they can use it again if they log out
      localStorage.removeItem('anonymousDesignUsed');
      setIsBlocked(false);
      pageViewTracked.current = true;
    }
  }, [user, isUserLoading]);


  useEffect(() => {
    const loadLastProject = async () => {
      if (user && firestore) {
        const projectsRef = collection(firestore, `users/${user.uid}/ceilingProjects`);
        const q = query(projectsRef, orderBy('createdAt', 'desc'), limit(1));
        
        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const lastProject = querySnapshot.docs[0].data();
            setProjectName(lastProject.projectName || '');
            setLength(decimalToDimension(lastProject.length));
            setWidth(decimalToDimension(lastProject.width));
            setPanelHeight(decimalToDimension(lastProject.panelHeight));
            setPanelWidth(decimalToDimension(lastProject.panelWidth));
            setLineColor(lastProject.lineColor || 'white');
            setBorderAlignment(lastProject.borderAlignment || 'end');
            setTextureImage(lastProject.textureImage || null);
            setBorderImage(lastProject.borderImage || null);
          }
        } catch (error) {
          console.error("Error loading last project:", error);
        }
      }
    };

    if (!isUserLoading && user) {
        loadLastProject();
    }
  }, [user, isUserLoading, firestore]);

  useEffect(() => {
    const openGallery = () => {
      // Logic to open the main texture file dialog
      if (textureInputRef.current) {
        textureInputRef.current.removeAttribute('capture');
        textureInputRef.current.click();
      }
    };

    window.addEventListener('open-gallery', openGallery);

    return () => {
      window.removeEventListener('open-gallery', openGallery);
    };
  }, []);



  const toFeetInches = (decimalFeet: number): string => {
    if (!decimalFeet || decimalFeet < 0) return `0' 0"`;
    const absoluteFeet = Math.abs(decimalFeet);
    const feet = Math.floor(absoluteFeet);
    const inches = parseFloat(((absoluteFeet - feet) * 12).toFixed(1));
    if (inches === 12) {
      return `${feet + 1}' 0"`;
    }
    return `${feet}' ${inches}"`;
  };

  const toFeetInchesString = (dim: Dimension): string => {
    const feet = typeof dim.feet === 'number' ? dim.feet : 0;
    const inches = typeof dim.inches === 'number' ? dim.inches : 0;
    if (inches === 0) return `${feet}'`;
    return `${feet}'${inches}"`;
  };

  const drawingLength = toDecimalFeet(length);
  const drawingWidth = toDecimalFeet(width);
  const drawingPanelWidth = toDecimalFeet(panelWidth);
  const drawingPanelHeight = toDecimalFeet(panelHeight);

  const materials: MaterialQuantities = calculateMaterials(drawingLength, drawingWidth, drawingPanelWidth, drawingPanelHeight, borderAlignment);
  const totalArea = (drawingLength * drawingWidth).toFixed(2);
  const ceilingBoardName = `${translations.billOfMaterials.ceilingBoard[language]} ${toFeetInchesString(panelWidth)}x${toFeetInchesString(panelHeight)}`;


  const handleFileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoom(prev => Math.min(prev + 0.2, 5));
    } else {
      setZoom(prev => Math.max(prev - 0.2, 0.2));
    }
  }

  const handleTextureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileToDataUri(e.target.files[0])
        .then(setTextureImage)
        .catch(err => {
            console.error("Error converting file to data URI", err);
            setError("Could not load the selected image.");
        });
    }
  };
  
  const handleBorderTextureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileToDataUri(e.target.files[0])
        .then(setBorderImage)
        .catch(err => {
            console.error("Error converting border file to data URI", err);
            setError("Could not load the selected border image.");
        });
    }
  };

  const openFileDialog = (target: 'main' | 'border', useCamera: boolean) => {
    const ref = target === 'main' ? textureInputRef : borderTextureInputRef;
    if (ref.current) {
        if (useCamera) {
            ref.current.setAttribute('capture', 'environment');
        } else {
            ref.current.removeAttribute('capture');
        }
        ref.current.click();
    }
  };

  const handleRemoveImages = () => {
    setTextureImage(null);
    setBorderImage(null);
    setVisualization(null); // Also clear AI visualization if present
  };

  const createDimensionHandler = (setter: React.Dispatch<React.SetStateAction<Dimension>>) => {
    return (part: 'feet' | 'inches') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
       if (isNaN(value as number)) return;
      setter(prev => ({ ...prev, [part]: value }));
    };
  };

  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (viewMode === '3d') {
      setIsDragging(true);
      setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleInteractionMove = (clientX: number, clientY: number) => {
    if (isDragging && viewMode === '3d') {
      const dx = clientX - dragStart.x;
      const dy = clientY - dragStart.y;
      setDragStart({ x: clientX, y: clientY });

      setRotation(prev => {
        const newX = prev.x - dy * 0.5;
        const newZ = prev.z + dx * 0.5;
        return { x: newX, z: newZ };
      });
    }
  };

  const handleInteractionEnd = () => {
    setIsDragging(false);
  };
  
  const onMouseDown = (e: MouseEvent) => handleInteractionStart(e.clientX, e.clientY);
  const onMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX, e.clientY);
  const onMouseUp = () => handleInteractionEnd();
  const onMouseLeave = () => handleInteractionEnd();

  const onTouchStart = (e: TouchEvent) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleInteractionEnd();

  const toggleView = () => {
      setActiveView(prev => prev === 'layout' ? 'materials' : 'layout');
  }
  
  const handleSaveProject = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: translations.loginToSave[language],
        });
        return;
    }
     if (!projectName) {
      toast({
        variant: "destructive",
        title: "Project name is required.",
      });
      return;
    }

    const projectData = {
        projectName,
        length: toDecimalFeet(length),
        width: toDecimalFeet(width),
        panelHeight: toDecimalFeet(panelHeight),
        panelWidth: toDecimalFeet(panelWidth),
        lineColor,
        borderAlignment,
        textureImage,
        borderImage,
    };

    const result = await saveCeilingProjectAction(firestore, user.uid, projectData);

    if (result.success) {
        toast({
            title: translations.projectSaved[language],
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
        });
    }
  };

const handleSaveToPdf = async () => {
    const svgElement = document.getElementById('ceiling-drawing-svg');
    if (!svgElement) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find the drawing to save.' });
        return;
    }

    try {
        const scale = 4;
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const svgSize = svgElement.getBoundingClientRect();
        canvas.width = svgSize.width * scale;
        canvas.height = svgSize.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create canvas context.' });
            return;
        }

        const img = document.createElement('img');
        const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
        img.src = 'data:image/svg+xml;base64,' + svgBase64;

        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                ctx.fillStyle = 'white'; // Set background color
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve();
            };
            img.onerror = () => reject(new Error('Image failed to load for PDF generation'));
        });

        const imgData = canvas.toDataURL('image/png');

        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageMargin = 15;

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const aspectRatio = imgWidth / imgHeight;
        let finalImgWidth = pageWidth - (pageMargin * 2);
        let finalImgHeight = finalImgWidth / aspectRatio;

        if (finalImgHeight > pageHeight * 0.4) {
             finalImgHeight = pageHeight * 0.4;
             finalImgWidth = finalImgHeight * aspectRatio;
        }
        
        const x = (pageWidth - finalImgWidth) / 2;
        doc.addImage(imgData, 'PNG', x, pageMargin, finalImgWidth, finalImgHeight);
        let lastY = pageMargin + finalImgHeight + 10;

        (doc as any).autoTable({
            body: [
                [`${translations.projectName[language]}:`, projectName || 'N/A'],
                [`${translations.totalLength[language]}:`, toFeetInches(drawingLength)],
                [`${translations.totalWidth[language]}:`, toFeetInches(drawingWidth)],
            ],
            startY: lastY,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1 },
            columnStyles: { 0: { fontStyle: 'bold' } },
        });

        lastY = (doc as any).lastAutoTable.finalY + 5;
        
        const bomTitle = translations.billOfMaterials.title[language];
        const bomItems = [
            { name: ceilingBoardName, quantity: materials.ceilingBoards, unit: translations.billOfMaterials.boards[language] },
            { name: translations.billOfMaterials.mainTee[language], quantity: materials.mainTees, unit: translations.billOfMaterials.pieces[language] },
            { name: translations.billOfMaterials.crossTee[language], quantity: materials.crossTees, unit: translations.billOfMaterials.pieces[language] },
            { name: translations.billOfMaterials.wallAngle[language], quantity: materials.wallAngles, unit: translations.billOfMaterials.pieces[language] },
            { name: translations.billOfMaterials.concreteNails[language], quantity: materials.concreteNails, unit: translations.billOfMaterials.pieces[language] },
            { name: translations.billOfMaterials.wire[language], quantity: materials.wireKilos, unit: translations.billOfMaterials.kg[language] },
            { name: translations.billOfMaterials.rivets[language], quantity: materials.rivets, unit: translations.billOfMaterials.pieces[language] },
        ].filter(item => item.quantity > 0);

        if (bomItems.length > 0) {
            (doc as any).autoTable({
                head: [[bomTitle]],
                startY: lastY,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], halign: 'center' },
            });
             lastY = (doc as any).lastAutoTable.finalY;

            (doc as any).autoTable({
                head: [[translations.billOfMaterials.item[language], translations.billOfMaterials.quantity[language], translations.billOfMaterials.unit[language]]],
                body: bomItems.map(item => [item.name, item.quantity, item.unit]),
                startY: lastY,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
            });
        }
        
        doc.save(`${projectName || 'ceiling-design'}.pdf`);

        toast({
            title: 'PDF Saved',
            description: 'Your ceiling design has been saved as a PDF.',
        });
    } catch (e) {
      console.error("Error saving PDF:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save PDF.' });
    }
  };

  const isFormDisabled = user?.disabled === true;

  if (isUserLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
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
        
        <Card className="max-w-md text-center bg-background/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>{translations.loginToContinue[language]}</CardTitle>
                <CardDescription>{translations.loginPrompt[language]}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg">
                    <Link href="/login">
                        <LogIn className="mr-2 h-5 w-5" />
                        {translations.loginButton[language]}
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
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
      
      <div className="relative z-10">
        <input 
          type="file" 
          accept="image/*" 
          ref={textureInputRef}
          onChange={handleTextureSelect}
          className="hidden" 
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={borderTextureInputRef} 
          onChange={handleBorderTextureSelect}
          className="hidden" 
        />
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{translations.designTitle[language]}</CardTitle>
                  <CardDescription>{translations.designDescription[language]}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isFormDisabled && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{translations.accountDisabled.title[language]}</AlertTitle>
                        <AlertDescription>{translations.accountDisabled.description[language]}</AlertDescription>
                    </Alert>
                  )}
                  <fieldset disabled={isFormDisabled} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName" className="text-lg text-orange-600">{translations.projectName[language]}</Label>
                      <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder={translations.projectName[language]}
                        className="text-lg text-green-700"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-lg text-green-700">{translations.totalLength[language]}</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder={translations.feet[language]}
                            value={length.feet}
                            onChange={createDimensionHandler(setLength)('feet')}
                            className="text-lg text-blue-700"
                          />
                          <Input 
                            type="number" 
                            placeholder={translations.inches[language]}
                            value={length.inches}
                            onChange={createDimensionHandler(setLength)('inches')}
                            className="text-lg text-blue-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-lg text-green-700">{translations.totalWidth[language]}</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder={translations.feet[language]}
                            value={width.feet}
                            onChange={createDimensionHandler(setWidth)('feet')}
                            className="text-lg text-blue-700"
                          />
                          <Input 
                            type="number" 
                            placeholder={translations.inches[language]}
                            value={width.inches}
                            onChange={createDimensionHandler(setWidth)('inches')}
                            className="text-lg text-blue-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-lg text-green-700">{translations.panelHeight[language]}</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder={translations.feet[language]}
                            value={panelHeight.feet}
                            onChange={createDimensionHandler(setPanelHeight)('feet')}
                            className="text-lg text-blue-700"
                          />
                          <Input 
                            type="number"                  
                            placeholder={translations.inches[language]}
                            value={panelHeight.inches}
                            onChange={createDimensionHandler(setPanelHeight)('inches')}
                            className="text-lg text-blue-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-lg text-green-700">{translations.panelWidth[language]}</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder={translations.feet[language]}
                            value={panelWidth.feet}
                            onChange={createDimensionHandler(setPanelWidth)('feet')}
                            className="text-lg text-blue-700"
                          />
                          <Input 
                            type="number" 
                            placeholder={translations.inches[language]}
                            value={panelWidth.inches}
                            onChange={createDimensionHandler(setPanelWidth)('inches')}
                            className="text-lg text-blue-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                       <div className="space-y-3">
                        <Label className="text-lg text-orange-600">{translations.gridLineColor[language]}</Label>
                        <RadioGroup
                          onValueChange={setLineColor}
                          defaultValue={lineColor}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-3 space-y-0">
                            <RadioGroupItem value="white" id="c-white" />
                            <Label htmlFor="c-white" className="font-normal text-lg text-green-700">{translations.white[language]}</Label>
                          </div>
                          <div className="flex items-center space-x-3 space-y-0">
                            <RadioGroupItem value="white-black" id="c-white-black" />
                            <Label htmlFor="c-white-black" className="font-normal text-lg text-green-700">{translations.whiteBlack[language]}</Label>
                          </div>
                          <div className="flex items-center space-x-3 space-y-0">
                            <RadioGroupItem value="brown" id="c-brown" />
                            <Label htmlFor="c-brown" className="font-normal text-lg text-green-700">{translations.brown[language]}</Label>
                          </div>
                        </RadioGroup>
                      </div>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between">
                           <Label className="text-lg text-orange-600">{translations.borderAlignment[language]}</Label>
                          </div>
                          <RadioGroup
                            onValueChange={(value) => setBorderAlignment(value as BorderAlignment)}
                            defaultValue={borderAlignment}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-3 space-y-0">
                              <RadioGroupItem value="end" id="align-end" />
                              <Label htmlFor="align-end" className="font-normal text-lg text-green-700">{translations.alignEnd[language]}</Label>
                            </div>
                            <div className="flex items-center space-x-3 space-y-0">
                              <RadioGroupItem value="center" id="align-center" />
                              <Label htmlFor="align-center" className="font-normal text-lg text-green-700">{translations.alignCenter[language]}</Label>
                            </div>
                             <div className="flex items-center space-x-3 space-y-0">
                              <RadioGroupItem value="large-center" id="align-large-center" />
                              <Label htmlFor="align-large-center" className="font-normal text-lg text-green-700">{translations.alignLargeCenter[language]}</Label>
                            </div>
                          </RadioGroup>
                        </div>
                    </div>
                  </fieldset>
                </CardContent>
              </Card>
              <div className="py-4 flex gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button className="w-full" onClick={handleSaveProject} disabled={!user || isFormDisabled}>
                                <Save className="mr-2 h-4 w-4" />
                                {translations.saveProject[language]}
                            </Button>
                        </TooltipTrigger>
                        {!user && (
                            <TooltipContent>
                                <p>{translations.loginToSave[language]}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={toggleView} disabled={isFormDisabled}>
                    <ChevronsUpDown className="mr-2 h-4 w-4" />
                    {activeView === 'layout' ? translations.toggleView.viewMaterials[language] : translations.toggleView.viewLayout[language]}
                </Button>
              </div>
            </div>
            <div className="lg:col-span-3">
              {activeView === 'layout' ? (
                  <Card className="sticky top-20">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 p-3">
                      <div className="flex items-center gap-4">
                        {visualization ? (
                            <CardTitle className="text-lg">{translations.previewTitle.aiResult[language]}</CardTitle>
                        ) : (
                            <ToggleGroup type="single" value={viewMode} onValueChange={(value: ViewMode) => value && setViewMode(value)} aria-label="View mode" disabled={isFormDisabled}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <ToggleGroupItem value="2d" aria-label="2D View" className="data-[state=on]:bg-blue-600 data-[state=on]:text-white">
                                                2D
                                            </ToggleGroupItem>
                                        </TooltipTrigger>
                                        <TooltipContent><p>2D View</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <ToggleGroupItem value="3d" aria-label="3D View" className="data-[state=on]:bg-red-600 data-[state=on]:text-white">
                                                3D
                                            </ToggleGroupItem>
                                        </TooltipTrigger>
                                        <TooltipContent><p>3D View</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </ToggleGroup>
                        )}
                        
                        {!visualization && (
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs bg-purple-600 text-white hover:bg-purple-700" disabled={isFormDisabled}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    {translations.addBorderImage[language]}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => openFileDialog('border', true)}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    <span>{translations.fromCamera[language]}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => openFileDialog('border', false)}>
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    <span>{translations.fromGallery[language]}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs bg-purple-600 text-white hover:bg-purple-700" disabled={isFormDisabled}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    {translations.addImage[language]}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => openFileDialog('main', true)}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    <span>{translations.fromCamera[language]}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => openFileDialog('main', false)}>
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    <span>{translations.fromGallery[language]}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                                
                                {(textureImage || borderImage) && (
                                  <TooltipProvider>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-9 w-9" onClick={handleRemoveImages} disabled={isFormDisabled}>
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove Images</span>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                              <p>Remove Images</p>
                                          </TooltipContent>
                                      </Tooltip>
                                  </TooltipProvider>
                                )}
                            </div>
                        )}
                      </div>
                  </CardHeader>
                  <div 
                    className="relative"
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseLeave}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button variant="outline" size="icon" onClick={() => handleZoom('out')} disabled={zoom <= 0.2 || isFormDisabled}>
                                          <ZoomOut className="h-4 w-4" />
                                          <span className="sr-only">Zoom Out</span>
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Zoom Out</p>
                                  </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button variant="outline" size="icon" onClick={() => handleZoom('in')} disabled={zoom >= 5 || isFormDisabled}>
                                          <ZoomIn className="h-4 w-4" />
                                          <span className="sr-only">Zoom In</span>
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Zoom In</p>
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                      </div>
                    <CardContent 
                        className="relative flex items-center justify-center bg-muted/50 p-4 overflow-hidden"
                        style={{ cursor: viewMode === '3d' && !isFormDisabled ? (isDragging ? 'grabbing' : 'grab') : 'default', minHeight: '400px' }}
                    >
                        {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p>{translations.loading[language]}</p>
                            <p className="text-sm">{translations.loadingSub[language]}</p>
                        </div>
                        ) : error ? (
                        <Alert variant="destructive" className="max-w-md">
                            <AlertTitle>{translations.errorTitle[language]}</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        ) : visualization ? (
                        <Image
                            src={visualization}
                            alt="AI generated ceiling visualization"
                            width={800}
                            height={600}
                            className="object-contain w-full h-full rounded-lg"
                        />
                        ) : (
                        <>
                            <CeilingDrawing
                            id="ceiling-drawing-svg"
                            length={drawingLength || 0}
                            width={drawingWidth || 0}
                            panelWidth={drawingPanelWidth || 0}
                            panelHeight={drawingPanelHeight || 0}
                            lineColor={lineColor as any}
                            borderAlignment={borderAlignment}
                            zoom={zoom}
                            textureImage={textureImage}
                            borderImage={borderImage}
                            viewMode={viewMode}
                            rotation={rotation}
                            isDragging={isDragging}
                            mainTees={materials.mainTees}
                            />
                        </>
                        )}
                    </CardContent>
                  </div>
                   <CardFooter className="flex justify-between items-center p-3 bg-muted/50">
                        <p className="text-sm text-muted-foreground">{translations.totalArea[language]}: <span className="font-semibold text-foreground">{totalArea}</span> sq. ft.</p>
                       {!visualization && (
                           <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm" onClick={handleSaveToPdf} disabled={isFormDisabled}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {translations.downloadPdf[language]}
                                </Button>
                            </div>
                       )}
                  </CardFooter>
                   {!visualization && (
                      <>
                        <Separator />
                        <CardContent className="p-4 text-sm">
                           <p className="font-semibold mb-2 text-center">{translations.billOfMaterials.title[language]}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Rows className="h-5 w-5 text-primary" />
                                    <span>{translations.billOfMaterials.mainTee[language]}: {materials.mainTees}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Grip className="h-5 w-5 text-primary" />
                                    <span>{translations.billOfMaterials.crossTee[language]}: {materials.crossTees}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Box className="h-5 w-5 text-primary" />
                                    <span>{ceilingBoardName}: {materials.ceilingBoards}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Square className="h-5 w-5 text-primary" />
                                    <span>{translations.billOfMaterials.wallAngle[language]}: {materials.wallAngles}</span>
                                </div>
                            </div>
                        </CardContent>
                      </>
                   )}
                  </Card>
              ) : (
                  <BillOfMaterials 
                      materials={materials}
                      manualCeilingBoards={manualCeilingBoards}
                      onCeilingBoardsChange={setManualCeilingBoards}
                      manualMainTees={manualMainTees}
                      onMainTeesChange={setManualMainTees}
                      manualCrossTees={manualCrossTees}
                      onCrossTeesChange={setManualCrossTees}
                      manualWallAngles={manualWallAngles}
                      onWallAnglesChange={setManualWallAngles}
                      manualRivets={manualRivets}
                      onRivetsChange={setManualRivets}
                      manualWire={manualWire}
                      onWireChange={setManualWire}
                      manualNails={manualNails}
                      onNailsChange={setManualNails}
                      ceilingBoardName={ceilingBoardName}
                  />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
