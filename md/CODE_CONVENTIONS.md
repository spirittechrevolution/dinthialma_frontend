# Conventions de Code - Dinthialma Frontend

Guide des conventions de code pour maintenir la cohérence et la qualité du projet.

## 📝 Nomenclature

### Fichiers et dossiers

```
✅ CORRECT
src/
├── components/ui/Button.tsx         (PascalCase)
├── services/tontineService.ts       (camelCase)
├── hooks/useTontines.ts             (camelCase avec "use")
├── pages/admin/TontinesPage.tsx     (PascalCase)
└── types/tontine.ts                 (lowercase)

❌ INCORRECT
├── components/ui/button.tsx         (ne pas utiliser lowercase)
├── services/TontineService.ts       (ne pas utiliser PascalCase)
├── hooks/tontines.ts                (manque le "use" prefix)
```

### Variables et constantes

```typescript
// Variables
const userName = 'Jean'           // camelCase
let isLoading = false             // camelCase booléen avec "is/has"
const TIMEOUT_MS = 5000           // UPPER_CASE pour constantes

// Énums
enum TontineStatus {              // PascalCase
  ACTIVE = 'ACTIVE',
  EN_ATTENTE = 'EN_ATTENTE',
}

// Types
type UserRole = 'ADMIN' | 'MEMBER' // PascalCase
interface User {                      // PascalCase
  id: string
  name: string
}
```

## 🎯 Composants React

### Structure générale

```typescript
import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

// Props destructurées et typées
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx('...', className)}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Règles

- ✅ Composants en **PascalCase**
- ✅ Props typées avec **TypeScript**
- ✅ Props structurées en premier
- ✅ Valeurs par défaut explicites
- ✅ Destructuration des props
- ✅ Pas de logique métier complexe
- ❌ Ne pas utiliser de `any`
- ❌ Ne pas mélanger styled-components et Tailwind

## 🪝 Hooks personnalisés

### Structure

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tontineService } from '@/services/tontineService'
import { Tontine } from '@/types/tontine'

export function useTontines(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['tontines', page, size],
    queryFn: () => tontineService.getAllTontines(page, size),
  })
}

export function useCreateTontine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request) => tontineService.createTontine(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontines'] })
    },
  })
}
```

### Conventions

- ✅ Noms commençant par `use`
- ✅ Query keys en tableau : `['resource', id, filter]`
- ✅ Invalidations lors de mutations
- ✅ Refetch automatique des dépendances
- ✅ Types génériques : `useQuery<T>`

## 🎨 Tailwind CSS

### Utilisation

```typescript
// ✅ CORRECT
<div className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg">
  Button
</div>

// ✅ Avec clsx pour les conditions
<div className={clsx(
  'px-4 py-2 rounded-lg',
  isLoading && 'opacity-50 cursor-not-allowed',
  variant === 'primary' && 'bg-primary-500'
)}>
  Content
</div>

// ❌ INCORRECT - Ne pas hardcoder les couleurs
<div style={{ color: '#22c55e', padding: '8px' }}>
  Button
</div>

// ❌ N'utiliser que les couleurs du design system
<div className="bg-red-800"> {/* Utiliser error au lieu */}
  Error
</div>
```

### Palette disponible

```css
Primary:    #22c55e (500), #16a34a (600), ...
Success:    #22c55e
Warning:    #f59e0b
Error:      #ef4444
Info:       #3b82f6
Neutral:    50-900
```

### Classes courantes

```typescript
// Spacing
p-4    /* padding */
px-6   /* padding horizontal */
my-8   /* margin vertical */

// Layout
flex gap-4
grid grid-cols-3
md:grid-cols-2 lg:grid-cols-3

// Text
text-lg font-semibold
text-neutral-900 (titres)
text-neutral-600 (corps)

// Colors
bg-primary-500
text-error
border-neutral-200

// Border & Radius
border rounded-lg
rounded-2xl
shadow-sm
```

## 📡 Services API

### Structure

```typescript
import api from './api'
import { PageResponse, CustomResponse } from '@/types/common'
import { Tontine, CreateTontineRequest } from '@/types/tontine'

export const tontineService = {
  // GET toutes les ressources
  getAllTontines: async (page = 0, size = 20): Promise<PageResponse<Tontine>> => {
    const response = await api.get<CustomResponse<PageResponse<Tontine>>>('/api/tontines', {
      params: { page, size },
    })
    return response.data.data
  },

  // GET une ressource
  getTontineById: async (id: string): Promise<Tontine> => {
    const response = await api.get<CustomResponse<Tontine>>(`/api/tontines/${id}`)
    return response.data.data
  },

  // POST créer une ressource
  createTontine: async (request: CreateTontineRequest): Promise<Tontine> => {
    const response = await api.post<CustomResponse<Tontine>>('/api/tontines', request)
    return response.data.data
  },

  // PUT modifier une ressource
  updateTontine: async (id: string, request: UpdateTontineRequest): Promise<Tontine> => {
    const response = await api.put<CustomResponse<Tontine>>(`/api/tontines/${id}`, request)
    return response.data.data
  },

  // DELETE une ressource
  deleteTontine: async (id: string): Promise<void> => {
    await api.delete(`/api/tontines/${id}`)
  },
}
```

### Conventions

- ✅ Une fonction par endpoint
- ✅ Types de réponse explicites
- ✅ Retourner les données extraites (`response.data.data`)
- ✅ Grouper par ressource dans un objet
- ✅ Noms descriptifs : `getAllTontines`, `createTontine`
- ❌ Ne pas ajouter de logique dans les services

## 🗂️ Pages

### Structure

```typescript
import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'

export function TontinesPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useTontines(page, 20)

  const columns: Column<Tontine>[] = [
    { key: 'nom', header: 'Nom' },
    { key: 'statut', header: 'Statut' },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Mes Tontines"
        action={<Button>Créer</Button>}
      />

      <Card noPadding>
        <CardBody>
          <Table
            columns={columns}
            data={data?.content || []}
            isLoading={isLoading}
            page={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>
    </AppLayout>
  )
}
```

### Conventions

- ✅ Déléger aux hooks personnalisés
- ✅ Wrappé dans `<AppLayout>`
- ✅ `PageHeader` pour titre et actions
- ✅ Pas d'appel Axios direct
- ✅ Gérer isLoading, emptyState

## 💾 Types TypeScript

### Structure

```typescript
// common.ts - Shared
export interface PageResponse<T> {
  content: T[]
  page: number
  totalPages: number
}

export enum TontineStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  ACTIVE = 'ACTIVE',
}

// tontine.ts - Domain
export interface Tontine {
  id: string
  nom: string
  statut: TontineStatus
}

export interface CreateTontineRequest {
  nom: string
  description: string
}
```

### Conventions

- ✅ Interfaces pour objets
- ✅ Enums pour énumérations
- ✅ Suffixes clairs : `Request`, `Response`
- ✅ Union types pour variantes
- ✅ Généricité pour rendre réutilisable
- ❌ Pas de `any`
- ❌ Utiliser `unknown` si réellement inconnu

## 🔄 Patterns courants

### Loading state

```typescript
{isLoading ? (
  <Spinner />
) : data && data.length > 0 ? (
  <Table data={data} />
) : (
  <EmptyState title="Aucune donnée" />
)}
```

### Mutations avec callback

```typescript
const { mutate, isPending } = useCreateTontine()

const handleSubmit = (formData) => {
  mutate(formData, {
    onSuccess: () => {
      toast.success('Créé avec succès')
      router.push('/tontines')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
```

### Validation de rôle

```typescript
const { hasRole, isSuperAdmin } = useAuth()

if (!hasRole(UserRole.ADMIN)) {
  return <Unauthorized />
}
```

## 📚 Imports

### Ordre des imports

```typescript
// 1. React et dépendances externes
import { useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Composants locaux
import { Button } from '@/components/ui/Button'
import { AppLayout } from '@/components/layout/AppLayout'

// 3. Hooks locaux
import { useTontines } from '@/hooks/useTontines'

// 4. Services
import { tontineService } from '@/services/tontineService'

// 5. Types
import { Tontine } from '@/types/tontine'

// 6. Icônes
import { Plus } from 'lucide-react'

// 7. Styles
import './TontinesPage.css'
```

## 🚫 Ce qu'il faut éviter

```typescript
// ❌ Ne pas utiliser console.log en production
console.log(data)  // Utiliser un logger propre

// ❌ Pas de logique métier dans les composants
if (user.role === 'ADMIN') {  // Mettre ça dans un hook

// ❌ Pas de requêtes API directes
fetch('/api/...')  // Utiliser les services

// ❌ Pas de valeurs magiques
if (count > 10) {  // Créer une constante: const MAX_ITEMS = 10

// ❌ Pas de types génériques sans contrainte
function getData<T>(id: string): T  // Contraindre le type

// ❌ Pas de mutations sans refetch
createTontine()  // Invalider la query après

// ❌ Pas d'inline styles
<div style={{ color: 'red' }}>  // Utiliser Tailwind

// ❌ Pas de fonctions réutilisables dans les composants
<Button onClick={() => navigate('/path')} />  // Extraire en fonction
```

## ✅ Checklist avant commit

- [ ] TypeScript - Pas d'erreurs, pas de `any`
- [ ] Imports - Ordre correct, pas d'imports inutiles
- [ ] Noms - Fichiers et variables bien nommés
- [ ] Composants - Pas de logique métier
- [ ] Hooks - Dépendances correctes
- [ ] Responsivité - Mobile, tablet, desktop
- [ ] Accessibilité - aria-labels, semantic HTML
- [ ] Styles - Utiliser Tailwind, pas d'inline styles
- [ ] Tests - Page fonctionnelle, pas d'erreurs console

---

**Dernière mise à jour** : Mai 2026
