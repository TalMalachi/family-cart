# Lists + Media Hardening Plan

Align list/media security and schema changes in one pass: replace body-owned parent IDs with generic input schemas, harden every affected route in `lists` and `media` with explicit existence/ownership checks, add paginated and filterable list queries, and update web/mobile callers to the new request/response contracts. This keeps diagnostics consistent (`400`/`403`/`404`), fixes `completed_at` transitions, and prevents cross-family or wrong-parent mutations.

## Implementation Steps

1. Update shared schemas in `packages/shared/src/schemas/index.ts` with `CreateItemInputSchema`, `UpdateItemInputSchema`, `AddAlternativeInputSchema`, and a `ListQuerySchema`.
2. Refactor `listsRoutes` in `apps/api/src/routes/lists.ts` route-by-route using the checklist below, keeping exact `400`/`403`/`404` outcomes.
3. Mirror the same ownership checks in `apps/api/src/routes/media.ts` for `presign`, primary-image, and delete-image flows.
4. Update list consumers in `apps/mobile/src/screens/lists/ShoppingListsScreen.tsx` and `apps/api/src/routes/web.ts` to use paginated `GET /lists`.
5. Remove legacy `listId`/`itemId` request body fields in `apps/mobile/src/screens/lists/ListDetailScreen.tsx`, `apps/mobile/src/components/lists/AlternativesManager.tsx`, and `apps/api/src/routes/web.ts`.

## Defaults / Decisions

- Use `status=all` by default for current mobile/web grouping so clients can keep grouping locally.
- Keep response keys stable: `error`, `message`, `required`.
- `DELETE /lists/items/:itemId/alternatives/:altId` should return `403` only when the alternative exists but belongs to another item.
- Changing a list to `completed` should set `completed_at`.
- Changing a list away from `completed` should clear `completed_at`.

## Route-by-Route Checklist

### 1) `apps/api/src/routes/lists.ts:2-5`
- Replace `CreateItemSchema`, `UpdateItemSchema`, `AddAlternativeSchema`.
- Import generic `*InputSchema` names and `ListQuerySchema`.

### 2) `apps/api/src/routes/lists.ts:11-23` — `GET /lists`
- Parse `status`, `page`, `pageSize`.
- Support `status=active|completed|archived|all`.
- Return paginated envelope: `data`, `total`, `page`, `pageSize`.
- Status codes:
  - `200` success
  - `400` invalid query

### 3) `apps/api/src/routes/lists.ts:25-46` — `GET /lists/:id`
- Load list by raw `id` first.
- Status codes:
  - `200` success
  - `404` missing list
  - `403` foreign-family list
- Load items only after ownership passes.

### 4) `apps/api/src/routes/lists.ts:48-67` — `GET /lists/items/:itemId`
- Load item with owning list/family metadata first.
- Status codes:
  - `200` success
  - `404` missing item
  - `403` foreign-family item
- Run aggregate detail query only after ownership passes.

### 5) `apps/api/src/routes/lists.ts:69-77` — `POST /lists`
- Keep `CreateListSchema`.
- Status codes:
  - `201` success
  - `400` invalid body

### 6) `apps/api/src/routes/lists.ts:79-90` — `PATCH /lists/:id`
- Verify list first.
- Limit updates to mutable fields only.
- Set `completed_at = now()` when entering `completed`.
- Set `completed_at = null` when leaving `completed`.
- Status codes:
  - `200` success
  - `400` invalid body
  - `400` empty mutable body
  - `404` missing list
  - `403` foreign-family list

### 7) `apps/api/src/routes/lists.ts:92-97` — `DELETE /lists/:id`
- Verify list first.
- Status codes:
  - `204` success
  - `404` missing list
  - `403` foreign-family list

### 8) `apps/api/src/routes/lists.ts:99-110` — `POST /lists/:id/items`
- Switch to `CreateItemInputSchema`.
- Remove body `listId`.
- Verify parent list first.
- Status codes:
  - `201` success
  - `400` invalid body
  - `404` missing list
  - `403` foreign-family list

### 9) `apps/api/src/routes/lists.ts:112-121` — `PATCH /lists/items/:itemId`
- Switch to `UpdateItemInputSchema`.
- Verify item first.
- Preserve purchased/unpurchased side effects only after ownership passes.
- Status codes:
  - `200` success
  - `400` invalid body
  - `400` empty mutable body
  - `404` missing item
  - `403` foreign-family item

### 10) `apps/api/src/routes/lists.ts:123-127` — `DELETE /lists/items/:itemId`
- Verify item first.
- Status codes:
  - `204` success
  - `404` missing item
  - `403` foreign-family item

### 11) `apps/api/src/routes/lists.ts:130-152` — `POST /lists/items/:itemId/images`
- Use strict image body parsing.
- Verify parent item first.
- If `isPrimary`, clear prior primaries only for the verified item.
- Status codes:
  - `201` success
  - `400` invalid or empty image URL
  - `404` missing item
  - `403` foreign-family item

### 12) `apps/api/src/routes/lists.ts:154-162` — `POST /lists/items/:itemId/alternatives`
- Switch to `AddAlternativeInputSchema`.
- Remove body `itemId`.
- Verify parent item first.
- Status codes:
  - `201` success
  - `400` invalid body
  - `404` missing item
  - `403` foreign-family item

### 13) `apps/api/src/routes/lists.ts:164-167` — `DELETE /lists/items/:itemId/alternatives/:altId`
- Verify parent item first.
- Verify alternative second.
- Status codes:
  - `204` success
  - `404` missing item
  - `404` missing alternative
  - `403` foreign-family parent item
  - `403` alternative belongs to another item

### 14) `apps/api/src/routes/media.ts:22-46` — `POST /media/presign`
- Validate body/content type.
- Verify target item first.
- Status codes:
  - `200` success
  - `400` invalid body
  - `404` missing item
  - `403` foreign-family item

### 15) `apps/api/src/routes/media.ts:50-67` — `PATCH /media/:imageId/primary`
- Verify image first, then owning item/list family.
- Status codes:
  - `200` success
  - `404` missing image
  - `403` foreign-family image

### 16) `apps/api/src/routes/media.ts:70-82` — `DELETE /media/:imageId`
- Verify image first, then family ownership.
- Status codes:
  - `204` success
  - `404` missing image
  - `403` foreign-family image

### 17) `apps/mobile/src/screens/lists/ShoppingListsScreen.tsx:47-53`
- Change `GET /lists` consumption from raw array to paginated response.
- Request `status=all` unless separate filtered queries are introduced.

### 18) `apps/api/src/routes/web.ts:524-539`
- Change `loadLists()` to pass explicit query params and unwrap paginated `data`.

### 19) `apps/mobile/src/screens/lists/ListDetailScreen.tsx:93-96` and `apps/api/src/routes/web.ts:951-975`
- Remove body `listId` from item creation.

### 20) `apps/mobile/src/components/lists/AlternativesManager.tsx:32-38`
- Remove body `itemId` from alternative creation.

