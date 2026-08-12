# GoPasal Master Software

# Requirements Specification (SRS)

## Ultra-Detailed, Phase-Based Delivery Plan (Phases

## 1–10)

### Document Type: Master SRS (Rebuild / Migration)

### Product: GoPasal Platform (Customer, Seller, Delivery, Admin)

### Release Train: 2026

```
Version: v3.0 (Ultra-Detailed)
Status: Draft / Internal Review
Prepared For: Product, Engineering, QA, Operations
Prepared By: GoPasal Team
Date: February 11, 2026
```

## Document Control

### Confidentiality

This document contains platform design, security posture, operational workflows, and
financial logic. Distribution must be limited to authorized stakeholders.

### Ownership

- Product Owner: Owns feature scope, priorities, acceptance criteria
- Engineering Owner:Owns technical feasibility, architecture, implementation de-
    tails
- QA Owner: Owns test strategy, coverage, release readiness
- Ops Owner:Owns deployment, monitoring, incident handling, on-call readiness

### Approvals

```
Name / Role Signature Date Status
Product Owner Pending
Engineering Lead Pending
QA Lead Pending
Operations Lead Pending
Security Reviewer
(Optional)
```
```
Pending
```

## Revision History

```
Version Date Author Change Summary
v1.0 Initial outline
v2.0 Expanded phase plan and system cov-
erage
v3.0 February
11, 2026
```
```
Ultra-detailed master rebuild aligned
to migration constraints
```

## Contents










- Document Control
- Revision History
- Executive Summary
- Goals and Success Criteria
- Scope
- Stakeholders
- Definitions and Glossary
- Assumptions and Constraints
- Quality Attributes (High-Level)
- Requirements Traceability Approach
- Phase Map (1–10)
- 1 PHASE 1 — Platform Foundation
   - 1.1 Phase Objective
   - 1.2 Actors Involved
   - 1.3 In-Scope Components
   - 1.4 Out-of-Scope Components
   - 1.5 Functional Requirements
      - 1.5.1 FR-1.1 Environment Configuration Management
      - 1.5.2 FR-1.2 Feature Flag System
      - 1.5.3 FR-1.3 Multi-Tenant Store Foundation
      - 1.5.4 FR-1.4 Store Lifecycle States
      - 1.5.5 FR-1.5 Identity and Role Scaffolding
   - 1.6 Non-Functional Requirements
      - 1.6.1 Performance
      - 1.6.2 Availability
      - 1.6.3 Security
   - 1.7 Observability and Audit
      - 1.7.1 Logging
      - 1.7.2 Audit Trails
   - 1.8 Failure Scenarios
   - 1.9 Acceptance Criteria
   - 1.10 Dependencies
   - 1.11 Risks and Mitigations
- 2 PHASE 2 — Customer Platform
   - 2.1 Phase Objective
   - 2.2 Actors Involved
   - 2.3 In-Scope Components
   - 2.4 Out-of-Scope Components
   - 2.5 Functional Requirements
      - 2.5.1 FR-2.1 Customer Authentication
      - 2.5.2 FR-2.2 Customer Profile Management
      - 2.5.3 FR-2.3 Location and Address Management
      - 2.5.4 FR-2.4 Store Discovery
      - 2.5.5 FR-2.5 Product Discovery
      - 2.5.6 FR-2.6 Search and Filtering
      - 2.5.7 FR-2.7 Cart Management
      - 2.5.8 FR-2.8 Checkout Process
      - 2.5.9 FR-2.9 Order Tracking
      - 2.5.10 FR-2.10 Notifications
      - 2.5.11 FR-2.11 Customer Support Initiation
   - 2.6 Non-Functional Requirements
      - 2.6.1 Performance
      - 2.6.2 Reliability
      - 2.6.3 Usability
   - 2.7 Failure Scenarios
   - 2.8 Acceptance Criteria
   - 2.9 Dependencies
   - 2.10 Risks and Mitigations
- 3 PHASE 3 — Seller and Staff Platform
   - 3.1 Phase Objective
   - 3.2 Actors Involved
   - 3.3 In-Scope Components
   - 3.4 Out-of-Scope Components
   - 3.5 Functional Requirements
      - 3.5.1 FR-3.1 Seller Registration
      - 3.5.2 FR-3.2 Seller Verification and Approval
      - 3.5.3 FR-3.3 Store Profile Management
      - 3.5.4 FR-3.4 Staff and Role Management
      - 3.5.5 FR-3.5 Product Catalog Management
      - 3.5.6 FR-3.6 Inventory Management
      - 3.5.7 FR-3.7 Order Acceptance and Processing
      - 3.5.8 FR-3.8 Order Cancellation Handling
      - 3.5.9 FR-3.9 Seller Notifications
      - 3.5.10 FR-3.10 Seller Financial Visibility
   - 3.6 Non-Functional Requirements
      - 3.6.1 Performance
      - 3.6.2 Security
      - 3.6.3 Usability
   - 3.7 Failure Scenarios
   - 3.8 Acceptance Criteria
   - 3.9 Dependencies
   - 3.10 Risks and Mitigations
- 4 PHASE 4 — Delivery Platform
   - 4.1 Phase Objective
   - 4.2 Actors Involved
   - 4.3 In-Scope Components
   - 4.4 Out-of-Scope Components
   - 4.5 Delivery Models
      - 4.5.1 Model 4A — Seller Self-Delivery
      - 4.5.2 Model 4B — Platform-Managed Delivery
      - 4.5.3 Model 4C — Hybrid / Third-Party Delivery
   - 4.6 Functional Requirements
      - 4.6.1 FR-4.1 Delivery Task Creation
      - 4.6.2 FR-4.2 Delivery Assignment
      - 4.6.3 FR-4.3 Delivery Task Lifecycle
      - 4.6.4 FR-4.4 Pickup Workflow
      - 4.6.5 FR-4.5 Proof of Delivery (POD)
      - 4.6.6 FR-4.6 Cash on Delivery (COD) Handling
      - 4.6.7 FR-4.7 Failed Delivery Handling
      - 4.6.8 FR-4.8 Return-to-Seller Workflow
      - 4.6.9 FR-4.9 Delivery Notifications
   - 4.7 Non-Functional Requirements
      - 4.7.1 Performance
      - 4.7.2 Reliability
      - 4.7.3 Security
   - 4.8 Failure Scenarios
   - 4.9 Acceptance Criteria
   - 4.10 Dependencies
   - 4.11 Risks and Mitigations
- 5 PHASE 5 — Super Admin and Governance
   - 5.1 Phase Objective
   - 5.2 Actors Involved
   - 5.3 In-Scope Components
   - 5.4 Out-of-Scope Components
   - 5.5 Functional Requirements
      - 5.5.1 FR-5.1 Admin Authentication and Authorization
      - 5.5.2 FR-5.2 Store Approval and Lifecycle Management
      - 5.5.3 FR-5.3 Policy and Rule Management
      - 5.5.4 FR-5.4 Dispute and Support Resolution
      - 5.5.5 FR-5.5 Fraud Detection and Enforcement
      - 5.5.6 FR-5.6 Platform Analytics and Reporting
      - 5.5.7 FR-5.7 Audit Logs
   - 5.6 Non-Functional Requirements
      - 5.6.1 Security
      - 5.6.2 Availability
      - 5.6.3 Scalability
   - 5.7 Failure Scenarios
   - 5.8 Acceptance Criteria
   - 5.9 Dependencies
   - 5.10 Risks and Mitigations
- 6 PHASE 6 — UX, Design System and Accessibility
   - 6.1 Phase Objective
   - 6.2 Actors Involved
   - 6.3 In-Scope Components
   - 6.4 Out-of-Scope Components
   - 6.5 UX Design Principles
      - 6.5.1 UX-6.1 Clarity Over Density
      - 6.5.2 UX-6.2 Trust-First Design
      - 6.5.3 UX-6.3 Speed Perception
      - 6.5.4 UX-6.4 Error Forgiveness
   - 6.6 Design System
      - 6.6.1 DS-6.1 Component Standardization
      - 6.6.2 DS-6.2 Typography
      - 6.6.3 DS-6.3 Color Usage
   - 6.7 Accessibility Requirements
      - 6.7.1 AR-6.1 Visual Accessibility
      - 6.7.2 AR-6.2 Interaction Accessibility
      - 6.7.3 AR-6.3 Cognitive Accessibility
   - 6.8 Localization and Language Handling
      - 6.8.1 LH-6.1 Language Support
      - 6.8.2 LH-6.2 Mixed Language Tolerance
   - 6.9 Offline and Low-Connectivity Behavior
      - 6.9.1 OC-6.1 Offline State Handling
      - 6.9.2 OC-6.2 Data Persistence
   - 6.10 Error Handling and Feedback
      - 6.10.1 EH-6.1 Error Presentation
      - 6.10.2 EH-6.2 Confirmation and Alerts
   - 6.11 Non-Functional Requirements
      - 6.11.1 Usability
      - 6.11.2 Consistency
   - 6.12 Failure Scenarios
   - 6.13 Acceptance Criteria
   - 6.14 Dependencies
   - 6.15 Risks and Mitigations
- 7 PHASE 7 — Backend Architecture, Authentication and RBAC
   - 7.1 Phase Objective
   - 7.2 Actors Involved
   - 7.3 In-Scope Components
   - 7.4 Out-of-Scope Components
   - 7.5 Backend Architecture
      - 7.5.1 BA-7.1 Architectural Style
      - 7.5.2 BA-7.2 Core Services
      - 7.5.3 BA-7.3 Inter-Service Communication
   - 7.6 API Standards
      - 7.6.1 API-7.1 API Design Principles
      - 7.6.2 API-7.2 Idempotency
      - 7.6.3 API-7.3 Rate Limiting
   - 7.7 Authentication
      - 7.7.1 AUTH-7.1 Customer Authentication
      - 7.7.2 AUTH-7.2 Seller Authentication
      - 7.7.3 AUTH-7.3 Admin Authentication
   - 7.8 Session Management
      - 7.8.1 SM-7.1 Session Lifecycle
      - 7.8.2 SM-7.2 Device Binding
   - 7.9 Authorization
      - 7.9.1 AUTHZ-7.1 Role-Based Access Control (RBAC)
      - 7.9.2 AUTHZ-7.2 Attribute-Based Access Control (ABAC)
      - 7.9.3 AUTHZ-7.3 Permission Enforcement
   - 7.10 Security Controls
      - 7.10.1 SEC-7.1 Data Isolation
      - 7.10.2 SEC-7.2 Secrets Management
      - 7.10.3 SEC-7.3 Audit Logging
   - 7.11 Non-Functional Requirements
      - 7.11.1 Performance
      - 7.11.2 Scalability
      - 7.11.3 Reliability
   - 7.12 Failure Scenarios
   - 7.13 Acceptance Criteria
   - 7.14 Dependencies
   - 7.15 Risks and Mitigations
- 8 PHASE 8 — Payments, Escrow, Settlements and Refunds
   - 8.1 Phase Objective
   - 8.2 Actors Involved
   - 8.3 In-Scope Components
   - 8.4 Out-of-Scope Components
   - 8.5 Payment Methods
      - 8.5.1 PM-8.1 Cash on Delivery (COD)
      - 8.5.2 PM-8.2 Digital Payments
      - 8.5.3 PM-8.3 Hybrid Payments
   - 8.6 Escrow Management
      - 8.6.1 ESC-8.1 Escrow Principles
      - 8.6.2 ESC-8.2 Escrow Release Conditions
      - 8.6.3 ESC-8.3 Escrow Failure Handling
   - 8.7 Settlement Engine
      - 8.7.1 SET-8.1 Settlement Calculation
      - 8.7.2 SET-8.2 Settlement Cycles
      - 8.7.3 SET-8.3 Settlement Execution
   - 8.8 Refund Management
      - 8.8.1 REF-8.1 Refund Triggers
      - 8.8.2 REF-8.2 Refund Types
      - 8.8.3 REF-8.3 Refund Execution
   - 8.9 Financial Ledger
      - 8.9.1 LED-8.1 Ledger Principles
      - 8.9.2 LED-8.2 Ledger Events
      - 8.9.3 LED-8.3 Reconciliation
   - 8.10 Non-Functional Requirements
      - 8.10.1 Security
      - 8.10.2 Accuracy
      - 8.10.3 Reliability
   - 8.11 Failure Scenarios
   - 8.12 Acceptance Criteria
   - 8.13 Dependencies
   - 8.14 Risks and Mitigations
- 9 PHASE 9 — Data Privacy, Retention and Compliance
   - 9.1 Phase Objective
   - 9.2 Actors Involved
   - 9.3 In-Scope Components
   - 9.4 Out-of-Scope Components
   - 9.5 Data Classification
      - 9.5.1 DC-9.1 Data Categories
      - 9.5.2 DC-9.2 Data Ownership
   - 9.6 Consent and Purpose Limitation
      - 9.6.1 CP-9.1 User Consent
      - 9.6.2 CP-9.2 Purpose Limitation
   - 9.7 Data Storage and Access Control
      - 9.7.1 DS-9.1 Secure Storage
      - 9.7.2 DS-9.2 Access Control
   - 9.8 Data Retention Policy
      - 9.8.1 DR-9.1 Retention Durations
      - 9.8.2 DR-9.2 Retention Enforcement
   - 9.9 Data Deletion and Anonymization
      - 9.9.1 DD-9.1 User-Initiated Deletion
      - 9.9.2 DD-9.2 Anonymization
   - 9.10 User Data Rights
      - 9.10.1 UR-9.1 Right to Access
      - 9.10.2 UR-9.2 Right to Correction
      - 9.10.3 UR-9.3 Right to Erasure
   - 9.11 Audit and Compliance Reporting
      - 9.11.1 AC-9.1 Audit Logs
      - 9.11.2 AC-9.2 Compliance Reports
   - 9.12 Non-Functional Requirements
      - 9.12.1 Security
      - 9.12.2 Transparency
   - 9.13 Failure Scenarios
   - 9.14 Acceptance Criteria
   - 9.15 Dependencies
   - 9.16 Risks and Mitigations
- 10 PHASE 10 — Legal Safety, Terms, Liability and Enforcement
   - 10.1 Phase Objective
   - 10.2 Actors Involved
   - 10.3 In-Scope Components
   - 10.4 Out-of-Scope Components
   - 10.5 Platform Role Definition
      - 10.5.1 LR-10.1 Marketplace Intermediary Status
      - 10.5.2 LR-10.2 Agency Disclaimer
   - 10.6 Customer Terms of Service
      - 10.6.1 CT-10.1 Customer Obligations
      - 10.6.2 CT-10.2 Customer Limitations
      - 10.6.3 CT-10.3 Customer Liability Limits
   - 10.7 Seller Agreement
      - 10.7.1 SA-10.1 Seller Responsibilities
      - 10.7.2 SA-10.2 Prohibited Seller Activities
      - 10.7.3 SA-10.3 Seller Liability
   - 10.8 Delivery Partner Agreement
      - 10.8.1 DP-10.1 Delivery Partner Responsibilities
      - 10.8.2 DP-10.2 Delivery Partner Limitations
      - 10.8.3 DP-10.3 Delivery Liability
   - 10.9 Content and Conduct Enforcement
      - 10.9.1 EN-10.1 User Conduct Rules
      - 10.9.2 EN-10.2 Enforcement Actions
      - 10.9.3 EN-10.3 Enforcement Due Process
   - 10.10Disclaimers and Risk Allocation
      - 10.10.1 DR-10.1 Platform Availability Disclaimer
      - 10.10.2 DR-10.2 Third-Party Disclaimer
   - 10.11Jurisdiction and Governing Law
      - 10.11.1 JL-10.1 Governing Law
      - 10.11.2 JL-10.2 Dispute Resolution
   - 10.12Non-Functional Requirements
      - 10.12.1 Compliance
      - 10.12.2 Transparency
   - 10.13Failure Scenarios
   - 10.14Acceptance Criteria
   - 10.15Dependencies
   - 10.16Risks and Mitigations
- 11 PHASE 11 – Growth, Monetization, and Advanced Intelligence
   - 11.1 11.1 Phase Objective
   - 11.2 11.2 Actors Involved
   - 11.3 11.3 In-Scope Components
   - 11.4 11.4 Functional Requirements
      - 11.4.1 11.4.1 FR-11.1 Marketing and Coupons
      - 11.4.2 11.4.2 FR-11.2 Monetization and Ad Tech
      - 11.4.3 11.4.3 FR-11.3 Intelligent Logistics (Batching & AI)
      - 11.4.4 11.4.4 FR-11.4 Point-of-Sale (POS) Integration
      - 11.4.5 11.4.5 FR-11.5 Communication and Privacy
      - 11.4.6 11.4.6 FR-11.6 Regulatory Compliance (VAT)
   - 11.5 11.5 Non-Functional Requirements
   - 11.6 11.6 Acceptance Criteria
   - 11.7 11.7 Risks and Mitigations
- 12 PHASE 12 – The ”Modern Experience” Layer (CX & Retention)
   - 12.1 12.1 Phase Objective
   - 12.2 12.2 Actors Involved
   - 12.3 12.3 In-Scope Components
   - 12.4 12.4 Functional Requirements
      - 12.4.1 12.4.1 FR-12.1 Semantic and Voice Search
      - 12.4.2 12.4.2 FR-12.2 GoPasal Gold (Subscription)
      - 12.4.3 12.4.3 FR-12.3 Group Ordering
      - 12.4.4 12.4.4 FR-12.4 Video Stories
      - 12.4.5 12.4.5 FR-12.5 AI Support Agent
      - 12.4.6 12.4.6 FR-12.6 Smart Reorder
      - 12.4.7 12.4.7 FR-12.7 Modern Authentication
   - 12.5 12.5 Non-Functional Requirements
- 12.6 12.6 Acceptance Criteria
- 12.7 12.7 Risks and Mitigations
- silience 13 PHASE 13 – Enterprise Scale, Gamification, and High-Velocity Re-
- 13.1 13.1 Phase Objective
- 13.2 13.2 Actors Involved
- 13.3 13.3 In-Scope Components
- 13.4 13.4 Functional Requirements
   - 13.4.1 13.4.1 FR-13.1 Enterprise ”Master Merchant” Management
   - 13.4.2 13.4.2 FR-13.2 Gamification & Tiered Rewards
   - 13.4.3 13.4.3 FR-13.3 High-Concurrency ”Flash Sale” Mode
   - 13.4.4 13.4.4 FR-13.4 Sustainability & EV Logic
- 13.5 13.5 Non-Functional Requirements
- 13.6 13.6 Acceptance Criteria
- 13.7 13.7 Risks and Mitigations


## Executive Summary

GoPasal is a multi-tenant hyperlocal commerce platform consisting of:

- Customer App/Web:browsing, ordering, tracking, support
- Seller Portal: store management, products, inventory, order fulfillment
- Delivery Partner Module:task assignment, delivery lifecycle, COD handling
- Admin Console: governance, compliance, disputes, finance oversight
This SRS is written as aphase-based implementation blueprint (Phases 1–
10). A key constraint is thatan existing project already exists; the backend must be
upgraded to match this SRS whilepreserving the existing frontend design and API
contracts as much as possible. Where changes are needed, backward compatibility
or adapters must be used.


## Goals and Success Criteria

### Primary Goals

- Enable a reliable hyperlocal ordering experience for customers
- Enable sellers to manage products, inventory, and fulfillment efficiently
- Enable delivery operations with auditable task lifecycle and COD handling
- Enable platform governance with strict RBAC, tenant isolation, and audit logs
- Enable finance correctness through immutable ledger, escrow, settlement, refunds

### Success Criteria

- Zero critical security leaks: No cross-tenant data exposure
- Financial correctness:Double-entry ledger remains balanced; no duplicate post-
    ings
- Operational readiness: Monitoring, alerts, auditability, incident response paths
- Frontend stability:Existing UI flows continue working throughout migration


## Scope

### In Scope

- Customer ordering lifecycle, cart, checkout, tracking, cancellations
- Seller store lifecycle, product catalog, inventory, order fulfillment
- Delivery task lifecycle, POD, COD collection confirmation, mismatch flagging
- Identity & access: OTP auth, sessions/tokens, RBAC/ABAC, tenant isolation
- Finance core: ledger, escrow hold/release, settlement calculation, refunds/reversals
- Admin governance: approvals, suspensions, disputes, audit logging, compliance
- Data privacy: retention policies, anonymization, deletion workflows, exports (back-
    end)
- Policy enforcement: prohibited items, abuse controls, runtime enforcement hooks
- Production hardening: rate limiting, monitoring, alerts, reliability controls

### Out of Scope (for this SRS iteration)

- Full re-design of frontend UI/UX
- Building a new frontend from scratch
- Banking transfer integrations (can be tracked as future enhancement)
- Advanced ML personalization beyond SRS-defined minimal capabilities (future)


## Stakeholders

- Customer:end users ordering from nearby shops
- Seller Owner:store owner / tenant owner
- Seller Staff:store employees with scoped permissions
- Delivery Partner (Rider):fulfills delivery tasks
- Admin:platform operations/support
- Super Admin:platform governance, finance, legal overrides
- Engineering:backend, frontend, mobile, DevOps
- QA:test planning, regression, release acceptance


## Definitions and Glossary

Tenant
A store boundary. One store equals one tenant for data isolation purposes.
Seller Owner
The primary user identity that owns and controls a store (tenant).
Seller Staff
Store employees. Limited permissions within a specific tenant.
Admin / Super Admin
Platform operator roles. Not tenant-scoped; actions must be audited.
Ledger
Immutable double-entry financial record. Balances are derived, not stored.
Escrow
Holding account mechanism that prevents premature payout.
Settlement
Periodic calculation of seller payable amounts from released escrow.
Refund/Reversal
Financial correction flows that must preserve ledger invariants.
POD
Proof of Delivery (confirmation evidence and delivery finalization).


## Assumptions and Constraints

### Assumptions

- The system operates in a hyperlocal context where stores have limited delivery
    radius.
- Orders are tenant-scoped; a single order is associated to one store tenant (unless
    explicitly split by design).
- Existing frontend behavior is considered a contract that must remain functional.
- Platform requires strict audit trails for admin actions and financial operations.

### Constraints

- Non-breaking migration: upgrade existing backend without disrupting current
    frontend UX.
- Security:default-deny RBAC; tenant isolation enforced centrally.
- Finance correctness:no manual balance edits; ledger is immutable and balanced.
- Operational readiness: monitoring and alerting must exist before production
    rollout.


## Quality Attributes (High-Level)

- Reliability:graceful degradation, retries, idempotency for critical operations
- Security:RBAC/ABAC enforcement, tenant isolation, secure session management
- Performance:efficient queries, indexing, low-latency core flows (order + delivery)
- Observability:structured logs, metrics, alerts, traceable audit events
- Maintainability:modular services, clear boundaries, minimal coupling
- Compliance: retention policies, PII minimization, export/anonymization work-
    flows


## Requirements Traceability Approach

This SRS is structured into Phases 1–10. Each phase contains:

- Functional requirements (features, workflows, roles)
- Data model impacts (entities, relationships)
- API implications (endpoints, backward compatibility)
- Security requirements (RBAC, tenant checks, audit)
- Acceptance criteria and testing focus
A traceability matrix can be maintained using the following identifiers:
- PHx-FR-yyyFunctional Requirement
- PHx-NFR-yyyNon-Functional Requirement
- PHx-DM-yyyData Model Requirement
- PHx-SEC-yyySecurity Requirement
- PHx-AC-yyyAcceptance Criteria


## Phase Map (1–10)

1. Phase 1:Foundation, architecture, core patterns, baseline services
2. Phase 2:Customer flows (browse, cart, checkout, tracking)
3. Phase 3:Seller & staff flows (store, catalog, inventory, fulfillment)
4. Phase 4:Delivery operations (tasks, rider lifecycle, COD capture)
5. Phase 5:Admin governance (approvals, controls, auditing)
6. Phase 6:UX guarantees and resilience expectations (backend support)
7. Phase 7:Security core (auth, RBAC/ABAC, tenant isolation)
8. Phase 8:Finance core (ledger, escrow, settlement, refunds)
9. Phase 9:Privacy & compliance (retention, deletion, exports)
10. Phase 10: Legal safety & policy enforcement + production readiness


## 1 PHASE 1 — Platform Foundation

### 1.1 Phase Objective

The objective of Phase 1 is to establish a secure, scalable, and configurable core platform
upon which all customer-facing, seller-facing, and admin-facing capabilities will be built.
This phase focuses on system bootstrapping, multi-tenant isolation, configuration gover-
nance, observability, and baseline security. No direct revenue features are exposed in this
phase.
Phase 1 is mandatory for all subsequent phases and must be completed successfully
before customer onboarding begins.

### 1.2 Actors Involved

- System (Backend Services)
- Super Admin
- Platform Operator (DevOps)

### 1.3 In-Scope Components

- Environment and configuration management
- Multi-tenant store foundation
- Role and identity scaffolding
- Logging, monitoring, and auditing
- Feature flags and rollout control
- Security baseline and secrets handling

### 1.4 Out-of-Scope Components

- Customer-facing UI
- Seller onboarding flows
- Payments, orders, or delivery
- AI-driven personalization


### 1.5 Functional Requirements

#### 1.5.1 FR-1.1 Environment Configuration Management

The system shall provide a centralized configuration mechanism that governs platform-
wide and tenant-specific behavior.

- The system shall support environment-specific configurations (development, stag-
    ing, production).
- Configuration values shall be schema-validated at application startup.
- Invalid or missing mandatory configuration shall prevent system boot.
- Configuration parameters shall include:
    - Platform commission rates
    - Delivery fee calculation rules
    - COD limits
    - Refund windows
    - Feature toggles
- Only Super Admin users may modify production configuration.
- All configuration changes shall be versioned and auditable.

#### 1.5.2 FR-1.2 Feature Flag System

The platform shall include a feature flag system to allow controlled rollout of features.

- Feature flags shall be configurable per environment.
- Feature flags may be global or tenant-specific.
- Feature flags shall not require code redeployment for activation.
- Disabled features must fail gracefully with user-safe messages.

#### 1.5.3 FR-1.3 Multi-Tenant Store Foundation

The system shall implement a strict multi-tenant data model.

- Each seller store shall be treated as a separate tenant.
- Every tenant shall have a globally unique identifier.


- All tenant-owned data shall be logically isolated.
- Cross-tenant data access shall be prohibited at service level.
- Shared reference data (categories, policies) shall be read-only.

#### 1.5.4 FR-1.4 Store Lifecycle States

Each store shall follow a defined lifecycle state machine.

- Store states shall include:
    - CREATED
    - PENDINGAPPROVAL
    - ACTIVE
    - SUSPENDED
    - TERMINATED
- Only ACTIVE stores may appear in customer search results.
- State transitions shall be initiated only by Super Admin.
- All state transitions shall be recorded in audit logs.

#### 1.5.5 FR-1.5 Identity and Role Scaffolding

The system shall establish identity and role scaffolding without exposing end-user au-
thentication flows.

- Roles shall include:
    - Super Admin
    - Platform Operator
    - System Service
- Role permissions shall follow the principle of least privilege.
- All service-to-service calls shall use internal service identities.

### 1.6 Non-Functional Requirements

#### 1.6.1 Performance

- Configuration lookup shall complete within 50ms (P95).
- Tenant resolution shall complete within 20ms (P95).


#### 1.6.2 Availability

- Platform uptime target: 99.5%.
- Configuration service failure shall not crash running instances.

#### 1.6.3 Security

- Secrets shall never be stored in source code.
- Secrets shall be encrypted at rest and in transit.
- Admin actions shall require re-authentication.

### 1.7 Observability and Audit

#### 1.7.1 Logging

- All requests shall include a unique request ID.
- Logs shall include tenant ID, actor ID, and action type.

#### 1.7.2 Audit Trails

- Audit logs shall be immutable.
- Audit entries shall include before and after state.
- Audit logs shall be exportable for compliance review.

### 1.8 Failure Scenarios

- Invalid configuration upload shall be rejected atomically.
- Partial configuration updates shall not be allowed.
- Unauthorized admin access attempts shall be logged and alerted.

### 1.9 Acceptance Criteria

- System fails fast on invalid configuration.
- Stores cannot access other store data under any condition.
- All admin actions appear in audit logs.
- Feature flags toggle behavior without redeploy.


### 1.10 Dependencies

- Database availability
- Secure secrets manager
- Logging and monitoring infrastructure

### 1.11 Risks and Mitigations

- Risk: Misconfiguration causes revenue leakage Mitigation: Versioned configs with
    approval workflow.
- Risk: Tenant data leakage Mitigation: Mandatory tenant ID enforcement at service
    layer.

## 2 PHASE 2 — Customer Platform

### 2.1 Phase Objective

The objective of Phase 2 is to design and implement the complete customer-facing experi-
ence of the GoPasal platform. This phase enables end users to discover nearby stores and
products, place orders using cash-first workflows, track order status, and raise support
requests.
Phase 2 introduces the first revenue-impacting flows of the platform and must pri-
oritize trust, clarity, speed, and reliability under low-connectivity conditions common in
Nepal.

### 2.2 Actors Involved

- Customer (End User)
- System (Backend Services)
- Seller (Indirect participant)
- Delivery Partner (Indirect participant)

### 2.3 In-Scope Components

- Customer authentication and profile
- Location and address management


- Store and product discovery
- Search and filtering
- Cart and checkout
- Order tracking
- Notifications
- Customer support initiation

### 2.4 Out-of-Scope Components

- Seller-side operations
- Delivery rider application
- Admin dispute resolution (handled in Phase 5)
- Loyalty and referral programs (future phase)

### 2.5 Functional Requirements

#### 2.5.1 FR-2.1 Customer Authentication

The system shall authenticate customers primarily using phone number and One-Time
Password (OTP).

- Customers shall be able to sign up and log in using a valid mobile number.
- OTP delivery shall use SMS gateways optimized for Nepal.
- OTP attempts shall be rate-limited per device and per number.
- Successful authentication shall create a persistent session.
- Sessions shall expire automatically after inactivity.
- Customers shall be able to log out from all devices.


#### 2.5.2 FR-2.2 Customer Profile Management

The system shall allow customers to manage their personal profile.

- Profile fields shall include:
    - Full name
    - Phone number (read-only after verification)
    - Preferred language
- Customers may update their name and language preference.
- Profile updates shall be reflected across all active sessions.

#### 2.5.3 FR-2.3 Location and Address Management

The system shall support accurate delivery location handling.

- Customers shall be able to add multiple delivery addresses.
- Address input methods shall include:
    - GPS-based pin drop
    - Manual address entry
- Each address shall include geo-coordinates.
- Customers shall be able to set a default address.
- Orders shall be restricted to stores that can serve the selected address.

#### 2.5.4 FR-2.4 Store Discovery

The system shall allow customers to discover nearby stores.

- Only ACTIVE stores shall be visible to customers.
- Stores shall be ranked using:
    - Distance from customer
    - Store availability
    - Store rating (if available)
    - Estimated delivery time
- Closed stores shall be clearly labeled as unavailable.


#### 2.5.5 FR-2.5 Product Discovery

The system shall allow customers to browse and view products.

- Products shall display:
    - Name and images
    - Price and discount (if any)
    - Availability status
    - Seller information
- Products that are out of stock shall not be orderable.

#### 2.5.6 FR-2.6 Search and Filtering

The system shall provide a robust search experience.

- Search shall support:
    - Romanized Nepali keywords
    - Partial matches
    - Typo tolerance
- Filters shall include:
    - Category
    - Price range
    - In-stock only
    - Delivery time
- Search results shall respect delivery eligibility.

#### 2.5.7 FR-2.7 Cart Management

The system shall allow customers to manage a shopping cart.

- Customers shall add, update, and remove items from cart.
- Cart shall be store-specific (single-store checkout).
- Cart state shall persist across sessions.
- Quantity limits shall respect seller inventory.


#### 2.5.8 FR-2.8 Checkout Process

The system shall guide customers through checkout.

- Checkout shall require:
    - Selected delivery address
    - Payment method selection
- Cash on Delivery (COD) shall be enabled by default.
- Delivery fees shall be shown before confirmation.
- Order confirmation shall generate a unique order ID.

#### 2.5.9 FR-2.9 Order Tracking

The system shall provide real-time order status tracking.

- Order statuses shall include:
    - Placed
    - Accepted
    - Packed
    - Out for Delivery
    - Delivered
    - Cancelled
- Customers shall receive notifications on status changes.

#### 2.5.10 FR-2.10 Notifications

The system shall notify customers of important events.

- Notification channels shall include:
    - Push notifications
    - SMS (critical events)
- Notifications shall be retried on failure.


#### 2.5.11 FR-2.11 Customer Support Initiation

The system shall allow customers to initiate support.

- Customers may raise issues for:
    - Order cancellation
    - Delayed delivery
    - Wrong or missing items
- Each issue shall create a support ticket.

### 2.6 Non-Functional Requirements

#### 2.6.1 Performance

- Store discovery response time shall be under 1 second (P95).
- Checkout confirmation shall complete within 2 seconds.

#### 2.6.2 Reliability

- Cart data shall not be lost during network interruption.
- Order placement shall be idempotent.

#### 2.6.3 Usability

- UI shall support one-handed mobile usage.
- All critical actions shall have confirmation prompts.

### 2.7 Failure Scenarios

- OTP delivery failure shall allow retry after cooldown.
- Store becomes unavailable during checkout→order blocked.
- Payment confirmation timeout→order not created.


### 2.8 Acceptance Criteria

- Customers can successfully log in using OTP.
- Only eligible stores appear for a selected address.
- COD checkout completes without error.
- Order status updates are visible within seconds.

### 2.9 Dependencies

- SMS gateway availability
- Location services (GPS)
- Backend order service

### 2.10 Risks and Mitigations

- Risk: High OTP failure rate Mitigation: Multiple SMS providers and retry logic.
- Risk: Incorrect delivery location Mitigation: Mandatory map pin validation.

## 3 PHASE 3 — Seller and Staff Platform

### 3.1 Phase Objective

The objective of Phase 3 is to enable local businesses (sellers) to operate digitally on the
GoPasal platform. This phase focuses on seller onboarding, store configuration, catalog
and inventory management, order processing, staff delegation, and financial visibility.
Phase 3 ensures that sellers of varying technical literacy can manage their daily op-
erations reliably using mobile-first tools.

### 3.2 Actors Involved

- Store Owner (Primary Seller)
- Store Staff (Delegated Roles)
- System (Backend Services)
- Super Admin (Indirect Oversight)


### 3.3 In-Scope Components

- Seller onboarding and verification
- Store profile and operational settings
- Staff management and role-based access
- Product catalog and inventory
- Order acceptance and fulfillment
- Seller financial visibility (non-payout)

### 3.4 Out-of-Scope Components

- Platform-wide fee configuration (Admin Phase)
- Payment settlement execution (Phase 8)
- Advanced analytics and ads

### 3.5 Functional Requirements

#### 3.5.1 FR-3.1 Seller Registration

The system shall allow local businesses to register as sellers.

- Sellers shall provide:
    - Owner name
    - Mobile number
    - Store name
    - Store category
    - Store address with map pin
- Each seller account shall create exactly one store initially.
- Duplicate store registration using the same mobile number shall be prevented.


#### 3.5.2 FR-3.2 Seller Verification and Approval

The system shall enforce a verification workflow before store activation.

- Newly registered stores shall enterPENDINGAPPROVALstate.
- Required verification data may include:
    - Business documents (if applicable)
    - Store photos
    - Bank or wallet details (optional at this stage)
- Only Super Admin may approve or reject a store.
- Rejection shall require a reason visible to the seller.

#### 3.5.3 FR-3.3 Store Profile Management

The system shall allow sellers to manage store-level information.

- Editable store attributes shall include:
    - Store name and logo
    - Description
    - Operating hours
    - Delivery radius
    - Minimum order value
- Changes to critical fields may require admin re-approval.
- Store status shall be clearly visible to the seller.

#### 3.5.4 FR-3.4 Staff and Role Management

The system shall support delegation of responsibilities to staff.

- Store owners shall be able to invite staff via mobile number.
- Staff roles shall include:
    - Manager
    - Order Handler
    - Inventory Editor


- Support Staff
- Each role shall have predefined permissions.
- Owners may enable or revoke staff access at any time.
- All staff actions shall be recorded in audit logs.

#### 3.5.5 FR-3.5 Product Catalog Management

The system shall allow sellers to manage their product listings.

- Sellers shall create products with:
    - Product name
    - Category
    - Images
    - Price
    - Unit or variant
- Products may have multiple variants (size, quantity, pack).
- Products may be temporarily disabled without deletion.
- Bulk product upload via CSV shall be supported.

#### 3.5.6 FR-3.6 Inventory Management

The system shall track product availability.

- Inventory may be managed as:
    - Unlimited stock
    - Quantity-based stock
- Low-stock alerts shall be generated.
- Out-of-stock products shall not be orderable.


#### 3.5.7 FR-3.7 Order Acceptance and Processing

The system shall allow sellers to process incoming orders.

- Sellers shall receive real-time order notifications.
- Sellers may accept or reject orders within a defined SLA.
- Rejected orders shall require a reason.
- Accepted orders shall progress through:
    - Accepted
    - Packed
    - Ready for Pickup / Dispatch
- Sellers shall not modify order contents after acceptance.

#### 3.5.8 FR-3.8 Order Cancellation Handling

The system shall manage seller-initiated cancellations.

- Seller cancellations shall be allowed only before dispatch.
- Cancellation reasons shall be mandatory.
- Excessive cancellations shall negatively affect seller score.

#### 3.5.9 FR-3.9 Seller Notifications

The system shall notify sellers of critical events.

- Notification events shall include:
    - New order
    - Order cancellation
    - Store status change
- Notifications shall be delivered via app and SMS (critical).


#### 3.5.10 FR-3.10 Seller Financial Visibility

The system shall provide sellers with financial insight.

- Sellers shall view:
    - Completed orders
    - Gross sales
    - Platform fees (informational)
- Actual settlement execution is handled in Phase 8.

### 3.6 Non-Functional Requirements

#### 3.6.1 Performance

- Order notification latency shall be under 3 seconds.
- Catalog update operations shall complete within 2 seconds.

#### 3.6.2 Security

- Staff access shall be strictly role-limited.
- Sellers shall not access other store data.

#### 3.6.3 Usability

- Seller UI shall be usable by non-technical users.
- Critical actions shall require confirmation.

### 3.7 Failure Scenarios

- Seller fails to accept order within SLA→order auto-cancelled.
- Inventory mismatch→order blocked before confirmation.
- Staff misuse→access revocation and audit review.


### 3.8 Acceptance Criteria

- Sellers can register and await approval.
- Approved sellers can manage catalog and inventory.
- Orders can be accepted, packed, and dispatched.
- Staff permissions are enforced correctly.

### 3.9 Dependencies

- Admin approval workflows
- Notification service
- Order management backend

### 3.10 Risks and Mitigations

- Risk: Seller operational errors Mitigation: Clear UI flows and confirmations.
- Risk: Staff misuse Mitigation: RBAC and audit logging.

## 4 PHASE 4 — Delivery Platform

### 4.1 Phase Objective

The objective of Phase 4 is to enable reliable, auditable, and scalable order fulfillment
through multiple delivery models. This phase defines how orders move physically from
seller to customer, how proof of delivery is captured, and how cash-on-delivery (COD) is
handled safely.
This phase is critical for customer trust, seller payouts, and platform liability control.

### 4.2 Actors Involved

- Delivery Partner (Rider / Courier)
- Seller (Store Staff)
- Customer
- System (Backend Services)
- Super Admin (Oversight)


### 4.3 In-Scope Components

- Delivery models and assignment
- Delivery task lifecycle
- Proof of Delivery (POD)
- Cash on Delivery (COD) handling
- Failed delivery and return workflows
- Delivery notifications

### 4.4 Out-of-Scope Components

- Settlement of delivery fees (Phase 8)
- Advanced route optimization (future phase)
- Third-party courier contracts (business scope)

### 4.5 Delivery Models

#### 4.5.1 Model 4A — Seller Self-Delivery

- Seller uses own staff to deliver orders.
- Seller marks order as delivered in the system.
- Proof of delivery requirements are minimal.
- Platform liability is limited.

#### 4.5.2 Model 4B — Platform-Managed Delivery

- Platform assigns delivery partners (riders).
- Riders use a dedicated delivery application.
- Full proof-of-delivery is mandatory.
- COD collection is tracked by platform.


#### 4.5.3 Model 4C — Hybrid / Third-Party Delivery

- Orders may be handed to integrated courier services.
- Delivery status updates received via webhook/API.
- Proof artifacts are stored centrally.

### 4.6 Functional Requirements

#### 4.6.1 FR-4.1 Delivery Task Creation

The system shall generate a delivery task for each eligible order.

- Delivery tasks shall be created only after seller dispatch.
- Each delivery task shall reference exactly one order.
- Delivery task shall include pickup and drop-off locations.

#### 4.6.2 FR-4.2 Delivery Assignment

The system shall assign delivery tasks to delivery partners.

- Assignment may be:
    - Automatic (system-driven)
    - Manual (admin override)
- Assignment criteria shall include:
    - Proximity
    - Current workload
    - COD eligibility
- All assignment actions shall be logged.

#### 4.6.3 FR-4.3 Delivery Task Lifecycle

Delivery tasks shall follow a defined state machine.

- Task states shall include:
    - CREATED
    - ASSIGNED


##### – PICKEDUP

##### – INTRANSIT

##### – DELIVERED

##### – FAILED

##### – RETURNED

- Invalid state transitions shall be rejected.

#### 4.6.4 FR-4.4 Pickup Workflow

The system shall support order pickup from sellers.

- Rider shall confirm pickup within the delivery app.
- Pickup confirmation shall include timestamp and location.
- Seller shall be notified upon pickup.

#### 4.6.5 FR-4.5 Proof of Delivery (POD)

The system shall require proof of delivery for completed orders.

- Proof artifacts may include:
    - Photo evidence
    - OTP confirmation from customer
    - Geo-location data
- POD artifacts shall be immutable after submission.
- POD shall be mandatory for COD orders.

#### 4.6.6 FR-4.6 Cash on Delivery (COD) Handling

The system shall securely manage COD transactions.

- COD amount due shall be displayed to the rider.
- Rider shall confirm amount collected.
- Discrepancies shall trigger a flag for review.
- COD collection data shall be linked to settlement records.


#### 4.6.7 FR-4.7 Failed Delivery Handling

The system shall manage failed delivery attempts.

- Failure reasons shall include:
    - Customer unavailable
    - Address unreachable
    - Customer refusal
- Failed deliveries may be:
    - Rescheduled
    - Returned to seller
- Customers and sellers shall be notified.

#### 4.6.8 FR-4.8 Return-to-Seller Workflow

The system shall support order returns to seller.

- Return shall create a reverse delivery task.
- Return confirmation shall require proof.
- Returned orders shall not be marked as delivered.

#### 4.6.9 FR-4.9 Delivery Notifications

The system shall notify relevant parties.

- Customer notifications:
    - Out for delivery
    - Delivered
    - Failed delivery
- Seller notifications:
    - Pickup confirmed
    - Return initiated


### 4.7 Non-Functional Requirements

#### 4.7.1 Performance

- Delivery status updates shall propagate within 5 seconds.
- POD upload shall complete within 3 seconds on normal network.

#### 4.7.2 Reliability

- Delivery updates shall be retryable on network failure.
- Duplicate POD submissions shall be rejected.

#### 4.7.3 Security

- Delivery partners shall access only assigned tasks.
- COD manipulation attempts shall be logged and flagged.

### 4.8 Failure Scenarios

- Rider app offline→task updates queued and synced later.
- COD mismatch→order flagged for admin review.
- POD missing→order not eligible for settlement.

### 4.9 Acceptance Criteria

- Delivery tasks are created only after dispatch.
- Riders cannot complete delivery without POD.
- COD amounts are correctly recorded.
- Failed deliveries trigger correct follow-up flows.

### 4.10 Dependencies

- Order service
- Notification service
- Mobile delivery application


### 4.11 Risks and Mitigations

- Risk: COD fraud by riders Mitigation: Mandatory POD and reconciliation checks.
- Risk: Delivery disputes Mitigation: Immutable delivery evidence.

## 5 PHASE 5 — Super Admin and Governance

### 5.1 Phase Objective

The objective of Phase 5 is to provide the platform with centralized governance, oversight,
and enforcement capabilities. This phase ensures that GoPasal can operate as a legally
safe marketplace by clearly separating platform responsibility from seller responsibility
while still maintaining quality, trust, and fraud control.
Phase 5 is critical for scalability, regulatory readiness, and long-term platform sus-
tainability.

### 5.2 Actors Involved

- Super Admin
- Platform Operations Team
- Compliance / Support Staff
- System (Backend Services)

### 5.3 In-Scope Components

- Admin authentication and RBAC
- Store approval and lifecycle control
- Policy and rule management
- Dispute and support resolution
- Fraud detection and enforcement
- Platform-wide analytics and reporting


### 5.4 Out-of-Scope Components

- Seller payout execution (Phase 8)
- AI model training pipelines (future phase)
- External legal arbitration

### 5.5 Functional Requirements

#### 5.5.1 FR-5.1 Admin Authentication and Authorization

The system shall enforce strict authentication and authorization for admin users.

- Admin users shall authenticate using:
    - Username/password
    - Secondary verification (OTP or hardware token)
- Admin roles shall include:
    - Super Admin
    - Operations Admin
    - Support Agent
    - Compliance Reviewer
    - Finance Viewer
- Each role shall have predefined permissions.
- Privileged actions shall require re-authentication.

#### 5.5.2 FR-5.2 Store Approval and Lifecycle Management

The system shall allow admins to control store states.

- Admins shall view pending store applications.
- Store approval shall require manual review.
- Admins may suspend or terminate stores.
- Suspension reasons shall be recorded and visible to sellers.
- Suspended stores shall not appear to customers.


#### 5.5.3 FR-5.3 Policy and Rule Management

The system shall support configurable platform policies.

- Policy categories shall include:
    - Cancellation and refund rules
    - Prohibited items
    - Rating and review guidelines
    - Delivery SLAs
- Policies shall be versioned.
- Policy changes shall include effective dates.
- Historical policy versions shall remain accessible.

#### 5.5.4 FR-5.4 Dispute and Support Resolution

The system shall provide tools for dispute handling.

- Dispute types shall include:
    - Wrong item
    - Missing item
    - Damaged item
    - Late delivery
    - COD dispute
- Each dispute shall include:
    - Order reference
    - Evidence (photos, chat logs, POD)
    - Timestamps
- Admins may issue:
    - Full refund
    - Partial refund
    - Store credit
    - Reorder


#### 5.5.5 FR-5.5 Fraud Detection and Enforcement

The system shall assist admins in identifying suspicious activity.

- Fraud indicators may include:
    - Excessive order cancellations
    - Repeated COD failures
    - Abnormally high refunds
- Flagged entities shall be reviewed manually.
- Enforcement actions may include:
    - Warning
    - Temporary suspension
    - Permanent ban

#### 5.5.6 FR-5.6 Platform Analytics and Reporting

The system shall provide visibility into platform performance.

- Dashboards shall include:
    - Order volume
    - Revenue (gross)
    - Cancellation rates
    - Delivery success rate
- Reports shall be exportable in CSV format.

#### 5.5.7 FR-5.7 Audit Logs

The system shall maintain immutable audit logs.

- All admin actions shall be logged.
- Logs shall include before/after state.
- Logs shall be retained per compliance policy.


### 5.6 Non-Functional Requirements

#### 5.6.1 Security

- Admin endpoints shall be IP-restricted (optional).
- All admin sessions shall expire automatically.

#### 5.6.2 Availability

- Admin portal availability target: 99.5%.

#### 5.6.3 Scalability

- Admin tools shall support thousands of stores without degradation.

### 5.7 Failure Scenarios

- Incorrect suspension→appeal workflow initiated.
- Admin action conflict→latest version wins with audit.
- Analytics data delay→dashboard shows last refresh time.

### 5.8 Acceptance Criteria

- Admins can approve, suspend, and terminate stores.
- Disputes can be resolved with evidence.
- Fraud flags are visible and actionable.
- All admin actions appear in audit logs.

### 5.9 Dependencies

- Identity and RBAC system
- Order and delivery services
- Notification service

### 5.10 Risks and Mitigations

- Risk: Abuse of admin power Mitigation: Role separation and audit trails.
- Risk: Delayed dispute resolution Mitigation: SLA tracking and escalation rules.


## 6 PHASE 6 — UX, Design System and Accessibility

### 6.1 Phase Objective

The objective of Phase 6 is to define a consistent, intuitive, and accessible user experience
across all platform surfaces (Customer, Seller, Delivery, and Admin). This phase ensures
usability under real-world constraints such as low bandwidth, small screens, mixed lan-
guage usage, and varying levels of digital literacy.
Phase 6 does not introduce new business logic but governs how existing features are
presented, interacted with, and understood by users.

### 6.2 Actors Involved

- Customer
- Seller (Owner and Staff)
- Delivery Partner
- Super Admin
- System (Frontend Clients)

### 6.3 In-Scope Components

- Cross-platform UX principles
- Design system and UI consistency
- Accessibility standards
- Error handling and feedback patterns
- Offline and low-connectivity behavior
- Localization and language handling

### 6.4 Out-of-Scope Components

- Marketing branding guidelines
- Advanced motion design and animations
- A/B testing frameworks (future phase)


### 6.5 UX Design Principles

#### 6.5.1 UX-6.1 Clarity Over Density

- Screens shall prioritize essential actions.
- Information shall be progressively disclosed.
- No screen shall require more than one primary decision.

#### 6.5.2 UX-6.2 Trust-First Design

- Seller identity and store status shall be clearly visible.
- Delivery timelines and fees shall be transparent.
- COD confirmation steps shall be explicit.

#### 6.5.3 UX-6.3 Speed Perception

- Skeleton loaders shall be used instead of blank screens.
- Optimistic UI updates shall be used where safe.
- Heavy operations shall show progress indicators.

#### 6.5.4 UX-6.4 Error Forgiveness

- Errors shall be reversible where possible.
- Clear recovery paths shall be provided.
- User mistakes shall not result in silent failures.

### 6.6 Design System

#### 6.6.1 DS-6.1 Component Standardization

The platform shall maintain a shared design system.

- Common components:
    - Buttons
    - Input fields
    - Cards
    - Modals


- Lists
- Components shall behave consistently across all apps.
- Design tokens shall define colors, spacing, and typography.

#### 6.6.2 DS-6.2 Typography

- Fonts shall support both English and Nepali scripts.
- Text sizes shall scale with system accessibility settings.
- Important information shall not rely on font size alone.

#### 6.6.3 DS-6.3 Color Usage

- Color shall not be the sole indicator of status.
- Status colors shall be consistent platform-wide.
- High-contrast mode shall be supported where possible.

### 6.7 Accessibility Requirements

#### 6.7.1 AR-6.1 Visual Accessibility

- Minimum contrast ratio shall meet WCAG AA standards.
- Text shall remain readable at increased font sizes.
- Icons shall include text labels where ambiguity exists.

#### 6.7.2 AR-6.2 Interaction Accessibility

- Touch targets shall be large enough for one-handed use.
- Critical actions shall not rely on swipe-only gestures.
- Confirmation dialogs shall be keyboard and screen-reader accessible.

#### 6.7.3 AR-6.3 Cognitive Accessibility

- Instructions shall use simple language.
- Jargon shall be avoided or explained.
- Error messages shall explain what went wrong and how to fix it.


### 6.8 Localization and Language Handling

#### 6.8.1 LH-6.1 Language Support

- The platform shall support:
    - English
    - Nepali
- Language selection shall be user-configurable.
- Language preference shall persist across sessions.

#### 6.8.2 LH-6.2 Mixed Language Tolerance

- Romanized Nepali shall be accepted in search fields.
- Mixed-script inputs shall not cause errors.

### 6.9 Offline and Low-Connectivity Behavior

#### 6.9.1 OC-6.1 Offline State Handling

- The app shall detect offline state.
- Non-critical actions shall be queued for retry.
- Users shall be informed when actions are pending sync.

#### 6.9.2 OC-6.2 Data Persistence

- Cart data shall be cached locally.
- Draft forms shall be preserved on interruption.

### 6.10 Error Handling and Feedback

#### 6.10.1 EH-6.1 Error Presentation

- Errors shall be displayed in user-friendly language.
- Technical error codes shall not be exposed to users.

#### 6.10.2 EH-6.2 Confirmation and Alerts

- Destructive actions shall require confirmation.
- Success actions shall provide visible feedback.


### 6.11 Non-Functional Requirements

#### 6.11.1 Usability

- New users shall complete first order within 3 minutes.
- Seller onboarding shall be completable without training.

#### 6.11.2 Consistency

- UI patterns shall remain consistent across updates.

### 6.12 Failure Scenarios

- Network loss during action→action queued with status.
- Language resource missing→fallback to English.
- Accessibility conflict→default to safest readable option.

### 6.13 Acceptance Criteria

- All screens usable with one hand.
- Text readable at increased system font size.
- Offline actions clearly indicated.
- Errors provide recovery guidance.

### 6.14 Dependencies

- Frontend frameworks (Flutter/Web)
- Localization files
- Offline storage mechanisms

### 6.15 Risks and Mitigations

- Risk: User confusion due to feature complexity Mitigation: Progressive disclosure
    and simple defaults.
- Risk: Poor accessibility adoption Mitigation: Accessibility checks in design review.


## 7 PHASE 7 — Backend Architecture, Authentica-

## tion and RBAC

### 7.1 Phase Objective

The objective of Phase 7 is to define the backend architecture, authentication mechanisms,
and authorization controls that secure and power all platform operations. This phase
establishes trust boundaries, ensures data isolation, and provides a scalable foundation
for future growth.
Phase 7 is mandatory for platform security, regulatory readiness, and multi-tenant
correctness.

### 7.2 Actors Involved

- Customer
- Seller (Owner and Staff)
- Delivery Partner
- Super Admin
- System Services

### 7.3 In-Scope Components

- Backend service architecture
- API standards and conventions
- Authentication mechanisms
- Authorization (RBAC and ABAC)
- Session management
- Inter-service communication

### 7.4 Out-of-Scope Components

- Frontend UI implementation
- AI model training pipelines
- Payment settlement logic (Phase 8)


### 7.5 Backend Architecture

#### 7.5.1 BA-7.1 Architectural Style

- The backend shall follow a modular, service-oriented architecture.
- Services may be deployed as:
    - Modular monolith (initial)
    - Independently scalable services (future)
- External clients shall access backend services only via public APIs.

#### 7.5.2 BA-7.2 Core Services

- Identity and Access Service
- Store and Tenant Service
- Catalog and Inventory Service
- Order Management Service
- Delivery Service
- Payment and Ledger Service
- Notification Service
- Admin Governance Service

#### 7.5.3 BA-7.3 Inter-Service Communication

- Synchronous communication via internal APIs.
- Asynchronous events for:
    - Order lifecycle changes
    - Payment events
    - Delivery updates
- Events shall be idempotent and retry-safe.


### 7.6 API Standards

#### 7.6.1 API-7.1 API Design Principles

- APIs shall be versioned.
- RESTful conventions shall be followed.
- Requests and responses shall use JSON.
- Error responses shall use standardized error codes.

#### 7.6.2 API-7.2 Idempotency

- Idempotency keys shall be required for:
    - Order placement
    - Payment initiation
    - Refund requests
- Duplicate requests shall not create duplicate side effects.

#### 7.6.3 API-7.3 Rate Limiting

- Rate limits shall be applied per:
    - IP address
    - User account
    - Device identifier
- Rate limit violations shall return user-safe errors.

### 7.7 Authentication

#### 7.7.1 AUTH-7.1 Customer Authentication

- Customers shall authenticate via phone number and OTP.
- OTPs shall be time-bound and single-use.
- OTP attempts shall be rate-limited.


#### 7.7.2 AUTH-7.2 Seller Authentication

- Sellers and staff shall authenticate using:
    - Phone number and OTP
    - Role-based session creation
- Staff access shall be scoped to store permissions.

#### 7.7.3 AUTH-7.3 Admin Authentication

- Admins shall authenticate using strong credentials.
- Secondary authentication shall be required.
- Admin sessions shall have shorter lifetimes.

### 7.8 Session Management

#### 7.8.1 SM-7.1 Session Lifecycle

- Sessions shall be issued upon successful authentication.
- Sessions shall expire after inactivity.
- Users may revoke all active sessions.

#### 7.8.2 SM-7.2 Device Binding

- Sessions shall be associated with a device identifier.
- Unrecognized devices may require re-authentication.

### 7.9 Authorization

#### 7.9.1 AUTHZ-7.1 Role-Based Access Control (RBAC)

- Each user shall have one or more roles.
- Roles define allowed actions.
- Default-deny policy shall apply.


#### 7.9.2 AUTHZ-7.2 Attribute-Based Access Control (ABAC)

- Access decisions may consider:
    - Tenant ID
    - Resource ownership
    - Request context
- ABAC shall complement RBAC.

#### 7.9.3 AUTHZ-7.3 Permission Enforcement

- Permissions shall be enforced at API level.
- Frontend checks shall be considered advisory only.

### 7.10 Security Controls

#### 7.10.1 SEC-7.1 Data Isolation

- Tenant data shall be isolated by tenant ID.
- Cross-tenant access attempts shall be blocked and logged.

#### 7.10.2 SEC-7.2 Secrets Management

- Secrets shall be stored in secure vaults.
- Secrets shall never be logged or exposed.

#### 7.10.3 SEC-7.3 Audit Logging

- Authentication and authorization events shall be logged.
- Failed access attempts shall trigger alerts.

### 7.11 Non-Functional Requirements

#### 7.11.1 Performance

- Authentication response time shall be under 500ms (P95).
- Authorization checks shall add no more than 10ms overhead.

#### 7.11.2 Scalability

- Backend services shall scale horizontally.


#### 7.11.3 Reliability

- Auth failures shall fail closed.
- Session services shall be highly available.

### 7.12 Failure Scenarios

- Token expiry during request→request rejected with re-auth prompt.
- Permission mismatch→access denied and logged.
- Service-to-service auth failure→request aborted.

### 7.13 Acceptance Criteria

- Unauthorized access is always blocked.
- Users only see data they are permitted to see.
- Session revocation works across devices.

### 7.14 Dependencies

- Identity service
- Secure secrets storage
- API gateway

### 7.15 Risks and Mitigations

- Risk: Privilege escalation Mitigation: Default-deny RBAC and ABAC checks.
- Risk: Session hijacking Mitigation: Device binding and short-lived tokens.

## 8 PHASE 8 — Payments, Escrow, Settlements and Refunds

### 8.1 Phase Objective

The objective of Phase 8 is to define secure, transparent, and auditable financial flows
for the platform. This phase governs how customers pay, how funds are held in escrow,
how sellers are settled, how delivery fees are reconciled, and how refunds are executed.
Phase 8 is critical for trust, cash-flow stability, legal safety, and financial reconciliation.


### 8.2 Actors Involved

- Customer
- Seller (Store Owner)
- Delivery Partner
- Super Admin (Finance / Compliance)
- External Payment Providers
- System (Payment and Ledger Services)

### 8.3 In-Scope Components

- Payment method handling
- Cash on Delivery (COD) workflows
- Digital payment workflows
- Escrow management
- Settlement calculation and execution
- Refund and partial refund handling
- Financial ledger and reconciliation

### 8.4 Out-of-Scope Components

- Accounting software integration
- Tax filing and statutory reporting
- Credit and lending products

### 8.5 Payment Methods

#### 8.5.1 PM-8.1 Cash on Delivery (COD)

- COD shall be the default payment method.
- COD availability may be restricted based on:
    - Order value
    - Store policy


- Customer risk score
- COD amount due shall be fixed at order confirmation.

#### 8.5.2 PM-8.2 Digital Payments

- Digital payment options may include:
    - Wallets
    - Bank transfers
    - UPI-like instruments (where available)
- Payment initiation shall create a Payment Intent.
- Payment confirmation shall be verified via webhook or callback.

#### 8.5.3 PM-8.3 Hybrid Payments

- The system may support partial digital + partial COD payments.
- Hybrid payments shall clearly show remaining COD amount.

### 8.6 Escrow Management

#### 8.6.1 ESC-8.1 Escrow Principles

- Customer payments shall be held in escrow until order completion.
- Funds in escrow shall not be considered seller revenue.
- Escrow release shall be event-driven.

#### 8.6.2 ESC-8.2 Escrow Release Conditions

- Escrow shall be released only when:
    - Order status isDELIVERED
    - Dispute window has passed (if applicable)
- Partial releases may occur for partial deliveries.

#### 8.6.3 ESC-8.3 Escrow Failure Handling

- Escrow release failures shall be retried automatically.
- Failed releases shall be flagged for admin intervention.


### 8.7 Settlement Engine

#### 8.7.1 SET-8.1 Settlement Calculation

The system shall calculate settlements per seller.

- Settlement amount shall consider:
    - Gross order value
    - Platform commission
    - Delivery fees
    - Refund adjustments
    - Penalties (if any)
- Calculations shall be deterministic and reproducible.

#### 8.7.2 SET-8.2 Settlement Cycles

- Settlement cycles may be:
    - Daily
    - Weekly
- Minimum payout thresholds may apply.
- Settlement schedules shall be configurable.

#### 8.7.3 SET-8.3 Settlement Execution

- Settlements shall be executed via:
    - Bank transfer
    - Wallet credit
- Settlement execution shall be logged and auditable.

### 8.8 Refund Management

#### 8.8.1 REF-8.1 Refund Triggers

- Refunds may be triggered by:
    - Order cancellation
    - Failed delivery
    - Admin dispute resolution


#### 8.8.2 REF-8.2 Refund Types

- Full refund
- Partial refund (missing/damaged items)
- Store credit (policy-based)

#### 8.8.3 REF-8.3 Refund Execution

- Digital payment refunds shall return to original source where possible.
- COD refunds may be issued via:
    - Wallet transfer
    - Bank transfer
    - Store credit
- Refund timelines shall be communicated to customers.

### 8.9 Financial Ledger

#### 8.9.1 LED-8.1 Ledger Principles

- Every financial event shall create ledger entries.
- Ledger entries shall be immutable.
- Ledger shall support double-entry accounting concepts.

#### 8.9.2 LED-8.2 Ledger Events

- Events shall include:
    - Payment received
    - Escrow hold
    - Escrow release
    - Settlement payout
    - Refund issued

#### 8.9.3 LED-8.3 Reconciliation

- Automated reconciliation jobs shall run periodically.
- Mismatches shall generate alerts and investigation tickets.


### 8.10 Non-Functional Requirements

#### 8.10.1 Security

- Payment data shall never be logged.
- All financial APIs shall require strong authentication.

#### 8.10.2 Accuracy

- Settlement calculations shall be accurate to the smallest currency unit.

#### 8.10.3 Reliability

- Financial operations shall be idempotent.

### 8.11 Failure Scenarios

- Payment gateway timeout→payment marked pending.
- Settlement failure→retry and admin alert.
- Refund failure→escalation to finance admin.

### 8.12 Acceptance Criteria

- COD and digital payments are recorded correctly.
- Escrow releases only after valid conditions.
- Sellers receive accurate settlements.
- Ledger entries exist for every financial action.

### 8.13 Dependencies

- Payment gateway integrations
- Ledger service
- Order and delivery services

### 8.14 Risks and Mitigations

- Risk: Settlement disputes Mitigation: Transparent ledger and audit trails.
- Risk: COD fraud Mitigation: POD enforcement and reconciliation checks.


## 9 PHASE 9 — Data Privacy, Retention and Com-

## pliance

### 9.1 Phase Objective

The objective of Phase 9 is to define how the platform collects, stores, processes, retains,
and deletes data in a privacy-first and compliant manner. This phase ensures that cus-
tomer, seller, delivery partner, and admin data is handled responsibly, transparently, and
securely, while supporting legal, operational, and audit requirements.
Phase 9 is essential for user trust, regulatory readiness, and long-term platform cred-
ibility.

### 9.2 Actors Involved

- Customer
- Seller (Owner and Staff)
- Delivery Partner
- Super Admin (Compliance / Legal)
- System (Data and Security Services)

### 9.3 In-Scope Components

- Data classification and ownership
- User consent and purpose limitation
- Data storage and access controls
- Data retention and deletion policies
- User data rights (access, export, deletion)
- Audit and compliance reporting

### 9.4 Out-of-Scope Components

- External regulatory filings
- Government data-sharing integrations
- Advanced anonymized data monetization


### 9.5 Data Classification

#### 9.5.1 DC-9.1 Data Categories

The system shall classify all data into defined categories.

- Personally Identifiable Information (PII):
    - Name
    - Phone number
    - Address
    - Identity documents (if collected)
- Financial Data:
    - Order payments
    - Settlements
    - Refund records
- Operational Data:
    - Orders
    - Delivery logs
    - Inventory changes
- Behavioral Data:
    - Search queries
    - Browsing history
    - App usage events

#### 9.5.2 DC-9.2 Data Ownership

- Customers own their personal data.
- Sellers own their store operational data.
- The platform owns derived analytics and aggregates.


### 9.6 Consent and Purpose Limitation

#### 9.6.1 CP-9.1 User Consent

- Users shall be informed of data collection purposes.
- Explicit consent shall be required where legally mandated.
- Consent records shall be stored with timestamp and version.

#### 9.6.2 CP-9.2 Purpose Limitation

- Data shall only be used for the purpose it was collected.
- Reuse of data for new purposes shall require renewed consent.

### 9.7 Data Storage and Access Control

#### 9.7.1 DS-9.1 Secure Storage

- Sensitive data shall be encrypted at rest.
- Encryption keys shall be managed securely.
- Backups shall be encrypted and access-controlled.

#### 9.7.2 DS-9.2 Access Control

- Access to data shall follow least-privilege principles.
- Admin access to PII shall be logged and reviewable.
- Automated services shall use scoped service identities.

### 9.8 Data Retention Policy

#### 9.8.1 DR-9.1 Retention Durations

The system shall enforce configurable data retention periods.

- Session and access logs: 90 days (default).
- Order and invoice records: minimum 5 years.
- Payment and settlement records: minimum 5 years.
- Chat and support logs: configurable (e.g., 6–12 months).
- KYC documents: retained while seller is active plus defined grace period.


#### 9.8.2 DR-9.2 Retention Enforcement

- Retention rules shall be enforced automatically.
- Expired data shall be securely deleted or anonymized.

### 9.9 Data Deletion and Anonymization

#### 9.9.1 DD-9.1 User-Initiated Deletion

- Users may request account deletion.
- Deletion requests shall be verified for authenticity.
- Data required for legal compliance shall be retained but anonymized.

#### 9.9.2 DD-9.2 Anonymization

- Personally identifiable fields shall be irreversibly anonymized.
- Anonymized data may be retained for analytics.

### 9.10 User Data Rights

#### 9.10.1 UR-9.1 Right to Access

- Users may request a copy of their personal data.
- Data exports shall be provided in a machine-readable format.

#### 9.10.2 UR-9.2 Right to Correction

- Users may update inaccurate personal data.

#### 9.10.3 UR-9.3 Right to Erasure

- Users may request deletion subject to legal constraints.

### 9.11 Audit and Compliance Reporting

#### 9.11.1 AC-9.1 Audit Logs

- All access to sensitive data shall be logged.
- Logs shall include actor, timestamp, and purpose.


#### 9.11.2 AC-9.2 Compliance Reports

- Admins shall be able to generate compliance reports.
- Reports shall include data access summaries and deletion activity.

### 9.12 Non-Functional Requirements

#### 9.12.1 Security

- Data breaches shall trigger immediate alerts.
- Incident response procedures shall be documented.

#### 9.12.2 Transparency

- Privacy policies shall be clearly accessible to users.

### 9.13 Failure Scenarios

- Retention job failure→retry and alert.
- Unauthorized data access attempt→access blocked and logged.
- Data export failure→user notified and retry scheduled.

### 9.14 Acceptance Criteria

- Data is retained and deleted according to policy.
- Users can request and receive data exports.
- Sensitive data access is always logged.

### 9.15 Dependencies

- Identity and RBAC services
- Secure storage and backup systems
- Audit logging infrastructure

### 9.16 Risks and Mitigations

- Risk: Data over-retention Mitigation: Automated retention enforcement.
- Risk: Unauthorized PII access Mitigation: Strong RBAC and audit monitoring.


## 10 PHASE 10 — Legal Safety, Terms, Liability and Enforcement

### 10.1 Phase Objective

The objective of Phase 10 is to define the legal boundaries, liability separation, contractual
obligations, and enforcement mechanisms that govern the GoPasal platform. This phase
ensures that the platform operates as a technology intermediary rather than a seller,
while providing clear rules for all participants.
Phase 10 is critical for risk mitigation, dispute defensibility, and long-term operational
sustainability.

### 10.2 Actors Involved

- Customer
- Seller (Store Owner)
- Delivery Partner
- Platform Operator (Legal Entity)
- Super Admin (Legal / Compliance)

### 10.3 In-Scope Components

- Terms of Service (ToS)
- Seller Agreement
- Delivery Partner Agreement
- Liability allocation
- Content and conduct enforcement
- Legal compliance mechanisms

### 10.4 Out-of-Scope Components

- Jurisdiction-specific legal drafting
- Court representation
- Insurance procurement


### 10.5 Platform Role Definition

#### 10.5.1 LR-10.1 Marketplace Intermediary Status

- The platform shall operate as a marketplace intermediary.
- The platform shall not be the seller of goods.
- Sellers are solely responsible for product quality and legality.

#### 10.5.2 LR-10.2 Agency Disclaimer

- Delivery partners are not agents of the platform.
- Sellers are not employees of the platform.
- No partnership or joint venture is implied.

### 10.6 Customer Terms of Service

#### 10.6.1 CT-10.1 Customer Obligations

- Customers shall provide accurate information.
- Customers shall be responsible for availability at delivery.
- Abuse of COD or refund systems is prohibited.

#### 10.6.2 CT-10.2 Customer Limitations

- Platform availability is not guaranteed at all times.
- Estimated delivery times are not guarantees.

#### 10.6.3 CT-10.3 Customer Liability Limits

- Platform liability shall be limited to the order value.
- Indirect or consequential damages are excluded.

### 10.7 Seller Agreement

#### 10.7.1 SA-10.1 Seller Responsibilities

- Sellers must comply with all applicable laws.
- Sellers are responsible for:


- Product authenticity
- Pricing accuracy
- Timely fulfillment

#### 10.7.2 SA-10.2 Prohibited Seller Activities

- Sale of illegal or restricted goods.
- Misrepresentation of products.
- Circumventing platform fees.

#### 10.7.3 SA-10.3 Seller Liability

- Sellers bear liability for defective or illegal goods.
- Sellers indemnify the platform against claims.

### 10.8 Delivery Partner Agreement

#### 10.8.1 DP-10.1 Delivery Partner Responsibilities

- Safe and lawful delivery of orders.
- Accurate COD collection.
- Respectful customer conduct.

#### 10.8.2 DP-10.2 Delivery Partner Limitations

- Delivery partners shall not open or alter packages.
- Delivery partners shall not collect amounts beyond COD due.

#### 10.8.3 DP-10.3 Delivery Liability

- Liability is limited to delivery service scope.
- Platform may recover losses from proven misconduct.


### 10.9 Content and Conduct Enforcement

#### 10.9.1 EN-10.1 User Conduct Rules

- Harassment or abuse is prohibited.
- Fraudulent activity is prohibited.
- Manipulation of ratings or reviews is prohibited.

#### 10.9.2 EN-10.2 Enforcement Actions

- Warning notices
- Temporary suspension
- Permanent termination

#### 10.9.3 EN-10.3 Enforcement Due Process

- Enforcement actions shall be logged.
- Affected users may appeal decisions.

### 10.10Disclaimers and Risk Allocation

#### 10.10.1 DR-10.1 Platform Availability Disclaimer

- Services are provided on an “as-is” basis.
- No guarantee of uninterrupted service.

#### 10.10.2 DR-10.2 Third-Party Disclaimer

- Platform is not responsible for third-party services.

### 10.11Jurisdiction and Governing Law

#### 10.11.1 JL-10.1 Governing Law

- Governing law shall be defined by the platform’s registered jurisdiction.

#### 10.11.2 JL-10.2 Dispute Resolution

- Disputes shall first attempt internal resolution.
- Arbitration or courts may be used as final recourse.


### 10.12Non-Functional Requirements

#### 10.12.1 Compliance

- Legal documents shall be versioned.
- Users shall be notified of material changes.

#### 10.12.2 Transparency

- Terms and policies shall be accessible in-app.

### 10.13Failure Scenarios

- Conflicting terms→latest version applies.
- Enforcement error→appeal workflow triggered.

### 10.14Acceptance Criteria

- Platform liability boundaries are clearly defined.
- All participants accept applicable agreements.
- Enforcement actions follow documented process.

### 10.15Dependencies

- Policy management system
- Dispute resolution workflows
- Audit logging infrastructure

### 10.16Risks and Mitigations

- Risk: Legal ambiguity Mitigation: Clear role definitions and disclaimers.
- Risk: Enforcement disputes Mitigation: Documented due process and evidence.


## 11 PHASE 11 – Growth, Monetization, and Advanced Intelligence

### 11.1 11.1 Phase Objective

The objective of Phase 11 is to transition the platform from a functional transactional
system to a revenue-generating, intelligent ecosystem. This phase introduces ”Growth
Loops” (Referrals, Coupons), ”Monetization Engines” (Ad Tech, Sponsored Listings),
and ”Operational Intelligence” (Predictive AI, Batching).
Additionally, it mandates deep integrations with external Point-of-Sale (POS) systems
and strictly enforces local tax compliance (VAT), ensuring the platform is ready for
dominant market leadership.

### 11.2 11.2 Actors Involved

- Marketing Manager (Seller side): Creates promotions, coupons, and bids for
    ad slots.
- Delivery Partner:Receives batched orders and AI-driven positioning alerts.
- Customer:Interactions with loyalty systems and sponsored content.
- System (Intelligence Engine):Runs predictive models for demand and logistics.
- External POS System: Third-party billing software used by sellers (e.g., IMS,
    Bacteria).

### 11.3 11.3 In-Scope Components

- Growth:Seller coupons, Referral system, Loyalty points.
- Logistics:Order Batching, Rider Wallet Limits, Predictive Rider Positioning.
- Monetization: Sponsored Search Results, Banner Ad Management, Bidding En-
    gine.
- Integration: Two-way POS Integration (Menu Sync + Order Push).
- Compliance: Automated VAT Billing.
- Experience:In-App Chat, SEO Public Pages.


### 11.4 11.4 Functional Requirements

#### 11.4.1 11.4.1 FR-11.1 Marketing and Coupons

The system shall allow sellers to run autonomous marketing campaigns.

- Sellers shall define coupons (Fixed/Percentage) with caps and validity dates.
- Referral System: Users generate invite codes; rewards unlock only after the
    referee’s first completed order.
- Loyalty Points:Customers earn redeemable points per currency unit spent.

#### 11.4.2 11.4.2 FR-11.2 Monetization and Ad Tech

The system shall enable a secondary revenue stream via internal advertising.

- Sponsored Listings: Sellers shall be able to ”bid” to boost their products to the
    top of search results for specific keywords (e.g., ”Momo”).
- Banner Management: Admins can sell ”Hero Banner” slots on the homepage to
    brands.
- Budget Caps: Sellers set a ”Daily Max Spend” for ads; the system stops showing
    ads once the budget is exhausted.
- Ad Labeling: All sponsored content must be clearly labeled as ”Sponsored” or
    ”Ad” for transparency.

#### 11.4.3 11.4.3 FR-11.3 Intelligent Logistics (Batching & AI)

The system shall use logic and prediction to optimize delivery costs.

- Order Batching: The engine shall group multiple orders from the same cluster
    into a single ”Trip Task” for one rider.
- Predictive Positioning: The system shall analyze historical order heatmaps to
    push notifications to riders: ”High demand expected in Thamel in 15 mins. Go
    there now.”
- Rider Wallet: Riders with ”Cash in Hand” ¿ Limit are automatically blocked
    from new COD tasks until deposit.


#### 11.4.4 11.4.4 FR-11.4 Point-of-Sale (POS) Integration

The system shall bridge the gap between Online and Offline operations.

- Menu Sync: The system shall pull product prices and ”Out of Stock” status
    directly from the Seller’s existing POS software via API.
- Order Push:Online orders shall be injected directly into the Seller’s POS Kitchen
    Display System (KDS), eliminating manual re-entry.
- Conflict Handling: If a POS item is deleted, the platform shall auto-hide the
    product to prevent failed orders.

#### 11.4.5 11.4.5 FR-11.5 Communication and Privacy

- Masked Chat:In-app chat connects Rider and Customer without revealing phone
    numbers. Chat history is archived for disputes.
- SEO Pages: Every store gets a public, Google-indexable web page (Schema.org
    compliant) to drive organic traffic.

#### 11.4.6 11.4.6 FR-11.6 Regulatory Compliance (VAT)

- The system shall auto-generate VAT-compliant invoices for every sale.
- Invoices shall split ”Goods Total” (Seller VAT) and ”Service Fee” (Platform VAT)
    to ensure legal clarity.

### 11.5 11.5 Non-Functional Requirements

- Latency (Ads): Ad bidding logic must resolve in ¡50ms to not slow down search
    results.
- Data Freshness (POS):Inventory updates from POS must reflect on the app
    within 60 seconds.
- Accuracy (AI):Predictive models must be retrained weekly on the latest order
    data.

### 11.6 11.6 Acceptance Criteria

- A Seller can set a Rs. 500 daily budget for ”Burger” keywords, and their ad stops
    showing after the limit is hit.


- A price change in the local POS software automatically updates the GoPasal app
    price.
- Riders receive ”Demand Alerts” based on historical data patterns.
- Two orders from different customers in the same building are assigned to one rider.

### 11.7 11.7 Risks and Mitigations

- Risk: POS API downtime causing menu sync failures. Mitigation: Fallback to
    ”Last Known State” and alert the seller to manually verify.
- Risk: Ad spam making the app unusable. Mitigation: Limit ”Sponsored Slots”
    to max 2 per scroll screen.


## 12 PHASE 12 – The ”Modern Experience” Layer (CX & Retention)

### 12.1 12.1 Phase Objective

The objective of Phase 12 is to modernize the user interface and interaction patterns
to match 2026 industry standards. While previous phases built the ”Engine” (Back-
end/Ops), Phase 12 builds the ”Experience.”
This phase introduces AI-native interactions (Voice, Semantic Search), hyper-retention
loops (Subscriptions, Smart Reorder), and social commerce features (Group Ordering,
Video Stories) to maximize Lifetime Value (LTV).

### 12.2 12.2 Actors Involved

- Customer:Uses voice, biometrics, and social features.
- AI Agent (System): Handles support and search context.
- Seller: Uploads video content for products.

### 12.3 12.3 In-Scope Components

- Search Upgrade: Semantic & Voice Search (NLP).
- Support Upgrade: L1 AI Customer Support Agent.
- Auth Upgrade:Biometric (FaceID/Fingerprint) & Social Login.
- Content Upgrade:Product ”Video Stories” (Reels-style).
- Retention:”GoPasal Gold” Subscription Model.
- Social: Group Ordering (Multi-user Cart).
- Speed:”Smart Reorder” Widget.

### 12.4 12.4 Functional Requirements

#### 12.4.1 12.4.1 FR-12.1 Semantic and Voice Search

The system shall move beyond simple keyword matching.

- Voice Input:Users shall be able to tap a microphone and say, ”I need ingredients
    for Chatamari.”


- Contextual Understanding:The search engine shall map abstract queries (e.g.,
    ”Spicy food for cold weather”) to specific categories (e.g., Thukpa, Ramen) using
    vector embeddings.
- Multilingual Voice: The system shall support mixed Nepali/English voice com-
    mands (e.g., ”Ek plate Momo pathau”).

#### 12.4.2 12.4.2 FR-12.2 GoPasal Gold (Subscription)

The system shall implement a paid membership tier.

- Users shall be able to purchase a monthly or yearly ”Gold” subscription.
- Benefits:
    - Free Delivery on all orders above a threshold (e.g., Rs. 500).
    - Priority Delivery (orders flagged for top-rated riders).
    - Exclusive ”Gold-only” coupons.
- The system shall auto-renew subscriptions via tokenized payment methods.

#### 12.4.3 12.4.3 FR-12.3 Group Ordering

The system shall allow social cart management.

- Host Flow: A user creates a ”Group Order” and shares a unique link/QR code.
- Guest Flow: Guests join the cart via link, add their own items, and tag them
    with their name.
- Checkout:The Host pays the total bill, or the system allows ”Split Pay” (future
    enhancement).
- Locking:The Host can ”Lock” the cart to prevent further additions before check-
    out.

#### 12.4.4 12.4.4 FR-12.4 Video Stories

The system shall support rich media for higher conversion.

- Sellers shall be able to upload 15-second video clips for products (e.g., steaming
    food, product demos).
- Videos shall autoplay (muted) on the Product Details Page.
- Video content shall be compressed and cached via CDN for low-bandwidth perfor-
    mance.


#### 12.4.5 12.4.5 FR-12.5 AI Support Agent

The system shall automate Level 1 customer support.

- An AI Chatbot shall intercept all support queries.
- Capabilities:
    - ”Where is my order?”→Bot checks GPS and replies with ETA.
    - ”Item missing”→Bot validates against Packing List and auto-issues wallet
       credit (up to a safe limit, e.g., Rs. 200).
- Complex queries shall be seamlessly handed over to a human agent.

#### 12.4.6 12.4.6 FR-12.6 Smart Reorder

The system shall minimize time-to-order.

- The Homepage shall feature a ”Buy It Again” widget.
- The widget shall predict the user’s likely order based on time of day (e.g., showing
    Coffee in the morning, Pizza on Friday night).
- Reordering shall be achievable in 2 taps (Tap Item→Swipe to Pay).

#### 12.4.7 12.4.7 FR-12.7 Modern Authentication

The system shall reduce login friction.

- Social Login:Support for ”Continue with Google/Apple/Facebook”.
- Biometrics: Enable FaceID or Fingerprint login for returning users (replacing
    OTP).
- Silent Auth: If the SIM card matches the registered number (via carrier APIs),
    the user is auto-verified without manual OTP entry.

### 12.5 12.5 Non-Functional Requirements

- Video Performance: Videos must load instantly; if network is slow (¡3G), the
    system must fallback to the static image.
- AI Latency:Voice search results must render within 1.5 seconds.
- Subscription Logic: Free delivery logic must apply in ¡100ms at checkout to
    prevent cart abandonment.


## 12.6 12.6 Acceptance Criteria

- A user can invite 3 friends to a Group Order, and all items appear in one final cart.
- A ”Gold” user is not charged a delivery fee for an order of Rs. 600.
- Searching ”Lunch for sick person” returns soup/khichdi results.
- A user can log in using FaceID without receiving an SMS.

## 12.7 12.7 Risks and Mitigations

- Risk:AI Agent hallucinating (promising refunds it shouldn’t).Mitigation:Hard-
    coded rules for financial decisions; AI only handles ”chitchat” and data retrieval.
- Risk: Heavy video content slowing down the app. Mitigation: Strict 2MB size
    limit per video and aggressive caching.


## 13 PHASE 13 – Enterprise Scale, Gamification, and

## High-Velocity Resilience

## 13.1 13.1 Phase Objective

The objective of Phase 13 is to prepare the platform for ”Hyper-Scale.” This phase
moves beyond individual store management to support **Multi-Location Enterprises**
(Franchises) and introduces **Gamification** to reduce rider/seller churn.
Critically, it implements **”Flash Sale” Architecture** to prevent system crashes
during high-traffic marketing events.

## 13.2 13.2 Actors Involved

- Enterprise Manager (HQ):Manages multiple store branches from one dash-
    board.
- Delivery Partner:Competes for ”Tiers” and badges.
- System (Traffic Control):Manages virtual queues during traffic spikes.

## 13.3 13.3 In-Scope Components

- Enterprise Portal:Multi-Branch / Franchise Management.
- Gamification Engine:Rider Tiers (Bronze/Silver/Gold) & Leaderboards.
- Event Resilience: Virtual Waiting Rooms & High-Concurrency Inventory Lock-
    ing.
- Sustainability: Green Delivery (EV) Priority Routing.

## 13.4 13.4 Functional Requirements

### 13.4.1 13.4.1 FR-13.1 Enterprise ”Master Merchant” Management

The system shall support chain stores and franchises.

- Hierarchy: A ”Master Account” shall be able to own and controlN number of
    ”Branch Accounts.”
- Centralized Menu: The Master Account can push a menu update (e.g., ”New
    Summer Drink”) to all 50 branches instantly.
- Unified Reporting: The Master Dashboard shall show consolidated revenue
    across all branches (”Total Sales vs. Branch A Sales”).


- Zone Pricing: The Master Account can set different prices for the same item
    based on the branch’s city/zone.

### 13.4.2 13.4.2 FR-13.2 Gamification & Tiered Rewards

The system shall use psychology to increase retention.

- Rider Tiers: Riders shall be placed in Tiers (Bronze, Silver, Gold, Diamond)
    based on:
       - Monthly completed orders.
       - Acceptance Rate & Cancellation Rate.
       - Customer Ratings.
- Tier Benefits:
    - Silver:Priority Support access.
    - Gold:Early access to ”Pre-booking” shifts.
    - Diamond:Daily ”Instant Payout” (skipping the weekly cycle).
- Seller Badges: Sellers shall earn badges (”Fastest Packer,” ”Top Rated”) dis-
    played on their store card to boost conversion.

### 13.4.3 13.4.3 FR-13.3 High-Concurrency ”Flash Sale” Mode

The system shall survive massive traffic spikes (e.g., ”Rs. 1 Deal”).

- Virtual Waiting Room: If traffic exceedsXrequests/second, the system shall
    queue users in a ”Waiting Room” screen rather than crashing.
- Inventory Sharding: For ”Hot Items,” inventory counts shall be sharded across
    multiple Redis instances to prevent database write-locks.
- Bot Protection: During flash sales, Rate Limiting shall tighten to aggressively
    block non-human traffic patterns.

### 13.4.4 13.4.4 FR-13.4 Sustainability & EV Logic

The system shall promote green logistics.

- EV Tagging: Riders using Electric Vehicles (EVs) shall be tagged in the system.
- Green Routing: The dispatch algorithm shall prioritize assigning ”Long Dis-
    tance” orders to EVs (lower operating cost) over petrol bikes.
- Customer Choice:Customers can opt for ”Green Delivery” (wait slightly longer
    for an EV rider).


## 13.5 13.5 Non-Functional Requirements

- Bulk Updates:Pushing a menu change to 100 branches must complete within 30
    seconds.
- Concurrency:The Flash Sale module must handle 10,000 orders per second with-
    out data corruption.

## 13.6 13.6 Acceptance Criteria

- A KFC HQ user can update the price of a ”Bucket” for all Kathmandu branches
    but keep Pokhara branches unchanged.
- A Rider with ”Gold” status sees a ”Withdraw Now” button in their wallet.
- The system automatically queues users when traffic hits 90% of server capacity.

## 13.7 13.7 Risks and Mitigations

- Risk:Flash Sale inventory over-selling.Mitigation:Use atomic decrement oper-
    ations on Redis with a strict ”hard stop” buffer.
- Risk:Gamification leading to unsafe driving. Mitigation:”Speeding” or ”Harsh
    Braking” detected via GPS disqualifies riders from Gold Tier.



