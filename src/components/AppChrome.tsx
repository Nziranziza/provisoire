import OfflineIndicator from './OfflineIndicator';
import SwUpdateBanner from './SwUpdateBanner';
import InstallAppPromo from './InstallAppPromo';
import type { Lang } from '../lib/quiz';

interface AppChromeProps {
  lang?: Lang;
}

/** Single React island for global PWA UI — avoids duplicate React copies in dev. */
export default function AppChrome({ lang = 'en' }: AppChromeProps) {
  return (
    <>
      <OfflineIndicator lang={lang} />
      <SwUpdateBanner lang={lang} />
      <InstallAppPromo lang={lang} />
    </>
  );
}
