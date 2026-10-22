import React from 'react';
import { Linking } from 'react-native';
import { Card, Header, Row, Screen, T } from '../src/components/ui';
import { clearQuranCache } from '../src/lib/quran';
import { useContent } from '../src/state/ContentState';
import { Button } from '../src/components/ui';

export default function About() {
  const { refresh, refreshing } = useContent();
  return (
    <Screen>
      <Header title="About & sources" />
      <Card>
        <T size={14} weight="bold">Quran text and translations</T>
        <T size={13} muted>
          Arabic text (Uthmani script) and translations come from Quran.com, run by the Quran Foundation. They are shown exactly as supplied and checked
          for completeness when downloaded. The translator’s name is shown at the end of each surah.
        </T>
        <Row label="Quran.com" onPress={() => Linking.openURL('https://quran.com').catch(() => undefined)} last />
      </Card>
      <Card>
        <T size={14} weight="bold">Hadith and Sunnah</T>
        <T size={13} muted>
          A hadith or Sunnah appears in Khalad only after it has been checked for wording and reference. Spotted a mistake? Use “Share your thoughts”.
        </T>
      </Card>
      <Card>
        <T size={14} weight="bold">Prayer times</T>
        <T size={13} muted>
          Calculated on your phone with the open-source Adhan library, using the method and Asr setting you choose. Times can differ slightly from your
          mosque; use “Match your mosque” to align them.
        </T>
      </Card>
      <Card>
        <T size={14} weight="bold">Your privacy</T>
        <T size={13} muted>
          No ads and no tracking SDKs. Location, reading progress and sadaqah stay on your phone. Anonymous usage is shared only if you turn it on.
        </T>
      </Card>
      <Button label="Refresh content" variant="soft" loading={refreshing} onPress={refresh} />
      <Button label="Re-download Quran text" variant="ghost" onPress={clearQuranCache} />
    </Screen>
  );
}
