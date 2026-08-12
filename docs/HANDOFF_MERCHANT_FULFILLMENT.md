# Handoff: Merchant self-fulfillment (pickup + merchant delivery)

This document lets a new chat or teammate continue without re-reading the full thread.

## Goal

Focus on **merchant-handled fulfillment**: sellers/shops ship or hand off orders themselves. **Platform logistics** (rider tasks) stays optional and only runs when the store is configured for it.

## Schema (already merged)

- Enum `order_fulfillment_type`: `MERCHANT_DELIVERY`, `PICKUP`.
- Column `orders.fulfillment_type` (default `MERCHANT_DELIVERY`, not null).
- `orders.delivery_address_id` is **nullable** (pickup orders omit an address).
- Migration: `backend/drizzle/0014_merchant_self_fulfillment.sql`.
- New stores default `stores.delivery_type` to **`MERCHANT_SELF`** in `store.service.ts` (varchar; distinct from order fulfillment enum).

**After pulling:** run `cd backend && bun run db:migrate`.

## Checkout API

`POST /api/v1/orders/checkout` body:

- `fulfillmentType` (optional): `MERCHANT_DELIVERY` | `PICKUP` — defaults to `MERCHANT_DELIVERY`.
- `deliveryAddressId` (optional): required when `MERCHANT_DELIVERY`; must belong to the authenticated customer; ignored/null for `PICKUP`.
- For `MERCHANT_DELIVERY`, every cart line’s product must have `is_deliverable === true`, or checkout fails with a validation error.

Implemented in `backend/src/modules/order/order.service.ts` (`placeOrder`) and `order.controller.ts`.

## Platform rider tasks

`OrderService.updateStatus`: when status becomes `PACKED`, `createTaskForOrder` runs **only if** `stores.delivery_type === 'PLATFORM'` **and** `orders.fulfillment_type === 'MERCHANT_DELIVERY'`. Merchant-self stores do not auto-create tasks.

**Gap (acceptable for current scope):** Seller UI updates flow through `sellerOrderService.updateOrderStatus`, which does **not** create rider tasks. If you re-enable `PLATFORM` stores and pack only via the seller app, you may want to mirror the same gate and call `deliveryService.createTaskForOrder` there.

## Seller workflow

`backend/src/modules/seller/order/order.workflow.ts`:

- `isSellerTransitionAllowed`: base graph plus **`PICKUP` only**: `PACKED → DELIVERED`.
- Delivery orders keep the existing path (`PACKED → OUT_FOR_DELIVERY → …`).

## Seller app

`apps/seller/app/(tabs)/orders.tsx`: fulfillment badge (Pickup vs Delivery), pickup address line as “Store pickup”, primary action from packed → **Complete pickup** → `DELIVERED` when `fulfillmentType === 'PICKUP'`.

## Suggested follow-ups

1. Customer storefront/checkout UI: send `fulfillmentType` and omit address for pickup.
   **DONE.** `apps/customer/app/checkout.tsx` derives the store delivery mode from
   `stores.delivery_type` (falling back to missing lat/lng), offers a Delivery/Store-pickup
   selector for `MERCHANT_SELF`/`HYBRID` stores, always sends `fulfillmentType`
   (`PICKUP` | `MERCHANT_DELIVERY`), and omits the address for pickup.
   `apps/customer/app/order/[id].tsx` now shows a fulfillment badge plus the delivery
   address or a "Store pickup" handoff card.
2. Order detail screen (`apps/seller/app/order/[id].tsx`) is still stubbed; optionally load order by ID from a new `GET /seller/orders/:id` if needed.
   **DONE.** Loads via `GET /seller/orders/:id/detail` with pickup-aware actions.
3. Audit any code assuming `deliveryAddressId` is always set (invoices, notifications, rider joins).
   **DONE.** `delivery.service.ts` joins addresses with `leftJoin` in
   `getAssignedTasks`/`getTaskDetail`/`findAvailableTasks`; invoices/notifications do not
   depend on the address.
4. Align `OrderStateMachine` in `order.state-machine.ts` with pickup shortcuts if generic `PATCH /orders/:id/status` is used for sellers (seller-specific routes already use `order.workflow.ts`).
   **DONE.** Added `ACCEPTED→CONFIRMED`, `CONFIRMED→PACKED` (plus legacy `ACCEPTED→PACKED`)
   and a fulfillment-aware `PACKED→DELIVERED` pickup shortcut
   (`validateTransition` takes `fulfillmentType`).

Also completed in the same pass:

- **Seller status → rider task gap** (see above): `sellerOrderService.updateOrderStatus`
  now creates a platform delivery task on `PACKED` when
  `orders.fulfillment_type === 'PLATFORM_LOGISTICS'`.
- **Rider app wired end-to-end** (`apps/delivery`): rider onboarding + duty toggle in
  settings, available-task list with accept, assigned-task list, and a task detail screen
  with `PICKED_UP`/`DELIVERED` (incl. COD confirmation) + `FAILED`.
  Backend additions: `GET /riders/tasks/:id` (`getTaskDetail`) and rider authorization
  based on the `riders` row (the JWT only carries `CUSTOMER` roles, which previously
  blocked `DeliveryStateMachine`'s `RIDER` role check). Fixed the dead `available` route
  and the broken `product/[id]` stack registration in the delivery app.
- **Type/build fixes**: removed stale per-app copies of `@gopasal/ui` (missing `toast.tsx`);
  fixed seller `ErrorBoundary`/`StateViews` imports; fixed delivery `ErrorBoundary`
  (`Animated.Title`) and missing `SkeletonList` export; aligned admin-web
  `@types/react` with the React 19 override (671 type errors → 0).
- **Pre-existing, not fixed here**: ~39 backend integration tests fail against the
  evolved schema (e.g. stale `COMPLETED` enum values) and the e2e OTP test needs a live
  SMS provider. They fail before this pass; `seller-order.workflow`, `fulfillment`,
  `store-delivery-charges` unit tests pass.

## Production-hardening follow-up pass (later session)

- **Security**: social-login mock fallback removed (fail-closed); biometric endpoints fail
  closed; production boot gates for weak JWT secrets / wildcard CORS / mock payment flags /
  missing Redis; Khalti + eSewa webhooks now verify amounts against the order before
  confirming; secrets scanner (`scripts/check-secrets.sh`) wired into CI.
- **Features**: group orders mounted (`/api/v1/group-orders`: create/join/participants/leave);
  rider task history (`GET /riders/tasks/history`); live rider location for customers
  (`GET /orders/:id/rider-location` + periodic rider location push); customer support AI
  chat widget wired to the authenticated `/support/chat`; silent auth mounted.
- **Reliability**: full backend suite is hermetic (dedicated `gopasal_test` DB + per-run
  truncation + mock restoration) — 100% green; fresh-DB migrations verified end-to-end
  (duplicate migration files archived under `drizzle/archived/`); nightly DB backup service
  added to docker-compose; load-test script (`scripts/load-test.sh`).
- **Code quality**: `noUnusedLocals`/`noUnusedParameters` enabled; 160+ unused imports/locals
  removed; dead mocks replaced with real logic (gamification tiers, rider distance filter,
  restock suggestions, APM slow-transaction/error tracking, referral codes).
- **Admin web**: upgraded to Next 15 with a single React 19 install (production build was
  broken by dual React copies); typography/spacing system professionalized.
