# Relevamiento Hospitales — PSC

Dashboard que lee en vivo el Google Sheet "Relevamiento Hospitales" y calcula:

- DNIs únicos por mes (pestañas "Casos Únicos AGO/JUL")
- Intervenciones por hospital y por persona
- Ingresos y egresos a CIS/DiPA
- Personas que rechazan intervención (por día/hospital, con detalle para revisión manual)
- Casos de salud mental (Estrategia = ASIC-DGSAM) + indicios detectados en calle

## Cómo lee los datos

Un Service Account de Google (`sheets-reader@hospitales-dashboard.iam.gserviceaccount.com`)
tiene permiso de **Lector** sobre el Sheet. La app se conecta con esas credenciales
en el servidor (nunca en el navegador) y lee las pestañas en cada visita, con caché
de 1 hora en `/` y `/salud-mental` (la planilla se actualiza cada 2 días, así que
sobra margen). `/personas` y `/rechazos` usan filtros por URL y siempre leen datos
frescos.

Para forzar una relectura antes de que se cumpla la hora: `GET /api/refresh`.

## Configuración local

1. `npm install`
2. Crear `.env.local` (no se sube a git) con:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-reader@hospitales-dashboard.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEET_ID=10BeaoamIgffKz3QI4iEw-laP5_gvK77x7JzZYw6cjy4
   ```
3. `npm run dev`

## Deploy en Vercel

1. Subir este repo a GitHub (o el proveedor git que uses).
2. En [vercel.com](https://vercel.com) → **Add New... → Project** → importar el repo.
3. En **Settings → Environment Variables** del proyecto en Vercel, cargar las
   mismas 3 variables de arriba (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`,
   `GOOGLE_SHEET_ID`) tal cual están en `.env.local`. Ojo con `GOOGLE_PRIVATE_KEY`:
   Vercel acepta pegar el valor con los `\n` literales tal cual, no hace falta
   convertirlos a saltos de línea reales.
4. Deploy.

No hace falta redeployar cada vez que se actualiza el Sheet: la home y "Salud
mental" se refrescan solas cada 1 hora, y "Casos únicos"/"Rechazos" siempre
muestran el dato más nuevo.

## Nota de privacidad

El dashboard **no tiene login** (decisión tomada al armarlo) y muestra nombres,
DNI y datos de salud de personas en situación de calle. La URL de Vercel no es
secreta por diseño de Vercel (es adivinable/indexable si se linkea desde algún
lado público). No compartas el link fuera del equipo; si en algún momento hace
falta más protección, se puede agregar autenticación simple (contraseña
compartida) sin mucho esfuerzo — avisen y se agrega.
