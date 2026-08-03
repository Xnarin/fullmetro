# Fullmetro (공철의 연금술사)

공항철도 역 근처 맛집을 저장하고, 다녀온 곳에 별점을 매기는 앱.
혼자 쓰는 개인 프로젝트. 로그인 없음. 목표 8시간.

## 한 줄 정의

지역별로 필터링해서 볼 수 있고, 다녀오면 체크와 평점을 남길 수 있다.

## 대상 역 (6개, 고정)

김포공항 · 마곡나루 · 디지털미디어시티 · 홍대입구 · 공덕 · 서울역

## 스택

- Next.js (Route Handler로 API 겸용)
- Supabase (DB)
- 로그인 없음 — 미들웨어 비밀 쿼리 파라미터로 접근 잠금
- Supabase RLS는 켜두고 정책은 만들지 않음 → 클라이언트 직접 접근 차단, 서버에서만 `service_role` 키로 접근

## 화면 (3개)

### 1. 목록 (기본 화면)
- 역 필터 (전체 + 6개)
- 가격대 필터 (~1만 / 1~2만 / 2만~)
- 카드: 이름 · 역 · 도보분 · 카테고리 · 가격 · 별점(또는 "미방문") · 태그
- 별점순 정렬
- 추천 버튼: 선택한 역에서 미방문 1곳 랜덤 추천 (없으면 별점 4.0↑ 중 랜덤)
- [+ 등록] 진입

### 2. 상세
- 기본 정보 표시
- 방문 체크: 오늘 날짜로 `last_visited` 갱신
- 별점 입력
- 웨이팅 입력 (칩: 바로/10분/20분/30분/40분+)
- 메모 입력
- 수정 / 삭제

### 3. 등록
- 이름 (필수)
- 역 (필수, 셀렉트)
- 카테고리 (셀렉트)
- 태그 (체크박스: 로컬 / 느좋 / 블로거, 복수선택)
- 도보 분
- 1인 가격
- 메모
- 방문 정보는 등록 시 받지 않음 (저장 → 나중에 상세에서 방문 체크)

## DB — 테이블 1개: `places`

```sql
create table places (
  id            bigint generated always as identity primary key,
  name          text not null,
  station       text not null check (station in (
                  '김포공항','마곡나루','디지털미디어시티','홍대입구','공덕','서울역')),
  category      text,
  tags          text[] default '{}',
  walk_minutes  int,
  price         int,
  rating        numeric(2,1),
  wait_minutes  int,
  last_visited  date,
  memo          text,
  created_at    timestamptz default now()
);

alter table places enable row level security;
```

- `last_visited`가 비어있으면 = 미방문 (별도 상태 컬럼 없음)
- `wait_minutes`는 `0`(바로 입장)과 `NULL`(미입력)을 구분해서 저장
- `tags`는 배열이라 별도 태그 테이블 없이 `@>` 연산자로 필터

## 안 만들 것 (1차 범위 제외)

- 지도 연동 (카카오맵 SDK)
- 카카오/구글 검색 연동, 외부 평점 자동 수집
- 인스타그램 링크 저장
- 웨이팅 평균 통계, 등가교환(남은시간) 계산기
- 폐업 감지, 공공데이터 연동
- 커플 공유, 계정/로그인, 일정 관리, 예약 연동
- 다국어

## 오늘 순서

1. 목록
2. 등록
3. 상세 + 방문 체크
4. (시간 남으면) 필터
5. (시간 남으면) 추천 버튼
