# Plantillas de email con marca Trashure

Listas para aplicar, pero **bloqueadas por Supabase**: en el plan gratuito,
mientras se use el servicio de correo integrado de Supabase (sin SMTP
propio), la API rechaza cualquier cambio de plantilla con:

> Email template modification is not available for free tier projects using
> the default email provider. Please upgrade your plan or configure a custom
> SMTP provider.

## Para activarlas (cuando haya SMTP propio — ver docs/FASE2-SUPABASE.md)

1. Configurar SMTP propio en el panel de Supabase (Authentication → Emails → SMTP Settings).
2. Aplicar con la Management API:

```bash
TOKEN=$(security find-generic-password -s 'Supabase CLI' -w)
python3 - << 'EOF'
import json
files = {
    'mailer_subjects_confirmation': ('🤖 Confirma tu email — Trashure', 'confirmation.html'),
    'mailer_subjects_email_change': ('🤖 Guarda tu progreso — Trashure', 'email_change.html'),
    'mailer_subjects_magic_link': ('🔑 Tu enlace de acceso — Trashure', 'magic_link.html'),
}
payload = {}
for subject_key, (subject, filename) in files.items():
    content_key = subject_key.replace('subjects', 'templates') + '_content'
    payload[subject_key] = subject
    payload[content_key] = open(filename).read()
json.dump(payload, open('/tmp/payload.json', 'w'))
EOF
curl -X PATCH "https://api.supabase.com/v1/projects/cecppsvqfytqivfykdhd/config/auth" \
  -H "Authorization: Bearer $TOKEN" -H "User-Agent: trashure-setup/1.0" \
  -H "Content-Type: application/json" --data "@/tmp/payload.json"
```

## Qué es cada una

- `confirmation.html` — "Confirm signup" (solo se usaría si el flujo pasara
  a `signUp()` directo; hoy el juego no lo usa).
- `email_change.html` — **la que de verdad se envía hoy** al vincular email
  desde una cuenta anónima (`updateUser({ email })` en `src/game/online.js`,
  función `linkEmail`). Es "el mail que llega para registrarse".
- `magic_link.html` — enlace de acceso al recuperar cuenta en otro
  dispositivo (`signInWithOtp`, función `sendLoginLink`).

Todas usan HTML con estilos inline (compatibilidad universal en clientes de
correo) y la paleta de Trashure. Sin imágenes externas: el emoji del
encabezado es texto Unicode, así que se ve igual sin depender de que el
cliente de correo cargue imágenes remotas.
