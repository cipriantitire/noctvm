import { ToastProvider } from '@/components/ui';

export const metadata = { title: 'Figma Export — NOCTVM' };

export default function FigmaExportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#050505] text-[#E8E4DF]">
        {children}
      </div>
    </ToastProvider>
  );
}
