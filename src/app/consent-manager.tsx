'use client';

import { 
  ConsentManagerProvider, 
  useConsentManager 
} from '@c15t/nextjs';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NOCTVM Custom Consent Manager
 * Logic handled via @c15t/nextjs
 * Styling following Liquid Glass & Impeccable Design Standards
 */
export function ConsentManager({ children }: { children: React.ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'c15t',
        backendURL: '/api/c15t',
        // In development, we always want to see the banner to test it
        ignoreGeoLocation: process.env.NODE_ENV === 'development',
        consentCategories: ['necessary', 'measurement', 'marketing'],
      }}
    >
      <NoctvmConsentBanner />
      <CustomPreferencesDialog />
      {children}
    </ConsentManagerProvider>
  );
}

function NoctvmConsentBanner() {
  const { showPopup, saveConsents, setIsPrivacyDialogOpen } = useConsentManager();

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          id="noctvm-consent-banner"
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[1000] p-6 md:p-12 flex justify-center pointer-events-none"
        >
          <GlassPanel 
            variant="noise" 
            className="w-full max-w-5xl p-6 md:p-8 pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-8 border-white/10"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-noctvm-violet animate-pulse shadow-[0_0_12px_rgba(124,58,237,0.8)]" />
                <h3 className="text-xl font-heading font-bold text-white tracking-tight uppercase">
                  Memory of the Night
                </h3>
              </div>
              <p className="text-sm text-noctvm-silver leading-relaxed max-w-2xl font-body">
                NOCTVM uses refined tracking to map the city&apos;s pulse and preserve your digital footprints. 
                By accepting, you allow us to optimize your journey through the underground.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 min-w-fit">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsPrivacyDialogOpen(true)}
                className="text-noctvm-silver/60 hover:text-white transition-colors"
              >
                Preferences
              </Button>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="md" 
                  onClick={() => saveConsents('necessary')}
                  className="px-6"
                >
                  Strict
                </Button>
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={() => saveConsents('all')}
                  className="px-8"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CustomPreferencesDialog() {
  const { 
    isPrivacyDialogOpen, 
    setIsPrivacyDialogOpen, 
    selectedConsents, 
    setSelectedConsent,
    saveConsents,
    gdprTypes
  } = useConsentManager();

  const categories = gdprTypes || ['necessary', 'measurement', 'marketing'];

  return (
    <Modal
      isOpen={isPrivacyDialogOpen}
      onClose={() => setIsPrivacyDialogOpen(false)}
      title="Privacy Infrastructure"
      footer={
        <div className="flex justify-between items-center w-full">
          <Button variant="ghost" onClick={() => saveConsents('necessary')}>
            Only Required
          </Button>
          <Button variant="primary" onClick={() => saveConsents('custom')}>
            Save & Exit
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-8">
        <p className="text-sm text-noctvm-silver leading-relaxed">
          Select the data layers you want NOCTVM to synchronize with. Essential services cannot be disabled to ensure platform stability.
        </p>
        
        <div className="space-y-6">
          {categories.map((category: any) => (
            <div key={category} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white capitalize">{category}</h4>
                <p className="text-xs text-noctvm-silver/70 leading-relaxed uppercase tracking-widest">
                  {category === 'necessary' ? 'PLATFORM STABILITY' : 'EXPERIENCE ENHANCEMENT'}
                </p>
              </div>
              <Switch
                checked={(selectedConsents as any)[category] || false}
                disabled={category === 'necessary'}
                onCheckedChange={(checked) => setSelectedConsent(category, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
