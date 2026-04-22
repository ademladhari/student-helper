# Backend Setup

## Install

```bash
npm install
```

## Configure Environment

```bash
copy .env.example .env
```

Update `.env` values if needed.

Add an `AUTH_SECRET` value in `.env` for signing login tokens.

## Run

```bash
npm run dev
```

## Endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`
- `GET /api/students`
- `POST /api/students`
- `POST /api/ocr/extract` (multipart form-data with field `image`)

Example OCR request:

```bash
curl -X POST http://localhost:5000/api/ocr/extract \\
  -F "image=@C:/path/to/note-image.jpg"
```

Example OCR response:

```json
{
  "text": "Extracted text from image...",
  "confidence": 86,
  "filename": "note-image.jpg",
  "mimeType": "image/jpeg"
}
```

Example request body for creating a student:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "course": "Computer Science"
}

Example sign-up request body:

```json
{
  "name": "Alex Lee",
  "email": "alex@example.com",
  "password": "secret123"
}
```

Example sign-in request body:

```json
{
  "email": "alex@example.com",
  "password": "secret123"
}
```
```
