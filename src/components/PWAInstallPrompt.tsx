'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Download, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';
import { pwaService, PWAStatus } from '@/lib/pwa-service';

export default function PWAInstallPrompt() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOnline: true,
    isServiceWorkerSupported: false,
    isServiceWorkerRegistered: false,
    installPromptEvent: null
  });
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Get initial status
    setPwaStatus(pwaService.getStatus());

    // Subscribe to status changes
    const unsubscribe = pwaService.onStatusChange((status) => {
      setPwaStatus(status);
    });

    return unsubscribe;
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const result = await pwaService.installApp();
      if (result.success) {
        console.log('App installed successfully');
      } else {
        console.error('Installation failed:', result.error);
      }
    } catch (error) {
      console.error('Installation error:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show if already installed, not installable, or dismissed
  if (pwaStatus.isInstalled || !pwaStatus.isInstallable || dismissed) {
    return null;
  }

  return (
    <Card className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-blue-900">
                Install CoinBox AI
              </CardTitle>
              <CardDescription className="text-blue-700">
                Get the best experience with our mobile app
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-700">Offline access</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-700">Push notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-700">Faster loading</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleInstall}
            disabled={installing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {installing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Installing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Install App
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {pwaStatus.isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  Offline
                </Badge>
              </>
            )}
          </div>

          {pwaStatus.isServiceWorkerRegistered && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                Service Worker Active
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
