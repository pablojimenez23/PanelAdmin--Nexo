# NEXO · Panel de administración

Panel web para administradores de **NEXO** (marketplace de delivery). Permite moderar tiendas, cuentas y conductores, revisar calificaciones y estadísticas, gestionar colas/tópicos de mensajería, ver el programa de puntos y **leer en vivo los eventos de pedidos que llegan a Amazon Kinesis**.

Proyecto del ramo DSY1107 (Duoc UC) · Autores: Pablo Jiménez y Juan Vargas · Docente: Javier Peña.

## 1. Stack

- Vite + React + TypeScript (un solo componente principal `src/App.tsx`, estilos en `src/App.css`).
- Autenticación: `POST {ALB}/admin/login` (Amazon Cognito detrás de ms-users). El token se guarda en `sessionStorage` (`nexo_admin_token`) y solo entran cuentas del grupo `admin` de Cognito.
- Backend: 5 microservicios Spring Boot en AWS ECS Fargate detrás de un Application Load Balancer. Repositorio: https://github.com/pablojimenez23/Backend---Nexo
- App móvil (React Native/Expo): https://github.com/pablojimenez23/Frontend---nexo

## 2. Secciones del panel

| Sección | Qué hace | Servicio |
|---|---|---|
| Estadísticas | Resumen de usuarios, tiendas, pedidos | ms-users, ms-stores, ms-orders |
| Tiendas | Aprobar, rechazar y eliminar tiendas | ms-stores |
| Cuentas | Gestión de usuarios | ms-users |
| Conductores | Aprobación de conductores | ms-users |
| Calificaciones | Revisión de calificaciones | ms-orders |
| Colas | Colas SQS y tópicos SNS (V2) | ms-queues |
| Puntos | Resumen del programa de puntos: 1 punto por cada $1.000 (V2) | ms-orders |
| **Streams** | Lista streams de Kinesis y muestra los últimos 10/25/50 registros con su JSON (V3) | ms-queues |

## 3. Ejecutar en local

    npm install
    npm run dev

Abre http://localhost:5173 e inicia sesión con una cuenta del grupo `admin`. El panel llama al ALB configurado en la constante `ALB_HOST` de `src/App.tsx`.

## 4. Build y publicación

    npm run build

El contenido de `dist/` se publica como sitio estático en un bucket S3 (hosting de sitio web).

## 5. Versiones y ramas

| Rama / tag | Commit | Fecha | Contenido |
|---|---|---|---|
| `rama-1-base` · `v1.0.0` | 9a1f5dc | 5 sep 2026 | Panel base: tiendas, cuentas, conductores, calificaciones, estadísticas |
| `rama-2-sns-sqs` · `v2.0.0` | 433b8e6 | 21 oct 2026 | Colas, tópicos y puntos |
| `rama-3-kinesis` · `v3.0.0` | 43abf3a | 22 nov 2026 | ALB nuevo, regla de puntos corregida y pestaña Streams (Kinesis) |

Flujo: rama de versión → `staging` → `main` (merge `--no-ff` + tag). `develop` es la rama de trabajo y hoy coincide con `rama-3-kinesis`. No se reescribió historia ni se hizo force-push; los commits de merge de release son del 22 nov 2026.

## 6. Seguridad

- El panel no contiene credenciales: el usuario inicia sesión y el backend valida el token y el grupo `admin`.
- Las rutas de Streams son de solo lectura y exclusivas para administradores.