# Forest Organization Directory Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rollback-safe, revisioned Forest organization directory API and protect the legacy `intro-people` editor after the structured directory is configured.

**Architecture:** Store one typed `public` document in a dedicated `organization_directory` Mongo collection. Validate and normalize the complete snapshot before an atomic revision compare-and-swap; derive public data server-side, and use a domain-separated legacy-content fingerprint to prevent or surface cutover races. Keep the existing static-content public contract intact and add only a configured-state guard to the `intro-people` management PUT.

**Tech Stack:** Kotlin 1.9.25, Spring Boot 3.4.4, Java 21, Spring Data MongoDB, Jackson Kotlin, JUnit 5, Mockito Kotlin, Testcontainers MongoDB

## Global Constraints

- Execute backend code only in an isolated Forest worktree created with `superpowers:using-git-worktrees`; do not modify `/Users/park/Desktop/project/forest` directly if it has user changes.
- Public endpoints are `GET /api/v1/organization`; management endpoints are `GET` and `PUT /api/v1/organization/manage`.
- Management authorization remains the current `AccessControlService.onlyAdmin`: `ROLE_ADMIN || accessLevel == Int.MAX_VALUE`; missing, invalid, expired, and unauthorized Passport flows remain HTTP 403.
- Store organization data only in Mongo collection `organization_directory`, fixed document ID `public`; never place it in `static_content`.
- A missing document returns the immutable version-1 seed with `configured=false`, `revision=0`, `updatedAt=null`, and does not write to Mongo.
- First save requires request revision 0 and inserts revision 1. Later saves use one atomic `_id + revision` `findAndModify`; no Mongo multi-document transaction is assumed.
- Every organization PUT must compare the request `legacyContentFingerprint` with the current server fingerprint before saving and record that fingerprint in the organization document.
- After an organization document exists, management PUT of static-content key `intro-people` returns 409 `ORGANIZATION_DIRECTORY_ALREADY_CONFIGURED`; other static-content keys and public GET behavior remain unchanged.
- Limits: at most 100 groups, 500 people, 2,000 memberships, hierarchy depth 8; name 1–100, description 0–300, affiliation 0–200, role 0–100 characters after trim.
- IDs are request strings validated as UUID v4. Invalid IDs produce `INVALID_ORGANIZATION_STRUCTURE` 400 rather than Jackson 500.
- `affiliationOverride`: null inherits the person affiliation, `""` explicitly hides it, a nonblank value is trimmed to 1–200 characters, and whitespace-only values are invalid.
- Plain text only; reject markup-shaped input containing `<` or `>` in every organization text field.
- Do not modify `gradle.properties`, the published common modules, Gateway, credentials, CI secrets, or production data.
- Do not push or deploy. After backend verification and PRD sync, stop at the external deployment confirmation gate.

---

## File Structure

### Create

- `src/main/kotlin/org/woo/forest/domain/entity/organization/OrganizationDirectory.kt` — Mongo document and embedded value types.
- `src/main/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepository.kt` — CRUD plus revision-CAS contract.
- `src/main/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepositoryCustomImpl.kt` — MongoTemplate atomic insert/update implementation.
- `src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryValidator.kt` — limits, UUID, references, cycle/depth validation, and order normalization.
- `src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryProjector.kt` — public enabled/ancestor filtering.
- `src/main/kotlin/org/woo/forest/business/organization/DefaultOrganizationDirectoryProvider.kt` — fail-fast classpath seed loader.
- `src/main/kotlin/org/woo/forest/business/organization/LegacyContentFingerprintService.kt` — domain-separated SHA-256 of `intro-people`.
- `src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryService.kt` — public/manage/update orchestration.
- `src/main/kotlin/org/woo/forest/dto/organization/OrganizationDirectoryDto.kt` — request and distinct public/manage response contracts.
- `src/main/kotlin/org/woo/forest/presentation/rest/OrganizationDirectoryController.kt` — three endpoints and envelopes.
- `src/main/resources/organization/default-directory-v1.json` — the exact Appendix A seed.
- `src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryValidatorTest.kt`
- `src/test/kotlin/org/woo/forest/business/organization/DefaultOrganizationDirectoryProviderTest.kt`
- `src/test/kotlin/org/woo/forest/business/organization/LegacyContentFingerprintServiceTest.kt`
- `src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryProjectorTest.kt`
- `src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryServiceTest.kt`
- `src/test/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepositoryIntegrationTest.kt`
- `src/test/kotlin/org/woo/forest/presentation/rest/OrganizationDirectoryControllerTest.kt`
- `src/test/kotlin/org/woo/forest/integration/OrganizationDirectoryApiIntegrationTest.kt` — real MVC/auth/service/fingerprint/repository flow against Testcontainers Mongo.
- `src/test/kotlin/org/woo/forest/business/StaticContentServiceTest.kt`

### Modify

- `build.gradle.kts` — Testcontainers test dependencies only.
- `src/main/kotlin/org/woo/forest/common/constants/ErrorCode.kt` — five organization-specific error codes.
- `src/main/kotlin/org/woo/forest/business/StaticContentService.kt` — configured-state guard for `intro-people`.
- `/Users/park/Desktop/project/prd/forest/requirements.md` — product behavior after verified implementation.
- `/Users/park/Desktop/project/prd/forest/api-spec.md` — endpoint, payload, error, and legacy guard contract.

---

## Execution Setup Before Task 1

- [ ] Invoke `superpowers:using-git-worktrees` from `/Users/park/Desktop/project/forest`. Create branch `codex/forest-organization-directory` from reviewed base `df6746c06cdae0ec9e812dc687f075880fa6f6dc`; use `/Users/park/Desktop/project/.worktrees/forest-organization-directory` as the fallback worktree path if the skill does not provide a native isolated workspace.
- [ ] In the isolated worktree, run `git rev-parse HEAD`, `git branch --show-current`, and `git status --short`. Expected: the exact reviewed base SHA, branch `codex/forest-organization-directory`, and empty status.
- [ ] Run `./gradlew test` before the first edit. Expected: the existing baseline passes. If it does not, stop and report the pre-existing failure instead of mixing it with this feature.

---

### Task 1: Define the typed snapshot and deterministic validator

**Files:**
- Create: `src/main/kotlin/org/woo/forest/domain/entity/organization/OrganizationDirectory.kt`
- Create: `src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryValidator.kt`
- Create: `src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryValidatorTest.kt`
- Modify: `src/main/kotlin/org/woo/forest/common/constants/ErrorCode.kt`

**Interfaces:**
- Produces: `OrganizationDirectorySnapshot(schemaVersion, groups, people, memberships)`.
- Produces: `OrganizationDirectoryValidator.validateAndNormalize(snapshot): OrganizationDirectorySnapshot`.
- Produces: `INVALID_ORGANIZATION_STRUCTURE` and `CORRUPT_ORGANIZATION_DIRECTORY` error codes.
- Normalization order: siblings by `(displayOrder, name, id)` and memberships by `(displayOrder, roleLabel, id)`, then reassign 10, 20, 30.

- [ ] **Step 1: Add failing validator tests**

Create table-driven tests with these exact test names and assertions:

```kotlin
class OrganizationDirectoryValidatorTest {
    private val validator = OrganizationDirectoryValidator()

    @Test
    fun `valid snapshot is trimmed and sibling orders are normalized by tens`() {
        val result = validator.validateAndNormalize(
            snapshot(
                groups = listOf(group(id = G2, name = " 둘째 ", order = 7), group(id = G1, name = "첫째", order = 3)),
                people = listOf(person(id = P1, name = " 홍길동 ", affiliation = " 소속 ")),
                memberships = listOf(membership(id = M1, groupId = G1, personId = P1, role = " 이사 ", order = 1)),
            ),
        )

        assertEquals(listOf(G1, G2), result.groups.map { it.id })
        assertEquals(listOf(10, 20), result.groups.map { it.displayOrder })
        assertEquals("홍길동", result.people.single().name)
        assertEquals("소속", result.people.single().affiliation)
        assertEquals("이사", result.memberships.single().roleLabel)
    }

    @Test
    fun `affiliation override preserves null inheritance empty hiding and trimmed text`() {
        val result = validator.validateAndNormalize(
            snapshot(
                groups = listOf(group(G1)),
                people = listOf(person(P1), person(P2), person(P3)),
                memberships = listOf(
                    membership(M1, G1, P1, affiliationOverride = null),
                    membership(M2, G1, P2, affiliationOverride = ""),
                    membership(M3, G1, P3, affiliationOverride = " 별도 소속 "),
                ),
            ),
        )
        assertEquals(listOf(null, "", "별도 소속"), result.memberships.map { it.affiliationOverride })
    }

    @Test
    fun `duplicate person names remain distinct when UUIDs differ`() {
        val result = validator.validateAndNormalize(
            snapshot(
                groups = listOf(group(G1)),
                people = listOf(person(P1, name = "동명이인"), person(P2, name = "동명이인")),
                memberships = listOf(membership(M1, G1, P1), membership(M2, G1, P2)),
            ),
        )
        assertEquals(listOf(P1, P2), result.people.map { it.id })
    }

    @Test
    fun `whitespace override is invalid`() {
        assertInvalid(snapshot(listOf(group(G1)), listOf(person(P1)), listOf(membership(M1, G1, P1, affiliationOverride = "   "))))
    }

    @Test
    fun `invalid UUID version duplicate IDs dangling references and duplicate pairs are invalid`() {
        assertInvalid(snapshot(listOf(group("not-a-uuid")), emptyList(), emptyList()))
        assertInvalid(snapshot(listOf(group(G1), group(G1)), emptyList(), emptyList()))
        assertInvalid(snapshot(listOf(group(G1, parent = G2)), emptyList(), emptyList()))
        assertInvalid(snapshot(listOf(group(G1)), listOf(person(P1)), listOf(membership(M1, G1, P2))))
        assertInvalid(snapshot(listOf(group(G1)), listOf(person(P1)), listOf(membership(M1, G1, P1), membership(M2, G1, P1))))
    }

    @Test
    fun `self parent cycle and hierarchy deeper than eight are invalid`() {
        assertInvalid(snapshot(listOf(group(G1, parent = G1)), emptyList(), emptyList()))
        assertInvalid(snapshot(listOf(group(G1, parent = G2), group(G2, parent = G1)), emptyList(), emptyList()))
        val chain = GROUP_IDS.take(9).mapIndexed { index, id -> group(id, parent = GROUP_IDS.getOrNull(index - 1)) }
        assertInvalid(snapshot(chain, emptyList(), emptyList()))
    }

    @Test
    fun `count length schema and markup limits are invalid`() {
        assertInvalid(snapshot(schemaVersion = 2))
        assertInvalid(snapshot(groups = List(101) { group(UUID.randomUUID().toString()) }))
        assertInvalid(snapshot(groups = listOf(group(G1)), people = List(501) { person(UUID.randomUUID().toString()) }))
        assertInvalid(snapshot(groups = listOf(group(G1)), people = listOf(person(P1)), memberships = List(2_001) { membership(UUID.randomUUID().toString(), G1, P1) }))
        assertInvalid(snapshot(groups = listOf(group(G1, name = ""))))
        assertInvalid(snapshot(groups = listOf(group(G1, name = "<b>조직</b>"))))
        assertInvalid(snapshot(groups = listOf(group(G1, name = "가".repeat(101)))))
        assertInvalid(snapshot(groups = listOf(group(G1, description = "가".repeat(301)))))
        assertInvalid(snapshot(groups = listOf(group(G1)), people = listOf(person(P1, name = "가".repeat(101)))))
        assertInvalid(snapshot(groups = listOf(group(G1)), people = listOf(person(P1, affiliation = "가".repeat(201)))))
        assertInvalid(snapshot(groups = listOf(group(G1)), people = listOf(person(P1)), memberships = listOf(membership(M1, G1, P1, role = "가".repeat(101)))))
        assertInvalid(snapshot(groups = listOf(group(G1)), people = listOf(person(P1)), memberships = listOf(membership(M1, G1, P1, affiliationOverride = "가".repeat(201)))))
        assertInvalid(snapshot(groups = listOf(group(G1, description = "<설명>"))))
        assertInvalid(snapshot(groups = listOf(group(G1)), people = listOf(person(P1, affiliation = "<소속>"))))
        assertInvalid(snapshot(groups = listOf(group(G1)), people = listOf(person(P1)), memberships = listOf(membership(M1, G1, P1, role = "<직책>"))))
    }

    private fun assertInvalid(value: OrganizationDirectorySnapshot) {
        val exception = assertThrows<BusinessException> { validator.validateAndNormalize(value) }
        assertEquals(ErrorCode.INVALID_ORGANIZATION_STRUCTURE, exception.errorCode)
    }
}
```

Use fixed UUID-v4 constants for `G1`, `G2`, `P1`, `P2`, `P3`, `M1`, `M2`, `M3`, and nine `GROUP_IDS`; helpers must construct otherwise-valid values so each assertion isolates one rule.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `./gradlew test --tests 'org.woo.forest.business.organization.OrganizationDirectoryValidatorTest'`

Expected: compilation FAIL because the organization model and validator do not exist.

- [ ] **Step 3: Add the domain types and error codes**

Create the document/value types with these exact properties:

```kotlin
@Document(collection = "organization_directory")
data class OrganizationDirectory(
    @Id val id: String = PUBLIC_ID,
    val schemaVersion: Int,
    val revision: Int,
    val groups: List<OrganizationGroup>,
    val people: List<OrganizationPerson>,
    val memberships: List<OrganizationMembership>,
    val legacyContentFingerprintAtSave: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    companion object {
        const val PUBLIC_ID = "public"
        const val CURRENT_SCHEMA_VERSION = 1
    }
}

data class OrganizationDirectorySnapshot(
    val schemaVersion: Int,
    val groups: List<OrganizationGroup>,
    val people: List<OrganizationPerson>,
    val memberships: List<OrganizationMembership>,
)

data class OrganizationGroup(val id: String, val name: String, val description: String, val parentGroupId: String?, val displayOrder: Int, val enabled: Boolean)
data class OrganizationPerson(val id: String, val name: String, val affiliation: String, val enabled: Boolean)
data class OrganizationMembership(val id: String, val groupId: String, val personId: String, val roleLabel: String, val affiliationOverride: String?, val displayOrder: Int)
```

Add:

```kotlin
INVALID_ORGANIZATION_STRUCTURE("조직도 입력값을 확인해주세요.", HttpStatus.BAD_REQUEST, WARN),
ORGANIZATION_REVISION_CONFLICT("다른 관리자가 먼저 조직도를 수정했습니다.", HttpStatus.CONFLICT, WARN),
ORGANIZATION_LEGACY_CONTENT_CONFLICT("기존 함께하는이들 소개글이 변경되었습니다.", HttpStatus.CONFLICT, WARN),
ORGANIZATION_DIRECTORY_ALREADY_CONFIGURED("구조화된 조직도 관리 화면을 사용해주세요.", HttpStatus.CONFLICT, WARN),
CORRUPT_ORGANIZATION_DIRECTORY("저장된 조직도 데이터가 올바르지 않습니다.", HttpStatus.INTERNAL_SERVER_ERROR, ERROR),
```

- [ ] **Step 4: Implement validation and normalization**

`validateAndNormalize` must execute in this order so malformed input never reaches sorting/reference code:

```kotlin
fun validateAndNormalize(snapshot: OrganizationDirectorySnapshot): OrganizationDirectorySnapshot {
    invalidIf(snapshot.schemaVersion != OrganizationDirectory.CURRENT_SCHEMA_VERSION)
    invalidIf(snapshot.groups.size > 100 || snapshot.people.size > 500 || snapshot.memberships.size > 2_000)

    val groups = snapshot.groups.map(::normalizeGroup)
    val people = snapshot.people.map(::normalizePerson)
    val memberships = snapshot.memberships.map(::normalizeMembership)

    validateUniqueIds(groups.map { it.id })
    validateUniqueIds(people.map { it.id })
    validateUniqueIds(memberships.map { it.id })
    validateReferencesAndPairs(groups, people, memberships)
    validateHierarchy(groups)

    val groupOrders = normalizeSiblingOrders(groups)
    val membershipOrders = normalizeMembershipOrders(memberships)
    return OrganizationDirectorySnapshot(snapshot.schemaVersion, groupOrders, people, membershipOrders)
}
```

Implement `isUuidV4` as `runCatching { UUID.fromString(value) }.getOrNull()?.version() == 4`. `validateHierarchy` must walk every node through its parents, reject a repeated ID, and reject `depth > 8`. `invalidIf` throws `BusinessException(ErrorCode.INVALID_ORGANIZATION_STRUCTURE)`. Text normalization must preserve the special empty override while rejecting whitespace-only override and any `<` or `>`.

- [ ] **Step 5: Run validator tests and full existing tests**

Run: `./gradlew test --tests 'org.woo.forest.business.organization.OrganizationDirectoryValidatorTest'`

Expected: all validator tests PASS.

Run: `./gradlew test`

Expected: existing and new tests PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/main/kotlin/org/woo/forest/domain/entity/organization/OrganizationDirectory.kt src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryValidator.kt src/main/kotlin/org/woo/forest/common/constants/ErrorCode.kt src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryValidatorTest.kt
git commit -m "feat: validate Forest organization snapshots"
```

---

### Task 2: Load and verify the immutable versioned seed

**Files:**
- Create: `src/main/resources/organization/default-directory-v1.json`
- Create: `src/main/kotlin/org/woo/forest/business/organization/DefaultOrganizationDirectoryProvider.kt`
- Create: `src/test/kotlin/org/woo/forest/business/organization/DefaultOrganizationDirectoryProviderTest.kt`

**Interfaces:**
- Produces: `DefaultOrganizationDirectoryProvider.get(): OrganizationDirectorySnapshot`.
- The single product-fact source is Appendix A; it contains 9 groups, 38 people, and 53 memberships.

- [ ] **Step 1: Write the failing seed contract test**

```kotlin
class DefaultOrganizationDirectoryProviderTest {
    private val mapper = jacksonObjectMapper()
    private val validator = OrganizationDirectoryValidator()

    @Test
    fun `version one seed loads validates and preserves reviewed facts`() {
        val provider = DefaultOrganizationDirectoryProvider(mapper, validator)
        val seed = provider.get()
        assertEquals(1, seed.schemaVersion)
        assertEquals(9, seed.groups.size)
        assertEquals(38, seed.people.size)
        assertEquals(53, seed.memberships.size)
        assertEquals("전북대학교 산림환경과학과 교수", membership(seed, "공동대표", "박종민").affiliationOverride)
        assertEquals("", membership(seed, "탄소중립숲분과", "박해영").affiliationOverride)
        assertEquals("분과장", membership(seed, "탄소중립숲분과", "박해영").roleLabel)
        assertEquals("운영위원장", membership(seed, "운영위원회", "황중하").roleLabel)
    }
}
```

The helper resolves names through IDs and uses `single`, causing duplicate/omitted data to fail.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `./gradlew test --tests 'org.woo.forest.business.organization.DefaultOrganizationDirectoryProviderTest'`

Expected: compilation FAIL because the provider and resource do not exist.

- [ ] **Step 3: Add the exact seed and fail-fast provider**

Copy Appendix A verbatim to `src/main/resources/organization/default-directory-v1.json`.

Implement:

```kotlin
@Component
class DefaultOrganizationDirectoryProvider(
    objectMapper: ObjectMapper,
    validator: OrganizationDirectoryValidator,
) {
    private val snapshot = ClassPathResource("organization/default-directory-v1.json")
        .inputStream.use { objectMapper.readValue(it, OrganizationDirectorySnapshot::class.java) }
        .let(validator::validateAndNormalize)

    fun get(): OrganizationDirectorySnapshot = snapshot
}
```

Do not catch parse or validation failures; bean creation must fail instead of serving fabricated or partial data.

- [ ] **Step 4: Verify seed and validator tests**

Run: `./gradlew test --tests 'org.woo.forest.business.organization.DefaultOrganizationDirectoryProviderTest' --tests 'org.woo.forest.business.organization.OrganizationDirectoryValidatorTest'`

Expected: all selected tests PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/main/resources/organization/default-directory-v1.json src/main/kotlin/org/woo/forest/business/organization/DefaultOrganizationDirectoryProvider.kt src/test/kotlin/org/woo/forest/business/organization/DefaultOrganizationDirectoryProviderTest.kt
git commit -m "feat: add Forest organization seed"
```

---

### Task 3: Add fingerprinting and atomic revision persistence

**Files:**
- Modify: `build.gradle.kts`
- Create: `src/main/kotlin/org/woo/forest/business/organization/LegacyContentFingerprintService.kt`
- Create: `src/main/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepository.kt`
- Create: `src/main/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepositoryCustomImpl.kt`
- Create: `src/test/kotlin/org/woo/forest/business/organization/LegacyContentFingerprintServiceTest.kt`
- Create: `src/test/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepositoryIntegrationTest.kt`

**Interfaces:**
- Produces: `LegacyContentFingerprintService.current(): String` formatted `sha256:<64 lowercase hex>`.
- Produces: `OrganizationDirectoryRepository.insertFirst(snapshot, fingerprint, now)` and `updateIfRevisionMatches(expectedRevision, snapshot, fingerprint, now)`.
- `null` update result and duplicate first insert map to `ORGANIZATION_REVISION_CONFLICT` in the service layer.

- [ ] **Step 1: Add test dependencies and failing fingerprint tests**

Add only:

```kotlin
testImplementation("org.springframework.boot:spring-boot-testcontainers")
testImplementation("org.testcontainers:junit-jupiter")
testImplementation("org.testcontainers:mongodb")
```

Fingerprint tests must assert:

```kotlin
assertEquals(
    "sha256:1cae417042e0935f824a69a2b480a8b3374583781e371fdd0665de51c81eb2b7",
    service.current(),
)
assertNotEquals(fingerprintOfAbsent, fingerprintOfPresentEmptyString)
assertNotEquals(fingerprintOf("가"), fingerprintOf("가 "))
```

Mock `StaticContentRepository.findById("intro-people")` for absent, empty, and exact raw content.

- [ ] **Step 2: Verify fingerprint RED**

Run: `./gradlew test --tests 'org.woo.forest.business.organization.LegacyContentFingerprintServiceTest'`

Expected: compilation FAIL because the service does not exist.

- [ ] **Step 3: Implement domain-separated SHA-256**

```kotlin
@Service
class LegacyContentFingerprintService(
    private val staticContentRepository: StaticContentRepository,
) {
    fun current(): String {
        val content = staticContentRepository.findById(INTRO_PEOPLE_KEY).orElse(null)?.content
        val source = if (content == null) ABSENT else "$CONTENT_PREFIX\u0000$content"
        val digest = MessageDigest.getInstance("SHA-256").digest(source.toByteArray(StandardCharsets.UTF_8))
        return "sha256:" + digest.joinToString("") { "%02x".format(it) }
    }

    companion object {
        const val INTRO_PEOPLE_KEY = "intro-people"
        private const val ABSENT = "forest:intro-people:absent:v1"
        private const val CONTENT_PREFIX = "forest:intro-people:content:v1"
    }
}
```

- [ ] **Step 4: Write the failing Mongo integration tests**

Use `MongoDBContainer("mongo:7.0.14")`, register the replica-set URL with `@DynamicPropertySource`, import the repository implementation, and clean `organization_directory` before each test. Implement these four tests: `first insert stores revision one and duplicate first insert fails`, `matching revision atomically returns revision plus one`, `stale revision returns null and preserves the winning snapshot`, and `two concurrent updates from the same revision produce one winner`.

For the concurrency test, start two `CompletableFuture` calls behind one `CountDownLatch`, then assert `results.count { it != null } == 1` and persisted revision is 2.

- [ ] **Step 5: Verify repository RED**

Run: `./gradlew test --tests 'org.woo.forest.domain.repository.OrganizationDirectoryRepositoryIntegrationTest'`

Expected: compilation FAIL because the repository contract/implementation do not exist.

- [ ] **Step 6: Implement insert and CAS update**

```kotlin
interface OrganizationDirectoryRepository : MongoRepository<OrganizationDirectory, String>, OrganizationDirectoryRepositoryCustom

interface OrganizationDirectoryRepositoryCustom {
    fun insertFirst(snapshot: OrganizationDirectorySnapshot, fingerprint: String, now: LocalDateTime): OrganizationDirectory
    fun updateIfRevisionMatches(expectedRevision: Int, snapshot: OrganizationDirectorySnapshot, fingerprint: String, now: LocalDateTime): OrganizationDirectory?
}
```

`insertFirst` must call `mongoTemplate.insert` with revision 1. `updateIfRevisionMatches` must call:

```kotlin
mongoTemplate.findAndModify(
    Query.query(Criteria.where("_id").`is`(OrganizationDirectory.PUBLIC_ID).and("revision").`is`(expectedRevision)),
    Update()
        .set("schemaVersion", snapshot.schemaVersion)
        .set("groups", snapshot.groups)
        .set("people", snapshot.people)
        .set("memberships", snapshot.memberships)
        .set("legacyContentFingerprintAtSave", fingerprint)
        .set("updatedAt", now)
        .inc("revision", 1),
    FindAndModifyOptions.options().returnNew(true).upsert(false),
    OrganizationDirectory::class.java,
)
```

- [ ] **Step 7: Run persistence tests**

Run: `./gradlew test --tests 'org.woo.forest.business.organization.LegacyContentFingerprintServiceTest' --tests 'org.woo.forest.domain.repository.OrganizationDirectoryRepositoryIntegrationTest'`

Expected: all selected tests PASS; Testcontainers reports one Mongo container and the concurrency assertion has exactly one winner.

- [ ] **Step 8: Commit Task 3**

```bash
git add build.gradle.kts src/main/kotlin/org/woo/forest/business/organization/LegacyContentFingerprintService.kt src/main/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepository.kt src/main/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepositoryCustomImpl.kt src/test/kotlin/org/woo/forest/business/organization/LegacyContentFingerprintServiceTest.kt src/test/kotlin/org/woo/forest/domain/repository/OrganizationDirectoryRepositoryIntegrationTest.kt
git commit -m "feat: persist revisioned Forest organizations"
```

---

### Task 4: Project safe public data and implement manage/update orchestration

**Files:**
- Create: `src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryProjector.kt`
- Create: `src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryService.kt`
- Create: `src/main/kotlin/org/woo/forest/dto/organization/OrganizationDirectoryDto.kt`
- Create: `src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryProjectorTest.kt`
- Create: `src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryServiceTest.kt`

**Interfaces:**
- Produces distinct `PublicOrganizationDirectoryResponse` and `ManagedOrganizationDirectoryResponse`; public never has a fingerprint property.
- `getPublicDirectory()`, `getManagedDirectory(passport)`, `updateManagedDirectory(passport, request)`.

- [ ] **Step 1: Write projector tests and verify RED**

Implement these exact cases: `public projection excludes disabled groups people memberships and unreferenced people`, `enabled child under disabled parent is excluded`, `public projection preserves normalized group and membership order`, and `affiliation override tri-state is preserved without server-side guessing`.

Run: `./gradlew test --tests 'org.woo.forest.business.organization.OrganizationDirectoryProjectorTest'`

Expected: compilation FAIL because the projector does not exist.

- [ ] **Step 2: Implement the projector**

Build `visibleGroupIds` by requiring the group and every ancestor to be enabled. Keep memberships whose group is visible and whose person is enabled, then keep only referenced people. Never mutate the input snapshot; return copied lists in their already normalized order.

- [ ] **Step 3: Write service tests and verify RED**

Service tests must prove: missing document returns seed revision zero without repository write; public response filters private data and exposes drift boolean but has no fingerprint type; managed response rejects an ordinary user, while an admin succeeds with private data plus the current fingerprint; a max-access user can manage even with `ROLE_USER`; an invalid persisted document fails closed as `CORRUPT_ORGANIZATION_DIRECTORY`; a negative revision is rejected as `INVALID_ORGANIZATION_STRUCTURE` before fingerprint/repository access; a changed legacy fingerprint is rejected before repository mutation; revision zero inserts revision one and maps duplicate key to revision conflict; later saves use compare-and-swap and map a null result to revision conflict; and a race after save is returned as `legacyContentDrift=true`.

Run: `./gradlew test --tests 'org.woo.forest.business.organization.OrganizationDirectoryServiceTest'`

Expected: compilation FAIL because DTOs and service do not exist.

- [ ] **Step 4: Implement DTOs and service**

Use these response boundaries:

```kotlin
data class UpdateOrganizationDirectoryRequest(val schemaVersion: Int, val revision: Int, val legacyContentFingerprint: String, val groups: List<OrganizationGroup>, val people: List<OrganizationPerson>, val memberships: List<OrganizationMembership>)
data class PublicOrganizationDirectoryResponse(val schemaVersion: Int, val configured: Boolean, val revision: Int, val legacyContentDrift: Boolean, val groups: List<OrganizationGroup>, val people: List<OrganizationPerson>, val memberships: List<OrganizationMembership>, val updatedAt: LocalDateTime?)
data class ManagedOrganizationDirectoryResponse(val schemaVersion: Int, val configured: Boolean, val revision: Int, val legacyContentDrift: Boolean, val legacyContentFingerprint: String, val groups: List<OrganizationGroup>, val people: List<OrganizationPerson>, val memberships: List<OrganizationMembership>, val updatedAt: LocalDateTime?)
```

Service save order must be: `onlyAdmin` → reject `revision < 0` as `INVALID_ORGANIZATION_STRUCTURE` → validate/normalize request → compute current fingerprint → compare request fingerprint → insert/CAS → validate saved document → recompute current fingerprint for returned drift. Catch only `DuplicateKeyException` around first insert and map it to revision conflict. A persisted document failing validation maps to `CORRUPT_ORGANIZATION_DIRECTORY`; do not replace it with seed data.

- [ ] **Step 5: Run business tests**

Run: `./gradlew test --tests 'org.woo.forest.business.organization.*'`

Expected: validator, provider, fingerprint, projector, and service tests PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryProjector.kt src/main/kotlin/org/woo/forest/business/organization/OrganizationDirectoryService.kt src/main/kotlin/org/woo/forest/dto/organization/OrganizationDirectoryDto.kt src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryProjectorTest.kt src/test/kotlin/org/woo/forest/business/organization/OrganizationDirectoryServiceTest.kt
git commit -m "feat: expose safe Forest organization views"
```

---

### Task 5: Expose endpoints and guard the legacy editor

**Files:**
- Create: `src/main/kotlin/org/woo/forest/presentation/rest/OrganizationDirectoryController.kt`
- Create: `src/test/kotlin/org/woo/forest/presentation/rest/OrganizationDirectoryControllerTest.kt`
- Modify: `src/main/kotlin/org/woo/forest/business/StaticContentService.kt`
- Create: `src/test/kotlin/org/woo/forest/business/StaticContentServiceTest.kt`

**Interfaces:**
- Public GET is annotated `@PublicEndPoint`.
- Manage GET/PUT Passport parameters are annotated `@AuthenticationUser`.
- Existing static-content guard occurs after admin authorization and before lookup/save.

- [ ] **Step 1: Write failing controller route tests**

Use standalone MockMvc with the real `PassportInterceptor`, `GlobalExceptionHandler`, and a test argument resolver that calls the existing `HttpServletRequest.getPassport()` after the interceptor succeeds. Send a serialized valid admin Passport header for success cases. Assert:

```kotlin
mockMvc.perform(get("/api/v1/organization"))
    .andExpect(status().isOk)
    .andExpect(jsonPath("$.data.configured").value(false))
    .andExpect(jsonPath("$.data.legacyContentFingerprint").doesNotExist())

mockMvc.perform(get("/api/v1/organization/manage"))
    .andExpect(status().isForbidden)
    .andExpect(jsonPath("$.code").value("FORBIDDEN"))

mockMvc.perform(get("/api/v1/organization/manage").header("X-User-Passport", "not-json"))
    .andExpect(status().isForbidden)
    .andExpect(jsonPath("$.code").value("FORBIDDEN"))

mockMvc.perform(get("/api/v1/organization/manage").header("X-User-Passport", serializedAdminPassport))
    .andExpect(status().isOk)
    .andExpect(jsonPath("$.data.legacyContentFingerprint").exists())

mockMvc.perform(put("/api/v1/organization/manage").header("X-User-Passport", serializedAdminPassport).contentType(APPLICATION_JSON).content(objectMapper.writeValueAsBytes(request)))
    .andExpect(status().isOk)
    .andExpect(jsonPath("$.data.revision").value(1))
```

Also send a serialized valid non-admin Passport through both manage routes, have the mocked service throw `BusinessException(FORBIDDEN)` for that fixture, and assert the common 403 envelope. Together with the real-service role tests in Task 4, this proves the route requirements and role authorization without changing the shared 403 contract.

Run: `./gradlew test --tests 'org.woo.forest.presentation.rest.OrganizationDirectoryControllerTest'`

Expected: compilation FAIL because the controller does not exist.

- [ ] **Step 2: Implement the controller exactly**

```kotlin
@RestController
@RequestMapping("/api/v1/organization")
class OrganizationDirectoryController(private val service: OrganizationDirectoryService) {
    @PublicEndPoint
    @GetMapping
    fun getPublic() = SucceededApiResponseBody(service.getPublicDirectory())

    @GetMapping("/manage")
    fun getManaged(@AuthenticationUser @Parameter(hidden = true) passport: Passport) =
        SucceededApiResponseBody(service.getManagedDirectory(passport))

    @PutMapping("/manage")
    fun updateManaged(
        @AuthenticationUser @Parameter(hidden = true) passport: Passport,
        @RequestBody request: UpdateOrganizationDirectoryRequest,
    ) = SucceededApiResponseBody(service.updateManagedDirectory(passport, request))
}
```

- [ ] **Step 3: Write failing legacy guard tests**

Construct `StaticContentService` with mocked repositories and implement four tests: `unauthorized user receives forbidden before configured state is checked`, `configured organization blocks intro people update with dedicated conflict`, `unconfigured intro people update retains existing behavior`, and `configured organization does not block another static content key`.

Verify the blocked case never calls `staticContentRepository.findById` or `save`.

- [ ] **Step 4: Add the service-layer guard**

Immediately after the existing `onlyAdmin(passport)` call:

```kotlin
if (
    contentKey == LegacyContentFingerprintService.INTRO_PEOPLE_KEY &&
    organizationDirectoryRepository.existsById(OrganizationDirectory.PUBLIC_ID)
) {
    throw BusinessException(ErrorCode.ORGANIZATION_DIRECTORY_ALREADY_CONFIGURED)
}
```

- [ ] **Step 5: Add and run the real request-to-Mongo integration test**

Create `OrganizationDirectoryApiIntegrationTest` with this real slice boundary:

```kotlin
@WebMvcTest(OrganizationDirectoryController::class)
@AutoConfigureMockMvc
@Import(
    OrganizationDirectoryService::class,
    OrganizationDirectoryValidator::class,
    OrganizationDirectoryProjector::class,
    DefaultOrganizationDirectoryProvider::class,
    LegacyContentFingerprintService::class,
    OrganizationDirectoryRepositoryCustomImpl::class,
    AccessControlService::class,
    PassportInterceptor::class,
    AuthenticationResolver::class,
    WebMvcConfig::class,
    GlobalExceptionHandler::class,
    MongoDbConfig::class,
)
@ImportAutoConfiguration(MongoAutoConfiguration::class, MongoDataAutoConfiguration::class)
@EnableMongoRepositories(basePackageClasses = [OrganizationDirectoryRepository::class, StaticContentRepository::class])
@Testcontainers
class OrganizationDirectoryApiIntegrationTest {
    companion object {
        @Container
        @JvmStatic
        val mongo = MongoDBContainer(DockerImageName.parse("mongo:7.0.14"))

        @DynamicPropertySource
        @JvmStatic
        fun mongoProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl)
        }
    }

    @MockitoBean
    lateinit var authGrpcService: AuthGrpcService
}
```

Send a serialized admin Passport whose `UserContext` is already loaded so the request performs no external gRPC call. Do not mock the controller, access control, organization services, fingerprint service, repositories, MongoTemplate, interceptor, resolver, or exception advice.

Before each test, clear only `organization_directory` and `static_content`. Execute one real flow through MockMvc:

1. unauthenticated `GET /api/v1/organization/manage` returns 403;
2. authenticated manage GET returns `configured=false`, `revision=0`, the seed arrays, and a valid current legacy fingerprint;
3. construct the PUT body from that response's `schemaVersion`, `revision`, `legacyContentFingerprint`, `groups`, `people`, and `memberships`, set the first person's `enabled` to false while keeping its memberships, and send one authenticated `PUT /api/v1/organization/manage`;
4. assert 200, `configured=true`, `revision=1`, then inspect Mongo to assert one document with ID `public`, revision 1, and no `intro-people` static-content write;
5. authenticated manage GET returns the same saved structure at revision 1;
6. public GET without a Passport returns 200, contains no fingerprint property, and excludes the disabled person's ID plus every membership that references it while manage GET still retains them;
7. replay the original revision-0 PUT and assert 409 `ORGANIZATION_REVISION_CONFLICT` while Mongo remains revision 1.

Run: `./gradlew test --tests 'org.woo.forest.integration.OrganizationDirectoryApiIntegrationTest'`

Expected: PASS with one isolated Mongo container and no external service calls.

- [ ] **Step 6: Run controller, guard, and full tests**

Run: `./gradlew test --tests 'org.woo.forest.presentation.rest.OrganizationDirectoryControllerTest' --tests 'org.woo.forest.business.StaticContentServiceTest'`

Expected: selected tests PASS.

Run: `./gradlew test`

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/main/kotlin/org/woo/forest/presentation/rest/OrganizationDirectoryController.kt src/test/kotlin/org/woo/forest/presentation/rest/OrganizationDirectoryControllerTest.kt src/main/kotlin/org/woo/forest/business/StaticContentService.kt src/test/kotlin/org/woo/forest/business/StaticContentServiceTest.kt src/test/kotlin/org/woo/forest/integration/OrganizationDirectoryApiIntegrationTest.kt
git commit -m "feat: add Forest organization management API"
```

---

### Task 6: Verify the backend, synchronize PRD, and stop at deployment approval

**Files:**
- Modify through `source-command-prd-sync`: `/Users/park/Desktop/project/prd/forest/requirements.md`
- Modify through `source-command-prd-sync`: `/Users/park/Desktop/project/prd/forest/api-spec.md`

**Interfaces:**
- Produces a tested backend commit series and synchronized Forest product truth.
- Does not deploy.

- [ ] **Step 1: Run complete verification from a clean process**

Run:

```bash
./gradlew clean test
./gradlew test --tests 'org.woo.forest.integration.OrganizationDirectoryApiIntegrationTest'
./gradlew build
git diff --check
git status --short
```

Expected: Gradle commands exit 0; no failed/skipped organization tests; `git diff --check` is silent; status contains only intentional files before their final commit.

- [ ] **Step 2: Review the complete backend diff**

Run:

```bash
git diff --stat df6746c06cdae0ec9e812dc687f075880fa6f6dc..HEAD
git diff df6746c06cdae0ec9e812dc687f075880fa6f6dc..HEAD -- src/main src/test build.gradle.kts
```

Verify no `gradle.properties`, credential, unrelated endpoint, common module, or CI workflow change. Verify public response type has no fingerprint property.

- [ ] **Step 3: Request code review and re-run affected verification**

Use `superpowers:requesting-code-review`. Resolve only verified findings, then re-run `./gradlew clean test`, `./gradlew build`, and `git diff --check`.

- [ ] **Step 4: Invoke `source-command-prd-sync` once for this backend work unit**

After the reviewed backend diff is final, sync only verified facts into Forest requirements/API spec: three endpoints, exact payload fields, five error codes, 403 auth behavior, configured-after guard, revision/fingerprint semantics, public filtering, seed fallback, and no-write GET. Do not copy planned or unverified deployment status.

- [ ] **Step 5: Validate and commit PRD changes in the PRD repository that owns them**

Run the sync skill's required checks plus:

```bash
git diff --check -- prd/forest/requirements.md prd/forest/api-spec.md
```

Commit using the owning repository's normal boundary; do not mix the PRD files into the Forest repo if they are outside it.

- [ ] **Step 6: Stop and request explicit backend deployment confirmation**

Report commit SHAs, exact test counts, build result, PRD sync result, and the read-only smoke plan. Do not push/deploy until the user approves the external action.

---

## Appendix A: Exact version-1 seed manifest

The implementation must copy the complete JSON below verbatim; no runtime parsing of JSX and no automatic name-based identity merging.

```json
{
  "schemaVersion": 1,
  "groups": [
    { "id": "8c716072-65de-4d69-a5b6-5092de822dc3", "name": "공동대표", "description": "", "parentGroupId": null, "displayOrder": 10, "enabled": true },
    { "id": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "name": "이사회", "description": "", "parentGroupId": null, "displayOrder": 20, "enabled": true },
    { "id": "45f6aeb9-f18b-4c08-a0f2-dbedf3d0242b", "name": "감사", "description": "", "parentGroupId": null, "displayOrder": 30, "enabled": true },
    { "id": "1d8a8c78-cdb3-4bbb-a613-b770ebad8f61", "name": "운영위원회", "description": "", "parentGroupId": null, "displayOrder": 40, "enabled": true },
    { "id": "5bcb95ad-27c8-4d2d-be49-7d37227fc22c", "name": "탄소중립숲분과", "description": "", "parentGroupId": "1d8a8c78-cdb3-4bbb-a613-b770ebad8f61", "displayOrder": 10, "enabled": true },
    { "id": "9e8987b7-e0c3-44b8-ae89-3200a30d987b", "name": "숲문화탐방분과", "description": "", "parentGroupId": "1d8a8c78-cdb3-4bbb-a613-b770ebad8f61", "displayOrder": 20, "enabled": true },
    { "id": "133b0c53-4ea4-4163-8f90-76e9180691d1", "name": "숲교육분과", "description": "", "parentGroupId": "1d8a8c78-cdb3-4bbb-a613-b770ebad8f61", "displayOrder": 30, "enabled": true },
    { "id": "4c83c304-cce1-46a7-8a98-b4c548574829", "name": "숲조직홍보분과", "description": "", "parentGroupId": "1d8a8c78-cdb3-4bbb-a613-b770ebad8f61", "displayOrder": 40, "enabled": true },
    { "id": "724c0d79-fc61-403c-ada6-4e7e226ecdbc", "name": "사무국", "description": "", "parentGroupId": null, "displayOrder": 50, "enabled": true }
  ],
  "people": [
    { "id": "cdde7303-d7dc-4f92-a560-b799fd3e61f1", "name": "박종민", "affiliation": "전북대학교 산림환경과학과", "enabled": true },
    { "id": "90439aea-97d5-4043-ad5f-1bf2da6d2a8d", "name": "박해영", "affiliation": "금강유역환경회의 전북지역위원회대표", "enabled": true },
    { "id": "3eb1e41c-1cbf-497f-a42e-779388c00b94", "name": "김정숙", "affiliation": "산소리숲마을", "enabled": true },
    { "id": "3ce8ca03-b185-466e-80ab-959f3165f648", "name": "양차랑", "affiliation": "국립생태원", "enabled": true },
    { "id": "04278356-e0bb-4c0b-81d6-51b33dfd82ba", "name": "김계숙", "affiliation": "숲쟁이협동조합", "enabled": true },
    { "id": "bf6f825b-a533-4296-bad3-665a7236f6df", "name": "김석균", "affiliation": "흙건축연구소 대표", "enabled": true },
    { "id": "a789c766-db62-43eb-8a4d-61cc07aaba77", "name": "김양용", "affiliation": "숲해설가", "enabled": true },
    { "id": "140390ab-0d60-4c85-ad3a-526c50195415", "name": "김연주", "affiliation": "작가, 숲해설가", "enabled": true },
    { "id": "5594081d-0917-4766-8e7c-3ae7f161d6ee", "name": "김은아", "affiliation": "산림치유지도사", "enabled": true },
    { "id": "ac482f1e-b74f-430e-a917-5b17a3dce714", "name": "김종찬", "affiliation": "전주한일고등학교", "enabled": true },
    { "id": "a8e9bc59-b849-45ab-9ba9-32631b685be7", "name": "김창석", "affiliation": "평화의숲전북연대", "enabled": true },
    { "id": "a597e837-23b5-4cf0-9794-c7cc9f2df29b", "name": "박성수", "affiliation": "前전북생명의숲사무국장", "enabled": true },
    { "id": "ff4169a7-f9a7-4238-8ecd-841a042d677c", "name": "서욱현", "affiliation": "구례자연드림파크밀크쿱대표", "enabled": true },
    { "id": "c1dbb02b-012d-4cf6-96e6-7b2ac769afff", "name": "손재호", "affiliation": "산림기술사", "enabled": true },
    { "id": "87b5feab-5d60-48e8-8e4e-f741310ca648", "name": "양준화", "affiliation": "前전북생명의숲활동가", "enabled": true },
    { "id": "ad91969a-2032-46b9-b68b-4aa65640fa80", "name": "윤여인", "affiliation": "숲정이산림기술사사무소", "enabled": true },
    { "id": "4c8711eb-830b-4c38-9c8b-9b8ef5afb594", "name": "오흥근", "affiliation": "전북강살리기추진단", "enabled": true },
    { "id": "7571e156-63cd-4449-9ffd-a3e350d65621", "name": "이은성", "affiliation": "산소리숲마을", "enabled": true },
    { "id": "7c158e21-451f-494e-a08a-8ee4a2ea1b55", "name": "이은주", "affiliation": "전주시새활용센터", "enabled": true },
    { "id": "54354429-d221-4412-886b-8bda5bfe6605", "name": "이창헌", "affiliation": "전북대학교 산림환경과학과", "enabled": true },
    { "id": "c138bcf7-7e9f-4fe1-a798-b7664f62cbba", "name": "전경수", "affiliation": "前원광대학교 환경조경학과", "enabled": true },
    { "id": "754c2736-2f94-4643-8817-b3bbfa883a2b", "name": "전정일", "affiliation": "(사)생태교육센터 숲터대표", "enabled": true },
    { "id": "5d178bb5-f571-4d3d-a00e-a0ebdde80dd5", "name": "정용준", "affiliation": "완주군귀농귀촌지원센터장", "enabled": true },
    { "id": "0b0474ab-bd2d-4d29-b995-ad31606100d4", "name": "정진권", "affiliation": "前한일고등학교", "enabled": true },
    { "id": "5ee1fc2f-01ab-4659-8f7d-6a8a0e3f6981", "name": "조명자", "affiliation": "산소리숲마을대표", "enabled": true },
    { "id": "cdbfd749-94e1-4f00-9cae-a61058cd8d5c", "name": "최석원", "affiliation": "장수군청 산림공원과", "enabled": true },
    { "id": "7471bdfa-92a4-471e-b643-516a26f5e574", "name": "표효숙", "affiliation": "숲해설가", "enabled": true },
    { "id": "a2e5ca79-a104-4bdb-b8df-36485b98d078", "name": "한경연", "affiliation": "前 성일고등학교 교사", "enabled": true },
    { "id": "14f683c8-ec57-4031-bd22-0ad3794d018a", "name": "홍석기", "affiliation": "이화유치원", "enabled": true },
    { "id": "0ff4f076-da29-40f5-b3c1-12f4c1c05a49", "name": "황중하", "affiliation": "두산임업(유)", "enabled": true },
    { "id": "c2841fef-7658-42a1-9301-6d70d0e9d7f1", "name": "박영호", "affiliation": "", "enabled": true },
    { "id": "e2ed3c09-7d5a-4ece-abac-0684f71dc421", "name": "박형근", "affiliation": "", "enabled": true },
    { "id": "4f4c1cb1-b225-4541-89d3-2f41382d9c33", "name": "차옥순", "affiliation": "", "enabled": true },
    { "id": "624d0f99-20ac-4ca6-a201-1253edab26a3", "name": "김기수", "affiliation": "", "enabled": true },
    { "id": "9ed1b853-8d8e-4530-83fc-005f15a24c77", "name": "오광민", "affiliation": "", "enabled": true },
    { "id": "3cb03c2b-9e8e-45fc-b4c7-5aa5052304b3", "name": "이근자", "affiliation": "", "enabled": true },
    { "id": "058fd811-bd95-44f5-a711-2d6200deea28", "name": "박은미", "affiliation": "", "enabled": true },
    { "id": "4c56603e-1069-4c8c-ad61-bf76831f6c17", "name": "박정섭", "affiliation": "", "enabled": true }
  ],
  "memberships": [
    { "id": "abbce94d-52ae-46aa-b736-607f12835d7d", "groupId": "8c716072-65de-4d69-a5b6-5092de822dc3", "personId": "cdde7303-d7dc-4f92-a560-b799fd3e61f1", "roleLabel": "공동대표", "affiliationOverride": "전북대학교 산림환경과학과 교수", "displayOrder": 10 },
    { "id": "9491f172-b153-457f-bdb2-ea7397361ec3", "groupId": "8c716072-65de-4d69-a5b6-5092de822dc3", "personId": "90439aea-97d5-4043-ad5f-1bf2da6d2a8d", "roleLabel": "공동대표", "affiliationOverride": "금강유역환경회의 전북지역위원회 대표", "displayOrder": 20 },
    { "id": "eb433f2d-8a4d-4d7b-abf4-3e311a8b1de7", "groupId": "8c716072-65de-4d69-a5b6-5092de822dc3", "personId": "3eb1e41c-1cbf-497f-a42e-779388c00b94", "roleLabel": "공동대표", "affiliationOverride": null, "displayOrder": 30 },
    { "id": "32383988-34a5-4134-baa3-aa07ceab2f06", "groupId": "45f6aeb9-f18b-4c08-a0f2-dbedf3d0242b", "personId": "3ce8ca03-b185-466e-80ab-959f3165f648", "roleLabel": "사업감사", "affiliationOverride": null, "displayOrder": 10 },
    { "id": "279b7866-2912-44ff-9d0d-3dce89abb0ab", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "04278356-e0bb-4c0b-81d6-51b33dfd82ba", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 10 },
    { "id": "55166fa7-2c80-456c-9ed9-a55c61eefe51", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "bf6f825b-a533-4296-bad3-665a7236f6df", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 20 },
    { "id": "af354a8c-d317-4550-b0b2-95345de0afc2", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "a789c766-db62-43eb-8a4d-61cc07aaba77", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 30 },
    { "id": "2be36abb-0f20-45c8-9193-b2fdd67475e1", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "140390ab-0d60-4c85-ad3a-526c50195415", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 40 },
    { "id": "d21d93bd-a6f9-45f8-85ac-184109ae4f5e", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "5594081d-0917-4766-8e7c-3ae7f161d6ee", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 50 },
    { "id": "bda92112-2549-48fe-848e-e378e4cde501", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "3eb1e41c-1cbf-497f-a42e-779388c00b94", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 60 },
    { "id": "ac5acc0d-4d60-4f5e-be54-8f8fd05f6a54", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "ac482f1e-b74f-430e-a917-5b17a3dce714", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 70 },
    { "id": "f53c0031-3aac-416f-a6ea-ce8404feb2b5", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "a8e9bc59-b849-45ab-9ba9-32631b685be7", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 80 },
    { "id": "86b7b18b-0959-452e-9d52-14846728c297", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "a597e837-23b5-4cf0-9794-c7cc9f2df29b", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 90 },
    { "id": "9c820730-e46d-40ab-b069-b896289da32d", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "cdde7303-d7dc-4f92-a560-b799fd3e61f1", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 100 },
    { "id": "b705ff09-9d60-431a-a344-321efb285287", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "90439aea-97d5-4043-ad5f-1bf2da6d2a8d", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 110 },
    { "id": "984145d4-e4b2-4ecc-82f0-0381964cac19", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "ff4169a7-f9a7-4238-8ecd-841a042d677c", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 120 },
    { "id": "5cd998c1-4110-4b8b-a9e9-fa171f42348e", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "c1dbb02b-012d-4cf6-96e6-7b2ac769afff", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 130 },
    { "id": "0a0be9dc-0618-45f7-b4b2-70a7136b7c83", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "87b5feab-5d60-48e8-8e4e-f741310ca648", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 140 },
    { "id": "38330cd7-5c08-49cc-8d74-7d7448f51895", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "3ce8ca03-b185-466e-80ab-959f3165f648", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 150 },
    { "id": "7d359bca-b887-414e-873d-f9213008a7d8", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "ad91969a-2032-46b9-b68b-4aa65640fa80", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 160 },
    { "id": "ba8b8fc7-676e-45d0-b4ec-3973ff859440", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "4c8711eb-830b-4c38-9c8b-9b8ef5afb594", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 170 },
    { "id": "7baa1bc6-b660-4100-a622-cf0c78c60c5f", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "7571e156-63cd-4449-9ffd-a3e350d65621", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 180 },
    { "id": "1df03a64-6542-42ae-a8c1-63e640761ec8", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "7c158e21-451f-494e-a08a-8ee4a2ea1b55", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 190 },
    { "id": "36060391-7f33-426b-b257-b0963f32b40b", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "54354429-d221-4412-886b-8bda5bfe6605", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 200 },
    { "id": "f62cabf9-d836-47b8-9ef8-3d8950147c9f", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "c138bcf7-7e9f-4fe1-a798-b7664f62cbba", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 210 },
    { "id": "0dad8a30-8247-4697-b988-dda3cc22e1f6", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "754c2736-2f94-4643-8817-b3bbfa883a2b", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 220 },
    { "id": "078505cd-1da7-4e8e-a757-3fe29dc7e1ac", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "5d178bb5-f571-4d3d-a00e-a0ebdde80dd5", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 230 },
    { "id": "0165f63e-0e1f-4684-9537-eaf0c17c08a8", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "0b0474ab-bd2d-4d29-b995-ad31606100d4", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 240 },
    { "id": "a9cb8366-087f-458d-82f2-1438ef7fa9b6", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "5ee1fc2f-01ab-4659-8f7d-6a8a0e3f6981", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 250 },
    { "id": "3152356b-97db-4165-bb9c-c997f72a3275", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "cdbfd749-94e1-4f00-9cae-a61058cd8d5c", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 260 },
    { "id": "4e8b0481-2a1e-4dc4-98e2-e6e3149e5c92", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "7471bdfa-92a4-471e-b643-516a26f5e574", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 270 },
    { "id": "3b9789b6-0f42-44b8-b45b-ff9f22c3e72f", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "a2e5ca79-a104-4bdb-b8df-36485b98d078", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 280 },
    { "id": "4165b436-9f6b-49cc-a238-6806069bc9e5", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "14f683c8-ec57-4031-bd22-0ad3794d018a", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 290 },
    { "id": "283c197f-789e-4a8d-88ad-8cfdb7ebf13f", "groupId": "666a6259-7ff1-4c55-88aa-01d40d75e26e", "personId": "0ff4f076-da29-40f5-b3c1-12f4c1c05a49", "roleLabel": "이사", "affiliationOverride": null, "displayOrder": 300 },
    { "id": "2079af24-d441-45c5-b565-3fc4ae143027", "groupId": "1d8a8c78-cdb3-4bbb-a613-b770ebad8f61", "personId": "0ff4f076-da29-40f5-b3c1-12f4c1c05a49", "roleLabel": "운영위원장", "affiliationOverride": "", "displayOrder": 10 },
    { "id": "5bb44f3e-2e7c-4792-a0dc-99557054ed26", "groupId": "5bcb95ad-27c8-4d2d-be49-7d37227fc22c", "personId": "90439aea-97d5-4043-ad5f-1bf2da6d2a8d", "roleLabel": "분과장", "affiliationOverride": "", "displayOrder": 10 },
    { "id": "6d4a6443-dd6a-4c37-8f1b-982b3eb4deae", "groupId": "5bcb95ad-27c8-4d2d-be49-7d37227fc22c", "personId": "140390ab-0d60-4c85-ad3a-526c50195415", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 20 },
    { "id": "75db51ad-e1c8-4dde-b78c-578cf1508e5c", "groupId": "5bcb95ad-27c8-4d2d-be49-7d37227fc22c", "personId": "a8e9bc59-b849-45ab-9ba9-32631b685be7", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 30 },
    { "id": "436ab595-3e79-428a-b140-472c40eab4dc", "groupId": "9e8987b7-e0c3-44b8-ae89-3200a30d987b", "personId": "754c2736-2f94-4643-8817-b3bbfa883a2b", "roleLabel": "분과장", "affiliationOverride": "", "displayOrder": 10 },
    { "id": "118c5698-be03-4a6b-bfba-651894f2bda4", "groupId": "9e8987b7-e0c3-44b8-ae89-3200a30d987b", "personId": "c2841fef-7658-42a1-9301-6d70d0e9d7f1", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 20 },
    { "id": "85a06a46-6a21-4d3a-b868-8c31a213f094", "groupId": "9e8987b7-e0c3-44b8-ae89-3200a30d987b", "personId": "e2ed3c09-7d5a-4ece-abac-0684f71dc421", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 30 },
    { "id": "c52c3262-cc0f-48a0-a24b-995a45a6081a", "groupId": "9e8987b7-e0c3-44b8-ae89-3200a30d987b", "personId": "4f4c1cb1-b225-4541-89d3-2f41382d9c33", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 40 },
    { "id": "c05dd955-fa0d-4ff4-b9f1-35a0f7900b04", "groupId": "133b0c53-4ea4-4163-8f90-76e9180691d1", "personId": "0b0474ab-bd2d-4d29-b995-ad31606100d4", "roleLabel": "분과장", "affiliationOverride": "", "displayOrder": 10 },
    { "id": "cae66b2b-da8a-4eaa-be2a-b7e295be186d", "groupId": "133b0c53-4ea4-4163-8f90-76e9180691d1", "personId": "624d0f99-20ac-4ca6-a201-1253edab26a3", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 20 },
    { "id": "f9773e8e-fdce-4530-acf4-6b264e1c49ac", "groupId": "133b0c53-4ea4-4163-8f90-76e9180691d1", "personId": "5594081d-0917-4766-8e7c-3ae7f161d6ee", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 30 },
    { "id": "1c87a1c6-50b8-4cd4-85fe-b199cac99963", "groupId": "133b0c53-4ea4-4163-8f90-76e9180691d1", "personId": "9ed1b853-8d8e-4530-83fc-005f15a24c77", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 40 },
    { "id": "71bdcc43-b222-4164-83a2-856926deac6e", "groupId": "133b0c53-4ea4-4163-8f90-76e9180691d1", "personId": "3cb03c2b-9e8e-45fc-b4c7-5aa5052304b3", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 50 },
    { "id": "70ebbdf6-a87c-4f12-aad1-58e8a59ac4fa", "groupId": "133b0c53-4ea4-4163-8f90-76e9180691d1", "personId": "058fd811-bd95-44f5-a711-2d6200deea28", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 60 },
    { "id": "3fe1e83d-e6b2-4bbb-be24-b2294dcd073d", "groupId": "4c83c304-cce1-46a7-8a98-b4c548574829", "personId": "0ff4f076-da29-40f5-b3c1-12f4c1c05a49", "roleLabel": "분과장", "affiliationOverride": "", "displayOrder": 10 },
    { "id": "6713c4fb-6bdb-4f88-a07d-d47b58d3d219", "groupId": "4c83c304-cce1-46a7-8a98-b4c548574829", "personId": "04278356-e0bb-4c0b-81d6-51b33dfd82ba", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 20 },
    { "id": "caa88416-b500-407e-8f27-b50f8ee9894d", "groupId": "4c83c304-cce1-46a7-8a98-b4c548574829", "personId": "624d0f99-20ac-4ca6-a201-1253edab26a3", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 30 },
    { "id": "9d47f155-c381-4901-9063-72a7942d2fca", "groupId": "4c83c304-cce1-46a7-8a98-b4c548574829", "personId": "bf6f825b-a533-4296-bad3-665a7236f6df", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 40 },
    { "id": "eb62695e-66c6-4b57-a83b-cdb1fe1e74e3", "groupId": "4c83c304-cce1-46a7-8a98-b4c548574829", "personId": "4c56603e-1069-4c8c-ad61-bf76831f6c17", "roleLabel": "분과위원", "affiliationOverride": "", "displayOrder": 50 }
  ]
}
```
