# Drive 모듈 — 디자인 문서

> English version: [`drive.md`](./drive.md)

이 문서는 `@kabyeon/nexusjs/drive`의 아키텍처를 설명합니다:
`StorageDriver` 인터페이스, 세 가지 내장 드라이버, 서명된 URL
추상화, 경로 안전성.

## 목표

1. **통합 파일 스토리지 API.** `put`, `get`, `delete`, `head`, `list`,
   `copy`, `move`, `getSignedUrl` — 백엔드에 관계없이 동일한 인터페이스.
2. **플러그 가능한 드라이버.** 로컬 파일시스템, 인메모리, S3 호환 —
   그리고 `StorageDriver`를 구현하는 모든 사용자 정의 드라이버.
3. **필수 의존성 없음.** 로컬 및 메모리 드라이버는 제로 의존성. S3는
   `@aws-sdk/client-s3`를 느리게 로드.
4. **경로 탐색 보호.** 파일시스템 드라이버는 `..` 및 절대 경로를 거부.
5. **서명된 URL 지원.** 비공개 파일의 임시 접근 URL.

## 참고

- [`../user-guide/drive.ko.md`](../user-guide/drive.ko.md) — 사용자 가이드
- [`../user-guide/upload.ko.md`](../user-guide/upload.ko.md) — 파일 업로드 헬퍼 (별도 모듈)
