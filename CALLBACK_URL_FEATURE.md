# Fonctionnalité de Callback URL

## Description

Cette fonctionnalité permet de rediriger automatiquement les utilisateurs vers la page qu'ils tentaient d'accéder après une connexion réussie.

## Comment ça fonctionne

### 1. Redirection vers la page de connexion

Lorsqu'un utilisateur non connecté tente d'accéder à une page protégée, il est redirigé vers `/login` avec un paramètre `callbackUrl` contenant l'URL de la page d'origine.

**Exemple :**
```
/quiz/123 → /login?callbackUrl=%2Fquiz%2F123
```

### 2. Pages implémentées

#### Pages protégées qui redirigent avec callback URL :
- **`/quiz/[id]`** - Page de quiz
- **`/dashboard`** - Tableau de bord utilisateur

#### Pages d'authentification qui supportent le callback URL :
- **`/login`** - Page de connexion
- **`/register`** - Page d'inscription

### 3. Flux utilisateur

1. **Utilisateur non connecté accède à un quiz** :
   ```
   Visite /quiz/abc123
   → Redirigé vers /login?callbackUrl=%2Fquiz%2Fabc123
   → Message affiché : "🔒 Vous devez être connecté pour accéder à cette page"
   ```

2. **Connexion réussie** :
   ```
   Utilisateur se connecte
   → Redirigé automatiquement vers /quiz/abc123
   → Peut commencer le quiz immédiatement
   ```

3. **Inscription depuis une page protégée** :
   ```
   Clic sur "S'inscrire" depuis /login?callbackUrl=%2Fquiz%2Fabc123
   → Redirigé vers /register?callbackUrl=%2Fquiz%2Fabc123
   → Après inscription, redirigé vers /login?registered=true&callbackUrl=%2Fquiz%2Fabc123
   → Après connexion, redirigé vers /quiz/abc123
   ```

## Implémentation technique

### Page de connexion (`/login`)

```typescript
const [callbackUrl, setCallbackUrl] = useState<string>('/dashboard');

useEffect(() => {
  const callback = searchParams.get('callbackUrl');
  if (callback) {
    setCallbackUrl(callback);
  }
}, [searchParams]);

// Après connexion réussie
router.push(callbackUrl);
```

### Page d'inscription (`/register`)

```typescript
const [callbackUrl, setCallbackUrl] = useState<string>('/dashboard');

useEffect(() => {
  const callback = searchParams.get('callbackUrl');
  if (callback) {
    setCallbackUrl(callback);
  }
}, [searchParams]);

// Après inscription réussie
const loginUrl = callbackUrl !== '/dashboard' 
  ? `/login?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}`
  : '/login?registered=true';
router.push(loginUrl);
```

### Page de quiz (`/quiz/[id]`)

```typescript
const fetchQuiz = async () => {
  const response = await fetch(`/api/quiz/${quizId}`);
  
  if (response.status === 401) {
    // Non authentifié - rediriger avec callback URL
    router.push(`/login?callbackUrl=${encodeURIComponent(`/quiz/${quizId}`)}`);
    return;
  }
  // ...
};
```

### Page dashboard (`/dashboard`)

```typescript
useEffect(() => {
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=' + encodeURIComponent('/dashboard'));
  }
}, [status, router]);
```

## Avantages

✅ **Meilleure expérience utilisateur** : L'utilisateur est redirigé exactement où il voulait aller  
✅ **Moins de friction** : Pas besoin de rechercher le quiz après connexion  
✅ **Cohérence** : Le callback URL est préservé entre login et register  
✅ **Sécurité** : Les URLs sont encodées correctement avec `encodeURIComponent()`  

## Exemples d'utilisation

### Scénario 1 : Partage de lien de quiz
```
1. Alice partage le lien : https://app.com/quiz/abc123
2. Bob (non connecté) clique sur le lien
3. Bob est redirigé vers /login avec le callback
4. Bob se connecte
5. Bob arrive directement sur le quiz abc123
```

### Scénario 2 : Navigation interne
```
1. Utilisateur non connecté navigue sur le site
2. Clique sur "Jouer" pour un quiz
3. Est redirigé vers /login avec callback
4. Se connecte et arrive sur le quiz
```

### Scénario 3 : Nouvel utilisateur
```
1. Utilisateur non connecté accède à /quiz/abc123
2. Redirigé vers /login?callbackUrl=/quiz/abc123
3. Clique sur "S'inscrire"
4. Redirigé vers /register?callbackUrl=/quiz/abc123
5. Crée son compte
6. Redirigé vers /login?registered=true&callbackUrl=/quiz/abc123
7. Se connecte
8. Arrive sur /quiz/abc123
```

## Notes importantes

- Le callback URL par défaut est `/dashboard` si aucun n'est spécifié
- Les URLs sont encodées avec `encodeURIComponent()` pour éviter les problèmes avec les caractères spéciaux
- Un message informatif est affiché sur la page de connexion quand un callback URL est présent
- Le callback URL est préservé dans les liens entre login et register
