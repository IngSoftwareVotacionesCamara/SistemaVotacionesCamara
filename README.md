# Votaciones Cámara - Proyecto base

Estructura mínima de un backend en Node.js (Express) que usa el esquema SQL proporcionado para el módulo "Votar".

## Archivos principales

- `src/app.js` - servidor principal
- `src/db.js` - conexión a PostgreSQL
- `src/routes/auth.js` - endpoint POST /api/login
- `src/routes/voto.js` - endpoint POST /api/votar
- `DB Votaciones_Camara (1).sql` - script SQL subido por el usuario (esquema `votaciones`)

## Requisitos

- Node.js v18+ recomendado
- PostgreSQL en ejecución (o Docker)
- Copiar `.env.example` a `.env` y completar credenciales

## Instalación

```bash
npm install
cp .env.example .env     # editar .env con credenciales reales
# Crear la base de datos y ejecutar el SQL:
psql -U <usuario> -d <nombre_bd> -f "DB Votaciones_Camara (1).sql"
npm run dev
```

## Endpoints

- `POST /api/login` body: `{ "id_elector": 1234, "password": "clave" }`
- `POST /api/votar` body: `{ "id_elector": 1234, "cod_partido": 1, "codigo_dane": 11, "cod_cir": 101 }`

## Notas

- Las contraseñas en la base de datos deben estar hasheadas con bcrypt. Si están en texto plano, ajustar el código en `auth.js`.
- Este proyecto es un scaffold académico: antes de cualquier uso real, revisar seguridad, cifrado y cumplimiento legal.
