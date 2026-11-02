import { useFonts } from 'expo-font';
import type { TextStyle } from 'react-native';

// Deep subpath imports, one per face. Importing from the package root instead pulls in
// `@expo-google-fonts/inter/index.js`, which `require()`s all 18 variants at module scope —
// Metro then bundles every one of them (~6.2 MB of TTF) no matter which are actually loaded.
// Reaching straight for the faces the app uses keeps that down to the eight below.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { Inter_900Black } from '@expo-google-fonts/inter/900Black';
import { Inter_400Regular_Italic } from '@expo-google-fonts/inter/400Regular_Italic';
import { Inter_700Bold_Italic } from '@expo-google-fonts/inter/700Bold_Italic';

/**
 * The web app loads no webfont — it renders in Tailwind's default `font-sans` stack, which
 * resolves to whatever the host OS supplies. On the Windows machine the design was authored
 * and reviewed on, that is Segoe UI; on iOS it would be San Francisco and on Android Roboto.
 * So "the design" as it exists in the designer's head is a Segoe-flavoured humanist UI sans,
 * and the unstyled RN app was rendering in a different typeface on every platform.
 *
 * Segoe UI cannot be redistributed inside an app bundle (Microsoft licence), so we embed Inter
 * instead: an open-licenced typeface drawn for exactly this role, with near-identical metrics
 * and a matching neutral-geometric tone. Embedding it also makes text render *identically on
 * iOS and Android*, which the platform defaults never would.
 *
 * Only the weights the app actually uses are here. Tailwind classes in use are `font-medium`
 * (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800) and `font-black`
 * (900), plus unstyled body copy at 400. Add a face here before using a new weight class —
 * an unmapped weight silently falls back to regular.
 */
const UPRIGHT: Record<string, string> = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
  '900': 'Inter_900Black',
};

// Only 400 and 700 italics ship — the app's single italic is a bold "VISA" card label. Other
// weights round to the nearer of the two rather than losing the slant entirely.
const ITALIC: Record<string, string> = {
  '400': 'Inter_400Regular_Italic',
  '500': 'Inter_400Regular_Italic',
  '600': 'Inter_700Bold_Italic',
  '700': 'Inter_700Bold_Italic',
  '800': 'Inter_700Bold_Italic',
  '900': 'Inter_700Bold_Italic',
};

/**
 * React Native does not synthesise weights for custom fonts the way a browser does — each
 * weight is a separately registered family, and a bare `fontWeight: '700'` against a custom
 * `fontFamily` silently renders regular on Android. Every weight therefore has to be resolved
 * to its own family name before it reaches the native text node.
 */
export function familyForWeight(weight: TextStyle['fontWeight'], italic = false): string {
  // RN accepts numbers, numeric strings, and the `normal`/`bold` keywords.
  const normalised =
    weight === undefined || weight === null || weight === 'normal'
      ? '400'
      : weight === 'bold'
        ? '700'
        : String(weight);

  const table = italic ? ITALIC : UPRIGHT;
  return table[normalised] ?? table['400'];
}

/** Loads every face the app uses. Returns `[loaded, error]`. */
export function useAppFonts() {
  return useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    Inter_400Regular_Italic,
    Inter_700Bold_Italic,
  });
}
