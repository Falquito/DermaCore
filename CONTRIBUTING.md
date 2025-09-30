# Contributing to CareLink - Sistema de Gestión de Turnos Clínicos

¡Gracias por contribuir a CareLink! Este es un proyecto académico desarrollado por 7 estudiantes. Este documento establece las pautas de colaboración para nuestro equipo.

## 🎯 Flujo de Trabajo Git Flow

### Estructura de Ramas
- **`main`** - Código de producción estable (protegida)
- **`develop`** - Rama principal de desarrollo (DEFAULT, protegida)  
- **`feature/[nombre]`** - Ramas individuales por funcionalidad
- **`hotfix/[nombre]`** - Correcciones urgentes desde main

### 🔄 Workflow del Equipo

#### 1. Comenzar una nueva funcionalidad
```bash
git checkout develop
git pull origin develop
git checkout -b feature/gestion-pacientes
```

#### 2. Desarrollar y commitear
```bash
git add .
git commit -m "feat: add patient registration form"
git push origin feature/gestion-pacientes
```

#### 3. Crear Pull Request
- **Base branch**: `develop`
- **Compare branch**: `feature/tu-funcionalidad`
- Usar la plantilla de PR
- Solicitar review de al menos 1 compañero

#### 4. Code Review y Merge
- Revisar código cuidadosamente
- Probar los cambios localmente
- Aprobar solo si todo funciona correctamente

#### 5. Después del Merge - Limpiar ramas
```bash
# Actualizar develop
git checkout develop
git pull origin develop

# Eliminar rama local
git branch -d feature/tu-funcionalidad

# Limpiar referencias remotas
git remote prune origin
```
**Nota**: GitHub eliminará automáticamente la rama remota si está configurado.

## 📋 Reportar Issues

### Bugs
- Usar plantilla de bug report
- Incluir screenshots si es posible
- Etiquetar con severidad: `critical`, `high`, `medium`, `low`

### Nuevas Funcionalidades
- Usar plantilla de feature request
- Discutir en team antes de implementar
- Asignar responsable y estimar tiempo

## 📋 Estándares de Código

### Convenciones de Naming
- **Archivos**: `kebab-case` (ej: `patient-form.tsx`)
- **Componentes**: `PascalCase` (ej: `PatientForm`)
- **Variables/Funciones**: `camelCase` (ej: `getUserName`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `API_BASE_URL`)

### Estructura de Commits
Usar [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` cambios de formato
- `refactor:` refactoring de código
- `test:` agregar o modificar tests
- `chore:` tareas de mantenimiento

### Reglas de Código
- ✅ **TypeScript obligatorio** para todo código nuevo
- ✅ **ESLint debe pasar** sin errores
- ✅ **Componentes pequeños** (< 200 líneas)
- ✅ **Nombres descriptivos** y en español para funcionalidades de dominio
- ✅ **Comentarios** para lógica de negocio compleja
- ✅ **Prisma migrations** para cambios de DB

## 🛠️ Configuración de Desarrollo

### Primera vez
```bash
# Clonar y configurar
git clone <repo-url>
cd carelink-clinic-management
npm install
cp .env.example .env

# Base de datos
docker-compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run db:seed

# Desarrollo
npm run dev
```

### Comandos útiles
```bash
# Desarrollo
npm run lint        # Verificar código
npm run build       # Build producción
npm run type-check  # Verificar TypeScript
npm run prisma:studio  # UI de base de datos

# Git - Limpieza de ramas
git branch --merged develop  # Ver ramas mergeadas
git remote prune origin       # Limpiar referencias remotas
git branch -d nombre-rama     # Eliminar rama local
```

## 👥 Responsabilidades del Equipo

### Code Reviews
- **Obligatorios** para merge a `develop` y `main`
- Mínimo **1 aprobación** requerida
- Revisar: funcionalidad, código, tests, documentación
- **No aprobar** si hay conflictos o CI falla

### Issues y Asignaciones
- **Asignarse** antes de trabajar en un issue
- **Comunicar** si no puedes completar a tiempo
- **Actualizar** el estado del issue regularmente
- **Cerrar** issues solo cuando están completamente terminados

## 🚨 Reglas Importantes

❌ **NUNCA hacer push directo** a `main` o `develop`  
❌ **NO hacer force push** a ramas compartidas  
❌ **NO mergear** tu propio PR sin review  
❌ **NO commitear** archivos de configuración local  
✅ **SIEMPRE** probar los cambios antes del PR  
✅ **SIEMPRE** sincronizar con `develop` antes de crear PR  
✅ **SIEMPRE** usar las plantillas de Issues y PR

## 🧪 Testing

- Ejecuta `npm run lint` antes de hacer commit
- Asegúrate de que `npm run build` funcione correctamente
- Prueba tu funcionalidad manualmente

## 📝 Convenciones de commit

Usa conventional commits:
- `feat:` para nuevas funcionalidades
- `fix:` para correcciones de bugs
- `docs:` para cambios en documentación
- `style:` para cambios de formato
- `refactor:` para refactoring de código
- `test:` para agregar o modificar tests
- `chore:` para tareas de mantenimiento

Ejemplo: `feat: agregar autenticación de usuarios`