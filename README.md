# Froo Rewards

Aplicația de loialitate Froo: puncte, oferte, listă de cumpărături, magazine și mini-jocuri.

```
mobile/   aplicația iOS + Android (Expo / React Native)  ← asta se prezintă
src/      versiunea web (Vite + React), referința de design
scripts/  build pentru jocurile incluse în aplicația mobilă
docs/     ghiduri de arhitectură și migrare
```

## Linkuri publice

- **Web (orice telefon, fără instalare):** https://froo-rewards.expo.app
- **Proiect Expo / build-uri:** https://expo.dev/accounts/altmar-group/projects/froo-rewards

Actualizare versiune web:

```sh
cd mobile
npx expo export -p web && npx eas-cli deploy --prod
```

APK Android public (link de instalare pe expo.dev):

```sh
cd mobile
npx eas-cli build -p android --profile preview
```

## Aplicația mobilă

```sh
cd mobile
npm install
```

**Instalată pe telefon, merge fără laptop (Release):**

```sh
# iPhone conectat prin cablu (sau pe aceeași rețea, asociat în Xcode)
npx expo run:ios --configuration Release --device

# Android: APK instalabil pe orice telefon
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
adb install -r app/build/outputs/apk/release/app-release.apk
```

**Dezvoltare cu reîncărcare live:** `npx expo run:ios` / `npx expo run:android`.

Harta din „Magazine” folosește Apple Maps pe iOS. Pe Android folosește Google Maps dacă
`GOOGLE_MAPS_API_KEY` e setat la build (vezi `mobile/.env.example`), altfel OpenStreetMap.

## Versiunea web

```sh
npm install
npm run dev        # http://localhost:3000
```
