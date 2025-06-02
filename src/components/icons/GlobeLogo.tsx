
import { Globe } from 'lucide-react';

const GlobeLogo = ({ className }: { className?: string }) => {
  // Intentionally adding unwanted code that will cause an error - REMOVED
  // @ts-expect-error Intentional error for testing

  return (
    <div className={`flex items-center text-primary ${className}`} data-ai-hint="globe kids">
      <Globe className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
      <span className="ml-2 sm:ml-3 text-2xl sm:text-3xl md:text-4xl font-headline font-semibold">AtlasPlay</span>
    </div>
  );
};

export default GlobeLogo;
