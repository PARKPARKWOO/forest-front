# Forest Isolated Real-API E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fail-closed, disposable full-stack E2E gate that proves the approved Forest administrator UI can create, read, update, and delete programs, activity posts, and notices against the real Forest controllers and temporary databases without any path to production or shared development data.

**Architecture:** A Kotlin `realApiE2e` runner in a Gradle `integrationTest` source set owns three pinned Testcontainers, an in-process Spring context on a random loopback port, and one Node child process. The Node process owns a loopback gateway shim, a programmatic Vite server, and Playwright Chromium. A run manifest, backend startup validator, test-only readiness endpoint, and per-write readiness check must all agree on `runId`, infrastructure fingerprint, container identity, resolved endpoints, and the `e2e` profile before any mutating request is forwarded.

**Tech Stack:** Kotlin 1.9.25, Java 21, Spring Boot 3.4.4, Gradle 8.13, JUnit 5, Testcontainers, MySQL 8.0.41, MongoDB 7.0.17, Redis 7.4.9, Node 20+, Vite 6, Playwright Chromium.

## Global Constraints

- Execute this plan only after the public and administrator mock-UI gates pass.
- Run frontend `npm`, `node`, and frontend `git` commands with tool working directory `/Users/park/Desktop/project/cms-react-project`; run `./gradlew`, Docker ownership checks, and backend `git` commands with tool working directory `/Users/park/Desktop/project/forest`. Before Task 1 record `git status --short`, `git branch --show-current`, and `git rev-parse HEAD` in both repositories as `REAL_API_CMS_BASE_SHA` and `REAL_API_FOREST_BASE_SHA`; stop on overlapping unrelated changes.
- Do not allow implicit package, browser, container-image, Gradle dependency, or private-package downloads. Verify local prerequisites first; if an exact artifact is absent, stop and request approval before the explicit download/pull or any credential use.
- Put every readiness endpoint, fake external service, actor registry, container registry, and write capability in `forest/src/integrationTest`; none may enter `src/main`, `bootJar`, or a production profile.
- Never use `application-local.yml`, an installed local database, Docker Compose shared by another project, or a production/staging/dev URL.
- Allow only explicit `http:` URLs with a port and hostname exactly `localhost`, `127.0.0.1`, or `::1`; reject `0.0.0.0`, LAN addresses, Docker DNS names, suffix lookalikes, credentials in URLs, HTTPS production hosts, and missing ports.
- The Kotlin runner must compare resolved Spring datasource, Mongo, and Redis endpoints with the live Testcontainers it owns. An environment variable alone is never proof of ownership.
- MySQL and Mongo database names must contain the current filesystem-safe `runId`; credentials and actor/write tokens must not appear in the manifest, console, screenshots, or committed fixtures.
- Disable Eureka, Kafka producers/listeners, schedulers, APM/Pyroscope, Loki, and real auth/storage clients in the integration-test application. Redis remains real and disposable because the application creates Redis beans.
- The loopback gateway strips browser-supplied `Authorization` and `X-User-Passport`, injects only runner-issued actor data, and revalidates readiness before every `POST`, `PUT`, `PATCH`, or `DELETE`.
- The first real-API gate covers program, activity-post, and notice CRUD. File upload, OAuth/Gateway SSO, Eureka discovery, real CDN/storage, mail, and production deployment remain explicitly unverified.
- Do not modify `gradle.properties`, push, create a PR, deploy, or use an actual credential while implementing this plan.

---

## Cross-repository File Structure

### Backend: create

- `forest/src/integrationTest/resources/application-e2e.yml`
- `forest/src/integrationTest/resources/logback-test.xml`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/manifest/E2eRunManifest.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/manifest/AtomicManifestStore.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runtime/E2eRuntimeRegistry.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runtime/E2eActorRegistry.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/ResolvedEndpointParser.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/E2eOwnedEnvironmentInitializer.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/E2eStartupValidator.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/readiness/E2eVerificationState.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/readiness/E2eReadinessController.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/config/E2eForestApplication.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/config/E2eOnlyConfiguration.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/config/E2eSourceSetMarker.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runner/ForestRealApiE2eRunner.kt`
- `forest/src/integrationTest/kotlin/org/woo/forest/e2e/verify/DatabasePostconditions.kt`
- matching JUnit tests under the same packages.

### Backend: modify

- `forest/build.gradle.kts` — isolated source set, dependencies, `integrationTest`, `realApiE2e`, and production-artifact boundary task.
- `forest/src/main/kotlin/org/woo/forest/business/post/PostService.kt` — skip an external storage deletion call when a deleted post has no images.
- `forest/src/test/kotlin/org/woo/forest/business/post/PostServiceTest.kt` — owning regression for empty/nonempty image deletion.

### Frontend: create

- `cms-react-project/e2e/real-api/playwright.config.js`
- `cms-react-project/e2e/real-api/run-real-api-e2e.mjs`
- `cms-react-project/e2e/real-api/global-setup.mjs`
- `cms-react-project/e2e/real-api/runtime/loopback-guard.mjs`
- `cms-react-project/e2e/real-api/runtime/loopback-guard.test.mjs`
- `cms-react-project/e2e/real-api/runtime/run-manifest.mjs`
- `cms-react-project/e2e/real-api/runtime/run-manifest.test.mjs`
- `cms-react-project/e2e/real-api/runtime/gateway-shim.mjs`
- `cms-react-project/e2e/real-api/runtime/vite-server.mjs`
- `cms-react-project/e2e/real-api/fixtures/actors.mjs`
- `cms-react-project/e2e/real-api/fixtures/real-api-test.mjs`
- `cms-react-project/e2e/real-api/specs/safety.spec.js`
- `cms-react-project/e2e/real-api/specs/contract.spec.js`
- `cms-react-project/e2e/real-api/specs/program-crud.spec.js`
- `cms-react-project/e2e/real-api/specs/post-crud.spec.js`
- `cms-react-project/e2e/real-api/specs/notice-crud.spec.js`

### Frontend: modify

- `cms-react-project/package.json`, `package-lock.json` — reuse approved Playwright and add real-API scripts.
- `cms-react-project/src/axiosInstance.js` — environment-overridable API base from the public plan.
- `cms-react-project/vite.config.js` — loopback-only proxy target in `e2e-real` mode.
- `cms-react-project/eslint.config.js` — Node/Playwright globals for the new tree.
- `cms-react-project/.gitignore` — generated reports and local run artifacts only.

---

### Task 1: Lock the frontend write guard before adding a real runner

**Files:**
- Modify: `cms-react-project/package.json`
- Create: `cms-react-project/e2e/real-api/runtime/loopback-guard.mjs`
- Create: `cms-react-project/e2e/real-api/runtime/loopback-guard.test.mjs`
- Create: `cms-react-project/e2e/real-api/runtime/run-manifest.mjs`
- Create: `cms-react-project/e2e/real-api/runtime/run-manifest.test.mjs`

**Interfaces:**
- `assertLoopbackHttpUrl(rawUrl, label) -> Promise<URL>`
- `readReadyManifest({ manifestPath, expectedRunId, expectedFingerprint, expectedBackendUrl }) -> Promise<E2eRunManifest>`
- `assertReadinessMatches({ readiness, manifest }) -> void`

- [ ] **Step 0: Prove Playwright is already local**

Run without installation:

```bash
npm ls --offline @playwright/test
node --input-type=module -e "import fs from 'node:fs'; import path from 'node:path'; import { chromium } from '@playwright/test'; const cli = path.resolve('node_modules/@playwright/test/cli.js'); if (!fs.existsSync(cli) || !fs.existsSync(chromium.executablePath())) process.exit(1);"
```

Expected: the dependency, local CLI file, and Chromium executable all exist from the approved public-plan setup. If any check fails, stop; do not let `npm exec` or Playwright fetch it implicitly.

- [ ] **Step 1: Add scripts and failing allowlist tests**

Add without removing public/admin scripts:

```json
{
  "scripts": {
    "test:e2e:guards": "node --test e2e/real-api/runtime/*.test.mjs",
    "test:e2e:real-api": "node e2e/real-api/run-real-api-e2e.mjs"
  }
}
```

Accept `http://127.0.0.1:49152`, `http://localhost:3000`, and `http://[::1]:8080`. Reject this exact table:

```js
const rejected = [
  'https://127.0.0.1:8443',
  'http://127.0.0.1',
  'http://0.0.0.0:8080',
  'http://192.168.0.10:8080',
  'http://forest:8080',
  'http://localhost.evil.example:8080',
  'http://forest.platformholder.site:80',
  'http://forest-front-psi.vercel.app:80',
  'http://user:pass@127.0.0.1:8080',
];
```

Manifest tests reject a missing file, non-`READY` state, schema version other than `1`, mismatched `runId`, mismatched fingerprint, missing backend endpoint, a non-loopback backend endpoint, or a canonical backend URL that differs from `expectedBackendUrl` only by loopback port.

- [ ] **Step 2: Confirm red tests**

Run: `npm run test:e2e:guards`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for the guard modules.

- [ ] **Step 3: Implement the exact guard**

`assertLoopbackHttpUrl` parses with `new URL`, requires `protocol === 'http:'`, rejects username/password, requires a numeric port from 1 through 65535, and requires normalized hostname `localhost`, `127.0.0.1`, or `::1`. Resolve `localhost` with `dns.promises.lookup(hostname, { all: true })` and require every result to be `127.0.0.0/8` or `::1`.

Use this manifest contract:

```js
export async function readReadyManifest({ manifestPath, expectedRunId, expectedFingerprint, expectedBackendUrl }) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.state !== 'READY') throw new Error('E2E manifest is not READY');
  if (manifest.runId !== expectedRunId) throw new Error('E2E runId mismatch');
  if (manifest.infrastructureFingerprint !== expectedFingerprint) throw new Error('E2E infrastructure fingerprint mismatch');
  const backend = await assertLoopbackHttpUrl(manifest.backend.baseUrl, 'backend');
  const expectedBackend = await assertLoopbackHttpUrl(expectedBackendUrl, 'expected backend');
  if (backend.href !== expectedBackend.href) throw new Error('E2E backend URL mismatch');
  return Object.freeze(manifest);
}

export function assertReadinessMatches({ readiness, manifest }) {
  if (readiness.status !== 'ready') throw new Error('backend readiness is not ready');
  if (readiness.profile !== 'e2e') throw new Error('backend profile is not e2e');
  if (readiness.runId !== manifest.runId) throw new Error('readiness runId mismatch');
  if (readiness.infrastructureFingerprint !== manifest.infrastructureFingerprint) throw new Error('readiness fingerprint mismatch');
}
```

Import `readFile` and `assertLoopbackHttpUrl`. Do not accept a default manifest path, runId, fingerprint, or backend URL.

- [ ] **Step 4: Run and commit**

Run: `npm run test:e2e:guards`

Expected: all acceptance, rejection, and tamper cases PASS.

```bash
git add package.json package-lock.json e2e/real-api/runtime
git commit -m "test: lock Forest real API E2E writes to loopback"
```

---

### Task 2: Add an integration-test-only Gradle source set

**Files:**
- Modify: `forest/build.gradle.kts`
- Create: `forest/src/integrationTest/resources/application-e2e.yml`
- Create: `forest/src/integrationTest/resources/logback-test.xml`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/config/E2eSourceSetMarker.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/config/ProductionArtifactBoundaryTest.kt`

**Interfaces:**
- `./gradlew integrationTest` runs integration-source guard tests without Playwright.
- `./gradlew realApiE2e -PcmsDir=/Users/park/Desktop/project/cms-react-project` runs the owned full-stack lifecycle.
- `./gradlew verifyProductionArtifactHasNoE2e` fails if an E2E class enters `bootJar`.

- [ ] **Step 1: Write the failing production boundary test**

Create `object E2eSourceSetMarker` under `org.woo.forest.e2e.config`. Resolve `Class.forName("org.woo.forest.e2e.config.E2eSourceSetMarker")` from integration-test runtime and assert its class file is absent from the Gradle-provided `forestMainOutput` system property. Later artifact verification catches every class under the whole `org/woo/forest/e2e` package, including readiness.

- [ ] **Step 2: Add source set and managed dependencies**

Add after the existing dependencies:

```kotlin
val integrationTestSourceSet = sourceSets.create("integrationTest") {
    compileClasspath += sourceSets.main.get().output
    runtimeClasspath += output + compileClasspath
}

configurations[integrationTestSourceSet.implementationConfigurationName]
    .extendsFrom(configurations.testImplementation.get())
configurations[integrationTestSourceSet.runtimeOnlyConfigurationName]
    .extendsFrom(configurations.testRuntimeOnly.get())

dependencies {
    add(integrationTestSourceSet.implementationConfigurationName, "org.springframework.boot:spring-boot-testcontainers")
    add(integrationTestSourceSet.implementationConfigurationName, "org.testcontainers:junit-jupiter")
    add(integrationTestSourceSet.implementationConfigurationName, "org.testcontainers:mysql")
    add(integrationTestSourceSet.implementationConfigurationName, "org.testcontainers:mongodb")
    add(integrationTestSourceSet.implementationConfigurationName, "org.testcontainers:testcontainers")
}

val integrationTest by tasks.registering(Test::class) {
    description = "Runs Forest integration-source guard tests"
    group = LifecycleBasePlugin.VERIFICATION_GROUP
    testClassesDirs = integrationTestSourceSet.output.classesDirs
    classpath = integrationTestSourceSet.runtimeClasspath
    shouldRunAfter(tasks.test)
    useJUnitPlatform()
    systemProperty("forestMainOutput", sourceSets.main.get().output.classesDirs.asPath)
}

val cmsDir = providers.gradleProperty("cmsDir").orElse("../cms-react-project")
val e2eGrep = providers.gradleProperty("e2eGrep")

val realApiE2e by tasks.registering(JavaExec::class) {
    description = "Runs disposable Forest backend and Playwright CRUD E2E"
    group = LifecycleBasePlugin.VERIFICATION_GROUP
    dependsOn(integrationTestSourceSet.classesTaskName)
    classpath = integrationTestSourceSet.runtimeClasspath
    mainClass.set("org.woo.forest.e2e.runner.ForestRealApiE2eRunnerKt")
    doFirst {
        setArgs(listOf(cmsDir.get(), e2eGrep.orNull ?: ""))
    }
}
```

Use Spring Boot dependency management. Do not add credentials or versions to `gradle.properties`.

- [ ] **Step 3: Add E2E-only configuration**

`application-e2e.yml` sets the following; dynamic datasource/Mongo/Redis/crypto/CDN values come only from the runner:

```yaml
spring:
  application:
    name: e2e-forest
  main:
    banner-mode: off
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: none
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
  cloud:
    discovery:
      enabled: false
  kafka:
    bootstrap-servers: 127.0.0.1:1
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration
eureka:
  client:
    enabled: false
    register-with-eureka: false
    fetch-registry: false
grpc:
  client:
    GLOBAL:
      enable-keep-alive: false
    auth:
      address: static://127.0.0.1:1
    storage:
      address: static://127.0.0.1:1
management:
  endpoints:
    enabled-by-default: false
logging:
  config: classpath:logback-test.xml
```

`logback-test.xml` contains only a console appender and never references Loki.

- [ ] **Step 4: Add artifact task, run, and commit**

Register `verifyProductionArtifactHasNoE2e` to depend on `bootJar`, open the jar with `zipTree`, and fail on `BOOT-INF/classes/org/woo/forest/e2e/**`.

Resolve and run offline first:

```bash
./gradlew --offline integrationTest verifyProductionArtifactHasNoE2e
```

Expected: custom source compiles, boundary test passes, and the production jar has no E2E classes using only cached dependencies. If any public Testcontainers artifact or private package/plugin is uncached, stop and list only its coordinate; request approval before an online Gradle resolution or actual GitHub credential use, and never print credentials.

```bash
git add build.gradle.kts src/integrationTest
git commit -m "test: isolate Forest integration E2E source set"
```

---

### Task 3: Define the owned manifest and disposable containers

**Files:**
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/manifest/E2eRunManifest.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/manifest/AtomicManifestStore.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runtime/E2eRuntimeRegistry.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/manifest/E2eRunManifestTest.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runner/ForestRealApiE2eRunner.kt`

**Interfaces:**

```kotlin
enum class E2eRunState { STARTING, BACKEND_READY, READY, FINISHED, FAILED }
enum class E2eResourceName { MYSQL, MONGODB, REDIS }

data class E2eRuntimeDescriptor(
    val containerId: String,
    val imageRef: String,
    val host: String,
    val mappedPort: Int,
    val logicalName: String?,
)

data class E2eHttpEndpoint(val baseUrl: String)

data class E2eRunManifest(
    val schemaVersion: Int = 1,
    val runId: String,
    val state: E2eRunState,
    val profile: String = "e2e",
    val createdAt: Instant,
    val backend: E2eHttpEndpoint?,
    val resources: Map<E2eResourceName, E2eRuntimeDescriptor>,
    val infrastructureFingerprint: String,
    val failureStage: String? = null,
)
```

- [ ] **Step 1: Write failing manifest tests**

Prove all of these:

- `runId` is `forest-` plus a lowercase 32-character UUID without hyphens.
- canonical fingerprint input sorts resources by enum name and contains container ID, exact image, host, port, and logical database name.
- SHA-256 is stable across map insertion order and changes if one owned field changes.
- serialized JSON contains no password, bearer token, write capability, JDBC username, or Mongo credential.
- `AtomicManifestStore` writes a sibling temporary file and atomically replaces `run-manifest.json`.

- [ ] **Step 2: Implement strict state transitions**

Expose only:

```kotlin
fun writeStarting(manifest: E2eRunManifest)
fun recordOwnedResources(resources: Map<E2eResourceName, E2eRuntimeDescriptor>, fingerprint: String)
fun markBackendReady(endpoint: E2eHttpEndpoint, fingerprint: String)
fun markReady()
fun markFinished()
fun markFailed(stage: String)
```

`recordOwnedResources` is the sole permitted same-state update: it requires `STARTING`, a currently empty resource map, all three resource keys, and a matching nonempty fingerprint; it can run once. State transitions remain `STARTING -> BACKEND_READY -> READY -> FINISHED` and any nonterminal state to `FAILED`. Reject every other transition and any second terminal transition.

- [ ] **Step 3: Start pinned resources in one registry**

Use these exact constants:

```kotlin
const val MYSQL_IMAGE = "mysql:8.0.41"
const val MONGO_IMAGE = "mongo:7.0.17"
const val REDIS_IMAGE = "redis:7.4.9-alpine"
```

- Derive `runIdSuffix` exactly once with `runId.removePrefix("forest-").take(12)` and derive `databaseName` as `forest_e2e_$runIdSuffix`.
- MySQL: `MySQLContainer`, database `databaseName`, username `forest_e2e`, and a `SecureRandom` password held only in memory.
- Mongo: `MongoDBContainer`, database `databaseName` passed to `getReplicaSetUrl(databaseName)`.
- Redis: `GenericContainer` exposing 6379 and command arguments `redis-server`, `--requirepass`, and a separate `SecureRandom` password held only in memory. Pass arguments as a list; never interpolate them into a shell command.

Before constructing or starting a container, build the required image list from the three constants plus `TestcontainersConfiguration.getInstance().ryukImage`. Query the Docker daemon for every exact image reference without pulling. If any is absent, abort at stage `image-preflight` and report only the missing references; wait for explicit approval before running one exact `docker pull` command per reported reference. Container startup is forbidden until the complete list is local.

Populate descriptors from each live container's full `containerId`, configured Docker image, host, and mapped port. The registry exposes connection secrets only in memory and returns secret-free descriptors to the manifest.

- [ ] **Step 4: Add fail-safe lifecycle behavior**

The runner creates the run directory and writes `STARTING` with an empty resource map before Docker work. It starts resources in MySQL/Mongo/Redis order, immediately calls `recordOwnedResources` with live descriptors/fingerprint, and stops resources in reverse order on every exit. On failure it writes only a safe stage label such as `containers`, never an exception message containing a connection string.

- [ ] **Step 5: Run and commit**

```bash
./gradlew integrationTest --tests "org.woo.forest.e2e.manifest.*"
docker info
```

Expected: manifest tests PASS and Docker reports an available daemon. A missing daemon is a prerequisite blocker, not permission to use shared databases.

```bash
git add src/integrationTest
git commit -m "test: own Forest E2E runtime manifest"
```

---

### Task 4: Boot a test-only Forest application with deterministic actors

**Files:**
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/config/E2eForestApplication.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/config/E2eOnlyConfiguration.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runtime/E2eActorRegistry.kt`
- Modify: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runner/ForestRealApiE2eRunner.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/config/E2eApplicationBoundaryTest.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/E2eOwnedEnvironmentInitializer.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/E2eOwnedEnvironmentInitializerTest.kt`
- Modify: `forest/src/main/kotlin/org/woo/forest/business/post/PostService.kt`
- Modify: `forest/src/test/kotlin/org/woo/forest/business/post/PostServiceTest.kt`

**Interfaces:**
- Actors: `PUBLIC`, `USER`, `OTHER_USER`, `ADMIN`, `MAX`.
- `E2eActorRegistry.passportJson(actor) -> String` returns null `userContext`.
- `E2eActorRegistry.bearerToken(actor) -> String` returns a per-run random token.
- `E2eActorRegistry.authorizationHeader(actor) -> String` returns exactly `Bearer ${bearerToken(actor)}` for non-PUBLIC actors.
- `E2eOnlyConfiguration` provides test doubles for `AuthGrpcService` and `StorageGrpcService`.

- [ ] **Step 1: Write a failing scan-boundary test**

Load `E2eForestApplication` annotation metadata and assert every external/background class in Step 2 is excluded. Also assert the application class exists only under integration-test output.

- [ ] **Step 2: Define the E2E application**

Use `@SpringBootConfiguration`, `@EnableAutoConfiguration`, and `@ComponentScan("org.woo.forest")`. Add assignable-type exclusions for:

- `ForestApplication`
- `ApmConfig`
- `KafkaConfig`
- `SchedulerConfig`
- `StorageConfig`
- `ProgramScheduler`
- `MessageSubscriber`
- `GrpcClientMetricsInterceptor`
- `AuthGrpcService`
- `StorageGrpcService`

Import `E2eOnlyConfiguration` explicitly. Do not add a profile-based bypass to main source.

- [ ] **Step 3: Build actor fixtures in memory**

Derive actor UUIDs with `UUID.nameUUIDFromBytes("$runId:${actor.name}".toByteArray(StandardCharsets.UTF_8))`; generate bearer tokens randomly and never serialize them to disk. Pass the exact in-memory `authorizationHeader` and passport JSON to the Node child through its scrubbed environment. Passport shape is exactly:

```json
{
  "userId": "00000000-0000-0000-0000-000000000000",
  "role": "ROLE_ADMIN",
  "signInApplicationId": "forest-e2e",
  "userContext": null
}
```

The zero UUID documents the schema only; runtime JSON uses the derived UUID. Map actors as follows:

- USER, OTHER_USER: passport/auth role `ROLE_USER`, access level 0.
- ADMIN: passport/auth role `ROLE_ADMIN`, access level 0.
- MAX: passport role `ROLE_USER`, auth role `ROLE_ADMIN`, access level 2147483647.

- [ ] **Step 4: Remove the existing empty storage call with an owning regression**

First add a red `PostServiceTest` that deletes an authorized post with `images = emptyList()` and verifies `storageGrpcService.deleteFiles(...)` is never called. Add a second test with two image URLs and verify the exact nonempty list is passed once. Then change only the current delete branch to:

```kotlin
post?.images
    ?.takeIf { it.isNotEmpty() }
    ?.let { images -> runBlocking { storageGrpcService.deleteFiles(images) } }
```

Run `./gradlew test --tests "org.woo.forest.business.post.PostServiceTest"` and require both tests to pass before relying on the strict E2E storage assertion.

- [ ] **Step 5: Provide external doubles only in integration source**

Create a Mockito `AuthGrpcService` whose suspending `getUserInfo(authorizationHeader)` accepts only the exact string `"Bearer ${actorRegistry.bearerToken(actor)}"` for a registered non-PUBLIC actor and returns `AuthProto.UserInfoResponse` with actor email, Korean name, application role, and access level. Missing, raw-without-prefix, duplicated-prefix, or unknown headers throw. Provide a Mockito `StorageGrpcService` and retain it in the E2E verification registry; the first CRUD gate sends no files, and runner postconditions call `verifyNoInteractions(storageGrpcService)`, so any accidental storage call fails the task.

The application must not instantiate a gRPC channel, `StorageClient`, `DeleteClient`, `KafkaTemplate`, Eureka client, or discovery client.

- [ ] **Step 6: Install and validate owned properties before Spring refresh**

Create `E2eOwnedEnvironmentInitializer`, an integration-source `ApplicationContextInitializer<ConfigurableApplicationContext>`. The runner constructs a `StandardServletEnvironment`, adds `MapPropertySource("forestE2eOwned", ownedProperties)` first, sets its only active profile to `e2e`, and gives that environment to `SpringApplicationBuilder.environment(...)` before config-data processing. During `initialize`, remove/re-add that same named source first, reset active profiles to exactly `e2e`, and validate again before refresh. Do not use `SpringApplicationBuilder.properties(...)` or command-line arguments for any safety-critical value because those can be lower priority or can leave an inherited profile active.

The owned map contains `spring.profiles.active=e2e`, `server.address=127.0.0.1`, `server.port=0`, exact `spring.datasource.url/username/password`, exact independent `spring.flyway.url/user/password`, exact `spring.data.mongodb.uri`, exact Redis host/port/password, disabled Eureka/discovery, and all crypto/CDN values. Generate separate 32-byte random AES and HMAC keys and Base64-encode each. Use `platform-holder.cdn.domain=http://127.0.0.1:1` only for binding; storage doubles make attempted use fail. Secrets remain in memory and never enter process arguments or manifest fields.

Still inside `initialize`, before any bean or Flyway callback can run, require: active profiles exactly `e2e`; resolved datasource URL equals the live owned MySQL endpoint/database; resolved independent Flyway URL equals that same owned JDBC URL; Mongo and Redis endpoints/database equal their live registry objects; manifest is `STARTING` with matching runId/fingerprint/full container IDs; and every container is running. Throw immediately on any mismatch. Register runtime registry, actor registry, manifest store, verification state, and the already-validated ownership proof as singleton beans only after these checks pass.

Write tests that seed hostile higher-level environment variables/properties for datasource, Flyway, Mongo, Redis, and `dev` profile, then prove the add-first owned source and exact active-profile reset prevent them from becoming resolved values. Independently tamper each owned value/ID and require initializer failure before a test bean or migration callback executes. Read `local.server.port` only after successful startup; never reserve a port by closing a temporary socket.

- [ ] **Step 7: Run and commit**

Run:

```bash
./gradlew test --tests "org.woo.forest.business.post.PostServiceTest"
./gradlew integrationTest --tests "org.woo.forest.e2e.config.*" --tests "org.woo.forest.e2e.guard.E2eOwnedEnvironmentInitializerTest"
```

Expected: scan and production-boundary tests PASS without external network access.

```bash
git add src/main/kotlin/org/woo/forest/business/post/PostService.kt src/test/kotlin/org/woo/forest/business/post/PostServiceTest.kt src/integrationTest
git commit -m "fix: isolate Forest E2E and skip empty storage deletes"
```

---

### Task 5: Validate resolved endpoints and expose verified readiness

**Files:**
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/ResolvedEndpointParser.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/E2eStartupValidator.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/readiness/E2eVerificationState.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/readiness/E2eReadinessController.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/ResolvedEndpointParserTest.kt`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/guard/E2eStartupValidatorTest.kt`

**Interfaces:**

```kotlin
data class E2eOwnershipProof(
    val runId: String,
    val infrastructureFingerprint: String,
    val jdbcUrl: String,
    val mongoHost: String,
    val mongoPort: Int,
    val mongoDatabase: String,
    val redisHost: String,
    val redisPort: Int,
)

data class VerifiedE2eRun(
    val runId: String,
    val infrastructureFingerprint: String,
    val verifiedAt: Instant,
)

class E2eVerificationState {
    fun publish(verified: VerifiedE2eRun)
    fun current(): VerifiedE2eRun?
}
```

- [ ] **Step 1: Write parser and tamper tests first**

Cover JDBC datasource and independent Flyway URLs, Mongo replica-set URLs, and Redis host/port. Starting from valid descriptors, independently mutate container ID, host, port, Flyway URL, and logical database name and require pre-refresh validation failure. Profiles `dev`, `prod`, `e2e,dev`, and empty must fail.

- [ ] **Step 2: Implement validation in fixed order**

The pre-refresh initializer from Task 4 owns endpoint/profile/container validation. The `ApplicationRunner` accepts only its immutable ownership proof and then requires, in order:

1. active profiles still equal exactly `arrayOf("e2e")` and the proof runId/fingerprint equal the current `STARTING` manifest;
2. MySQL/Mongo logical names start `forest_e2e_` and end in the current run suffix;
3. Eureka/discovery remain disabled, no main-source auth/storage component bean definitions exist, and the selected auth/storage beans are Mockito doubles declared by `E2eOnlyConfiguration`;
4. successful `SELECT 1`, Mongo `{ ping: 1 }`, and Redis `PING` through application beans;
5. `flyway_schema_history` contains successful migrations through version 10 and Flyway reports the same owned JDBC URL proven before refresh;
6. recomputed live fingerprint still equals the proof and manifest;
7. only then publish `VerifiedE2eRun`.

Any post-start failure stops startup before readiness or Node is opened and never publishes partial state. Database mutation safety does not depend on this runner: the initializer has already rejected unowned endpoints before Flyway/context refresh. `BACKEND_READY` is not required inside the runner because the random HTTP port is read only after startup completes.

- [ ] **Step 3: Add test-only readiness**

`GET /__e2e/ready` returns 503 and `{ "status": "not-ready" }` while empty. After verification, it returns 200:

```json
{
  "status": "ready",
  "runId": "forest-0123456789abcdef0123456789abcdef",
  "profile": "e2e",
  "infrastructureFingerprint": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

Keep the controller under `org.woo.forest.e2e` so artifact verification catches accidental inclusion.

- [ ] **Step 4: Run and commit**

Run: `./gradlew integrationTest --tests "org.woo.forest.e2e.guard.*"`

Expected: valid and every tampered case PASS.

```bash
git add src/integrationTest
git commit -m "test: verify Forest E2E infrastructure ownership"
```

---

### Task 6: Add the loopback gateway, Vite owner, and Playwright gate

**Files:**
- Modify: `cms-react-project/src/axiosInstance.js`
- Modify: `cms-react-project/vite.config.js`
- Modify: `cms-react-project/package.json`
- Modify: `cms-react-project/eslint.config.js`
- Create: `cms-react-project/e2e/real-api/run-real-api-e2e.mjs`
- Create: `cms-react-project/e2e/real-api/playwright.config.js`
- Create: `cms-react-project/e2e/real-api/global-setup.mjs`
- Create: `cms-react-project/e2e/real-api/runtime/gateway-shim.mjs`
- Create: `cms-react-project/e2e/real-api/runtime/gateway-shim.test.mjs`
- Create: `cms-react-project/e2e/real-api/runtime/vite-server.mjs`
- Create: `cms-react-project/e2e/real-api/fixtures/actors.mjs`
- Create: `cms-react-project/e2e/real-api/fixtures/real-api-test.mjs`
- Create: `cms-react-project/e2e/real-api/specs/safety.spec.js`

**Required environment:**
- `FOREST_E2E_MANIFEST`
- `FOREST_E2E_RUN_ID`
- `FOREST_E2E_FINGERPRINT`
- `FOREST_E2E_BACKEND_URL`
- `FOREST_E2E_ACTORS_JSON`
- `FOREST_E2E_WRITE_CAPABILITY`

**Interfaces:**
- `startGatewayShim(options) -> Promise<{ baseUrl, requestAudit, close }>`
- `startViteForRealApi({ cmsDir, gatewayUrl }) -> Promise<{ baseUrl, close }>`
- Missing or tampered environment exits nonzero before Playwright.

- [ ] **Step 1: Write failing gateway tests**

With a fake loopback backend, prove:

- browser-supplied auth/passport headers never reach the backend;
- protected GET receives only selected runner actor credentials;
- mutation without capability returns 403 and is not forwarded;
- readiness runId/fingerprint mismatch returns 503 and is not forwarded;
- changing only the manifest backend loopback port away from `FOREST_E2E_BACKEND_URL` returns 503 and is not forwarded;
- exact readiness/capability match forwards once;
- non-loopback backend/proxy/frontend URLs stop startup.

- [ ] **Step 2: Make Axios and Vite mode-aware without weakening defaults**

Keep this exact API precedence:

```js
const defaultApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:8080/api/v1'
  : 'https://forest.platformholder.site/api/v1';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
```

In `vite.config.js`, use `loadEnv(mode, process.cwd(), '')`. For `e2e-real`, require and loopback-validate `VITE_API_PROXY_TARGET` before configuring `/api`; browser API base stays `/api/v1`. Draft middleware remains draft-only and normal development retains its localhost behavior.

- [ ] **Step 3: Implement the write lease**

Remove incoming `authorization`, `x-user-passport`, `x-e2e-run-id`, `x-e2e-actor`, and `x-e2e-write-capability`. Validate control values against in-memory runner data, then inject only:

- `Authorization: actor.authorizationHeader` (already the exact single `Bearer ` prefix from the Kotlin registry)
- `X-User-Passport: actor.passportJson` (the exact registry-issued JSON whose `userContext` is `null`)

PUBLIC receives neither. Before each mutating method, re-read the manifest through `readReadyManifest` with `expectedBackendUrl: process.env.FOREST_E2E_BACKEND_URL`, fetch only that exact backend's `/__e2e/ready` with a two-second timeout, validate readiness, runId, fingerprint, and capability, then forward. Return 403/503 without forwarding on failure. Never log control headers or actor registry. Record only `{ method, pathname, status }` in request audit.

Reserve `GET /__e2e_gateway/audit` on the shim. It requires exact run ID and capability headers, is never forwarded, and returns only the secret-free audit array. Every other `/__e2e_gateway/**` method/path returns 404. The orchestrator passes the actual loopback shim address as `FOREST_E2E_GATEWAY_URL` to Playwright; global setup must require equality with the address returned by `startGatewayShim`.

- [ ] **Step 4: Start Vite middleware behind a runner-owned random HTTP server**

Vite 6 treats configured port zero as falsy, so do not use Vite's listener. Import `createServer as createViteServer` from Vite and `createServer as createHttpServer` from `node:http`. Set `VITE_API_BASE_URL=/api/v1` and the validated gateway proxy target before loading config, then create Vite with `mode: 'e2e-real'`, `appType: 'spa'`, and `server: { middlewareMode: true }`. Pass `vite.middlewares` to the owned HTTP server, call `listen(0, '127.0.0.1')`, and derive the base URL from that server's actual `AddressInfo.port`. `close()` first awaits the HTTP server close and then `vite.close()`; it is idempotent and aggregates close errors without skipping either resource.

- [ ] **Step 5: Gate Playwright and issue actors per context**

Global setup calls `readReadyManifest` with the expected run ID, fingerprint, and `FOREST_E2E_BACKEND_URL`, checks gateway URL equality, fetches readiness from that exact canonical backend, and validates it. Extend Playwright with an `actor` option and a `requestAudit.snapshot()` fixture that calls the protected gateway audit endpoint. Each context sends only the run ID, actor name, and write capability control headers. Default actor is PUBLIC; CRUD suites use ADMIN.

Disable traces and video for this real-API project so secrets cannot enter artifacts. Allow screenshots on failure only because the shim strips control headers before proxying and screenshots do not expose environment variables.

- [ ] **Step 6: Own Node children in one `try/finally`**

`run-real-api-e2e.mjs` validates environment, resolves the already-verified local `node_modules/@playwright/test/cli.js` and Chromium executable, then starts gateway and Vite and sets `FOREST_E2E_GATEWAY_URL` plus `FOREST_E2E_FRONTEND_URL` for its child. Spawn `process.execPath` with arguments `[localCliPath, 'test', '--config', 'e2e/real-api/playwright.config.js']` and `shell: false`. Missing local CLI or Chromium fails before starting the gateway; never call `npm exec`, `npx`, or an install command from this runner. Append `--grep` and the value from `FOREST_E2E_GREP` as separate arguments only when the runner provided a nonblank value. Always close Vite and gateway and propagate the Playwright exit code.

- [ ] **Step 7: Run pure guards and commit**

```bash
npm run test:e2e:guards
npm run lint
```

Expected: guard and gateway unit tests PASS and lint exits 0. Running `npm run test:e2e:real-api` without runner environment must fail before Chromium and name only the missing variable.

```bash
git add package.json package-lock.json src/axiosInstance.js vite.config.js eslint.config.js e2e/real-api
git commit -m "test: add guarded Forest real API browser runner"
```

---

### Task 7: Wire the runner and verify contract/auth boundaries

**Files:**
- Create: `cms-react-project/e2e/real-api/specs/contract.spec.js`
- Modify: `cms-react-project/e2e/real-api/fixtures/real-api-test.mjs`
- Modify: `forest/build.gradle.kts`
- Modify: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runner/ForestRealApiE2eRunner.kt`

- [ ] **Step 1: Add failing contract tests**

Assert all of these against the real context:

- `/v3/api-docs` contains program information, post, and notice paths with current methods.
- public program/post-0/notice lists return 200 with `data.contents` arrays.
- unauthenticated `/api/v1/users` returns 403.
- USER receives 403 for program and notice creation.
- ADMIN `/api/v1/users` returns the test-auth actor DTO.
- ADMIN creates one no-file contract fixture for each program, category-0 post, and notice through the real API, discovers each ID through the corresponding list, asserts every ID is a JSON string, reads detail, and deletes all three in `finally`.

Use the Vite/gateway path for `/api/v1`; access backend directly only for readiness and OpenAPI after loopback validation.

- [ ] **Step 2: Define exact optional focused-run forwarding**

Add a Gradle provider `providers.gradleProperty("e2eGrep").orNull` and pass it as the runner's second nullable argument. The runner sets `FOREST_E2E_GREP` only when nonblank. Node appends `--grep` and the single value as separate spawn arguments; it never invokes a shell.

- [ ] **Step 3: Complete runner-to-Node handoff**

After startup validation returns, assign `val actualPort = environment.getRequiredProperty("local.server.port", Int::class.java)`, call `markBackendReady(E2eHttpEndpoint("http://127.0.0.1:$actualPort"), fingerprint)`, verify readiness over that exact URL, then call `markReady()`. Only after the manifest is `READY` may the runner execute `npm run test:e2e:real-api` in the supplied CMS directory. Pass the six required values and optional grep only in child environment. Remove inherited `VITE_API_BASE_URL`, `VITE_API_PROXY_TARGET`, production API variables, and CI credentials before adding E2E values. Do not print actor tokens or capability.

- [ ] **Step 4: Run focused contract/safety gate**

```bash
./gradlew realApiE2e -PcmsDir=/Users/park/Desktop/project/cms-react-project -Pe2eGrep="safety|contract"
```

Expected: three containers and Spring start, only safety/contract specs pass, Node exits 0, and all resources stop.

- [ ] **Step 5: Commit locally in each repository**

Frontend:

```bash
git add e2e/real-api
git commit -m "test: verify Forest real API contracts"
```

Backend:

```bash
git add build.gradle.kts src/integrationTest
git commit -m "test: wire Forest real API E2E runner"
```

---

### Task 8: Add serial browser-to-database CRUD scenarios

**Files:**
- Create: `cms-react-project/e2e/real-api/specs/program-crud.spec.js`
- Create: `cms-react-project/e2e/real-api/specs/post-crud.spec.js`
- Create: `cms-react-project/e2e/real-api/specs/notice-crud.spec.js`
- Create: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/verify/DatabasePostconditions.kt`
- Modify: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runner/ForestRealApiE2eRunner.kt`

**Rules:**
- Every created title starts with `"E2E-$runId-"` and ends with a per-spec random UUID suffix.
- Suites use serial mode and ADMIN actor.
- No file is uploaded and OAuth is never visited.
- Each UI mutation is verified through a subsequent real API read and then deleted through UI.

- [ ] **Step 1: Write the failing program flow**

Open `/admin?section=programs`, follow `프로그램 등록`, and create a PARTICIPATE program with unique title, future application/event dates, content, maximum 20, and no files. Verify the original admin filter return state, public detail/API response, edit to maximum 25, single-submit behavior, deletion through `AccessibleDialog`, list absence, and documented not-found detail response.

- [ ] **Step 2: Write the failing activity-post flow**

Use Flyway category ID 0. Open `/category/0/write`, create a unique no-image activity post, verify `/news/activities`, `/post/0/<id>`, and real detail API. Edit title/body, return to `/admin?section=content&contentType=activity` with filters preserved, delete through the explicit UI action, then prove list absence and not-found detail.

- [ ] **Step 3: Write the failing notice flow**

Open `/news/notice/write`, create a no-image notice, verify public list/detail and string ID, edit with administrator notice return state, delete through content panel, then prove list absence and not-found detail.

- [ ] **Step 4: Verify no duplicate mutation**

Immediately before each create/save/delete interaction, capture `const before = await requestAudit.snapshot()`. Click twice while the first request is pending, capture `after`, and compare only the new audit entries after `before.length`. For create, assert one new mutation at the collection path (`POST /api/v1/program/information`, `POST /api/v1/posts`, or `POST /api/v1/notice`); for edit/delete, assert one new mutation at the discovered resource-ID path. Also assert the second interaction produces no second state change through the subsequent real API read. Do not record bodies in the audit and do not infer duplicate protection from elapsed time.

- [ ] **Step 5: Add database postconditions**

Because every database is fresh and runner-owned, query total collection/table counts rather than title prefixes. Require Mongo `program_information`, `program_forms`, and `posts` to contain zero documents, and MySQL `program_apply`, `program_consent`, and `bucket` to contain zero rows. Also report counts for any other collection created during the run. On Playwright failure, collect and attach all counts without replacing the original Playwright exception, then tear down. A renamed or unexpectedly titled leftover must still fail cleanup.

- [ ] **Step 6: Run complete real-API gate**

```bash
./gradlew realApiE2e -PcmsDir=/Users/park/Desktop/project/cms-react-project
```

Expected: safety, contract, program CRUD, activity-post CRUD, and notice CRUD pass. Any product bug gets a new failing owning-layer regression test; do not weaken assertions or replace real API with route mocks.

- [ ] **Step 7: Commit locally**

Frontend:

```bash
git add e2e/real-api
git commit -m "test: cover Forest content CRUD end to end"
```

Backend:

```bash
git add src/integrationTest
git commit -m "test: verify Forest CRUD database cleanup"
```

---

### Task 9: Prove teardown and production separation

**Files:**
- Modify: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/runner/ForestRealApiE2eRunner.kt`
- Modify: `forest/src/integrationTest/kotlin/org/woo/forest/e2e/manifest/E2eRunManifestTest.kt`
- Modify: `cms-react-project/e2e/real-api/runtime/gateway-shim.test.mjs`

- [ ] **Step 1: Add lifecycle failure tests**

Use injectable factories to prove container-start failure stops earlier containers, Spring validation failure never starts Node, Node nonzero preserves failure after cleanup, SIGINT closes Node/Spring/all containers, and normal completion reaches `FINISHED` only after postconditions and stop verification.

- [ ] **Step 2: Verify actual container stop**

Keep full IDs. After `stop()`, inspect each via Testcontainers Docker client. Docker not-found or `running == false` passes; a running owned container fails. Never stop/delete a container absent from the current registry.

- [ ] **Step 3: Verify jar separation**

```bash
./gradlew test integrationTest verifyProductionArtifactHasNoE2e bootJar
```

Expected: tests pass and the automated jar rule finds no E2E package, readiness controller, actor registry, or test configuration.

- [ ] **Step 4: Verify deliberate tamper fails closed**

Through a JUnit-only injected manifest transformer, mutate one mapped port after startup. Validator must fail before readiness, Node must not start, and all containers must stop. Do not expose the transformer in normal task arguments.

- [ ] **Step 5: Commit locally**

```bash
git add src/integrationTest build.gradle.kts
git commit -m "test: prove Forest E2E teardown and isolation"
```

---

### Task 10: Run cumulative gates, PRD sync, and prepare review

- [ ] **Step 1: Run frontend gates**

```bash
npm run test:unit
npm run lint
npm run build
npm run test:e2e:guards
npm run test:e2e:public
npm run test:e2e:admin
```

Expected: every command exits 0. Record exact counts from output.

- [ ] **Step 2: Run backend and real-API gates**

```bash
./gradlew test integrationTest verifyProductionArtifactHasNoE2e realApiE2e -PcmsDir=/Users/park/Desktop/project/cms-react-project
```

Expected: existing backend tests, guards, artifact boundary, safety/contract specs, three CRUD suites, database postconditions, and teardown checks all pass.

- [ ] **Step 3: Run `source-command-prd-sync` exactly once**

Before sync, run `git diff --check` in both repositories and scan all three plan files with `rg -n "T[O]DO|T[B]D|implement lat[e]r|simi[l]ar|existing JS[X]|code goes her[e]|one-shot overrid[e]"`; the commands must print no unresolved implementation marker. Then compare actual implementation with Forest requirements/API spec and update only verified drift. Do not run marketing PRD sync unless a user-facing capability claim changed.

- [ ] **Step 4: Prepare the unpublished user bundle**

Include clickable local public/admin commands and URLs, 1440×900/768×1024/390×844 screenshots from deterministic mocks, exact command results, secret-free runId/fingerprint, verified CRUD scope, fixed bugs, and explicit unverified scope: OAuth/SSO, real storage/CDN, uploads, email, discovery, staging, production.

Say only that recorded critical paths passed in the recorded environment; never claim all bugs are absent.

- [ ] **Step 5: Stop before external action**

Show the bundle to the user. Do not push, open a PR, or deploy without a new immediate confirmation.

---

## Final Definition of Done

- Public and administrator mock-UI gates pass first.
- Backend accepts only the `e2e` profile and runner-owned MySQL/Mongo/Redis endpoints.
- Readiness and writes fail closed on manifest, endpoint, capability, or profile mismatch.
- Program, activity-post, and notice CRUD pass through browser, Vite, loopback shim, real Forest controllers/services, Flyway, and disposable stores.
- Test auth/storage doubles and readiness are absent from `bootJar`.
- Containers stop after success, assertion failure, startup failure, and interruption.
- PRD/API truth is synchronized once after code changes.
- User receives local draft URLs, responsive screenshots, exact evidence, limitations, and no unapproved push/deployment.
