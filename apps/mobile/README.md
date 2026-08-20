# Mobile MAWJA

Cette app mobile est basée sur Expo Router et Expo Dev Client.

## Prérequis

- `pnpm install` lancé à la racine du monorepo
- Node 20
- Expo SDK 51

## Lancer en local

Depuis la racine :

```bash
pnpm --filter @mawja/mobile dev
```

Pour ouvrir un serveur réutilisable depuis un development client :

```bash
cd apps/mobile
npx expo start --tunnel
```

## Development client

Le scheme applicatif est :

```text
kalymap
```

Le deep link de connexion au serveur Expo depuis le development client suit ce format :

```text
kalymap://expo-development-client/?url=<EXPO_TUNNEL_URL_ENCODEE>
```

Exemple :

```text
kalymap://expo-development-client/?url=exp%3A%2F%2Fu.expo.dev%2Fxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Codemagic

Le dépôt GitHub source est :

```text
git@github.com:Yahya-magharoui/MAWJA.git
```

Workflows utiles :

- `android-development-client`
- `android-debug`
- `ios-test`

### APK Android development client

Le workflow `android-development-client` produit cet artefact :

```text
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### APK Android debug classique

Le workflow `android-debug` publie les APKs sous :

```text
apps/mobile/android/app/build/outputs/**/*.apk
```

## Vérification rapide

Commande de validation locale :

```bash
pnpm --filter @mawja/mobile doctor:build
```

Commande de normalisation Gradle Android après un `expo prebuild` :

```bash
pnpm --filter @mawja/mobile doctor:android-gradle
```
