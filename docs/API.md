# SoundMind REST API

URL local:

`http://localhost:3000/api`

## Autenticación

Las rutas protegidas requieren:

`Authorization: Bearer <JWT>`

### POST /auth/register

Registra un usuario mediante correo, contraseña y nombre de usuario.

### POST /auth/login

Inicia sesión y devuelve un JWT, refresh token y datos del usuario.

### POST /auth/refresh

Renueva un JWT mediante un refresh token válido.

### POST /auth/logout

Revoca la sesión actual.

### POST /auth/forgot-password

Solicita un correo de recuperación sin revelar si la cuenta existe.

### POST /auth/reset-password

Actualiza la contraseña utilizando un token de recuperación válido.

### GET /auth/me

Devuelve el perfil del usuario autenticado.

## Sesiones musicales

### POST /sessions

Guarda de forma relacional las respuestas, perfil musical, canciones y recomendaciones.

### GET /history

Devuelve el historial completo del usuario autenticado.

### GET /history/:sessionId

Devuelve una sesión que pertenece al usuario.

### DELETE /history/:sessionId

Elimina una sesión y sus recomendaciones mediante eliminación en cascada.

## Feedback

### PUT /recommendations/:recommendationId/feedback

Crea o actualiza un like o dislike.

Cuerpo:

```json
{
  "isLiked": true
}